"""Rebuild Tianyu drop badges like Alma da Paz: full-bleed circle, no qty digits."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[1]
assets = Path(r"C:\Users\ricar\.cursor\projects\d-Projetos-hiperxp\assets")
items_dir = root / "apps/web/public/icons/drops/items"
badges_dir = root / "apps/web/public/icons/drops/badges"
preview = root / "tmp-icon-preview"
preview.mkdir(exist_ok=True)
items_dir.mkdir(parents=True, exist_ok=True)
badges_dir.mkdir(parents=True, exist_ok=True)

# Absolute INNER art boxes (past gold frame, above qty digits)
JOBS = [
    (
        "image-40615cae-7a8e-4380-ad94-8a412a8b2fbb.png",
        [
            ("ty-profundeza", (348, 300, 425, 365)),
            ("ty-cristalizado", (480, 292, 575, 377)),
            ("ty-mago", (628, 300, 705, 365)),
        ],
    ),
    (
        "image-21cf6397-48ef-437e-b755-5e76a4d66a57.png",
        [
            ("ty-cacador", (342, 312, 418, 378)),
            ("ty-atirador", (488, 312, 564, 378)),
            ("ty-sombrio", (618, 298, 723, 396)),
        ],
    ),
    (
        "image-75a3451e-fbf6-4bae-adb3-25940278043e.png",
        [
            ("ty-alado-furioso", (428, 322, 502, 388)),
            ("ty-alado-sanguinario", (555, 312, 650, 400)),
            ("ty-alado-guarda", (690, 315, 785, 400)),
        ],
    ),
    (
        "image-e0c4087b-d724-49a4-98c9-8e3732f24782.png",
        [
            ("ty-tita-espirito", (340, 355, 440, 445)),
            ("ty-tita-pacificador", (485, 355, 585, 445)),
            ("ty-tita-furioso", (630, 355, 730, 445)),
        ],
    ),
]

FINAL = 64


def scrub_qty(im: Image.Image) -> Image.Image:
    """Replace bottom-right quantity digits with nearby background."""
    im = im.copy().convert("RGBA")
    w, h = im.size
    px = im.load()
    qty_x0 = w - max(22, w // 3)
    qty_y0 = h - max(14, h // 4)
    for y in range(qty_y0, h):
        for x in range(qty_x0, w):
            r, g, b, a = px[x, y]
            # white-ish digit pixels, or always cover far corner
            if r + g + b > 380 or x > w - max(12, w // 5) or y > h - max(8, h // 8):
                srcx = max(0, qty_x0 - 6)
                srcy = min(y, qty_y0 - 2) if qty_y0 > 2 else y
                nr, ng, nb, na = px[srcx, srcy]
                px[x, y] = (nr, ng, nb, 255)
    return im


def make_badge(slot: Image.Image) -> Image.Image:
    slot = scrub_qty(slot)
    # cover-fit into square then circle (full-bleed)
    side = max(slot.size)
    canvas = Image.new("RGBA", (side, side), (18, 14, 12, 255))
    ox = (side - slot.size[0]) // 2
    oy = (side - slot.size[1]) // 2
    canvas.paste(slot, (ox, oy))
    slot = canvas.resize((FINAL, FINAL), Image.Resampling.LANCZOS)

    badge = Image.new("RGBA", (FINAL, FINAL), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (FINAL, FINAL), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse((2, 3, FINAL - 1, FINAL), fill=(0, 0, 0, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(1.4))
    badge = Image.alpha_composite(badge, shadow)

    mask = Image.new("L", (FINAL, FINAL), 0)
    ImageDraw.Draw(mask).ellipse((2, 2, FINAL - 3, FINAL - 3), fill=255)
    clipped = Image.new("RGBA", (FINAL, FINAL), (18, 14, 12, 255))
    clipped.paste(slot, (0, 0))
    clipped.putalpha(mask)
    badge = Image.alpha_composite(badge, clipped)

    ring = Image.new("RGBA", (FINAL, FINAL), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.ellipse((2, 2, FINAL - 3, FINAL - 3), outline=(255, 255, 255, 235), width=3)
    rd.ellipse((4, 4, FINAL - 5, FINAL - 5), outline=(0, 0, 0, 70), width=1)
    return Image.alpha_composite(badge, ring)


for fname, crops in JOBS:
    im = Image.open(assets / fname).convert("RGBA")
    for key, box in crops:
        x0, y0, x1, y1 = box
        x1 = min(x1, im.size[0] - 1)
        y1 = min(y1, im.size[1] - 1)
        raw = im.crop((x0, y0, x1, y1))
        cleaned = scrub_qty(raw).resize((72, 72), Image.Resampling.LANCZOS)
        cleaned.save(items_dir / f"{key}.png")
        badge = make_badge(raw)
        badge.save(badges_dir / f"{key}.png")
        badge.resize((128, 128), Image.Resampling.NEAREST).save(preview / f"{key}.png")
        print("ok", key, "slot", raw.size)

print("preview ->", preview)
