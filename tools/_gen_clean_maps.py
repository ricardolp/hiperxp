from pathlib import Path


def clean_map(path: Path, title: str, accent: str, subtitle: str) -> None:
    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="875" height="850" viewBox="0 0 875 850" role="img" aria-label="{title}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#122033"/>
      <stop offset="55%" stop-color="#0d1826"/>
      <stop offset="100%" stop-color="#09131e"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="{accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.035)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="875" height="850" fill="url(#sky)"/>
  <rect width="875" height="850" fill="url(#glow)"/>
  <rect width="875" height="850" fill="url(#grid)"/>
  <ellipse cx="438" cy="390" rx="280" ry="190" fill="{accent}" fill-opacity="0.06"/>
  <path d="M80 620 C220 540, 340 680, 480 600 S720 520, 820 590 L820 850 L80 850 Z" fill="rgba(20,40,55,0.55)"/>
  <path d="M60 480 C180 420, 260 510, 400 450 S650 390, 800 460" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="18" stroke-linecap="round"/>
  <text x="438" y="400" text-anchor="middle" fill="rgba(244,240,242,0.55)" font-family="Segoe UI, system-ui, sans-serif" font-size="34" font-weight="600">{title}</text>
  <text x="438" y="438" text-anchor="middle" fill="rgba(168,176,186,0.55)" font-family="Segoe UI, system-ui, sans-serif" font-size="15">{subtitle}</text>
</svg>
"""
    path.write_text(svg, encoding="utf-8")
    print("wrote", path)


def main() -> None:
    root = Path("apps/web/public/maps")
    root.mkdir(parents=True, exist_ok=True)
    # Quedanunca usa arte real em quedanunca.jpg — não recriar o SVG vazio.
    clean_map(root / "mundo-primitivo.svg", "Mundo Primitivo", "#c4a35a", "Mapa base limpo · calibração em breve")
    clean_map(root / "mundo-normal.svg", "Mundo Normal", "#6fbf8a", "Mapa base limpo · pontos em breve")


if __name__ == "__main__":
    main()
