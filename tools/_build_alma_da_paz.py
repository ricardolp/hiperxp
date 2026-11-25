#!/usr/bin/env python3
"""Upsert diária Alma da Paz Eterna no catálogo cidade-da-paz."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "fixtures" / "quests" / "cidade-da-paz.json"
SOURCE = None
NOTICE = (
    "Guia estruturado a partir do cliente BR (tasks 51174–51189) e observação comunitária. "
    "Pools aleatórios — validar coords/recompensas no cliente."
)
QUEST_ID = "quest-cidade-da-paz-alma-da-paz-eterna"
QUEST_SLUG = "alma-da-paz-eterna"


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
    dialog_hint: str | None = None,
) -> dict:
    return {
        "id": sid,
        "order": order,
        "title_pt_br": title,
        "instruction_pt_br": instruction,
        "npc": npc,
        "coords": coords or [],
        "dialog_hint": dialog_hint,
        "notes": notes,
        "image_url": None,
        "image_alt": None,
    }


def build_quest() -> dict:
    steps = [
        step(
            1,
            "step-01-aceitar",
            "Aceitar a diária",
            (
                "Com Alma da Paz nível 1+ e meridiano completo, fale com o Oficial "
                "Sagrado no Palácio Real e aceite Alma da Paz Eterna no nível da "
                "sua alma (I–V). A missão falha à meia-noite do dia seguinte."
            ),
            npc="Oficial Sagrado",
            coords=[C(183, 403, 69)],
            notes=(
                "Mutuamente exclusiva com Alma de Tianyu: só uma das duas por dia. "
                "IDs cliente: 51174–51177, 51189."
            ),
        ),
        step(
            2,
            "step-02-parte-i-intro",
            "Parte I — Alma de Pan Gu (variante aleatória)",
            (
                "A primeira etapa sorteia uma de três variantes: visitar uma "
                "paisagem, tirar foto de um local pitoresco, ou conversar com um "
                "morador. Use as listas abaixo conforme o objetivo que aparecer "
                "na janela de missão."
            ),
            notes="Etapas 3–5 detalham cada pool de coordenadas.",
        ),
        step(
            3,
            "step-03-paisagens",
            "Parte I · Variante — Paisagens",
            (
                "Vá até o ponto indicado da vista sagrada:\n"
                "• Palácio Imperial — 183,396(66)\n"
                "• Altar do Dragão Flamejante — 266,418(85)\n"
                "• Terra dos Sonhos do Sul — 232,474(114)\n"
                "• Ruínas Yunlu — 330,417(97)"
            ),
            coords=[
                C(183, 396, 66),
                C(266, 418, 85),
                C(232, 474, 114),
                C(330, 417, 97),
            ],
        ),
        step(
            4,
            "step-04-fotos",
            "Parte I · Variante — Locais pitorescos (foto)",
            (
                "Alcance o ângulo e tire a foto pedida pela missão:\n"
                "• Montanha do Imperador — 346,340(97)\n"
                "• Marinha Imperial da Imperatriz Verde — 93,374(62)\n"
                "• Túmulo do Rei Chengsong — 309,387(54)\n"
                "• Terra onde as Estrelas Caem no Mar — 158,473(87)"
            ),
            coords=[
                C(346, 340, 97),
                C(93, 374, 62),
                C(309, 387, 54),
                C(158, 473, 87),
            ],
            notes="Compare com a imagem de referência na janela da missão.",
        ),
        step(
            5,
            "step-05-npcs",
            "Parte I · Variante — Busca por NPCs",
            (
                "Converse com o morador indicado (alguns são andarilhos — busque "
                "próximo à coordenada):\n"
                "• Mestre do Vento — 258,463(100)\n"
                "• Coletor de Ervas — 322,421(90)\n"
                "• Coletor de Ginseng — 272,325(78)\n"
                "• Monge — 268,399(64)\n"
                "• Estudioso em Busca de Ideias — 289,476(84)\n"
                "• Pequeno monge em meditação — 288,495(93)\n"
                "• Ming Zhaomin — 317,418(106)\n"
                "• Zhao Yuxiang — 300,493(105)\n"
                "• Viajante do Tempo — 301,364(52)\n"
                "• Observador de Xadrez — 283,349(82)\n"
                "• Fada da Erva Guardiã — 313,333(84)\n"
                "• Jiang Shang — 285,360(75)\n"
                "• Caçador — 277,371(76)\n"
                "• Pequeno Imortal orgulhoso — 310,416(83)\n"
                "• Velho no Burro de Costas — 253,348(59)\n"
                "• Ermitão — 193,348(73)\n"
                "• Yu Min — 240,371(56)\n"
                "• Aldeão Ding Cai — 336,487(98)\n"
                "• Servo — 227,316(53)\n"
                "• Xu Jie (Loja de Tecidos) — 160,342(55)\n"
                "• Zheng — 170,357(55)\n"
                "• Bai Lingxiao — 132,429(54)"
            ),
            coords=[
                C(258, 463, 100),
                C(322, 421, 90),
                C(272, 325, 78),
                C(268, 399, 64),
                C(289, 476, 84),
                C(288, 495, 93),
                C(317, 418, 106),
                C(300, 493, 105),
                C(301, 364, 52),
                C(283, 349, 82),
                C(313, 333, 84),
                C(285, 360, 75),
                C(277, 371, 76),
                C(310, 416, 83),
                C(253, 348, 59),
                C(193, 348, 73),
                C(240, 371, 56),
                C(336, 487, 98),
                C(227, 316, 53),
                C(160, 342, 55),
                C(170, 357, 55),
                C(132, 429, 54),
            ],
        ),
        step(
            6,
            "step-06-parte-ii-intro",
            "Parte II — Poder Celestial (variante aleatória)",
            (
                "Pode cair a corrida de Yunuo Xiaoxiao (“Em Busca do Vento”) ou "
                "uma tarefa de auxílio a moradores. Sem voo em várias dessas "
                "variantes; morrer/teleportar pode falhar a etapa."
            ),
        ),
        step(
            7,
            "step-07-yunuo",
            "Parte II · Variante — Em Busca do Vento",
            (
                "Encontre Yunuo Xiaoxiao e complete a corrida pelas esferas "
                "numeradas no tempo limite (sem voar; use impulsos azuis):\n"
                "• 215,342(56) — 3 min · 16 pts\n"
                "• 153,358(55) — 2 min · 11 pts\n"
                "• 155,304(54) — 3 min · 12 pts\n"
                "• 174,317(54) — 2:50 · 15 pts\n"
                "• 187,338(56) — 3 min · 14 pts\n"
                "• 158,393(56) — 2:20 · 14 pts\n"
                "• 322,470(98) — 2:30 · 10 pts\n"
                "• 309,332(84) — 3 min · 12 pts\n"
                "• 264,440(94) — 3:20 · 12 pts\n"
                "• 117,297(53) — 3:20 · 14 pts\n"
                "• 125,428(54) — 2:20 · 14 pts"
            ),
            npc="Yunuo Xiaoxiao",
            coords=[
                C(215, 342, 56),
                C(153, 358, 55),
                C(155, 304, 54),
                C(174, 317, 54),
                C(187, 338, 56),
                C(158, 393, 56),
                C(322, 470, 98),
                C(309, 332, 84),
                C(264, 440, 94),
                C(117, 297, 53),
                C(125, 428, 54),
            ],
            notes="Título “Amante de Feijões” ao completar 50 vezes.",
        ),
        step(
            8,
            "step-08-filhote",
            "Parte II · Auxílio — O Filhote Ferido",
            (
                "Fale com Xia Yan e leve o filhote ao ninho (sem voar/teleporte) "
                "perto da Grande Pagoda no Vale do Dragão."
            ),
            npc="Xia Yan",
            coords=[C(252, 351, 59), C(264, 378, 96)],
            notes="Título “Protetor das Aves” com 5 conclusões.",
        ),
        step(
            9,
            "step-09-rio",
            "Parte II · Auxílio — Dominando o Rio",
            (
                "Receba o peixe com Ancião Fan → prepare com Wang (especiarias) → "
                "entregue ao General Cheng Huang."
            ),
            npc="Ancião Fan → Wang → General Cheng Huang",
            coords=[C(75, 342, 54), C(153, 382, 56), C(126, 402, 54)],
            notes="Título “Degustador de Pimenta Ardente” com 5 conclusões.",
        ),
        step(
            10,
            "step-10-filho",
            "Parte II · Auxílio — O Filho Errante",
            (
                "Em Chujiang pegue roupas/comida → peça pistas ao Lenhador → "
                "encontre Chu Liangchen perto das Ruínas Yunlu."
            ),
            npc="Chujiang → Lenhador → Chu Liangchen",
            coords=[C(332, 483, None), C(295, 434, None), C(345, 403, None)],
        ),
        step(
            11,
            "step-11-sistema",
            "Parte II · Auxílio — Sobre o Sistema",
            (
                "Com o Sacerdote Sagrado, entregue avisos a três comerciantes na "
                "Avenida Celestial da Coroação: Wu Sheng, Garçom e Chefe Xiong."
            ),
            npc="Sacerdote Sagrado",
            coords=[
                C(171, 395, None),
                C(155, 370, None),
                C(180, 343, None),
                C(173, 302, None),
            ],
        ),
        step(
            12,
            "step-12-tio",
            "Parte II · Auxílio — Tio e Sobrinho",
            (
                "Guan Zhizhou → pegue macarrão com Cao Erniang → entregue a "
                "Guan Shucheng na Academia das Orquídeas → devolva o livro ao tio."
            ),
            npc="Guan Zhizhou → Cao Erniang → Guan Shucheng",
            coords=[C(148, 358, None), C(150, 338, None), C(240, 312, None)],
            notes="Título “Macarrão e Álbum” com 5 conclusões.",
        ),
        step(
            13,
            "step-13-caminho",
            "Parte II · Auxílio — O Próprio Caminho",
            (
                "Pegue as ferramentas com o Jardineiro e leve até o Chefe da "
                "Guarda Imperial na praça; depois retorne ao Jardineiro."
            ),
            npc="Jardineiro → Chefe da Guarda Imperial",
            coords=[C(157, 339, None), C(174, 384, None)],
            notes="Título “O Autointitulado Mestre” com 5 conclusões.",
        ),
        step(
            14,
            "step-14-tesouro",
            "Parte II · Auxílio — O Tesouro da Senhora",
            (
                "Com Jiang Hai, escolte o cão Tesourinho pelas paradas "
                "(sem se afastar demais / sem voar): 216,339 → 229,344 → "
                "233,358 → 224,373."
            ),
            npc="Jiang Hai",
            coords=[
                C(177, 365, None),
                C(216, 339, None),
                C(229, 344, None),
                C(233, 358, None),
                C(224, 373, None),
            ],
            notes="Título “Au Au!” com 5 conclusões.",
        ),
        step(
            15,
            "step-15-parte-iii",
            "Parte III — Memórias de Pan Gu (coleta ou combate)",
            (
                "Ajude um NPC a coletar recursos ou farmar itens de monstros. "
                "Na Mochila Oriental, use “Rastrear” no item para marcar os mobs "
                "no mapa. Locais de entrega de coleta:"
            ),
            notes=(
                "Coleta: Menina dos Cogumelos 123,456(53); Criança do Lótus "
                "313,469(77); Menina das Conchas 109,309(53); Pomba "
                "242,493(128); Pedreiro 288,357(75). Combate: Guardião do "
                "Mar-Sem-Fim 76,433; Três Pássaros Azuis 207,488; Jovem "
                "Andarilho 300,417(95)."
            ),
            coords=[
                C(123, 456, 53),
                C(313, 469, 77),
                C(109, 309, 53),
                C(242, 493, 128),
                C(288, 357, 75),
                C(76, 433, None),
                C(207, 488, None),
                C(300, 417, 95),
            ],
        ),
        step(
            16,
            "step-16-parte-iv",
            "Parte IV — Os Cinco Refinos (entrega)",
            (
                "Volte ao Oficial Sagrado. Nível 1 pede um conjunto de recursos/"
                "drops (lótus, chifre, máscara, etc.). Níveis 2–5 pedem uma "
                "Relíquia da Alma da Paz um nível abaixo da missão "
                "(ex.: missão V → Relíquia IV)."
            ),
            npc="Oficial Sagrado",
            coords=[C(183, 403, 69)],
            notes=(
                "Recompensa: 1 Relíquia Alma da Paz Eterna do nível da missão, "
                "conforme especialização."
            ),
        ),
    ]

    return {
        "id": QUEST_ID,
        "slug": QUEST_SLUG,
        "map_slug": "cidade-da-paz",
        "kind": "daily",
        "order": 0,
        "name_pt_br": "Alma da Paz Eterna (Diária I–V)",
        "aliases": [
            "Alma da Paz Eterna I",
            "Alma da Paz Eterna II",
            "Alma da Paz Eterna III",
            "Alma da Paz Eterna IV",
            "Alma da Paz Eterna V",
            "Eternal Peace Soul",
            "Diária Alma da Paz",
            "Coração de Pan Gu diária",
        ],
        "excerpt_pt_br": (
            "Diária de relíquias do Reino Oriental: 4 etapas com pools "
            "aleatórios de coords, fotos, NPCs e farm."
        ),
        "summary_pt_br": (
            "Aceite no Oficial Sagrado (183,403) conforme o nível da Alma da Paz. "
            "Complete Alma de Pan Gu → Poder Celestial → Memórias de Pan Gu → "
            "Os Cinco Refinos para receber uma Relíquia do nível correspondente."
        ),
        "prerequisite_pt_br": (
            "Nv 100+, Reborn II, meridiano completo, Alma da Paz nível 1+. "
            "Não fazer Alma de Tianyu no mesmo dia."
        ),
        "rewards_pt_br": (
            "1 Relíquia Alma da Paz Eterna (nível da missão / especialização); "
            "progresso de Bênção da diária."
        ),
        "published_at": "2025-10-31",
        "coverage_status": "partial",
        "review_status": "foreign_reference",
        "origin": "community_observed",
        "source_url": SOURCE,
        "notice": NOTICE,
        "steps": steps,
    }


def main() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    quest = build_quest()
    quests = [q for q in catalog["quests"] if q.get("id") != QUEST_ID and q.get("slug") != QUEST_SLUG]
    quests.insert(0, quest)
    catalog["quests"] = quests
    catalog["generated_at"] = "2026-11-24"
    sources = [
        s
        for s in (catalog.get("sources") or [])
        if isinstance(s, str) and "triviapw.com.br" not in s.lower()
    ]
    for extra in (
        "data/fixtures/sources/client-br-levelup/",
        "cliente BR Alma da Paz 51174–51189",
        "data/fixtures/sources/quest-guides/",
    ):
        if extra not in sources:
            sources.append(extra)
    catalog["sources"] = sources
    name = catalog.get("name_pt_br") or ""
    if "Diária" not in name and "diária" not in name:
        catalog["name_pt_br"] = "Cidade da Paz Eterna — Missões Globais e Diárias"
    CATALOG.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Upserted {QUEST_SLUG} → {CATALOG.relative_to(ROOT)} ({len(quest['steps'])} steps)")


if __name__ == "__main__":
    main()
