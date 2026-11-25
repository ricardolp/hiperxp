"""Gera arte Quedanunca a partir do mapa zoom da PWpedia e atualiza o fixture."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data/fixtures/sources/maps/western-steppes-zoom.png"
OUT_WEBP = ROOT / "apps/web/public/maps/quedanunca.webp"
OUT_JPG = ROOT / "apps/web/public/maps/quedanunca.jpg"
FIXTURE = ROOT / "data/fixtures/maps/continente-ocidental.json"

# Affine calibrado com landmarks PWpedia (City Hall, Marketplace,
# Dawnlight Halls, Datun Docks, Niore).
TRANSFORM = {
    "a": 4.417132213993277,
    "b": 0.042198431879535314,
    "c": -527.8894436451035,
    "d": -0.6948151057642183,
    "e": -5.140482255125197,
    "f": 4381.014911376134,
}


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    im.save(OUT_WEBP, "WEBP", quality=82, method=6)
    im.save(OUT_JPG, "JPEG", quality=85, optimize=True)

    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    fixture["width"] = w
    fixture["height"] = h
    fixture["asset"] = "/maps/quedanunca.webp"
    fixture["transform"] = TRANSFORM
    fixture["notice"] = (
        "Mapa Western Steppes (Quedanunca) da PWpedia — qualidade alta. "
        "Pontos simplificados das diárias com calibração aproximada. foreign_reference."
    )
    fixture["synthetic"] = False
    fixture["origin"] = "third_party"
    fixture["source_url"] = (
        "https://pwi.fandom.com/wiki/File:Western_Steppes_Map_zoom.png"
    )
    fixture["native_refs"] = {
        "pwi.fandom.com": {
            "file": "Western_Steppes_Map_zoom.png",
            "size": [w, h],
        }
    }
    FIXTURE.write_text(
        json.dumps(fixture, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("wrote", OUT_WEBP, w, "x", h)


if __name__ == "__main__":
    main()
