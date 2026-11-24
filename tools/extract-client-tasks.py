#!/usr/bin/env python3
"""Extract quests from BR Perfect World tasks.data (v237 observed).

Read-only. Pass a copied tasks.data via --tasks.

Extracted per quest:
  - id, name_pt_br (XOR utf16 name)
  - description_pt_br (Latin length-prefixed XOR strings)
  - reward_items / premise_items (21-byte ITEM_WANTED pack(1) chains)
  - series dependency heuristic (Roman/Arabic suffixes)
"""
from __future__ import annotations

import argparse
import json
import re
import struct
from datetime import datetime, timezone
from pathlib import Path

NAME_CHARS = 30
ITEM_SIZE = 21
ROMAN_SUFFIX = re.compile(
    r"^(?P<base>.+?)\s*(?P<num>[IVXLCDM]+|\d+)\s*$",
    re.IGNORECASE,
)
COLOR_CODE = re.compile(r"\^[0-9a-fA-F]{6}")
ROMAN = {
    "I": 1,
    "II": 2,
    "III": 3,
    "IV": 4,
    "V": 5,
    "VI": 6,
    "VII": 7,
    "VIII": 8,
    "IX": 9,
    "X": 10,
}


def decode_name(buf: bytes, offset: int, task_id: int) -> str:
    key = task_id & 0xFFFF
    chars: list[str] = []
    for i in range(NAME_CHARS):
        p = offset + i * 2
        if p + 2 > len(buf):
            break
        c = struct.unpack_from("<H", buf, p)[0] ^ key
        if c == 0:
            break
        if c < 32:
            return ""
        chars.append(chr(c))
    name = "".join(chars).strip()
    if len(name) < 2:
        return ""
    if sum(1 for ch in name if ch.isprintable()) < max(2, len(name) // 2):
        return ""
    return name


def decode_xor_text(rec: bytes, offset: int, key: int) -> tuple[str, int] | None:
    if offset + 4 > len(rec):
        return None
    n = struct.unpack_from("<I", rec, offset)[0]
    if not (8 <= n <= 4000) or offset + 4 + n * 2 > len(rec):
        return None
    chars: list[str] = []
    latin = 0
    for j in range(n):
        c = struct.unpack_from("<H", rec, offset + 4 + j * 2)[0] ^ key
        if c == 0:
            break
        if 0xD800 <= c <= 0xDFFF or c > 0xFFFD:
            return None
        if not (c in (10, 13) or 32 <= c):
            return None
        ch = chr(c)
        chars.append(ch)
        if ("a" <= ch <= "z") or ("A" <= ch <= "Z") or ("\u00c0" <= ch <= "\u024f"):
            latin += 1
    text = "".join(chars).strip()
    if len(text) < 20 or latin < 12:
        return None
    # Prefer Portuguese/Latin body text over XOR-garbage with sparse Latin.
    if latin / max(1, len(text)) < 0.45:
        return None
    # Reject Hangul/CJK-heavy garbage that sometimes passes the Latin ratio.
    weird = sum(
        1
        for ch in text
        if ("\u1100" <= ch <= "\u11ff")
        or ("\u3130" <= ch <= "\u318f")
        or ("\uac00" <= ch <= "\ud7af")
        or ("\u4e00" <= ch <= "\u9fff")
    )
    if weird > max(2, len(text) // 20):
        return None
    text = COLOR_CODE.sub("", text).strip()
    if len(text) < 20:
        return None
    return text, n


def extract_texts(rec: bytes, task_id: int) -> tuple[list[str], int | None]:
    """Scan the tail of the record (where client stores XOR'd dialogue/briefing)."""
    key = task_id & 0xFFFF
    texts: list[str] = []
    first_at: int | None = None
    # Dialogue blobs are not always 4-byte aligned (see Alma de Tianyu I @6861).
    start = max(0, len(rec) // 4)
    i = start
    while i < len(rec) - 8:
        decoded = decode_xor_text(rec, i, key)
        if decoded:
            text, n = decoded
            if text not in texts:
                texts.append(text)
                if first_at is None:
                    first_at = i
            i += 4 + n * 2
        else:
            i += 1
    return texts, first_at


def read_item(rec: bytes, offset: int, item_ids: set[int]) -> dict | None:
    if offset + ITEM_SIZE > len(rec):
        return None
    item_id = struct.unpack_from("<I", rec, offset)[0]
    if item_id not in item_ids:
        return None
    common = rec[offset + 4]
    if common not in (0, 1):
        return None
    qty = struct.unpack_from("<I", rec, offset + 5)[0]
    if not (1 <= qty <= 999):
        return None
    prob_bits = struct.unpack_from("<I", rec, offset + 9)[0]
    if prob_bits not in (0, 0x3F800000):
        return None
    if any(rec[offset + 13 : offset + ITEM_SIZE]):
        return None
    return {
        "id": item_id,
        "quantity": qty,
        "common_item": bool(common),
        "probability": 1.0 if prob_bits else 0.0,
    }


def find_item_chains(rec: bytes, item_ids: set[int]) -> list[dict]:
    chains: list[dict] = []
    p = 0
    limit = len(rec) - (4 + ITEM_SIZE)
    while p < limit:
        count = struct.unpack_from("<I", rec, p)[0]
        if 1 <= count <= 24:
            items: list[dict] = []
            q = p + 4
            ok = True
            for _ in range(count):
                item = read_item(rec, q, item_ids)
                if not item:
                    ok = False
                    break
                items.append(item)
                q += ITEM_SIZE
            if ok and items:
                chains.append({"offset": p, "items": items})
                p = q
                continue
        p += 4
    return chains


def split_premise_rewards(
    chains: list[dict], text_start: int | None
) -> tuple[list[dict], list[dict]]:
    if not chains:
        return [], []
    if text_start is None:
        # single chain => rewards; multiple => first premise, last rewards
        if len(chains) == 1:
            return [], chains[0]["items"]
        return chains[0]["items"], chains[-1]["items"]

    before = [c for c in chains if c["offset"] < text_start]
    if not before:
        return [], chains[-1]["items"]
    if len(before) == 1:
        return [], before[0]["items"]
    return before[0]["items"], before[-1]["items"]


def parse_series_num(name: str) -> tuple[str, int] | None:
    m = ROMAN_SUFFIX.match(name.strip())
    if not m:
        return None
    base = m.group("base").strip(" -·.:")
    token = m.group("num").upper()
    if token.isdigit():
        num = int(token)
    else:
        num = ROMAN.get(token)
        if num is None:
            return None
    if not base or num <= 0 or num > 30:
        return None
    return base, num


def build_series_links(quests: list[dict]) -> None:
    buckets: dict[str, list[tuple[int, int]]] = {}
    for q in quests:
        parsed = parse_series_num(q["name_pt_br"])
        if not parsed:
            continue
        base, num = parsed
        key = base.casefold()
        buckets.setdefault(key, []).append((num, q["id"]))
    for key, entries in buckets.items():
        entries.sort()
        by_num = {num: qid for num, qid in entries}
        for num, qid in entries:
            quest = next(q for q in quests if q["id"] == qid)
            prev_id = by_num.get(num - 1)
            next_id = by_num.get(num + 1)
            quest["series"] = {
                "base": quest["name_pt_br"].rsplit(maxsplit=1)[0]
                if " " in quest["name_pt_br"]
                else quest["name_pt_br"],
                "index": num,
                "previous_id": prev_id,
                "next_id": next_id,
            }


def load_item_ids(path: Path | None) -> set[int]:
    if not path or not path.is_file():
        return set()
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload["items"] if isinstance(payload, dict) else payload
    return {int(row["id"]) for row in rows if int(row.get("id") or 0) >= 1000}


def extract_tasks(
    data: bytes, item_ids: set[int]
) -> tuple[int, int, list[dict]]:
    if len(data) < 12:
        raise ValueError("tasks.data too small")
    magic, version, count = struct.unpack_from("<III", data, 0)
    if count <= 0 or count > 500_000:
        raise ValueError(f"implausible task count: {count}")
    table_end = 12 + count * 4
    if table_end > len(data):
        raise ValueError("offset table exceeds file size")

    offsets = [struct.unpack_from("<I", data, 12 + i * 4)[0] for i in range(count)]
    sorted_offs = sorted(set(offsets))
    next_by_off = {
        off: sorted_offs[i + 1] if i + 1 < len(sorted_offs) else len(data)
        for i, off in enumerate(sorted_offs)
    }

    quests: list[dict] = []
    seen: set[int] = set()
    total = len(offsets)
    for idx, off in enumerate(offsets):
        id_at = off + 2
        name_at = id_at + 4
        if name_at + NAME_CHARS * 2 > len(data):
            continue
        task_id = struct.unpack_from("<I", data, id_at)[0]
        if task_id == 0 or task_id in seen:
            continue
        name = decode_name(data, name_at, task_id)
        if not name:
            continue
        end = next_by_off.get(off, len(data))
        if end <= off:
            continue
        rec = data[off:end]
        texts, text_start = extract_texts(rec, task_id)
        chains = find_item_chains(rec, item_ids) if item_ids else []
        premise_items, reward_items = split_premise_rewards(chains, text_start)
        seen.add(task_id)
        quests.append(
            {
                "id": task_id,
                "name_pt_br": name,
                "description_pt_br": "\n\n".join(texts) if texts else None,
                "premise_items": premise_items,
                "reward_items": reward_items,
            }
        )
        if (idx + 1) % 2000 == 0:
            print(f"  … {idx + 1}/{total} offsets")

    quests.sort(key=lambda q: q["id"])
    build_series_links(quests)
    return magic, version, quests


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--tasks",
        type=Path,
        default=Path(r"C:\Level Up\Perfect World\element\data\tasks.data"),
    )
    ap.add_argument(
        "--items-all",
        type=Path,
        default=Path(
            "data/fixtures/sources/client-br-levelup/items/items.all.json"
        ),
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=Path(
            "data/fixtures/sources/client-br-levelup/quests/quests.all.json"
        ),
    )
    args = ap.parse_args()

    item_ids = load_item_ids(args.items_all)
    data = args.tasks.read_bytes()
    magic, version, quests = extract_tasks(data, item_ids)

    with_desc = sum(1 for q in quests if q.get("description_pt_br"))
    with_rewards = sum(1 for q in quests if q.get("reward_items"))
    with_premise = sum(1 for q in quests if q.get("premise_items"))
    with_series = sum(1 for q in quests if q.get("series"))

    payload = {
        "meta": {
            "source_kind": "client_br_levelup",
            "tool": "tools/extract-client-tasks.py",
            "extracted_at": datetime.now(timezone.utc).isoformat(),
            "tasks_path": str(args.tasks),
            "tasks_size": len(data),
            "magic": magic,
            "magic_hex": f"0x{magic:08X}",
            "version": version,
            "quest_count": len(quests),
            "with_description": with_desc,
            "with_reward_items": with_rewards,
            "with_premise_items": with_premise,
            "with_series": with_series,
            "item_id_universe": len(item_ids),
            "fields": [
                "id",
                "name_pt_br",
                "description_pt_br",
                "premise_items",
                "reward_items",
                "series",
            ],
            "notice": (
                "Descriptions from XOR'd client strings. Item links use "
                "observed 21-byte ITEM_WANTED pack(1) chains (best-effort). "
                "Series links are name-suffix heuristics."
            ),
        },
        "quests": quests,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"wrote {args.out} ({len(quests)} quests, desc={with_desc}, "
        f"rewards={with_rewards}, premise={with_premise}, series={with_series})"
    )


if __name__ == "__main__":
    main()
