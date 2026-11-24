#!/usr/bin/env python3
"""Fetch item flavor descriptions from cotacao pages (resume-safe, overnight-friendly).

Examples:
  python tools/fetch-cotacao-descriptions.py --limit 20
  python tools/fetch-cotacao-descriptions.py --resume
  python tools/fetch-cotacao-descriptions.py --resume --delay 0.4
"""
from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ITEMS = (
    ROOT / "data/fixtures/sources/client-br-levelup/items/items.all.json"
)
DEFAULT_FIXTURES = ROOT / "data/fixtures/items.json"
DEFAULT_OUT = (
    ROOT
    / "data/fixtures/sources/client-br-levelup/items/descriptions.cotacao.json"
)
UA = "HiperXP-local-extract/0.2 (+community tools; offline staging crawl)"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_description(html: str) -> str | None:
    m = re.search(
        r'<div class="result-description">(.*?)</div>',
        html,
        flags=re.I | re.S,
    )
    if not m:
        return None
    raw = m.group(1)
    raw = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)
    raw = re.sub(r"<[^>]+>", "", raw)
    text = re.sub(r"[ \t]+\n", "\n", raw)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    text = re.sub(r"[ \t]{2,}", " ", text)
    if len(text) < 8:
        return None
    if text.lower().startswith("atualizado"):
        return None
    return text


def load_existing(path: Path) -> dict[int, dict]:
    if not path.is_file():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    rows = raw.get("items") if isinstance(raw, dict) else raw
    out: dict[int, dict] = {}
    for row in rows or []:
        if not isinstance(row, dict) or row.get("id") is None:
            continue
        out[int(row["id"])] = row
    return out


def load_targets(items_all: Path, fixtures: Path | None) -> list[tuple[int, str]]:
    targets: list[tuple[int, str]] = []
    seen: set[int] = set()

    if items_all.is_file():
        payload = json.loads(items_all.read_text(encoding="utf-8"))
        rows = payload.get("items") if isinstance(payload, dict) else payload
        for row in rows or []:
            if not isinstance(row, dict) or row.get("id") is None:
                continue
            iid = int(row["id"])
            if iid in seen:
                continue
            seen.add(iid)
            targets.append((iid, (row.get("name_pt_br") or "").strip()))

    if fixtures and fixtures.is_file():
        rows = json.loads(fixtures.read_text(encoding="utf-8"))
        if isinstance(rows, list):
            for item in rows:
                aliases = [
                    a for a in item.get("aliases", []) if str(a).isdigit()
                ]
                if not aliases:
                    continue
                iid = int(aliases[0])
                if iid in seen:
                    continue
                seen.add(iid)
                targets.append((iid, (item.get("name_pt_br") or "").strip()))

    targets.sort(key=lambda x: x[0])
    return targets


def write_out(path: Path, by_id: dict[int, dict]) -> None:
    rows = [by_id[k] for k in sorted(by_id)]
    payload = {
        "meta": {
            "source": "https://triviapw.com.br/cotacao/",
            "tool": "tools/fetch-cotacao-descriptions.py",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "count": len(rows),
            "with_description": sum(1 for r in rows if r.get("description")),
            "misses": sum(
                1
                for r in rows
                if not r.get("description") and not r.get("pending")
            ),
        },
        "items": rows,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def crawl_one(item_id: int) -> tuple[str | None, str | None, str]:
    url = f"https://triviapw.com.br/cotacao/?item={item_id}"
    try:
        html = fetch(url)
        desc = parse_description(html)
        if not desc:
            alt = f"https://triviapw.com.br/cotacao/{item_id}"
            html = fetch(alt)
            desc = parse_description(html)
            url = alt
        return desc, None, url
    except Exception as exc:  # noqa: BLE001
        return None, str(exc), url


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--items-all", type=Path, default=DEFAULT_ITEMS)
    ap.add_argument("--fixture-items", type=Path, default=DEFAULT_FIXTURES)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument(
        "--resume",
        action="store_true",
        help="Skip ids that already have a description in --out",
    )
    ap.add_argument(
        "--retry-misses",
        action="store_true",
        help="With --resume, also retry ids that previously missed",
    )
    ap.add_argument("--delay", type=float, default=0.35, help="Seconds between requests")
    ap.add_argument("--limit", type=int, default=0, help="0 = all pending")
    ap.add_argument(
        "--flush-every",
        type=int,
        default=25,
        help="Persist --out every N successful attempts",
    )
    args = ap.parse_args()

    targets = load_targets(args.items_all, args.fixture_items)
    if not targets:
        raise SystemExit(
            f"no item ids found in {args.items_all} or {args.fixture_items}"
        )

    by_id = load_existing(args.out) if args.resume or args.out.is_file() else {}
    pending: list[tuple[int, str]] = []
    for iid, name in targets:
        prev = by_id.get(iid)
        if args.resume and prev and prev.get("description"):
            continue
        if (
            args.resume
            and not args.retry_misses
            and prev
            and prev.get("description") is None
            and prev.get("error") is None
            and not prev.get("pending")
        ):
            # Previously checked miss — skip unless retry requested.
            continue
        pending.append((iid, name))

    if args.limit > 0:
        pending = pending[: args.limit]

    print(
        f"targets={len(targets)} cached={len(by_id)} pending={len(pending)} "
        f"out={args.out}",
        flush=True,
    )
    if not pending:
        write_out(args.out, by_id)
        print("nothing to fetch", flush=True)
        return 0

    ok = 0
    miss = 0
    err = 0
    started = time.time()

    for i, (iid, name) in enumerate(pending, start=1):
        desc, error, url = crawl_one(iid)
        by_id[iid] = {
            "id": iid,
            "name_pt_br": name or (by_id.get(iid) or {}).get("name_pt_br"),
            "description": desc,
            "source": "external_cotacao",
            "url": url,
            "error": error,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        if desc:
            ok += 1
            status = "OK"
        elif error:
            err += 1
            status = "ERR"
        else:
            miss += 1
            status = "MISS"

        preview = (desc or error or "")[:80].replace("\n", " ")
        print(f"[{i}/{len(pending)}] {iid} {status} {preview}", flush=True)

        if i % max(1, args.flush_every) == 0:
            write_out(args.out, by_id)
            elapsed = time.time() - started
            rate = i / elapsed if elapsed else 0
            eta = (len(pending) - i) / rate if rate else 0
            print(
                f"  flush ok={ok} miss={miss} err={err} "
                f"rate={rate:.2f}/s eta≈{eta/60:.1f}m",
                flush=True,
            )

        time.sleep(max(0.0, args.delay))

    write_out(args.out, by_id)
    meta_count = sum(1 for r in by_id.values() if r.get("description"))
    print(
        f"done wrote={args.out} with_description={meta_count} "
        f"session ok={ok} miss={miss} err={err}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
