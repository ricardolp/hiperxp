#!/usr/bin/env python3
"""Extract one NPC skin from models.pck and build a Three.js demo payload.

Default target: Ferreiro Gorg Veramon (elements id 4434 → 2014npc铁匠).
Requires: pip install autoangel pillow
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import autoangel
from PIL import Image

DEFAULT_PCK = Path(r"C:\Level Up\Perfect World\element\models.pck")
DEFAULT_PREFIX = r"models\npcs\npc\2014npc铁匠"
DEFAULT_OUT = Path(
    "data/fixtures/sources/client-br-levelup/npc-models/gorg-veramon"
)
DEFAULT_WEB = Path("apps/web/public/npc-demo/gorg-veramon")


def package_parts(pck: Path) -> list[str]:
    parts: list[str] = []
    for ext in (".pkx", ".pkx1", ".pkx2", ".pkx3"):
        nxt = pck.with_suffix(ext)
        if not nxt.exists():
            break
        parts.append(str(nxt))
    return parts


def mesh_to_dict(mesh, *, skinned: bool) -> dict:
    return {
        "name": str(mesh.name),
        "texture_index": int(mesh.texture_index),
        "material_index": int(mesh.material_index),
        "positions": [float(x) for x in mesh.positions],
        "normals": [float(x) for x in mesh.normals],
        "uvs": [float(x) for x in mesh.uvs],
        "indices": [int(x) for x in mesh.indices],
        "skinned": skinned,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--pck", type=Path, default=DEFAULT_PCK)
    ap.add_argument("--prefix", default=DEFAULT_PREFIX)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--web-out", type=Path, default=DEFAULT_WEB)
    ap.add_argument("--npc-id", type=int, default=4434)
    ap.add_argument("--name", default="Ferreiro Gorg Veramon")
    args = ap.parse_args()

    pkx = package_parts(args.pck)
    pkg = autoangel.read_pck(str(args.pck), pkx or None)
    hits = [p for p in pkg.file_list() if p.startswith(args.prefix)]
    if not hits:
        raise SystemExit(f"no files under prefix {args.prefix!r}")

    raw_dir = args.out / "raw"
    tex_dir = args.out / "textures"
    raw_dir.mkdir(parents=True, exist_ok=True)
    tex_dir.mkdir(parents=True, exist_ok=True)

    ski_bytes: bytes | None = None
    for path in hits:
        data = bytes(pkg.get_file(path))
        name = Path(path.replace("\\", "/")).name
        if path.lower().endswith(".dds") or "\\textures\\" in path.lower():
            (tex_dir / name).write_bytes(data)
        else:
            (raw_dir / name).write_bytes(data)
        if path.lower().endswith(".ski"):
            ski_bytes = data
        print(f"wrote {name} ({len(data)} bytes)")

    if not ski_bytes:
        raise SystemExit("no .ski found under prefix")

    skin = autoangel.read_skin(ski_bytes)
    meshes = [mesh_to_dict(m, skinned=True) for m in skin.skin_meshes]
    meshes += [mesh_to_dict(m, skinned=False) for m in skin.rigid_meshes]

    textures: list[dict] = []
    for i, tname in enumerate(skin.textures):
        src = tex_dir / Path(str(tname).replace("\\", "/")).name
        if not src.exists():
            cands = sorted(tex_dir.glob("*.dds"))
            src = cands[i] if i < len(cands) else None
        if src is None or not src.exists():
            raise SystemExit(f"missing texture {tname}")
        png_name = f"tex_{i}.png"
        Image.open(src).save(tex_dir / png_name)
        textures.append({"name": str(tname), "file": f"textures/{png_name}"})

    payload = {
        "npc_id": args.npc_id,
        "name_pt_br": args.name,
        "source_model": args.prefix.replace("\\", "/") + ".ski",
        "ski_version": int(skin.version),
        "textures": textures,
        "meshes": meshes,
    }
    (args.out / "model.json").write_text(
        json.dumps(payload, ensure_ascii=False), encoding="utf-8"
    )

    web = args.web_out
    (web / "textures").mkdir(parents=True, exist_ok=True)
    for t in textures:
        src = args.out / t["file"]
        (web / "textures" / src.name).write_bytes(src.read_bytes())
    (web / "model.json").write_text(
        json.dumps(payload, ensure_ascii=False), encoding="utf-8"
    )

    verts = sum(len(m["positions"]) // 3 for m in meshes)
    tris = sum(len(m["indices"]) // 3 for m in meshes)
    print(
        f"demo ready: {len(meshes)} meshes, {verts} verts, {tris} tris → {web}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
