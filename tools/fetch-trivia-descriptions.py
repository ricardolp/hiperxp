#!/usr/bin/env python3
"""Fetch item flavor descriptions from Trivia PW cotacao pages (one-shot staging)."""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

FIXTURES = Path("data/fixtures/items.json")
OUT = Path(
    "data/fixtures/sources/client-br-levelup/items/descriptions.trivia.json"
)
UA = "HiperXP-local-extract/0.1 (+community tools; one-shot staging)"


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


def main() -> int:
    fixtures = json.loads(FIXTURES.read_text(encoding="utf-8"))
    rows = []
    for item in fixtures:
        aliases = [a for a in item.get("aliases", []) if str(a).isdigit()]
        if not aliases:
            continue
        item_id = int(aliases[0])
        url = f"https://triviapw.com.br/cotacao/?item={item_id}"
        desc = None
        err = None
        try:
            html = fetch(url)
            desc = parse_description(html)
            if not desc:
                # alternate path style
                html = fetch(f"https://triviapw.com.br/cotacao/{item_id}")
                desc = parse_description(html)
        except Exception as e:  # noqa: BLE001
            err = str(e)
        rows.append(
            {
                "id": item_id,
                "name_pt_br": item.get("name_pt_br"),
                "description": desc,
                "source": "triviapw_cotacao",
                "url": url,
                "error": err,
            }
        )
        time.sleep(0.35)
        print(
            item_id,
            "OK" if desc else "MISS",
            (desc or err or "")[:80],
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "meta": {
            "source": "https://triviapw.com.br/cotacao/",
            "count": len(rows),
            "with_description": sum(1 for r in rows if r.get("description")),
        },
        "items": rows,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", OUT, "with_description", payload["meta"]["with_description"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
