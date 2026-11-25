from pathlib import Path
import os
import re
from collections import Counter

tmp = Path(os.environ["TEMP"])

def parse_kind(kind: str):
    text = (tmp / f"rupw-a78-{kind}.html").read_text(encoding="utf-8", errors="replace")
    rows = re.findall(
        r'<a href="\./\?ds=174&amp;p=(mine|npc|mob)&amp;id=(\d+)">([^<]+)</a></td>'
        r'<td class="num">([^<]*)</td>\s*'
        r"<td>(?:(\d+)\s+(\d+)\s*<span class=\"alt\">\((\d+)\)</span>)?</td>"
        r'<td class="num">(\d+)</td><td class="num">(\d+)</td>',
        text,
    )
    with_pos = [r for r in rows if r[4]]
    multi = [r for r in rows if not r[4] and int(r[7]) > 1]
    print(kind, "rows", len(rows), "single-pos", len(with_pos), "multi-no-pos", len(multi))
    return rows, with_pos

res_rows, res_pos = parse_kind("res")
npc_rows, npc_pos = parse_kind("npc")
mon_rows, mon_pos = parse_kind("mon")

print("\nSample resources with coords:")
for r in res_pos[:15]:
    print(f"  {r[2]} @ {r[4]} {r[5]} ({r[6]}) pts={r[7]}")

print("\nResources without single pos (top by count):")
res_multi = sorted(
    [r for r in res_rows if not r[4]], key=lambda r: -int(r[8])
)[:12]
for r in res_multi:
    print(f"  {r[2]} pts={r[7]} qty={r[8]}")

# Cross with BR client names of interest
wanted = [
    "Алтея",
    "Робертс",
    "Колорте",
    "Ландар",
    "Кандерсис",
    "Офицер",
    "телепорт",
    "Телепорт",
    "Банк",
    "Склад",
    "Аукцион",
    "Магазин",
    "кузнец",
    "портной",
]
print("\nUseful NPC hits:")
for r in npc_pos:
    name = r[2]
    if any(w.lower() in name.lower() for w in wanted) or "Офицер" in name:
        print(f"  {name} @ {r[4]} {r[5]} id={r[1]}")
