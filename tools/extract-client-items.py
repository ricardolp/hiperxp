#!/usr/bin/env python3
"""Extract item id/name/icon(/addon text) from a BR Perfect World elements.data (v0x30000xxx).

Read-only against the client: work from a copied elements.data or pass --elements.
Icons are pulled from surfaces.pck when --surfaces and --icons-out are set.

Based on the per-record MPPC layout documented by angelica-wardrobe / community notes.
"""
from __future__ import annotations

import argparse
import json
import re
import struct
import zlib
from dataclasses import dataclass
from pathlib import Path

KEY1 = 0xA8937462
KEY2 = 0xF1A43653
GUARD1 = 0xFDFDFEEE
GUARD2 = 0xF00DBEEF
TAIL_SIZE = 288
PATH_LEN = 260


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


def read_c_string(buf: bytes, offset: int, maxlen: int = 128) -> str:
    end = buf.find(b"\0", offset, offset + maxlen)
    if end < 0:
        end = min(len(buf), offset + maxlen)
    raw = buf[offset:end]
    if not raw:
        return ""
    for enc in ("gbk", "utf-8", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1", errors="replace")


def read_wstring_fixed(buf: bytes, offset: int, max_chars: int = 32) -> str:
    chars: list[str] = []
    for i in range(max_chars):
        p = offset + i * 2
        if p + 2 > len(buf):
            break
        c = buf[p] | (buf[p + 1] << 8)
        if c == 0:
            break
        chars.append(chr(c))
    return "".join(chars)


def _decode_gbk(raw: bytes) -> str:
    try:
        return raw.decode("gbk")
    except UnicodeDecodeError:
        return raw.decode("latin-1", errors="replace")


def extract_icon_path(buf: bytes) -> str | None:
    """Return best-effort icon path or bare .dds filename from a record."""
    for m in re.finditer(rb"Surfaces\\[^\x00]{1,120}\.dds", buf, flags=re.IGNORECASE):
        return _decode_gbk(m.group())
    # Many essence sheets store only the atlas tile basename (GBK), e.g. 很吊的披风.dds
    i = 0
    while i < len(buf) - 4:
        if buf[i] == 0:
            i += 1
            continue
        j = i
        while j < len(buf) and buf[j] != 0 and j - i < 160:
            j += 1
        raw = buf[i:j]
        if b".dds" in raw.lower() and b"Models\\" not in raw and b"Matters\\" not in raw:
            return _decode_gbk(raw)
        i = j + 1
    return None


def icon_basename(icon_path: str | None) -> str:
    if not icon_path:
        return ""
    return icon_path.replace("/", "\\").split("\\")[-1].lower()


def extract_name(buf: bytes) -> str:
    # Common layouts: id(+optional ints) then utf16 name.
    # Try a few offsets used by essence sheets.
    for off in (4, 8, 12, 16, 20):
        name = read_wstring_fixed(buf, off, 32)
        if len(name) >= 2 and any(ch.isalpha() for ch in name):
            # reject mostly-control / garbage
            if sum(1 for ch in name if ch.isprintable()) >= max(2, len(name) // 2):
                return name
    return ""


def extract_addon_texts(buf: bytes) -> list[str]:
    texts: list[str] = []
    i = 0
    while i + 4 <= len(buf):
        if buf[i + 1] == 0 and (
            32 <= buf[i] < 127
            or buf[i]
            in (0xE1, 0xE2, 0xE3, 0xE7, 0xE9, 0xEA, 0xED, 0xF3, 0xF5, 0xFA)
        ):
            name = read_wstring_fixed(buf, i, 64)
            if len(name) >= 3 and any(ch.isalpha() for ch in name):
                if name not in texts:
                    texts.append(name)
                i += max(2, len(name) * 2 + 2)
                continue
        i += 1
    # first utf16 is usually the item name; keep extras as addon/desc snippets
    return texts[1:]


@dataclass
class PckEntry:
    path: str
    offset: int
    size: int
    csize: int


class MultiPartFile:
    def __init__(self, parts: list[Path]):
        self.parts = parts
        self.sizes = [p.stat().st_size for p in parts]
        self.handles = [open(p, "rb") for p in parts]
        self.total = sum(self.sizes)

    def read(self, offset: int, length: int) -> bytes:
        out = bytearray()
        base = 0
        for size, fh in zip(self.sizes, self.handles):
            if length <= 0:
                break
            if offset < base + size:
                local = offset - base
                n = min(length, size - local)
                fh.seek(local)
                out += fh.read(n)
                offset += n
                length -= n
            base += size
        return bytes(out)

    def close(self) -> None:
        for fh in self.handles:
            fh.close()


def package_parts(pck: Path) -> list[Path]:
    parts = [pck]
    for ext in (".pkx", ".pkx1", ".pkx2", ".pkx3"):
        nxt = pck.with_suffix(ext)
        if not nxt.exists():
            break
        parts.append(nxt)
    return parts


class Package:
    def __init__(self, pck: Path):
        self.pck = pck
        self.data = MultiPartFile(package_parts(pck))
        self.entries = self._read_index()
        self.by_path = {e.path.replace("/", "\\").lower(): e for e in self.entries}

    def _read_index(self) -> list[PckEntry]:
        tail = self.data.read(self.data.total - TAIL_SIZE, TAIL_SIZE)
        guard1, version, table_off, _flags = struct.unpack_from("<IIQI", tail, 0)
        guard2, _zero, count, version2 = struct.unpack_from(
            "<IIII", tail, TAIL_SIZE - 16
        )
        if (
            guard1 != GUARD1
            or guard2 != GUARD2
            or version != 0x00020003
            or version2 != version
        ):
            raise ValueError(f"{self.pck.name}: unsupported package tail")
        table_off ^= KEY1 | 0xFFFFFFFF00000000
        table = self.data.read(table_off, self.data.total - TAIL_SIZE - table_off)
        entries: list[PckEntry] = []
        pos = 0
        for _ in range(count):
            a, b = struct.unpack_from("<II", table, pos)
            pos += 8
            size = a ^ KEY1
            if size != b ^ KEY2:
                raise ValueError(f"{self.pck.name}: corrupt index at {pos}")
            raw = table[pos : pos + size]
            pos += size
            try:
                raw = zlib.decompress(raw)
            except zlib.error:
                pass
            name = raw[:PATH_LEN].split(b"\0", 1)[0].decode("gbk", errors="replace")
            offset, fsize, csize = struct.unpack_from("<QII", raw, 264)
            entries.append(PckEntry(name, offset, fsize, csize))
        return entries

    def read(self, entry: PckEntry) -> bytes:
        raw = self.data.read(entry.offset, entry.csize)
        if entry.csize < entry.size:
            raw = zlib.decompress(raw)
        return raw

    def close(self) -> None:
        self.data.close()


def iter_records(data: bytes, lst: dict):
    if not lst["ok"] or not lst["ids"]:
        return
    off = lst["data_offset"]
    for rid, size in zip(lst["ids"], lst["sizes"]):
        blob = data[off : off + size]
        off += size
        try:
            dec = mppc_decompress(blob)
        except Exception:
            continue
        if len(dec) < 8:
            continue
        yield rid, dec


def sanitize_text(value: str | None) -> str | None:
    """Drop UTF-16 surrogates that break utf-8 JSON encoding."""
    if value is None:
        return None
    return "".join(ch for ch in value if not (0xD800 <= ord(ch) <= 0xDFFF))


def extract_items(
    data: bytes,
    only_ids: set[int] | None = None,
    require_icon: bool = False,
) -> list[dict]:
    ver, ts, lists = read_lists(data)
    items: list[dict] = []
    seen: set[int] = set()
    for lst in lists:
        for rid, dec in iter_records(data, lst):
            if only_ids is not None and rid not in only_ids:
                continue
            if rid in seen:
                continue
            name = sanitize_text(extract_name(dec)) or ""
            icon = sanitize_text(extract_icon_path(dec))
            if require_icon and not icon:
                continue
            if not name and not icon:
                continue
            # Skip tiny type/category sheets: keep rows that look like real items
            if only_ids is None and not icon and len(name) < 2:
                continue
            addons = extract_addon_texts(dec)
            # Drop the name if it leaked into addons
            addons = [
                sanitize_text(a) or ""
                for a in addons
                if a != name
            ]
            addons = [a for a in addons if a][:6]
            items.append(
                {
                    "id": rid,
                    "list": lst["index"],
                    "name_pt_br": name,
                    "icon_path": icon,
                    "addon_texts": addons,
                    "record_size": len(dec),
                }
            )
            seen.add(rid)
    meta = {
        "elements_version": ver,
        "elements_version_low": ver & 0xFFFF,
        "timestamp": ts,
        "item_count": len(items),
    }
    return items, meta


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--elements",
        type=Path,
        default=Path(
            "data/fixtures/sources/client-br-levelup/raw/elements.data"
        ),
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=Path("data/fixtures/sources/client-br-levelup/items/items.extracted.json"),
    )
    ap.add_argument(
        "--ids-from",
        type=Path,
        help="Optional fixtures items.json — extract only those numeric aliases",
    )
    ap.add_argument("--surfaces", type=Path, help="Path to surfaces.pck")
    ap.add_argument(
        "--icons-out",
        type=Path,
        default=Path("data/fixtures/sources/client-br-levelup/icons"),
    )
    ap.add_argument("--limit-icons", type=int, default=0, help="0 = all matched")
    args = ap.parse_args()

    data = args.elements.read_bytes()
    only_ids = None
    if args.ids_from and args.ids_from.exists():
        fixtures = json.loads(args.ids_from.read_text(encoding="utf-8"))
        only_ids = set()
        for row in fixtures:
            for alias in row.get("aliases", []):
                if str(alias).isdigit():
                    only_ids.add(int(alias))

    items, meta = extract_items(
        data,
        only_ids=only_ids,
        require_icon=only_ids is None,
    )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    payload = {"meta": meta, "items": items}
    args.out.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"wrote {args.out} items={len(items)} version=0x{meta['elements_version']:08X}")

    if args.surfaces and args.surfaces.exists():
        from PIL import Image

        pkg = Package(args.surfaces)
        args.icons_out.mkdir(parents=True, exist_ok=True)

        atlas_txt = pkg.by_path.get("surfaces\\iconset\\iconlist_ivtrm.txt")
        atlas_dds = pkg.by_path.get("surfaces\\iconset\\iconlist_ivtrm.dds")
        if not atlas_txt or not atlas_dds:
            raise SystemExit("iconlist_ivtrm not found in surfaces.pck")

        lines = pkg.read(atlas_txt).decode("gbk", errors="replace").splitlines()
        tile_w, tile_h = int(lines[0]), int(lines[1])
        names = [ln.strip() for ln in lines[4:] if ln.strip()]
        index_by_name = {name.lower(): i for i, name in enumerate(names)}

        # Pillow reads DDS; keep a temp file for the atlas.
        atlas_path = args.icons_out / "_atlas_ivtrm.dds"
        atlas_path.write_bytes(pkg.read(atlas_dds))
        atlas_img = Image.open(atlas_path)
        # Header lines 3/4 are packing hints; real column count comes from atlas width.
        cols = max(1, atlas_img.size[0] // tile_w)

        extracted = 0
        missing = []
        for item in items:
            if args.limit_icons and extracted >= args.limit_icons:
                break
            base = icon_basename(item.get("icon_path"))
            if not base:
                missing.append(item["id"])
                continue
            idx = index_by_name.get(base)
            if idx is None:
                # try direct pck file (shop art, etc.)
                direct = None
                for e in pkg.entries:
                    if e.path.lower().endswith("\\" + base) or e.path.lower().endswith(
                        "/" + base
                    ):
                        direct = e
                        break
                if direct:
                    blob = pkg.read(direct)
                    out_dds = args.icons_out / f"{item['id']}.dds"
                    out_dds.write_bytes(blob)
                    try:
                        Image.open(out_dds).save(args.icons_out / f"{item['id']}.png")
                        item["icon_file"] = str(
                            (args.icons_out / f"{item['id']}.png").as_posix()
                        )
                    except Exception:
                        item["icon_file"] = str(out_dds.as_posix())
                    extracted += 1
                    continue
                missing.append(item["id"])
                continue
            x = (idx % cols) * tile_w
            y = (idx // cols) * tile_h
            tile = atlas_img.crop((x, y, x + tile_w, y + tile_h))
            out_png = args.icons_out / f"{item['id']}.png"
            tile.save(out_png)
            item["icon_file"] = str(out_png.as_posix())
            item["icon_atlas_index"] = idx
            extracted += 1

        pkg.close()
        try:
            atlas_path.unlink(missing_ok=True)
        except Exception:
            pass
        args.out.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"icons extracted={extracted} missing={len(missing)}")
        if missing[:20]:
            print("missing sample ids:", missing[:20])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
