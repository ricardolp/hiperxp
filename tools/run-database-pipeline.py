#!/usr/bin/env python3
"""Run Database extract/build steps locally (no AI). Leave overnight-friendly jobs running.

Ready steps hit the client files / cotacao / catalog build.
Blocked steps print why and exit 0 for that step so you can plan next work.

Examples:
  python tools/run-database-pipeline.py --list
  python tools/run-database-pipeline.py --only extract-items,extract-quests,build
  python tools/run-database-pipeline.py --only descriptions -- --resume --delay 0.4
  python tools/run-database-pipeline.py --all-ready
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PY = sys.executable

DEFAULT_ELEMENTS = Path(r"C:\Level Up\Perfect World\element\data\elements.data")
DEFAULT_TASKS = Path(r"C:\Level Up\Perfect World\element\data\tasks.data")
SRC = ROOT / "data/fixtures/sources/client-br-levelup"


@dataclass(frozen=True)
class Step:
    key: str
    title: str
    status: str  # ready | blocked
    reason: str
    argv: list[str] | None = None


STEPS: list[Step] = [
    Step(
        "extract-items",
        "Extrair itens (+ ícones opcional via args)",
        "ready",
        "elements.data → items.all.json",
        [
            str(ROOT / "tools/extract-client-items.py"),
            "--elements",
            str(DEFAULT_ELEMENTS),
            "--out",
            str(SRC / "items/items.all.json"),
        ],
    ),
    Step(
        "extract-quests",
        "Extrair missões (texto / rewards / premise / series)",
        "ready",
        "tasks.data → quests.all.json",
        [
            str(ROOT / "tools/extract-client-tasks.py"),
            "--tasks",
            str(DEFAULT_TASKS),
            "--items-all",
            str(SRC / "items/items.all.json"),
            "--out",
            str(SRC / "quests/quests.all.json"),
        ],
    ),
    Step(
        "extract-recipes",
        "Extrair receitas",
        "ready",
        "elements.data lista 68 → recipes.all.json",
        [
            str(ROOT / "tools/extract-client-recipes.py"),
            "--elements",
            str(DEFAULT_ELEMENTS),
            "--out",
            str(SRC / "recipes/recipes.all.json"),
        ],
    ),
    Step(
        "extract-npcs",
        "Extrair NPCs (hello / serviços)",
        "ready",
        "elements.data lista 57 → npcs.all.json (~7k)",
        [
            str(ROOT / "tools/extract-client-npcs.py"),
            "--elements",
            str(DEFAULT_ELEMENTS),
            "--out",
            str(SRC / "npcs/npcs.all.json"),
        ],
    ),
    Step(
        "extract-shops",
        "Extrair lojas NPC",
        "ready",
        "elements.data lista 40 → shops.all.json",
        [
            str(ROOT / "tools/extract-client-npc-shops.py"),
            "--elements",
            str(DEFAULT_ELEMENTS),
            "--items-all",
            str(SRC / "items/items.all.json"),
            "--out",
            str(SRC / "shops/shops.all.json"),
        ],
    ),
    Step(
        "descriptions",
        "Descrições de item via cotacao (longo; use --resume)",
        "ready",
        "HTTP crawl resume-safe → descriptions.cotacao.json",
        [
            str(ROOT / "tools/fetch-cotacao-descriptions.py"),
            "--items-all",
            str(SRC / "items/items.all.json"),
            "--out",
            str(SRC / "items/descriptions.cotacao.json"),
            "--resume",
        ],
    ),
    Step(
        "build",
        "Montar catálogo público / fixtures",
        "ready",
        "sources → data/fixtures/database + apps/web/public/database",
        [str(ROOT / "tools/build-database-catalog.py")],
    ),
    Step(
        "npc-quest-links",
        "Vínculo NPC ↔ missões específicas",
        "blocked",
        "precisa ampliar extract-client-tasks.py (giver/deliver NPC ids no tasks.data)",
    ),
    Step(
        "quest-rich-fields",
        "Nível / facção / requisitos ricos da missão",
        "blocked",
        "offsets ainda não mapeados no extract de tasks",
    ),
    Step(
        "npc-coords",
        "Coordenadas de spawn de NPC",
        "blocked",
        "cliente BR local sem npcgen*; exige outra fonte (servidor/mapa)",
    ),
    Step(
        "client-drops",
        "Tabelas de drop do cliente",
        "blocked",
        "ainda sem extrator; só fixtures manuais de baú",
    ),
    Step(
        "addon-texts",
        "addon_texts dos itens no catálogo/UI",
        "blocked",
        "dado pode existir no extract de itens; catalog/UI ainda não persistem",
    ),
    Step(
        "recipe-skills",
        "skill_id / skill_level no catálogo/UI",
        "blocked",
        "já vem em recipes.all.json; build/UI ainda não expõem",
    ),
    Step(
        "all-npcs-catalog",
        "Incluir os ~7k NPCs no catálogo (não só craft/loja)",
        "blocked",
        "build filtra keep_ids; falta flag --include-all-npcs + UI de busca",
    ),
]


def by_key() -> dict[str, Step]:
    return {s.key: s for s in STEPS}


def list_steps() -> None:
    print("key                  status   title")
    print("-" * 72)
    for s in STEPS:
        print(f"{s.key:<20} {s.status:<8} {s.title}")
        print(f"{'':20}         {s.reason}")


def run_step(step: Step, extra: list[str]) -> int:
    print(f"\n=== [{step.key}] {step.title} ===", flush=True)
    if step.status != "ready" or not step.argv:
        print(f"SKIPPED ({step.status}): {step.reason}", flush=True)
        return 0

    cmd = [PY, *step.argv, *extra]
    print(">", " ".join(cmd), flush=True)
    proc = subprocess.run(cmd, cwd=ROOT)
    if proc.returncode != 0:
        print(f"FAILED [{step.key}] exit={proc.returncode}", flush=True)
    else:
        print(f"OK [{step.key}]", flush=True)
    return proc.returncode


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--list", action="store_true", help="List steps and exit")
    ap.add_argument(
        "--all-ready",
        action="store_true",
        help="Run every ready step in order (heavy; descriptions is long)",
    )
    ap.add_argument(
        "--only",
        type=str,
        default="",
        help="Comma-separated step keys (ready ones run; blocked print reason)",
    )
    ap.add_argument(
        "--skip-descriptions",
        action="store_true",
        help="With --all-ready, skip the long cotacao crawl",
    )
    ap.add_argument(
        "passthrough",
        nargs="*",
        help="Args after -- go to the single --only step (e.g. descriptions)",
    )
    args = ap.parse_args()

    if args.list or (not args.all_ready and not args.only):
        list_steps()
        if not args.list and not args.all_ready and not args.only:
            print(
                "\nUse --all-ready or --only <keys>. "
                "Extra args after -- go to a single --only step.",
            )
        return 0

    selected: list[Step]
    if args.all_ready:
        selected = [s for s in STEPS if s.status == "ready"]
        if args.skip_descriptions:
            selected = [s for s in selected if s.key != "descriptions"]
    else:
        wanted = [k.strip() for k in args.only.split(",") if k.strip()]
        unknown = [k for k in wanted if k not in by_key()]
        if unknown:
            raise SystemExit(f"unknown steps: {', '.join(unknown)}")
        selected = [by_key()[k] for k in wanted]

    extra = args.passthrough
    if extra and len(selected) != 1:
        raise SystemExit("passthrough args after -- require exactly one --only step")

    rc = 0
    for step in selected:
        code = run_step(step, extra if len(selected) == 1 else [])
        if code != 0:
            rc = code
            break
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
