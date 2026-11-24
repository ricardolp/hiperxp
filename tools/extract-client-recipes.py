#!/usr/bin/env python3
"""Extract craft recipes (RECIPE_ESSENCE) from BR Perfect World elements.data.

Observed on Level Up BR client elements version 0x3000025a:
  list 66 = RECIPE_MAJOR_TYPE
  list 67 = RECIPE_SUB_TYPE
  list 68 = RECIPE_ESSENCE (fixed decompressed size 472)

Classic RECIPE_ESSENCE layout (verified against materials/targets):
  id@0, major@4, sub@8, name wchar[32]@12,
  recipe_level@76, id_skill@80, skill_level@84, bind_type@88,
  targets[4] {id,u32 + prob,f32}@92,
  fail_probability@124, num_to_make@128, price@132, duration@136,
  exp@140, skillpoint@144,
  materials[32] {id,u32 + num,i32}@148,
  id_upgrade_equip@404, upgrade_rate@408, proc_type@412
"""
from __future__ import annotations

import argparse
import json
import struct
from datetime import datetime, timezone
from pathlib import Path

EXPECTED_VERSION_LOW = 0x025A
RECIPE_MAJOR_LIST = 66
RECIPE_SUB_LIST = 67
RECIPE_LIST = 68
NPC_MAKE_LIST = 54
NPC_ESSENCE_LIST = 57
RECIPE_DECLEN = 472
NAME_CHARS = 32
TARGETS = 4
MATERIALS = 32
# After id + name[32 wchar], recipe id pages begin.
MAKE_RECIPES_OFFSET = 68
# Observed id_make_service field on NPC_ESSENCE (declen 1092).
NPC_MAKE_FIELD_OFFSET = 796


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


def read_wstring(buf: bytes, offset: int, max_chars: int = NAME_CHARS) -> str:
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
        name = read_wstring(dec, 4) or read_wstring(dec, 12)
        if name:
            out[rid] = name
    return out


def parse_recipe(rid: int, dec: bytes) -> dict | None:
    if len(dec) < RECIPE_DECLEN:
        return None
    name = read_wstring(dec, 12)
    if len(name) < 1:
        return None
    major = struct.unpack_from("<I", dec, 4)[0]
    sub = struct.unpack_from("<I", dec, 8)[0]
    level = struct.unpack_from("<i", dec, 76)[0]
    skill_id = struct.unpack_from("<I", dec, 80)[0]
    skill_level = struct.unpack_from("<i", dec, 84)[0]
    targets: list[dict] = []
    for i in range(TARGETS):
        p = 92 + i * 8
        tid = struct.unpack_from("<I", dec, p)[0]
        prob = struct.unpack_from("<f", dec, p + 4)[0]
        if tid == 0:
            continue
        targets.append(
            {
                "id": tid,
                "probability": round(float(prob), 6),
            }
        )
    materials: list[dict] = []
    for i in range(MATERIALS):
        p = 148 + i * 8
        mid = struct.unpack_from("<I", dec, p)[0]
        num = struct.unpack_from("<i", dec, p + 4)[0]
        if mid == 0 and num == 0:
            continue
        if mid == 0 or num <= 0:
            continue
        materials.append({"id": mid, "quantity": int(num)})
    if not targets and not materials:
        return None
    return {
        "id": rid,
        "name_pt_br": name,
        "major_type": major,
        "sub_type": sub,
        "level": level,
        "skill_id": skill_id,
        "skill_level": skill_level,
        "targets": targets,
        "materials": materials,
    }


def extract_make_services(
    data: bytes, lists: list, recipe_ids: set[int]
) -> dict[int, dict]:
    if len(lists) <= NPC_MAKE_LIST or not lists[NPC_MAKE_LIST]["ok"]:
        return {}
    out: dict[int, dict] = {}
    for rid, dec in iter_records(data, lists[NPC_MAKE_LIST]):
        name = read_wstring(dec, 4) or read_wstring(dec, 12)
        if not name:
            continue
        found: list[int] = []
        seen: set[int] = set()
        for p in range(MAKE_RECIPES_OFFSET, len(dec) - 3, 4):
            v = struct.unpack_from("<I", dec, p)[0]
            if v == 0 or v == rid or v not in recipe_ids or v in seen:
                continue
            seen.add(v)
            found.append(v)
        out[rid] = {
            "id": rid,
            "name_pt_br": name,
            "recipe_ids": found,
        }
    return out


def extract_npc_makers(
    data: bytes, lists: list, make_ids: set[int]
) -> dict[int, dict]:
    if len(lists) <= NPC_ESSENCE_LIST or not lists[NPC_ESSENCE_LIST]["ok"]:
        return {}
    out: dict[int, dict] = {}
    for rid, dec in iter_records(data, lists[NPC_ESSENCE_LIST]):
        name = read_wstring(dec, 4) or read_wstring(dec, 12)
        if not name:
            continue
        services: list[int] = []
        seen: set[int] = set()
        # Prefer known id_make_service field, then scan nearby service slots.
        for base in range(NPC_MAKE_FIELD_OFFSET, min(len(dec), NPC_MAKE_FIELD_OFFSET + 64), 4):
            v = struct.unpack_from("<I", dec, base)[0]
            if v in make_ids and v not in seen:
                seen.add(v)
                services.append(v)
        # Fallback: any make-service id embedded in the NPC record.
        if not services:
            for p in range(0, len(dec) - 3, 4):
                v = struct.unpack_from("<I", dec, p)[0]
                if v in make_ids and v not in seen:
                    seen.add(v)
                    services.append(v)
        if not services:
            continue
        out[rid] = {
            "id": rid,
            "name_pt_br": name.strip(),
            "make_service_ids": services,
        }
    return out


def attach_npcs_to_recipes(
    recipes: list[dict],
    make_services: dict[int, dict],
    npcs: dict[int, dict],
) -> None:
    recipe_to_npcs: dict[int, list[dict]] = {}
    service_to_npcs: dict[int, list[dict]] = {}
    for npc in npcs.values():
        entry = {"id": npc["id"], "name_pt_br": npc["name_pt_br"]}
        for sid in npc["make_service_ids"]:
            service_to_npcs.setdefault(sid, []).append(entry)

    for sid, service in make_services.items():
        makers = service_to_npcs.get(sid, [])
        if not makers:
            continue
        for recipe_id in service["recipe_ids"]:
            bucket = recipe_to_npcs.setdefault(recipe_id, [])
            for npc in makers:
                if all(n["id"] != npc["id"] for n in bucket):
                    bucket.append(
                        {
                            **npc,
                            "service_id": sid,
                            "service_name_pt_br": service["name_pt_br"],
                        }
                    )

    for recipe in recipes:
        linked = recipe_to_npcs.get(recipe["id"], [])
        if linked:
            recipe["npcs"] = linked


def extract_recipes(data: bytes) -> tuple[list[dict], dict, dict[int, str], dict[int, str]]:
    ver, ts, lists = read_lists(data)
    ver_low = ver & 0xFFFF
    if ver_low != EXPECTED_VERSION_LOW:
        raise SystemExit(
            f"unsupported elements version low=0x{ver_low:x} "
            f"(expected 0x{EXPECTED_VERSION_LOW:x}); refuse silent offset heuristics"
        )
    if len(lists) <= RECIPE_LIST or not lists[RECIPE_LIST]["ok"]:
        raise SystemExit(f"recipe list {RECIPE_LIST} missing or corrupt")

    majors = extract_type_names(data, lists, RECIPE_MAJOR_LIST)
    subs = extract_type_names(data, lists, RECIPE_SUB_LIST)

    recipes: list[dict] = []
    skipped = 0
    for rid, dec in iter_records(data, lists[RECIPE_LIST]):
        if len(dec) != RECIPE_DECLEN:
            skipped += 1
            continue
        parsed = parse_recipe(rid, dec)
        if not parsed:
            skipped += 1
            continue
        if parsed["major_type"] in majors:
            parsed["major_name_pt_br"] = majors[parsed["major_type"]]
        if parsed["sub_type"] in subs:
            parsed["sub_name_pt_br"] = subs[parsed["sub_type"]]
        recipes.append(parsed)

    recipe_ids = {r["id"] for r in recipes}
    make_services = extract_make_services(data, lists, recipe_ids)
    npcs = extract_npc_makers(data, lists, set(make_services))
    attach_npcs_to_recipes(recipes, make_services, npcs)
    with_npcs = sum(1 for r in recipes if r.get("npcs"))

    meta = {
        "elements_version": ver,
        "elements_version_low": ver_low,
        "timestamp": ts,
        "recipe_list": RECIPE_LIST,
        "major_list": RECIPE_MAJOR_LIST,
        "sub_list": RECIPE_SUB_LIST,
        "make_list": NPC_MAKE_LIST,
        "npc_list": NPC_ESSENCE_LIST,
        "recipe_count": len(recipes),
        "make_service_count": len(make_services),
        "npc_maker_count": len(npcs),
        "recipes_with_npcs": with_npcs,
        "skipped": skipped,
        "layout": "classic_recipe_essence_v60",
        "extracted_at": datetime.now(timezone.utc).isoformat(),
    }
    return recipes, meta, majors, subs


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
        default=Path(
            "data/fixtures/sources/client-br-levelup/recipes/recipes.all.json"
        ),
    )
    args = ap.parse_args()
    if not args.elements.is_file():
        raise SystemExit(f"missing {args.elements}")

    data = args.elements.read_bytes()
    recipes, meta, majors, subs = extract_recipes(data)
    payload = {
        "meta": meta,
        "major_types": {str(k): v for k, v in sorted(majors.items())},
        "sub_types": {str(k): v for k, v in sorted(subs.items())},
        "recipes": recipes,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    with_mats = sum(1 for r in recipes if r["materials"])
    with_tgts = sum(1 for r in recipes if r["targets"])
    print(
        f"recipes: {len(recipes)} extracted "
        f"({with_mats} with materials, {with_tgts} with targets, "
        f"{meta['recipes_with_npcs']} with NPCs, "
        f"{meta['make_service_count']} make services, "
        f"{meta['npc_maker_count']} NPCs, "
        f"{meta['skipped']} skipped) → {args.out}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
