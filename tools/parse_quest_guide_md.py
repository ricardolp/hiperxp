"""Parse community journey markdown into quest steps with coords/NPC."""

from __future__ import annotations

import re
from pathlib import Path

COORD_RE = re.compile(
    r"(?P<x>\d{2,3})\s*[,，]\s*(?P<y>\d{2,3})"
    r"(?:\s*[/(（]\s*(?:altura\s*)?(?P<z>\d{1,3})\s*[/)）])?",
    re.I,
)
NPC_RE = re.compile(
    r"(?:fale com o NPC|NPC)\s+([^.\n]{2,80}?)(?:\s+em\s+|\s*$)",
    re.I,
)
DIALOG_RE = re.compile(
    r"(?:resposta correta|op[cç][aã]o)\s*[:\-]?\s*([^\n.]{3,100})",
    re.I,
)


def parse_coords(text: str) -> list[dict]:
    out: list[dict] = []
    seen: set[tuple[int, int, int | None]] = set()
    for m in COORD_RE.finditer(text):
        x, y = int(m.group("x")), int(m.group("y"))
        z = int(m.group("z")) if m.group("z") else None
        if x < 40 or y < 40 or x > 900 or y > 900:
            continue
        key = (x, y, z)
        if key in seen:
            continue
        seen.add(key)
        out.append({"x": x, "y": y, "altitude": z})
        if len(out) >= 10:
            break
    return out


def parse_npc(text: str) -> str | None:
    m = NPC_RE.search(text)
    if not m:
        return None
    name = re.sub(r"\s+", " ", m.group(1)).strip(" ,.")
    # Drop trailing coord leftovers
    name = re.sub(r"\s+\d{2,3}\s*[,，].*$", "", name).strip()
    return name or None


def slugify(value: str) -> str:
    s = value.lower()
    s = re.sub(r"[^a-z0-9à-ú]+", "-", s, flags=re.I)
    return s.strip("-")[:48] or "step"


def parse_quest_guide_md(path: Path, max_steps: int = 80) -> list[dict]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    # Drop header noise before first ###
    parts = re.split(r"(?m)^###\s+", text)
    steps: list[dict] = []
    order = 0
    for part in parts[1:]:
        lines = part.strip().splitlines()
        if not lines:
            continue
        title = lines[0].strip()
        body = "\n".join(lines[1:]).strip()
        if not title or title.lower() in {"índice", "indice"}:
            continue
        # Skip pure comment sections
        if title.lower().startswith("coment"):
            continue
        order += 1
        instruction = re.sub(r"\n{3,}", "\n\n", body)
        instruction = re.sub(r"[ \t]+", " ", instruction)
        instruction = instruction.strip()
        if len(instruction) > 700:
            instruction = instruction[:697].rstrip() + "…"
        dialog = DIALOG_RE.search(body)
        steps.append(
            {
                "id": f"step-{order:02d}-{slugify(title)}",
                "order": order,
                "title_pt_br": title,
                "instruction_pt_br": instruction or title,
                "npc": parse_npc(body),
                "coords": parse_coords(body),
                "dialog_hint": dialog.group(0).strip() if dialog else None,
                "notes": None,
            }
        )
        if order >= max_steps:
            break
    return steps
