"""Recalibra transform + corrige coords das fotos Memórias pelos rótulos da PWpedia."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data/fixtures/sources/maps/western-steppes-zoom.png"
FIXTURE = ROOT / "data/fixtures/maps/continente-ocidental.json"
QUESTS = ROOT / "data/fixtures/quests/continente-ocidental.json"
OUT = ROOT / "apps/web/public/maps/_photo-calib.jpg"
IMPORT = ROOT / "tools/_import_quedanunca_points.py"

# Controles: game coords conhecidos + pixel no rótulo/área do mapa zoom.
CONTROLS: list[tuple[tuple[int, int], tuple[int, int], str]] = [
    ((320, 613), (900, 1025), "City Hall"),
    ((330, 576), (930, 1155), "Marketplace"),
    ((315, 594), (880, 1120), "Evelyn tavern"),
    ((359, 601), (1030, 1050), "Paladin Square"),
    ((384, 586), (1150, 1085), "Church"),
    ((368, 466), (1125, 1725), "Datun Docks"),
    ((380, 475), (1175, 1675), "Niore"),
    ((312, 527), (800, 1425), "Lantis Tavern"),
    ((325, 491), (825, 1600), "Wenham"),
    ((381, 502), (1160, 1510), "Hibeth entrance"),
    ((442, 627), (1475, 825), "Dawnlight Halls"),
    ((440, 602), (1525, 1025), "Dragonslayer Fall"),
    ((478, 593), (1720, 1100), "Magnier"),
]

# Fotos: pixel no centro do local rotulado (mapa zoom).
PHOTO_PIXELS: dict[str, tuple[int, int]] = {
    "step-07-praca-do-paladino": (1030, 1050),
    "step-08-bar-da-evelyn": (880, 1120),
    "step-09-igreja": (1150, 1085),
    "step-10-descanso-glorioso": (1350, 1400),  # Glory's Rest
    "step-11-bosque-disspa": (1650, 820),
    "step-12-floresta-de-hibeth": (1150, 1480),
    "step-13-lago-da-tormenta": (2160, 370),  # Storm Lake — centro do lago gelado
    "step-14-portal-do-infinito": (2200, 650),  # Gate of Escape / Cycles
    "step-15-fonte-abandonada": (2350, 450),  # Derelict Mint
    "step-16-tribo-senhor-feras": (2100, 1580),  # Beast Lord Tribe
    "step-17-vale-orbital": (1350, 525),  # Fountain of Omen
    "step-18-campo-girassol": (1175, 470),  # Gaddar Sunflower Shrub Plains
    "step-19-cemiterio-de-titas": (1025, 330),  # Desolate Castle / Titan area N
    "step-20-fonte-da-vida": (1610, 1625),  # Well of Life
    "step-21-docas-de-datun": (1125, 1725),
    "step-22-queda-mata-dragao": (1525, 1025),
    "step-23-baixio-do-monolito": (1400, 275),  # Monolith Shoal (norte)
    "step-24-templo-de-nimis": (980, 720),  # Neverfall North / templo
    "step-25-cerne-quebrado-foto": (1600, 1475),  # Shattered Hub
    "step-26-fontequente": (1960, 1180),  # perto Drapha / Warmspring approx
}


HEIGHT = 2648
WIDTH = 2487


def to_leaflet(u: float, v_top: float) -> tuple[float, float]:
    """Pixels do PNG (origem no topo) → coords Leaflet CRS.Simple (lat sobe = topo da imagem)."""
    return u, HEIGHT - v_top


def fit_affine(pairs):
    """pares: ((gx, gy), (u, v_leaflet), name)"""
    rows, rhs = [], []
    for (x, y), (u, v), _ in pairs:
        rows += [[x, y, 1, 0, 0, 0], [0, 0, 0, x, y, 1]]
        rhs += [u, v]
    sol, *_ = np.linalg.lstsq(np.array(rows, float), np.array(rhs, float), rcond=None)
    a, b, c, d, e, f = map(float, sol)
    t = {"a": a, "b": b, "c": c, "d": d, "e": e, "f": f}
    pred = np.array(rows, float) @ sol
    rmse = float(np.sqrt(np.mean((pred - rhs) ** 2)))
    return t, rmse


def apply(t, x, y):
    return t["a"] * x + t["b"] * y + t["c"], t["d"] * x + t["e"] * y + t["f"]


def inverse(t, u, v):
    M = np.array([[t["a"], t["b"]], [t["d"], t["e"]]], float)
    xy = np.linalg.solve(M, np.array([u - t["c"], v - t["f"]], float))
    return float(xy[0]), float(xy[1])


def main() -> None:
    # CONTROLS / PHOTO_PIXELS guardam pixel do PNG (v a partir do topo).
    # O MapView usa position=[v, u] como latLng Leaflet → v precisa ser height - pixel_y.
    leaflet_controls = [
        ((x, y), to_leaflet(u, v), name) for (x, y), (u, v), name in CONTROLS
    ]
    t, rmse = fit_affine(leaflet_controls)
    print("transform rmse", round(rmse, 1), t)
    for (x, y), (u, v), name in leaflet_controls:
        pu, pv = apply(t, x, y)
        print(f"  {name:20s} err={((pu-u)**2+(pv-v)**2)**0.5:5.1f} leaflet=({u:.0f},{v:.0f})")

    quests = json.loads(QUESTS.read_text(encoding="utf-8"))
    updates = []
    for quest in quests["quests"]:
        if quest.get("slug") != "esforco-da-guerra":
            continue
        for step in quest.get("steps", []):
            sid = step["id"]
            if sid not in PHOTO_PIXELS:
                continue
            u_top, v_top = PHOTO_PIXELS[sid]
            u, v = to_leaflet(u_top, v_top)
            gx, gy = inverse(t, u, v)
            nx, ny = int(round(gx)), int(round(gy))
            old = step["coords"][0]
            updates.append(
                (sid, step.get("title_pt_br"), old["x"], old["y"], nx, ny, u_top, v_top, u, v)
            )
            alt = old.get("altitude")
            step["coords"] = [{"x": nx, "y": ny, "altitude": alt}]

    print("\nPhoto coord fixes:")
    for sid, title, ox, oy, nx, ny, u_top, v_top, u, v in updates:
        print(
            f"  {title}: ({ox},{oy}) -> ({nx},{ny})  "
            f"png=({u_top},{v_top}) leaflet=({u:.0f},{v:.0f})"
        )

    QUESTS.write_text(json.dumps(quests, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    fixture["transform"] = t
    fixture["width"] = WIDTH
    fixture["height"] = HEIGHT
    fixture["native_refs"] = fixture.get("native_refs") or {}
    fixture["native_refs"]["calibration_landmarks"] = [
        {
            "name": name,
            "game": [x, y],
            "image_png": [u, v],
            "image_leaflet": list(to_leaflet(u, v)),
        }
        for (x, y), (u, v), name in CONTROLS
    ]
    FIXTURE.write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # preview no espaço do PNG (topo = 0)
    im = Image.open(SRC).convert("RGB")
    dr = ImageDraw.Draw(im)
    for sid, title, ox, oy, nx, ny, u_top, v_top, u, v in updates:
        dr.ellipse(
            [u_top - 14, v_top - 14, u_top + 14, v_top + 14],
            outline=(255, 220, 0),
            width=4,
        )
        dr.text(
            (u_top + 16, v_top - 8),
            title.replace("Foto — ", "")[:14],
            fill=(255, 220, 0),
        )
    for (x, y), (u, v), name in CONTROLS:
        dr.ellipse([u - 6, v - 6, u + 6, v + 6], outline=(0, 255, 255), width=2)
    im.resize((1100, int(1100 * im.size[1] / im.size[0]))).save(OUT, quality=88)
    print("wrote", OUT)
    print("re-run import next")


if __name__ == "__main__":
    main()
