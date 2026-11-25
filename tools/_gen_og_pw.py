"""Compose a 1200x630 OG card with Perfect World scenery + HiperXP brand."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "apps" / "web" / "public"
BG = ROOT / "home" / "pw-tianyu-1.webp"
LOGO = ROOT / "brand" / "logos" / "hiperxp-escuro-1600.png"
GEM = ROOT / "brand" / "icones" / "hiperxp-gema-512.png"
OUT = ROOT / "brand" / "social" / "hiperxp-og-pw-1200x630.png"

W, H = 1200, 630


def main() -> None:
    canvas = Image.new("RGB", (W, H), (10, 9, 10))

    bg = Image.open(BG).convert("RGB")
    bw, bh = bg.size
    scale = max(W / bw, H / bh)
    nw, nh = int(bw * scale), int(bh * scale)
    bg = bg.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - W) // 2
    top = max(0, (nh - H) // 2 - 40)
    bg = bg.crop((left, top, left + W, top + H))
    bg = ImageEnhance.Brightness(bg).enhance(0.72)
    bg = ImageEnhance.Contrast(bg).enhance(1.05)
    canvas.paste(bg, (0, 0))

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for x in range(W):
        t = x / W
        alpha = int(210 * (1 - min(1.0, t / 0.62) ** 1.35) + 70 * (1 - t))
        alpha = max(40, min(230, alpha))
        draw.line([(x, 0), (x, H)], fill=(8, 6, 10, alpha))
    for y in range(H - 90, H):
        a = int(160 * ((y - (H - 90)) / 90))
        draw.line([(0, y), (W, y)], fill=(8, 6, 10, a))

    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)

    logo = Image.open(LOGO).convert("RGBA")
    lw = 560
    ratio = lw / logo.width
    logo = logo.resize((lw, int(logo.height * ratio)), Image.Resampling.LANCZOS)
    canvas.paste(logo, (64, 150), logo)

    d = ImageDraw.Draw(canvas)
    d.rectangle([64, 310, 134, 315], fill=(255, 0, 54, 255))

    bold = next(
        (
            p
            for p in (
                r"C:\Windows\Fonts\segoeuib.ttf",
                r"C:\Windows\Fonts\arialbd.ttf",
                r"C:\Windows\Fonts\segoeui.ttf",
            )
            if Path(p).exists()
        ),
        None,
    )
    regular = (
        r"C:\Windows\Fonts\segoeui.ttf"
        if Path(r"C:\Windows\Fonts\segoeui.ttf").exists()
        else bold
    )
    font_tag = ImageFont.truetype(bold, 22) if bold else ImageFont.load_default()
    font_h1 = ImageFont.truetype(bold, 42) if bold else ImageFont.load_default()
    font_sub = (
        ImageFont.truetype(regular, 24) if regular else ImageFont.load_default()
    )

    d.text(
        (64, 58),
        "FERRAMENTAS DA COMUNIDADE  ·  PERFECT WORLD",
        font=font_tag,
        fill=(255, 141, 166, 255),
    )
    d.text(
        (64, 340),
        "Explore mais. Evolua junto.",
        font=font_h1,
        fill=(250, 247, 248, 255),
    )
    d.text(
        (64, 410),
        "Mapas · Missões · Database · Simulador",
        font=font_sub,
        fill=(185, 172, 179, 255),
    )

    if GEM.exists():
        gem = Image.open(GEM).convert("RGBA")
        gem = gem.resize((72, 72), Image.Resampling.LANCZOS)
        alpha = gem.split()[-1].point(lambda p: int(p * 0.55))
        gem.putalpha(alpha)
        canvas.paste(gem, (W - 72 - 40, H - 72 - 28), gem)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out = canvas.convert("RGB")
    out.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
