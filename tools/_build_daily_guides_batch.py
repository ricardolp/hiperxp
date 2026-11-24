#!/usr/bin/env python3
"""Upsert Alma de Tianyu, Mie Wuyan/Wuyou e Espíritos Sagrados (Vitae)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUESTS = ROOT / "data" / "fixtures" / "quests"


def C(x: int, y: int, z: int | None = None) -> dict:
    return {"x": x, "y": y, "altitude": z}


def step(
    order: int,
    sid: str,
    title: str,
    instruction: str,
    *,
    npc: str | None = None,
    coords: list[dict] | None = None,
    notes: str | None = None,
) -> dict:
    return {
        "id": sid,
        "order": order,
        "title_pt_br": title,
        "instruction_pt_br": instruction,
        "npc": npc,
        "coords": coords or [],
        "dialog_hint": None,
        "notes": notes,
        "image_url": None,
        "image_alt": None,
    }


def upsert(catalog_path: Path, quest: dict, *, catalog_name: str | None = None) -> None:
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    qid, slug = quest["id"], quest["slug"]
    others = [q for q in catalog["quests"] if q.get("id") != qid and q.get("slug") != slug]
    others.insert(0 if quest.get("order", 99) == 0 else len(others), quest)
    # keep stable: sort by order then slug
    others.sort(key=lambda q: (q.get("order", 999), q.get("slug", "")))
    catalog["quests"] = others
    catalog["generated_at"] = "2026-11-24"
    if catalog_name:
        catalog["name_pt_br"] = catalog_name
    src = quest.get("source_url")
    sources = list(catalog.get("sources") or [])
    if src and src not in sources:
        sources.append(src)
    catalog["sources"] = sources
    catalog_path.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"  + {slug} → {catalog_path.name} ({len(quest['steps'])} steps)")


def quest_alma_tianyu() -> dict:
    notice = (
        "Estrutura das 4 etapas igual à Alma da Paz; pools de coords ainda "
        "compartilhados/parciais. foreign_reference — Trivia spoiler + patch notes LUG."
    )
    return {
        "id": "quest-tianyu-alma-de-tianyu",
        "slug": "alma-de-tianyu",
        "map_slug": "tianyu",
        "kind": "daily",
        "order": 0,
        "name_pt_br": "Alma de Tianyu (Diária I–V)",
        "aliases": [
            "Coração de Tianyu",
            "Alma de Tianyu I",
            "Alma de Tianyu II",
            "Alma de Tianyu III",
            "Alma de Tianyu IV",
            "Alma de Tianyu V",
            "Diária Tianyu",
        ],
        "excerpt_pt_br": (
            "Diária de relíquias do Coração de Tianyu — mutuamente exclusiva "
            "com Alma da Paz no mesmo dia."
        ),
        "summary_pt_br": (
            "Com Alma de Tianyu nível 1+, aceite no Sacerdote Divino de Tianyu. "
            "Mesmas quatro etapas da Alma da Paz (Alma de Pan Gu → Poder Celestial "
            "→ Memória de Pan Gu → Artefato dos Cinco Refinos). Recompensa Relíquia "
            "de Tianyu do nível da missão."
        ),
        "prerequisite_pt_br": (
            "Nv 100+, Reborn II, meridiano completo, Alma de Tianyu Nv.1+. "
            "Não fazer Alma da Paz Eterna no mesmo dia."
        ),
        "rewards_pt_br": (
            "Relíquia / Consciência Alma de Tianyu; Selo do Palácio Celestial "
            "(valores conforme patch)."
        ),
        "published_at": "2026-06-03",
        "coverage_status": "partial",
        "review_status": "foreign_reference",
        "origin": "community_observed",
        "source_url": (
            "https://triviapw.com.br/2026/06/03/"
            "nova-missao-diaria-coracao-de-tianyu-reino-oriental-segredos-de-tianyu/"
        ),
        "notice": notice,
        "steps": [
            step(
                1,
                "step-01-desbloquear",
                "Desbloquear Alma de Tianyu",
                (
                    "Desperte a aba Coração de Tianyu (itens de troca Pan Gu + exp "
                    "de anedota/desafios/globais de Tianyu). A passiva Trindade Pura "
                    "(+25% HP) exige Fonte de Energia: Cauda Nv.10 no Salão Principal."
                ),
                coords=[C(198, 761, 135)],
                notes="Fonte Cauda — 198,761(135). Relíquias Cauda ×100 pelo mapa.",
            ),
            step(
                2,
                "step-02-aceitar",
                "Aceitar a diária",
                (
                    "Fale com o Sacerdote Divino de Tianyu (Sacerdote de Tianyu) e "
                    "aceite Alma de Tianyu no nível da sua alma (I–V). Falha às 0h."
                ),
                npc="Sacerdote Divino de Tianyu",
                notes=(
                    "IDs cliente 52979–52983. Coordenada exata do NPC ainda não "
                    "confirmada no Trivia — use o ícone da missão no mapa."
                ),
            ),
            step(
                3,
                "step-03-etapas",
                "Quatro etapas (mesmo modelo da Alma da Paz)",
                (
                    "【I】 Alma de Pan Gu · 【II】 Poder Celestial · 【III】 Memória de "
                    "Pan Gu · 【IV】 Artefato dos Cinco Refinos. Enquanto o Trivia "
                    "não publicar pools próprios de Tianyu, use as coordenadas do "
                    "guia Alma da Paz Eterna para variantes de paisagem/foto/NPC/"
                    "corrida/auxílio/farm."
                ),
                notes="Ver /missoes/cidade-da-paz/alma-da-paz-eterna",
            ),
            step(
                4,
                "step-04-reportar",
                "Reportar ao Sacerdote",
                (
                    "Ao fechar as etapas, retorne ao Sacerdote de Tianyu para "
                    "reportar e receber a relíquia do nível correspondente."
                ),
                npc="Sacerdote de Tianyu",
            ),
        ],
    }


def quest_mie_wuyan() -> dict:
    return {
        "id": "quest-cidade-da-paz-mie-wuyan",
        "slug": "mie-wuyan",
        "map_slug": "cidade-da-paz",
        "kind": "daily",
        "order": 0,
        "name_pt_br": "Derrotar Mie Wuyan",
        "aliases": [
            "Mie Wuyan",
            "Mie Wuyou",
            "Boss diário Reino Oriental",
            "Expedição Punitiva",
        ],
        "excerpt_pt_br": (
            "Boss diário do Reino Oriental — token, plataforma e farm de Ramos Secos."
        ),
        "summary_pt_br": (
            "Missão diária de derrotar Mie Wuyan (Cidade da Paz) ou Mie Wuyou "
            "(Tianyu). Token no Oficial da Expedição / Recompensas; até 7 "
            "recompensas no ciclo, 1 por dia."
        ),
        "prerequisite_pt_br": "Acesso ao Reino Oriental (Nv 100+, Reborn II).",
        "rewards_pt_br": (
            "Baú/recompensa diária; Ramos Secos (progresso Alma da Paz); "
            "ingressos via Oficial de Recompensas."
        ),
        "published_at": "2025-10-15",
        "coverage_status": "partial",
        "review_status": "foreign_reference",
        "origin": "community_observed",
        "source_url": (
            "https://triviapw.com.br/2025/10/15/"
            "terras-orientais-novo-mapa-da-expansao-do-ceifador-guia-completo/"
        ),
        "notice": (
            "Coords do Trivia/guia Terras Orientais + cliente BR. "
            "foreign_reference."
        ),
        "steps": [
            step(
                1,
                "step-01-token",
                "Pegar o token",
                (
                    "Fale com o Oficial da Expedição Punitiva / Oficial de "
                    "Recompensas e pegue o Token Mie Wuyan (1×/dia)."
                ),
                npc="Oficial da Expedição Punitiva",
                coords=[C(59, 377, 94)],
                notes="Cliente: Derrotar Mie Wuyan / Nº de Derrotas (até 7).",
            ),
            step(
                2,
                "step-02-auto",
                "Missão automática no local",
                (
                    "Aproxime-se de 298,411(101) para receber a diária automática "
                    "de derrota. Sair da área cancela; volte para pegar de novo. "
                    "Recomenda-se grupo."
                ),
                coords=[C(298, 411, 101)],
            ),
            step(
                3,
                "step-03-plataforma",
                "Ativar a pedra e enfrentar o boss",
                (
                    "Ative a pedra no centro da plataforma (consome o token) e "
                    "lute. Solo Mie Wuyan: ~5 min, Labirinto Solar 2× (~75% e "
                    "~15% HP, 60s / 30s). Ao vencer, abra o baú dourado rápido."
                ),
                notes="Drop útil: Ramos Secos para Alma da Paz.",
            ),
            step(
                4,
                "step-04-mie-wuyou",
                "Variante Tianyu — Mie Wuyou",
                (
                    "Na Cidade de Tianyu o ciclo equivalente é Derrotar Mie Wuyou "
                    "(Oficial de Recompensas de Mie Wuyou). Mesma regra: 1 "
                    "ingresso/dia, até 7 recompensas no total."
                ),
                npc="Oficial de Recompensas de Mie Wuyou",
                notes="IDs cliente ~52886–52895.",
            ),
        ],
    }


def quest_espiritos_sagrados() -> dict:
    """Farm de Vitae (Vigor) — pontos Western Steppes / Quedanunca."""
    notice = (
        "Coords e tiers de PWpedia Sacred Spirits. foreign_reference — "
        "validar caps/HP no BR. Mapa do Continente Ocidental ainda sem "
        "calibração completa."
    )
    spirits = [
        (
            "Miragem (Silent Plains)",
            "Espírito Sagrado: Céu Miragem — planícies silenciosas",
            [
                C(360, 481),
                C(356, 492),
                C(359, 504),
                C(335, 500),
                C(345, 508),
                C(322, 510),
            ],
            "Até ~80 Vitae/kill (cap diário do seu Céu).",
        ),
        (
            "Crepúsculo (Ishire)",
            "Espírito Sagrado: Céu Crepúsculo — Ishire a oeste de Magnier",
            [
                C(447, 599),
                C(448, 585),
                C(460, 580),
                C(459, 594),
                C(467, 602),
                C(467, 589),
            ],
            "AoE + slow/bleed. ~200 Vitae máx.",
        ),
        (
            "Real (Gemini / Polydeux)",
            "Espírito Sagrado: Céu Real — oeste de Polydeux",
            [
                C(519, 717),
                C(513, 708),
                C(515, 700),
                C(508, 691),
                C(508, 701),
            ],
            None,
        ),
        (
            "Devoto (sudeste)",
            "Espírito Sagrado: Céu Devoto — sul Hannibal / oeste Alquimistas",
            [
                C(546, 490),
                C(574, 498),
                C(516, 521),
                C(524, 525),
            ],
            "Beast Lord 546,490 · Dragon's Graveyard 574,498 · Vampire Bat "
            "516,521 · Lifeless Woods 524,525 (espalhado).",
        ),
        (
            "Ápice (noroeste)",
            "Espírito Sagrado: Céu Ápice — Western Plains / Vidal Forest",
            [
                C(251, 740),
                C(263, 724),
                C(290, 726),
                C(241, 712),
                C(242, 688),
            ],
            None,
        ),
        (
            "Majestoso (Rising)",
            "Espírito Sagrado: Céu Majestoso — Sea of Spooky Flowers / Witch Titan",
            [
                C(241, 573),
                C(250, 572),
                C(249, 563),
                C(241, 564),
            ],
            None,
        ),
        (
            "Soberano (Seal / Ragnarök)",
            "Espírito Sagrado: Céu Soberano — Flame Giant / Ragnarök",
            [
                C(259, 487),
                C(262, 480),
                C(271, 487),
                C(278, 483),
            ],
            "Mesma região dos mobs de Pontos Arcanos do Céu Soberano.",
        ),
    ]
    steps = [
        step(
            1,
            "step-01-regras",
            "Como funciona",
            (
                "Espíritos Sagrados (Sacred Spirits / mobs de Vitae) dão Pontos "
                "de Vigor ao matar, com teto diário por Limite de Céu (reset 0h; "
                "subir de Céu zera o contador do dia). Vitae cheia no Céu "
                "correspondente; cada Céu acima do mob divide pela metade. "
                "Barra de limite: tecla C."
            ),
            notes="Fonte: https://pwi.fandom.com/wiki/Sacred_Spirits",
        )
    ]
    for i, (title, instruction, coords, notes) in enumerate(spirits, start=2):
        steps.append(
            step(
                i,
                f"step-{i:02d}-espiritos",
                title,
                instruction + "\nGrupos nas coordenadas listadas.",
                coords=coords,
                notes=notes,
            )
        )
    steps.append(
        step(
            len(steps) + 1,
            "step-mundoprim",
            "Também no Mundo Primitivo",
            (
                "Céus Arcano / Miragem / Astral / Oscilante também têm packs no "
                "Mundo Primitivo (Mirrorflower, Snow Ape, Glacial Prison, "
                "Waverun). Guia de mapa MP ainda não está no HiperXP — use "
                "PWpedia Sacred Spirits para esses pontos."
            ),
        )
    )
    return {
        "id": "quest-continente-ocidental-espiritos-sagrados",
        "slug": "espiritos-sagrados",
        "map_slug": "continente-ocidental",
        "kind": "daily",
        "order": 2,
        "name_pt_br": "Espíritos Sagrados (Farm de Vigor)",
        "aliases": [
            "Sacred Spirits",
            "Vitae Mobs",
            "Sacred Realm Phantoms",
            "Mobs de Vitalidade",
            "Farm de Vigor",
        ],
        "excerpt_pt_br": (
            "Pontos de farm diário de Vitae/Vigor por Limite de Céu no Continente Ocidental."
        ),
        "summary_pt_br": (
            "Mate Espíritos Sagrados do seu Céu (ou próximos) até o teto diário "
            "de Vitae. Lista de packs no Quedanunca / Continente Ocidental."
        ),
        "prerequisite_pt_br": "Reborn + Limite de Céu correspondente; acesso a Quedanunca.",
        "rewards_pt_br": "Pontos de Vigor (Vitae) até o cap diário do Céu.",
        "published_at": "2018-09-19",
        "coverage_status": "partial",
        "review_status": "foreign_reference",
        "origin": "community_observed",
        "source_url": "https://pwi.fandom.com/wiki/Sacred_Spirits",
        "notice": notice,
        "steps": steps,
    }


def quest_chama_vinganca() -> dict:
    return {
        "id": "quest-continente-ocidental-chama-da-vinganca",
        "slug": "chama-da-vinganca",
        "map_slug": "continente-ocidental",
        "kind": "daily",
        "order": 3,
        "name_pt_br": "Chama da Vingança",
        "aliases": ["Flame of Vengeance", "Diária: Chama da Vingança", "Céu Devoto"],
        "excerpt_pt_br": "Diária de Vigor do Céu Devoto — progresso ao norte de Quedanunca.",
        "summary_pt_br": (
            "Mate Guerreiros da Vingança ao norte de Quedanunca até 100% de "
            "progresso (ou cave torres de Demolição). Recompensa inclui "
            "Espírito Sagrado: Céu Devoto."
        ),
        "prerequisite_pt_br": "Nv 100+, Reborn II, Céu Devoto I–X.",
        "rewards_pt_br": (
            "50.000 Vitae; Espírito Sagrado Devoto; Sangue Bárbaro; Cristal; "
            "Insígnia; Pedra Yin Yang; Moeda Brilhante; Baú Astrolábios."
        ),
        "published_at": "2024-11-24",
        "coverage_status": "partial",
        "review_status": "foreign_reference",
        "origin": "community_observed",
        "source_url": "https://pwi.fandom.com/wiki/Flame_of_Vengeance",
        "notice": "PWpedia Flame of Vengeance + Trivia Limite de Céu. foreign_reference.",
        "steps": [
            step(
                1,
                "step-01-aceitar",
                "Aceitar a diária",
                "Com Céu Devoto, aceite Diária: Chama da Vingança (cliente ID 40039).",
                notes="1 diária de Vigor por Limite de Céu por dia.",
            ),
            step(
                2,
                "step-02-farm",
                "Progresso ao norte de Quedanunca",
                (
                    "Mate os tipos indicados (Scout/Warrior ~5%, Sweepwing 7%, "
                    "Slaughterer 8%, Flamethrower 10%, Catapult 20%, Chanter 25%). "
                    "Esquadrão compartilha progresso sem redução."
                ),
            ),
            step(
                3,
                "step-03-torres",
                "Opcional — Demolition Sites",
                (
                    "Cave torres de madeira para +20% cada. Spawns frequentes perto "
                    "de 357,665 e 341,664."
                ),
                coords=[C(357, 665), C(341, 664)],
            ),
            step(
                4,
                "step-04-fim",
                "Concluir em 100%",
                "Ao chegar a 100% a missão completa e entrega as recompensas do dia.",
            ),
        ],
    }


def normalize_cidade_da_paz() -> None:
    path = QUESTS / "cidade-da-paz.json"
    cdp = json.loads(path.read_text(encoding="utf-8"))
    world = [q for q in cdp["quests"] if q.get("kind") == "world_quest"]
    world.sort(key=lambda q: (q.get("order", 999), q.get("slug", "")))
    for i, q in enumerate(world, start=10):
        q["order"] = i
    for q in cdp["quests"]:
        if q["slug"] == "alma-da-paz-eterna":
            q["order"] = 0
        elif q["slug"] == "mie-wuyan":
            q["order"] = 1
    cdp["quests"].sort(key=lambda q: (q["order"], q["slug"]))
    cdp["name_pt_br"] = "Cidade da Paz Eterna — Missões Globais e Diárias"
    path.write_text(json.dumps(cdp, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_continente() -> None:
    path = QUESTS / "continente-ocidental.json"
    cat = json.loads(path.read_text(encoding="utf-8"))
    order_map = {
        "esforco-da-guerra": 1,
        "espiritos-sagrados": 2,
        "chama-da-vinganca": 3,
    }
    for q in cat["quests"]:
        if q["slug"] in order_map:
            q["order"] = order_map[q["slug"]]
    cat["quests"].sort(key=lambda q: (q["order"], q["slug"]))
    cat["name_pt_br"] = "Continente Ocidental — Diárias e Vigor"
    path.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_tianyu() -> None:
    path = QUESTS / "tianyu.json"
    cat = json.loads(path.read_text(encoding="utf-8"))
    journeys = [q for q in cat["quests"] if q.get("kind") != "daily"]
    journeys.sort(key=lambda q: (q.get("order", 999), q.get("slug", "")))
    for i, q in enumerate(journeys, start=10):
        q["order"] = i
    for q in cat["quests"]:
        if q["slug"] == "alma-de-tianyu":
            q["order"] = 0
    cat["quests"].sort(key=lambda q: (q["order"], q["slug"]))
    cat["name_pt_br"] = "Cidade de Tianyu — Jornadas e Diárias"
    path.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    print("Upserting daily guides…")
    upsert(QUESTS / "tianyu.json", quest_alma_tianyu())
    upsert(QUESTS / "cidade-da-paz.json", quest_mie_wuyan())
    upsert(QUESTS / "continente-ocidental.json", quest_espiritos_sagrados())
    upsert(QUESTS / "continente-ocidental.json", quest_chama_vinganca())
    normalize_tianyu()
    normalize_cidade_da_paz()
    normalize_continente()
    print("Done.")


if __name__ == "__main__":
    main()
