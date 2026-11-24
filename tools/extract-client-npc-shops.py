#!/usr/bin/env python3
"""Extract NPC shop inventories (NPC sell services, list 40) from BR elements.data.

Observed on Level Up BR client elements version 0x3000025a:
  list 40 = NPC sell service (shop the player buys from)
  list 41 = NPC buy service (NPC buys from player) — not a catalog

Record layout (verified against Ferreiro Valmoren sell id 2241, declen 5448):
  id@0
  name wchar[32]@4
  pages[8]@68, each 672 bytes:
    header[32]
    goods[32] × 20 bytes { id:u32, unk[4]u32 }

NPC_ESSENCE.id_sell@740 points at list 40.
"""
from __future__ import annotations

import argparse
import json
import struct
from datetime import datetime, timezone
from pathlib import Path

EXPECTED_VERSION_LOW = 0x025A
NPC_SELL_LIST = 40
NPC_ESSENCE_LIST = 57
NPC_DECLEN = 1092
SELL_DECLEN = 5448
SELL_FIELD_OFFSET = 740
NAME_CHARS = 32
PAGES = 8
PAGE_SIZE = 672
PAGE_HEADER = 32
GOODS_PER_PAGE = 32
GOOD_STRIDE = 20
PAGES_OFFSET = 68


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


def u32(dec: bytes, offset: int) -> int:
    if offset + 4 > len(dec):
        return 0
    return struct.unpack_from("<I", dec, offset)[0]


# Common pile_num_max values — used as an anchor near the end of short essences.
_PILE_MARKERS = {99, 100, 200, 999, 1000, 2000, 9999, 20000, 50000}


def _find_surfaces_icon(dec: bytes) -> int | None:
    for needle in (b"Surfaces\\", b"surfaces\\", b"Surfaces/", b"surfaces/"):
        idx = dec.find(needle)
        if idx >= 0:
            return idx
    return None


def extract_shop_price(dec: bytes) -> int | None:
    """Best-effort shop_price (what the player pays) from an item essence blob.

    Equipment (long records with Surfaces\\ icon): last plausible
    material_need/price/shop_price triple after the icon field.
    Consumables / short records: price/shop_price immediately before pile_num_max.
    """
    icon = _find_surfaces_icon(dec)
    if icon is not None and len(dec) >= 500:
        after = icon + 128
        best: int | None = None
        end = min(after + 260, len(dec) - 12)
        for off in range(after, end, 4):
            mat, price, shop = struct.unpack_from("<III", dec, off)
            if not (0 <= mat <= 30 and 1 <= price <= 50_000_000):
                continue
            if shop < price or shop > max(price * 100, price + 2000):
                continue
            if shop in _PILE_MARKERS and shop >= price * 10:
                continue
            best = shop
        if best:
            return best

    # Tail layout: … price, shop_price, pile_num_max, has_guid, proc_type
    for off in range(len(dec) - 8, 40, -4):
        pile = u32(dec, off)
        if pile not in _PILE_MARKERS:
            continue
        shop = u32(dec, off - 4)
        price = u32(dec, off - 8)
        if shop <= 0 or shop > 100_000_000 or shop == pile:
            continue
        if price > shop:
            continue
        return shop
    return None


def load_item_list_map(path: Path | None) -> dict[int, int]:
    """id → elements list index from items.all.json."""
    if path is None or not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("items") or []
    out: dict[int, int] = {}
    for row in rows:
        if "id" not in row:
            continue
        out[int(row["id"])] = int(row.get("list") or -1)
    return out


def build_shop_price_index(
    data: bytes, lists: list, item_lists: dict[int, int], item_ids: set[int]
) -> dict[int, int]:
    """Resolve shop_price for the given item ids via their essence list."""
    by_list: dict[int, set[int]] = {}
    for iid in item_ids:
        lid = item_lists.get(iid)
        if lid is None or lid < 0:
            continue
        by_list.setdefault(lid, set()).add(iid)

    prices: dict[int, int] = {}
    for lid, want in by_list.items():
        if lid >= len(lists) or not lists[lid]["ok"]:
            continue
        pending = set(want)
        for rid, dec in iter_records(data, lists[lid]):
            if rid not in pending:
                continue
            price = extract_shop_price(dec)
            if price is not None:
                prices[rid] = price
            pending.discard(rid)
            if not pending:
                break
    return prices


def parse_sell_service(rid: int, dec: bytes, valid_items: set[int] | None) -> dict | None:
    if len(dec) < PAGES_OFFSET + PAGES * PAGE_SIZE:
        return None
    name = read_wstring(dec, 4, NAME_CHARS)
    if not name:
        return None

    pages: list[dict] = []
    item_ids: list[int] = []
    seen: set[int] = set()

    for page_index in range(PAGES):
        base = PAGES_OFFSET + page_index * PAGE_SIZE
        page_icon = u32(dec, base)
        goods: list[dict] = []
        for slot in range(GOODS_PER_PAGE):
            off = base + PAGE_HEADER + slot * GOOD_STRIDE
            item_id = u32(dec, off)
            if not item_id:
                continue
            if valid_items is not None and item_id not in valid_items:
                continue
            goods.append({"id": item_id, "slot": slot})
            if item_id not in seen:
                seen.add(item_id)
                item_ids.append(item_id)
        if not goods and not page_icon:
            continue
        page: dict = {"index": page_index, "goods": goods}
        if page_icon:
            page["icon_id"] = page_icon
        pages.append(page)

    if not item_ids:
        return None

    return {
        "id": rid,
        "name_pt_br": name,
        "item_ids": item_ids,
        "item_count": len(item_ids),
        "pages": pages,
    }


def extract_npc_sell_links(data: bytes, lists: list) -> dict[int, list[dict]]:
    """Map sell_service_id -> [{id, name_pt_br}, ...]."""
    if len(lists) <= NPC_ESSENCE_LIST or not lists[NPC_ESSENCE_LIST]["ok"]:
        return {}
    out: dict[int, list[dict]] = {}
    for rid, dec in iter_records(data, lists[NPC_ESSENCE_LIST]):
        if len(dec) != NPC_DECLEN:
            continue
        name = read_wstring(dec, 4)
        if not name:
            continue
        sell_id = u32(dec, SELL_FIELD_OFFSET)
        if not sell_id:
            continue
        out.setdefault(sell_id, []).append({"id": rid, "name_pt_br": name})
    return out


def extract_shops(
    data: bytes,
    valid_items: set[int] | None = None,
    item_lists: dict[int, int] | None = None,
) -> tuple[list[dict], dict]:
    ver, ts, lists = read_lists(data)
    ver_low = ver & 0xFFFF
    if ver_low != EXPECTED_VERSION_LOW:
        raise SystemExit(
            f"unsupported elements version low=0x{ver_low:x} "
            f"(expected 0x{EXPECTED_VERSION_LOW:x})"
        )
    if len(lists) <= NPC_SELL_LIST or not lists[NPC_SELL_LIST]["ok"]:
        raise SystemExit(f"sell list {NPC_SELL_LIST} missing or corrupt")

    npc_links = extract_npc_sell_links(data, lists)
    shops: list[dict] = []
    skipped = 0
    wrong_size = 0

    for rid, dec in iter_records(data, lists[NPC_SELL_LIST]):
        if len(dec) != SELL_DECLEN:
            wrong_size += 1
            # still try if large enough
        shop = parse_sell_service(rid, dec, valid_items)
        if not shop:
            skipped += 1
            continue
        linked = npc_links.get(rid, [])
        if linked:
            shop["npcs"] = linked
        shops.append(shop)

    # Attach shop_price from item essences (not present in sell-service goods).
    all_ids: set[int] = set()
    for shop in shops:
        all_ids.update(int(x) for x in shop.get("item_ids") or [])
    price_index = (
        build_shop_price_index(data, lists, item_lists or {}, all_ids)
        if all_ids
        else {}
    )
    priced = 0
    for shop in shops:
        prices: dict[str, int] = {}
        for iid in shop.get("item_ids") or []:
            p = price_index.get(int(iid))
            if p is not None:
                prices[str(int(iid))] = p
        if prices:
            shop["shop_prices"] = prices
            priced += len(prices)
        for page in shop.get("pages") or []:
            for good in page.get("goods") or []:
                p = price_index.get(int(good["id"]))
                if p is not None:
                    good["shop_price"] = p

    shops.sort(key=lambda r: r["id"])
    with_npcs = sum(1 for s in shops if s.get("npcs"))
    meta = {
        "elements_version": ver,
        "elements_version_low": ver_low,
        "timestamp": ts,
        "sell_list": NPC_SELL_LIST,
        "shop_count": len(shops),
        "shops_with_npcs": with_npcs,
        "shop_prices_resolved": priced,
        "skipped": skipped,
        "wrong_size": wrong_size,
        "layout": "npc_sell_service_v60_pages8x32_stride20",
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "notice": (
            "Lista 40 = catálogo que o jogador COMPRA do NPC. "
            "Lista 41 (NPC compra do jogador) não é inventário de loja. "
            "shop_price vem do essence do item (campo shop_price)."
        ),
    }
    return shops, meta


def load_item_ids(path: Path | None) -> set[int] | None:
    if path is None or not path.exists():
        return None
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("items") or []
    return {int(row["id"]) for row in rows if "id" in row}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--elements",
        type=Path,
        default=Path(r"C:\Level Up\Perfect World\element\data\elements.data"),
    )
    ap.add_argument(
        "--items",
        "--items-all",
        dest="items",
        type=Path,
        default=Path("data/fixtures/sources/client-br-levelup/items/items.all.json"),
        help="items.all.json to validate goods ids and resolve shop_price",
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=Path("data/fixtures/sources/client-br-levelup/shops/shops.all.json"),
    )
    args = ap.parse_args()
    valid = load_item_ids(args.items)
    item_lists = load_item_list_map(args.items)
    data = args.elements.read_bytes()
    shops, meta = extract_shops(data, valid, item_lists)
    payload = {"meta": meta, "shops": shops}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    total_items = sum(s["item_count"] for s in shops)
    print(
        f"shops: {meta['shop_count']} services, "
        f"{meta['shops_with_npcs']} linked to NPCs, "
        f"{total_items} item slots, "
        f"{meta['shop_prices_resolved']} prices → {args.out}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
