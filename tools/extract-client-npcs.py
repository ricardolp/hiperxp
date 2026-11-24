#!/usr/bin/env python3
"""Extract NPC_ESSENCE details (hello + service flags) from BR elements.data.

Observed on Level Up BR client elements version 0x3000025a:
  list 57 = NPC_ESSENCE (fixed decompressed size 1092)

Layout (probed; not inventing silent offsets beyond verified fields):
  name wchar@4
  hello wchar@216 (buffer toward ~@740)
  id_sell@740, id_buy@744, id_repair@748,
  id_install@752, id_uninstall@756,
  id_task_out@760, id_task_in@764,
  id_teach@772, id_heal@776, id_teleport@780,
  id_storage@792, id_make_service@796, id_decompose@800,
  id_engrave@864, id_engrave_advanced@900

World coordinates are NOT in NPC_ESSENCE. This BR install has no npcgen*.
"""
from __future__ import annotations

import argparse
import json
import struct
from datetime import datetime, timezone
from pathlib import Path

EXPECTED_VERSION_LOW = 0x025A
NPC_ESSENCE_LIST = 57
NPC_DECLEN = 1092
HELLO_OFFSET = 216
HELLO_CHARS = 256

# (field_key, offset, source_list_for_name)
SERVICE_FIELDS: list[tuple[str, int, int | None]] = [
    ("sell", 740, 40),
    ("buy", 744, 41),
    ("repair", 748, 42),
    ("install", 752, 43),
    ("uninstall", 756, 44),
    ("task_out", 760, 46),
    ("task_in", 764, 45),
    ("teach", 772, 48),
    ("heal", 776, 49),
    ("teleport", 780, 50),
    ("storage", 792, 53),
    ("make", 796, 54),
    ("decompose", 800, 55),
    ("engrave", 864, 144),
    ("engrave_advanced", 900, 291),
]


def mppc_decompress(src: bytes, limit: int = 1 << 20) -> bytes:
    n_bits = len(src) * 8
    if n_bits == 0:
        return b""
    val = int.from_bytes(src, "big")
    pos = 0
    out = bytearray()

    def bits(k: int) -> int:
        nonlocal pos
        if pos + k > n_bits:
            raise EOFError
        v = (val >> (n_bits - pos - k)) & ((1 << k) - 1)
        pos += k
        return v

    try:
        while n_bits - pos >= 8 and len(out) < limit:
            if bits(1) == 0:
                out.append(bits(7))
                continue
            if bits(1) == 0:
                out.append(0x80 | bits(7))
                continue
            if bits(1) == 0:
                off = bits(13) + 320
            elif bits(1) == 0:
                off = bits(8) + 64
            else:
                off = bits(6)
            k = 0
            while bits(1) == 1:
                k += 1
            if k > 11:
                raise ValueError("bad length")
            length = 3 if k == 0 else (1 << (k + 1)) + bits(k + 1)
            start = len(out) - off
            if off == 0 or start < 0:
                raise ValueError(f"bad offset {off}")
            for i in range(length):
                out.append(out[start + i])
    except EOFError:
        pass
    return bytes(out)


def read_lists(data: bytes, max_lists: int = 500):
    ver = struct.unpack_from("<I", data, 0)[0]
    ts = struct.unpack_from("<I", data, 4)[0]
    p = 8
    n = struct.unpack_from("<I", data, p)[0]
    p += 4 + n
    p += 4
    ln = struct.unpack_from("<I", data, p)[0]
    p += 4 + ln + 4 + 4
    ln = struct.unpack_from("<I", data, p)[0]
    p += 4 + ln
    lists = []
    for idx in range(max_lists):
        if p + 4 > len(data):
            break
        count = struct.unpack_from("<I", data, p)[0]
        if count > 2_000_000:
            break
        ids: list[int] = []
        sizes: list[int] = []
        q = p + 4
        if count == 0:
            lists.append(
                {"index": idx, "ids": ids, "sizes": sizes, "data_offset": q, "ok": True}
            )
            p = q
            continue
        ok = True
        for _ in range(count):
            if q + 6 > len(data):
                ok = False
                break
            rid, size = struct.unpack_from("<IH", data, q)
            ids.append(rid)
            sizes.append(size)
            q += 6
        if not ok or q + 4 > len(data):
            lists.append(
                {"index": idx, "ids": ids, "sizes": sizes, "data_offset": -1, "ok": False}
            )
            break
        total = struct.unpack_from("<I", data, q)[0]
        if total != sum(sizes):
            lists.append(
                {"index": idx, "ids": ids, "sizes": sizes, "data_offset": -1, "ok": False}
            )
            break
        data_off = q + 4
        lists.append(
            {
                "index": idx,
                "ids": ids,
                "sizes": sizes,
                "data_offset": data_off,
                "ok": True,
            }
        )
        p = data_off + total
    return ver, ts, lists


def read_wstring(buf: bytes, offset: int, max_chars: int = 32) -> str:
    chars: list[str] = []
    for i in range(max_chars):
        p = offset + i * 2
        if p + 2 > len(buf):
            break
        c = buf[p] | (buf[p + 1] << 8)
        if c == 0:
            break
        if 0xD800 <= c <= 0xDFFF:
            continue
        chars.append(chr(c))
    return "".join(chars).strip()


def iter_records(data: bytes, lst: dict):
    off = lst["data_offset"]
    for rid, size in zip(lst["ids"], lst["sizes"]):
        blob = data[off : off + size]
        off += size
        try:
            dec = mppc_decompress(blob)
        except Exception:
            continue
        yield rid, dec


def extract_type_names(data: bytes, lists: list, list_index: int) -> dict[int, str]:
    if list_index >= len(lists) or not lists[list_index]["ok"]:
        return {}
    out: dict[int, str] = {}
    for rid, dec in iter_records(data, lists[list_index]):
        name = read_wstring(dec, 4) or read_wstring(dec, 12) or read_wstring(dec, 0)
        if name:
            out[rid] = name
    return out


def u32(dec: bytes, offset: int) -> int:
    if offset + 4 > len(dec):
        return 0
    return struct.unpack_from("<I", dec, offset)[0]


def extract_npcs(data: bytes) -> tuple[list[dict], dict]:
    ver, ts, lists = read_lists(data)
    ver_low = ver & 0xFFFF
    if ver_low != EXPECTED_VERSION_LOW:
        raise SystemExit(
            f"unsupported elements version low=0x{ver_low:x} "
            f"(expected 0x{EXPECTED_VERSION_LOW:x})"
        )
    if len(lists) <= NPC_ESSENCE_LIST or not lists[NPC_ESSENCE_LIST]["ok"]:
        raise SystemExit(f"NPC list {NPC_ESSENCE_LIST} missing or corrupt")

    name_maps: dict[int, dict[int, str]] = {}
    for _, _, list_id in SERVICE_FIELDS:
        if list_id is None or list_id in name_maps:
            continue
        name_maps[list_id] = extract_type_names(data, lists, list_id)

    npcs: list[dict] = []
    skipped = 0
    with_make = 0
    with_hello = 0

    for rid, dec in iter_records(data, lists[NPC_ESSENCE_LIST]):
        if len(dec) != NPC_DECLEN:
            skipped += 1
            continue
        name = read_wstring(dec, 4)
        if not name:
            skipped += 1
            continue

        services: dict[str, dict] = {}
        for key, offset, list_id in SERVICE_FIELDS:
            sid = u32(dec, offset)
            if not sid:
                continue
            entry: dict = {"id": sid}
            if list_id is not None:
                sname = name_maps.get(list_id, {}).get(sid)
                # Task talk templates often reuse the NPC name — skip as label.
                if sname and sname.strip().lower() != name.strip().lower():
                    entry["name_pt_br"] = sname
            services[key] = entry

        if not services:
            continue

        hello = read_wstring(dec, HELLO_OFFSET, HELLO_CHARS)
        row: dict = {
            "id": rid,
            "name_pt_br": name,
            "services": services,
        }
        if hello:
            row["hello_pt_br"] = hello
            with_hello += 1
        if "make" in services:
            with_make += 1
        npcs.append(row)

    npcs.sort(key=lambda r: r["id"])
    meta = {
        "elements_version": ver,
        "elements_version_low": ver_low,
        "timestamp": ts,
        "npc_list": NPC_ESSENCE_LIST,
        "npc_count": len(npcs),
        "with_make": with_make,
        "with_hello": with_hello,
        "skipped": skipped,
        "locations_notice": (
            "Coordenadas de mundo não estão no NPC_ESSENCE; cliente BR sem npcgen*."
        ),
        "extracted_at": datetime.now(timezone.utc).isoformat(),
    }
    return npcs, meta


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--elements",
        type=Path,
        default=Path(r"C:\Level Up\Perfect World\element\data\elements.data"),
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=Path("data/fixtures/sources/client-br-levelup/npcs/npcs.all.json"),
    )
    args = ap.parse_args()
    data = args.elements.read_bytes()
    npcs, meta = extract_npcs(data)
    payload = {"meta": meta, "npcs": npcs}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(
        f"npcs: {meta['npc_count']} with services, "
        f"{meta['with_make']} make, {meta['with_hello']} hello → {args.out}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
