#!/usr/bin/env python3
"""Gera fixtures de guias de missões (Cidade da Paz + Tianyu).

Fontes primárias:
- Guias comunitários BR (nomes pt-BR, coords e etapas quando disponíveis)
- VK LamaoMEMao (cadeia completa Cidade da Paz em RU)
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from parse_quest_guide_md import parse_quest_guide_md

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "fixtures" / "quests"
SRC_GUIDES = ROOT / "data" / "fixtures" / "sources" / "quest-guides"

NOTICE = (
    "Guias comunitários estruturados. "
    "foreign_reference — validar no cliente BR antes de republicar."
)


def C(x: int, y: int, z: int | None = None) -> dict:
    return {"x": x, "y": y, "altitude": z}


def step(
    order: int,
    title: str,
    instruction: str,
    *,
    npc: str | None = None,
    coords: list[dict] | None = None,
    dialog_hint: str | None = None,
    notes: str | None = None,
) -> dict:
    slug = (
        "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in title.lower())
        .strip("-")
        .replace("--", "-")
    )
    return {
        "id": f"step-{order:02d}-{slug[:48]}",
        "order": order,
        "title_pt_br": title,
        "instruction_pt_br": instruction,
        "npc": npc,
        "coords": coords or [],
        "dialog_hint": dialog_hint,
        "notes": notes,
    }


def quest(
    *,
    map_slug: str,
    order: int,
    slug: str,
    name: str,
    kind: str,
    summary: str,
    source_url: str | None = None,
    steps: list[dict] | None = None,
    aliases: list[str] | None = None,
    prerequisite: str | None = None,
    rewards: str | None = None,
    published_at: str | None = None,
) -> dict:
    if steps is None:
        steps = []
    excerpt = summary if len(summary) <= 160 else summary[:157].rstrip() + "…"
    return {
        "id": f"quest-{map_slug}-{slug}",
        "slug": slug,
        "map_slug": map_slug,
        "kind": kind,
        "order": order,
        "name_pt_br": name,
        "aliases": aliases or [],
        "excerpt_pt_br": excerpt,
        "summary_pt_br": summary,
        "prerequisite_pt_br": prerequisite,
        "rewards_pt_br": rewards,
        "published_at": published_at,
        "coverage_status": "partial",
        "review_status": "foreign_reference",
        "origin": "community_observed",
        "source_url": source_url,
        "notice": NOTICE,
        "steps": steps,
    }


VK = "https://vk.com/@-149459137-mirovye-kvesty-vostochnyh-zemel"
CLIENT_BR = "data/fixtures/sources/client-br-levelup/"

CIDADE_DA_PAZ = [
    quest(
        map_slug="cidade-da-paz",
        order=1,
        slug="correntes-ocultas",
        name="Correntes Ocultas",
        kind="world_quest",
        aliases=["Скрытые течения", "Hidden Currents"],
        summary="Identifique cinco espiões disfarçados na Cidade da Paz Eterna.",
        source_url=None,
        published_at="2025-11-23",
        rewards="Consciência da Alma; Selo do Palácio Celestial ×10; Emblema da Fênix Azul ×10",
        steps=[
            step(1, "Investigação Secreta",
                 "Fale com o Sacerdote Sagrado e aceite a caça aos cinco espiões.",
                 npc="Sacerdote Sagrado", coords=[C(171, 395)]),
            step(2, "Departamento de Exorcismo",
                 "Soldado Suspeito. Não pule o diálogo — escolha a opção correta.",
                 npc="Soldado Suspeito", coords=[C(220, 394)],
                 dialog_hint="Opção 3 — 'Eu sou um batedor corajoso!' (×3)"),
            step(3, "Palácio Imperial",
                 "Guarda Real Suspeito no canto superior direito do palácio.",
                 npc="Guarda Real Suspeito", coords=[C(183, 460)],
                 dialog_hint="Opção 2"),
            step(4, "Marinha / Imperatriz Verdejante",
                 "Soldado da Marinha Suspeito no final do píer.",
                 npc="Soldado da Marinha Suspeito", coords=[C(100, 405)]),
            step(5, "Ponte / Avenida",
                 "Morador Suspeito junto à ponte.",
                 npc="Morador Suspeito", coords=[C(190, 313)]),
            step(6, "Porto Geada Azul",
                 "Barqueiro Suspeito no píer mais afastado (fácil de não ver).",
                 npc="Barqueiro Suspeito", coords=[C(161, 295)]),
            step(7, "Entrega",
                 "Volte ao Sacerdote Sagrado para concluir.",
                 npc="Sacerdote Sagrado", coords=[C(171, 395)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=2,
        slug="ceu-atraves-das-folhas-caidas",
        name="Céu através das Folhas Caídas",
        kind="world_quest",
        aliases=["Небо сквозь опавшие листья", "Folhas Caídas"],
        summary=(
            "Cadeia longa no País dos Sonhos: prólogo + 5 capítulos "
            "(Mil Luzes, Sonhos Diurnos, Romance e Estrelas, Culinária, Dourado)."
        ),
        prerequisite="Cadeia principal do Continente Oriental",
        source_url=VK,
        rewards="Baús dourados, títulos, Selos do Palácio Celestial",
        steps=[
            step(1, "Prólogo",
                 "Mansão das Nuvens: Lili (214,420) → País dos Sonhos (226,458) → "
                 "(238,470). Cave anotações de Tata (242,478) e use o item.",
                 npc="Lili", coords=[C(214, 420), C(226, 458), C(242, 478)]),
            step(2, "Capítulo das Mil Luzes",
                 "Árvore Preciosa (225,450): poço → notas → (212,496) → Tata "
                 "(211,498/126). Mate 10 névoas; limpe cristais (efeitos ON); "
                 "acenda lanternas; salve Tata; boss + baú dourado no poço.",
                 coords=[C(225, 450), C(212, 496), C(211, 498, 126)],
                 notes="Efeitos gráficos no máximo."),
            step(3, "Capítulo dos Sonhos Diurnos",
                 "Fonte (221,460) com Flor da Amizade. Espíritos (178,479); "
                 "névoa (183,473); devolva árvores coloridas com Duoduo a (183,478).",
                 coords=[C(221, 460), C(183, 478)]),
            step(4, "Capítulo do Romance e das Estrelas",
                 "Poço Estelar (213,459). Mar (158,485). Colete 7 gemas/pérolas "
                 "e incruste em (167,486/70). Boss + baú no poço.",
                 coords=[C(213, 459), C(158, 485), C(167, 486, 70)]),
            step(5, "Capítulo dos Sonhos Culinários",
                 "Poço (209,451). Floresta dos Vaga-Lumes: colete 7 ingredientes, "
                 "caldeirão (122,476), bolo-armadilha no boss (109,484).",
                 coords=[C(209, 451), C(122, 476), C(109, 484)]),
            step(6, "Capítulo do Dourado e do Guardião",
                 "Poço (217,445). Costa (81,444): madeira, metal na estátua "
                 "(83,443/62), água do mar (78,444). Boss no poço. Fale com 16 NPCs "
                 "(219,460) e pegue o presente (238,469).",
                 coords=[C(217, 445), C(81, 444), C(83, 443, 62), C(78, 444)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=3,
        slug="poco-antigo-do-norte",
        name="Poço Antigo do Norte",
        kind="world_quest",
        aliases=["Древний колодец Хуайбэй", "Poço de Huaibei", "Huai Bei"],
        summary="Inscrições, selos com senha e dois baús dourados no poço antigo.",
        source_url=None,
        published_at="2025-11-23",
        steps=[
            step(1, "Fragmentos de inscrição",
                 "Fale com Jingkun e cave os 5 fragmentos na ordem 1→5.",
                 npc="Jingkun",
                 coords=[C(308, 436, 95), C(324, 435), C(342, 421), C(345, 409), C(343, 438), C(312, 443)]),
            step(2, "Erudito / Han Shuo",
                 "Livros abandonados (322,411)→(328,406)→caverna (328,414). "
                 "Antes de Han Shuo (343,419), cave a flor antiveneno na entrada.",
                 coords=[C(322, 411), C(328, 414), C(343, 419)]),
            step(3, "Dispositivos de selamento",
                 "Senhas: (337,447)=70; (333,443)=60; (334,453)=16; (346,457)=24; (346,445)=20. "
                 "Ative o mecanismo (341,447), mate os 3 mobs e pegue o baú no fundo.",
                 coords=[C(337, 447), C(333, 443), C(334, 453), C(346, 457), C(346, 445), C(341, 447)]),
            step(4, "Ervas e raposas",
                 "Jin Yu (346,478) → curandeiro (332,483). Colete ervas (senhas/poemas). "
                 "Raposas na ordem (338,466)→(336,462)→(329,459)→(325,466)→(330,472)→"
                 "(329,464)→(333,466). Baú central → fruto → curandeiro.",
                 coords=[C(346, 478), C(332, 483), C(338, 466)]),
            step(5, "Fonte do veneno",
                 "Sem marcador: vá a (345,452), mate 3 mobs, ative (340,448) e pegue o 2º baú.",
                 coords=[C(345, 452), C(340, 448)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=4,
        slug="tempestade",
        name="Tempestade",
        kind="world_quest",
        aliases=["Ураган", "Furacão"],
        summary="Recupere as cinco Pedras da Serenidade e acabe com o furacão no mar.",
        prerequisite="Memórias do Passado",
        source_url=None,
        published_at="2025-11-23",
        steps=[
            step(1, "Fragmentos de metal",
                 "Vice-Comandante (132,423). Fragmentos: navio (108,385), "
                 "água (76,335), píer (123,329).",
                 npc="Vice-Comandante Militar",
                 coords=[C(132, 423), C(108, 385), C(76, 335), C(123, 329)]),
            step(2, "Fragmentos de terra / madeira",
                 "Fragmentos no fundo do mar (97,382/50), (89,379/51), (84,388/51). "
                 "Use a Pedra de União. Caixa (135,418); baú senha 9529 (137,416).",
                 coords=[C(97, 382, 50), C(135, 418), C(137, 416)]),
            step(3, "Pesca das pedras",
                 "Comerciante misterioso (177,298): carpa (área vermelha), "
                 "perca-sombra (Vila da Alvorada), peixe-corvo (75,342).",
                 npc="Comerciante Misterioso de Peixes", coords=[C(177, 298), C(75, 342)]),
            step(4, "Faróis",
                 "Capitão (130,425). Combustível (92,373/53). Acenda: "
                 "(93,374/62), (76,432/62), (72,457/62), (81,470/62).",
                 coords=[C(130, 425), C(93, 374, 62), C(76, 432, 62), C(72, 457, 62), C(81, 470, 62)]),
            step(5, "Acabar com a tempestade",
                 "Tornado (74,409/50): incruste as 5 pedras (metal, terra, madeira, água, fogo).",
                 coords=[C(74, 409, 50)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=5,
        slug="pedra-espiritual-dos-4-simbolos",
        name="Pedra Espiritual dos 4 Símbolos",
        kind="world_quest",
        aliases=["Четыре камня стихий", "Quatro Fenômenos"],
        summary="Recupere Tartaruga, Dragão, Tigre e Fênix e devolva aos altares.",
        source_url=None,
        published_at="2025-11-23",
        steps=[
            step(1, "Tartaruga Negra",
                 "Song Shi (256,455). Reflita em (259,463). Oferendas: cenoura "
                 "(279,461) e maçã (275,469) nas estátuas (258,463).",
                 npc="Song Shi", coords=[C(256, 455), C(258, 463)]),
            step(2, "Dragão Azure",
                 "Entre pelo telhado (267,451/97) e cave a pedra dentro da casa.",
                 coords=[C(267, 451, 97)]),
            step(3, "Tigre Branco",
                 "Explosivos nas casas (264,482), (272,483), (266,475). "
                 "Destrua as colunas que prendem a pedra (269,478).",
                 coords=[C(269, 478), C(264, 482), C(272, 483), C(266, 475)]),
            step(4, "Fênix Vermelha",
                 "Vaga-lumes em cavernas: (264,495)→255/259,498; (252,465)→251,470; "
                 "cachoeira (277,485)→271,488. Acenda pilares em (280,477).",
                 coords=[C(280, 477), C(264, 495, 115), C(252, 465, 105), C(277, 485, 92)]),
            step(5, "Altares",
                 "Tartaruga (301,491/95), Dragão (303,479/96), Tigre (315,492/96), "
                 "Fênix (315,479/98). Abra o baú dourado.",
                 coords=[C(301, 491, 95), C(303, 479, 96), C(315, 492, 96), C(315, 479, 98)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=6,
        slug="segredo-da-montanha-longquan",
        name="Segredo da Montanha Longquan",
        kind="world_quest",
        aliases=["Тайна горы Драконова источника", "Dragon Spring Mountains"],
        summary=(
            "Cinco capítulos: Pagode Qianxun, Caverna do Dragão Adormecido, "
            "Degraus do Coração Puro, Túmulo do Príncipe Chengsong, Montanha do Senhor Morto."
        ),
        source_url=None,
        published_at="2025-11-23",
        steps=[
            step(1, "Pagode Qianxun",
                 "Arbusto Floral (263,383) → guarda (251,364) → esfera azul "
                 "(198,366/71). Acenda lanternas com status Queimadura; chaves "
                 "com Sai Mu (263,388); esfera d'água (255,374/71) → cristal no topo.",
                 npc="Feng Jing / Sai Mu", coords=[C(263, 383), C(251, 364), C(263, 388)]),
            step(2, "Caverna do Dragão Adormecido",
                 "Feng Jing (263,389) → (267,319/81). Espada do Trovão e upgrades "
                 "(minério, almas de lobo, pedras). Ative mecanismo (266,313); "
                 "cristal elemental; quebre selo (266,307); pedra (265,302/81).",
                 coords=[C(263, 389), C(267, 319, 81), C(266, 313), C(266, 307)]),
            step(3, "Degraus do Coração Puro",
                 "Dragão Solitário (264,315). Chaves com macacos (enigma da cópia "
                 "verdadeira, 2 min). Poção da Visão Verdadeira → siga pegadas → "
                 "Vidro do Mundo (341,320).",
                 coords=[C(264, 315), C(315, 331, 88), C(341, 320)]),
            step(4, "Túmulo do Príncipe Chengsong",
                 "Utensílios funerários (323,390). Chaves com senhas 3233, 7021, "
                 "8730 + chave selada. Escape em 5 min sem voar.",
                 coords=[C(323, 390, 56), C(348, 390), C(311, 390)]),
            step(5, "Montanha do Senhor Morto",
                 "Chaves com o Ancião (Go: interseções 11×9, 12×8, 13×7, 14×9, "
                 "13×8, 12×9). Mate mobs; conclua a cadeia Longquan.",
                 coords=[C(339, 346, 83), C(335, 356), C(338, 369, 79)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=7,
        slug="altar-do-dragao-flamejante",
        name="Altar do Dragão Flamejante",
        kind="world_quest",
        aliases=["Алтарь Пылающего Дракона"],
        summary="Selos elementais, mecanismos, esconde-esconde com Lanxi e gemas do dragão.",
        source_url=None,
        published_at="2025-11-23",
        steps=[
            step(1, "Selos elementais",
                 "Ordem: Água (268,421/77) → Fogo (269,417/84) → Madeira (253,419/86) "
                 "→ Metal (258,419/91) → Terra (267,431/82). Efeitos ON.",
                 npc="Monumento", coords=[C(267, 420), C(268, 421, 77), C(269, 417, 84)]),
            step(2, "Mecanismos",
                 "Qin Wuyang (275,425/73). Ordem: (261,443/94) → (256,436/73) → "
                 "(269,405/83) → (294,418/95) → (294,405/101).",
                 npc="Qin Wuyang",
                 coords=[C(275, 425, 73), C(261, 443, 94), C(256, 436, 73), C(269, 405, 83), C(294, 418, 95), C(294, 405, 101)]),
            step(3, "Terceira gema + Lanxi",
                 "Cave (287,433/77). Esconde-esconde: (264,418/82), (263,423/83), "
                 "(259,420/90) — aproximação bem perto.",
                 npc="Lanxi", coords=[C(287, 433, 77), C(273, 419), C(264, 418, 82)]),
            step(4, "Incrustar gemas",
                 "Mandíbulas dos dragões: (275,426), (279,423), (279,427). Baú dourado.",
                 coords=[C(275, 426), C(279, 423), C(279, 427)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=8,
        slug="misterio-da-origem",
        name="O Mistério da Origem",
        kind="world_quest",
        aliases=["Тайна происхождения"],
        summary="Segredo do nascimento do General Haifeng e Yuan Hongshan.",
        source_url=None,
        published_at="2025-11-23",
        rewards="Consciência da Alma ×15.152; Selos ×30; Emblemas ×10",
        steps=[
            step(1, "Triunfo",
                 "Jiang Chengyu (115,424) → General Haifeng (113,424).",
                 npc="Jiang Chengyu", coords=[C(115, 424), C(113, 424)]),
            step(2, "Pesadelo / acordar",
                 "Haifeng no telhado (136,433/57). Salte (133,431/54).",
                 npc="General Haifeng", coords=[C(136, 433, 57), C(133, 431, 54)]),
            step(3, "Audiência e interrogatório",
                 "Palácio (174,454)/(174,458). Prisão (220,434/76) com Yuan Hongshan.",
                 npc="Imperatriz Verdejante Mayen",
                 coords=[C(174, 454), C(174, 458), C(220, 435, 76)]),
            step(4, "Verdade",
                 "Pavilhão das Flores (144,366). Conclua com Yuan Hongshan.",
                 coords=[C(144, 366), C(143, 366)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=9,
        slug="desejo-da-alma-do-livro",
        name="Desejo da Alma do Livro",
        kind="world_quest",
        aliases=["Желание души книги"],
        summary="Cinco poemas/senhas levam a baús antigos e ao desfecho com Yue Yang.",
        source_url=None,
        published_at="2025-11-23",
        rewards="Consciência ×18.939; Selos ×30; Emblemas ×10; conquista",
        steps=[
            step(1, "Biblioteca",
                 "Prateleiras em (134,324). Leia até a última novela; fale com Yue Yang (135,321).",
                 npc="Yue Yang", coords=[C(134, 324), C(135, 321)]),
            step(2, "Baús com senha",
                 "Barco (205,367) senha 139; Torre Feihong (193,349/60) 13251; "
                 "Pavilhão Estrela Cadente (80,332) 32812; Torre Sonho (242,327/57) "
                 "3107121; Poço Renascimento (137,360/51) 25837.",
                 coords=[C(205, 367), C(193, 349, 60), C(80, 332), C(242, 327, 57), C(137, 360, 51)]),
            step(3, "Espelho das Nuvens",
                 "Pedra afiada (153,417/55). Liberte o esqueleto no poço. "
                 "Área restrita pode levar à prisão (5 min).",
                 coords=[C(153, 417, 55), C(137, 360)],
                 notes="Entrar sem permissão → prisão 5 min."),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=10,
        slug="loja-de-tecidos",
        name="Loja de Tecidos",
        kind="world_quest",
        aliases=["Ткацкая мастерская", "História da Tecelaria"],
        summary="Assombração na loja: talismã, pó, ilusão e os irmãos Chu.",
        source_url=None,
        published_at="2025-11-22",
        rewards="Consciência ×10.740; Selos ×30; Emblemas ×10",
        steps=[
            step(1, "Dono louco",
                 "Xu Jie (165,350). Vizinhos: Chen Baiqiang, Tia Cai (158,348), "
                 "Oráculo Feng Shui (184,334).",
                 npc="Xu Jie", coords=[C(165, 350), C(158, 348), C(184, 334)]),
            step(2, "Materiais do talismã",
                 "Água sem raiz (182,313); pó vermelho (158,360). Cole o talismã "
                 "na porta (165,349).",
                 coords=[C(182, 313), C(158, 360), C(165, 349)]),
            step(3, "Ilusão",
                 "Cave tecidos (165,349). Percurso: 172,349 → 174,343 → 183,327 → "
                 "200,322(52) e pule na água.",
                 coords=[C(165, 349), C(174, 343), C(200, 322, 52)]),
            step(4, "Irmãos Chu",
                 "Jovem branco Chu Heng e Chu Yan (154,312) — derrote ambos. "
                 "Detetive Li Da (149,405). Finalize na loja.",
                 npc="Chu Heng / Chu Yan", coords=[C(154, 312), C(149, 405), C(165, 350)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=11,
        slug="morte-inesperada",
        name="Morte Inesperada",
        kind="world_quest",
        aliases=["Смерть Борена", "Morte de Boren"],
        summary="Shunying, Lu Xiaoqi e a verdade por trás do 'sequestro' da criança.",
        prerequisite="Desejo da Alma do Livro",
        source_url=None,
        published_at="2025-11-23",
        rewards="Consciência ×18.939; Selos ×30; Emblemas ×10",
        steps=[
            step(1, "A Morte de Boren",
                 "Shunying (152,348) → farmácia Lu Xiaoqi (160,356).",
                 npc="Shunying", coords=[C(152, 348), C(160, 356)],
                 dialog_hint="Opção 4 — aproveitando o interesse das crianças"),
            step(2, "Lótus e dias seguintes",
                 "Lótus Amarela (139,342). Aguarde cutscenes/teleportes "
                 "(158,349), (157,348). Volte à farmácia.",
                 coords=[C(139, 342), C(134, 340), C(161, 357)]),
            step(3, "Investigação na aldeia",
                 "Ah Yuan (336,487) → lenhadores (344,465) → lobos (291,428); "
                 "pista (292,425). Shunying no telhado (150,357/59).",
                 coords=[C(336, 487), C(344, 465), C(292, 425), C(150, 357, 59)]),
            step(4, "Desfecho",
                 "Confronte Lu Shouheng (162,357). Aguarde dias finais e conquista.",
                 coords=[C(162, 357), C(155, 355)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=12,
        slug="memorias-do-passado",
        name="Memórias do Passado",
        kind="world_quest",
        aliases=["Вспоминая прошлое", "Aventuras: Passado"],
        summary="Ran Yi, a boneca de Rongyue e visitas ao longo dos anos.",
        prerequisite="Desejo da Alma do Livro",
        source_url=None,
        published_at="2025-11-23",
        steps=[
            step(1, "Encontro e boneca",
                 "Rongyue (169,365). Peças: (166,367), (167,365), (168,364), "
                 "(167,364). Monte no inventário.",
                 npc="Rongyue / Ran Yi",
                 coords=[C(169, 365), C(166, 367), C(167, 365), C(168, 364), C(167, 364)]),
            step(2, "Casa de Ran Yi",
                 "Porta (217,355) teleporta para dentro. Enterre a boneca (212,341).",
                 coords=[C(217, 355), C(212, 341)]),
            step(3, "Cartas anuais",
                 "Cedro (263,357). Tecidos: Xu Jie — opção 3 (três sedas + dois algodões). "
                 "Volte à casa de chá (168,365) e à casa (217,355).",
                 coords=[C(263, 357), C(218, 354), C(160, 342), C(217, 355)],
                 dialog_hint="Opção 3 — três rolos de seda e dois de algodão"),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=13,
        slug="medicos-sombrios",
        name="Médicos Sombrios",
        kind="world_quest",
        aliases=["Семья злых докторов", "Médicos Cruéis"],
        summary="Cadáver, mapas da base e captura de Chu Yan / Chu Heng.",
        prerequisite="Loja de Tecidos",
        source_url=None,
        published_at="2025-11-22",
        rewards="Consciência ×14.064; Selos ×30; Emblemas ×10",
        steps=[
            step(1, "Cadáver",
                 "Cocheiro Ming Sheng (154,334) → corpo (151,307) → Ye Feng (155,323) "
                 "→ contador Ming Yue (174,328, dentro da casa).",
                 npc="Cocheiro Ming Sheng",
                 coords=[C(154, 334), C(151, 307), C(155, 323), C(174, 328)]),
            step(2, "Pistas no porto",
                 "Chu Heng (165,350) → fazendeiro (181,305) → (224,335)/(230,333) → "
                 "pães (175,310) → médico (185,331) → mate Yang Yuan.",
                 coords=[C(165, 350), C(181, 305), C(230, 333), C(185, 331)]),
            step(3, "Mapas da base",
                 "Pacotes (181,300), (142,372), (157,365/62). Engrenagem/bancos "
                 "(165,334)/(163,334) → mapa sob a árvore (162,329/55).",
                 coords=[C(181, 300), C(142, 372), C(157, 365, 62), C(162, 329, 55)],
                 notes="Ordem dos bancos de pedra importa; efeitos ON."),
            step(4, "Captura",
                 "Quintal (166,346): mapa V + Chu Yan (164,346). Entrega à justiça.",
                 npc="Chu Yan", coords=[C(166, 346), C(164, 346)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=14,
        slug="em-busca-do-filho",
        name="Em Busca do Filho",
        kind="world_quest",
        aliases=["Пропавший сын"],
        summary="Peixinho desaparece; vaga-lumes, escola e roupa nova.",
        prerequisite="Médicos Sombrios",
        source_url=None,
        published_at="2025-11-23",
        steps=[
            step(1, "Sumiço",
                 "Pescador Tio Li (139,352). Pergunte nas barracas "
                 "(158,349), (158,347), (170,357), (169,364).",
                 npc="Pescador Tio Li",
                 coords=[C(139, 352), C(158, 349), C(158, 347), C(170, 357), C(169, 364)]),
            step(2, "Vaga-lumes",
                 "Crianças (152,313). Tia Li: pegue vaga-lumes (141,336) e acenda "
                 "(185,308/55).",
                 npc="Tia Li", coords=[C(152, 313), C(141, 336), C(185, 308, 55)]),
            step(3, "Escola e roupa",
                 "(140,352)/(141,353). Compre roupa (177,319) e entregue a Tia Li.",
                 coords=[C(140, 352), C(177, 319), C(185, 308)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=15,
        slug="homicidio",
        name="Homicídio",
        kind="world_quest",
        aliases=["Убийство в скромном доме"],
        summary="Morte da Tia Li: autópsia, Veratrum e carta de despedida.",
        prerequisite="Em Busca do Filho + aguardar ≥1 dia",
        source_url=None,
        published_at="2025-11-23",
        steps=[
            step(1, "Encontro casual",
                 "Mordomo Sun (176,335) → enfermaria (182,330). Voluntário com "
                 "General Cheng Huan (184,330).",
                 npc="Mordomo Sun", coords=[C(176, 335), C(184, 330), C(183, 308)]),
            step(2, "Autópsia",
                 "Restos de remédio no caldeirão (183,306). Veratrum sob a árvore (151,306).",
                 coords=[C(183, 306), C(151, 306)]),
            step(3, "Carta e enterro",
                 "Leia Testamento/Carta. Enterro com Tio Li (183,307).",
                 npc="Pescador Tio Li", coords=[C(182, 307), C(183, 307)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=16,
        slug="destino-inesperado",
        name="Destino Inesperado",
        kind="world_quest",
        aliases=["Прятки с судьбой"],
        summary="Ye Fuyao, rompimento de noivado e reconciliação com Jiang Chengyu.",
        prerequisite="Homicídio",
        source_url=None,
        published_at="2025-11-23",
        steps=[
            step(1, "De volta para casa",
                 "Ye Fuyao (166,297) → Senhor Ye (158,313) → Senhora Jiang (187,333).",
                 npc="Ye Fuyao", coords=[C(166, 297), C(158, 313), C(187, 333)]),
            step(2, "Quartel",
                 "Soldados (159,390). Diálogos em casa (159,313).",
                 coords=[C(159, 390), C(159, 313)]),
            step(3, "Tesourinho",
                 "Xu Xin (155,328) → garçom (180,343) → criança na ponte (~204). "
                 "Conclua em casa.",
                 coords=[C(155, 328), C(180, 343), C(159, 313)]),
        ],
    ),
    quest(
        map_slug="cidade-da-paz",
        order=17,
        slug="passado-de-bujuan",
        name="Passado de Bujuan",
        kind="world_quest",
        aliases=["Прошлое Бужуана", "Histórias da Tecelaria"],
        summary="Encerramento das missões globais da Cidade da Paz.",
        prerequisite="Homicídio",
        source_url=None,
        published_at="2025-11-23",
        steps=[
            step(1, "Início",
                 "NPC (141,353) → conclusão automática (147,342) → (148,342).",
                 coords=[C(141, 353), C(147, 342), C(148, 342)]),
            step(2, "Porto e vinho",
                 "Porto (163,308) → dono da vinícola. Continue em (295,320) com a economista.",
                 coords=[C(163, 308), C(295, 320)],
                 notes="Conquista 'Alma da Borboleta' ao concluir."),
        ],
    ),
]

def md_steps(filename: str) -> list[dict]:
    path = SRC_GUIDES / filename
    if not path.exists():
        return []
    return parse_quest_guide_md(path)


TIANYU = [
    quest(
        map_slug="tianyu",
        order=1,
        slug="historias-noturnas",
        name="Histórias Noturnas",
        kind="journey",
        aliases=["枫桥幻戏夜话", "Night Tales"],
        summary="Jornada teatral em Tianyu com Yunque'er e o diretor do teatro.",
        prerequisite="Anedota Continente Oriental – Cap. II · Pensamentos Ilusórios",
        source_url=None,
        published_at="2026-05-19",
        steps=md_steps("historias-noturnas.md")
        or [
            step(1, "Conflito",
                 "Fale com Yunque'er perto do Jardim de Pera.",
                 npc="Yunque'er", coords=[C(164, 586, 100)]),
        ],
    ),
    quest(
        map_slug="tianyu",
        order=2,
        slug="origem-comum-do-preto-e-branco",
        name="Origem Comum do Preto e Branco",
        kind="journey",
        aliases=["同源黑白"],
        summary="Disputas entre Alados; mensageiros e cavernas de Asa Branca/Negra.",
        prerequisite="Anedota Continente Oriental – Cap. II · Pensamentos Ilusórios",
        source_url=None,
        published_at="2026-05-19",
        steps=md_steps("origem-comum.md")
        or [
            step(1, "Risco de conflito",
                 "Chefe Sun Kuang → Mensageiro Liao Hua.",
                 npc="Chefe Sun Kuang", coords=[C(197, 758, 135), C(197, 757, 135)]),
        ],
    ),
    quest(
        map_slug="tianyu",
        order=3,
        slug="canglan-sob-neve-serena",
        name="Canglan sob Neve Serena",
        kind="journey",
        aliases=["沧澜晴雪"],
        summary="Pavilhão da Adoração à Espada, formação das estátuas e Espada da Neve Serena.",
        prerequisite="Anedota Continente Oriental – Cap. II · Pensamentos Ilusórios",
        source_url=None,
        published_at="2026-05-19",
        steps=[
            step(1, "Poema sem assinatura",
                 "Dentro do Pavilhão: cave o poema e a Espada de Ondas. "
                 "Fale com a Alma de Li Chang'an.",
                 npc="Alma de Li Chang'an",
                 coords=[C(298, 767, 93), C(298, 766, 93)]),
            step(2, "Formação das Dez Mil Glórias",
                 "Quatro estátuas Qilin na orientação correta; cave as três "
                 "espadas/fragmentos no centro.",
                 coords=[C(277, 711, 113)]),
            step(3, "Qingxue desperta",
                 "Cave a Espada da Neve Serena. Fale com Li Chang'an. "
                 "Baú dourado ao concluir.",
                 npc="Li Chang'an", coords=[C(277, 711, 113)]),
        ],
    ),
    quest(
        map_slug="tianyu",
        order=4,
        slug="montanha-espiritual",
        name="Montanha Espiritual",
        kind="journey",
        aliases=["灵山神秀", "Ling Shan"],
        summary="Selos das Três Bestas Sagradas: Xuanji, runas e cavernas de Ling Shan.",
        prerequisite="Anedota Continente Oriental – Cap. II · Pensamentos Ilusórios",
        source_url=None,
        published_at="2026-05-19",
        steps=[
            step(1, "Rumores",
                 "Chu Ran → Espírito Guardião. Use a anotação da montanha.",
                 npc="Chu Ran", coords=[C(333, 500, 86), C(333, 501, 88)]),
            step(2, "Colina das Águas de Ze",
                 "Ajude Bebê Ginseng: mate 10 espíritos desalmados.",
                 npc="Bebê Ginseng", coords=[C(326, 526, 84), C(327, 526, 84)]),
            step(3, "Chave Secreta de Xuanji",
                 "Cave pedras: 316,589=2; 334,536=7; 316,511=6; 331,526=8. "
                 "Senha na estátua do dragão: 2768.",
                 coords=[C(316, 589, 84), C(334, 536, 86), C(316, 511, 84), C(331, 526, 86), C(303, 530, 84)],
                 notes="Efeitos de luz ON para contar o brilho."),
        ],
    ),
    quest(
        map_slug="tianyu",
        order=5,
        slug="desembainhar-a-espada",
        name="Desembainhar a Espada",
        kind="journey",
        aliases=["拔剑茫然"],
        summary="Missão de aventura: loucura na cidade externa, Pavilhão e três duelos com Yi Nanping.",
        prerequisite="Anedota Continente Oriental – Cap. II · Pensamentos Ilusórios",
        source_url=None,
        published_at="2026-05-19",
        steps=[
            step(1, "Estranheza à beira da rua",
                 "Sun Chang na cidade externa. Fale com a multidão e contate "
                 "Sun Kuang (ativação em altitude 133).",
                 npc="Sun Chang",
                 coords=[C(181, 769, 83), C(230, 780, 133), C(230, 778)]),
            step(2, "Pavilhão da Espada do Vento",
                 "Ative perto do pavilhão e siga a trilha espectral.",
                 coords=[C(167, 774, 81), C(158, 748, 83)]),
            step(3, "Três batalhas",
                 "Yi Nanping: três duelos. Se falhar, aborte e reinicie.",
                 npc="Yi Nanping", coords=[C(158, 746, 83)]),
        ],
    ),
]


def enrich_published_at(quest: dict) -> dict:
    if quest.get("published_at"):
        return quest
    url = quest.get("source_url") or ""
    m = re.search(r"/(\d{4})/(\d{2})/(\d{2})/", url)
    if m:
        quest["published_at"] = f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return quest


def write_catalog(map_slug: str, name: str, quests: list[dict]) -> None:
    enriched = [enrich_published_at(dict(q)) for q in quests]
    payload = {
        "schema_version": 1,
        "id": f"quest-catalog-{map_slug}",
        "map_slug": map_slug,
        "name_pt_br": name,
        "generated_at": "2026-11-24",
        "synthetic": False,
        "origin": "community_observed",
        "review_status": "foreign_reference",
        "notice": NOTICE,
        "sources": [
            CLIENT_BR,
            VK,
            "data/fixtures/sources/quest-guides/",
        ],
        "quests": enriched,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{map_slug}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    steps = sum(len(q["steps"]) for q in enriched)
    print(f"Wrote {path.relative_to(ROOT)} — {len(enriched)} quests, {steps} steps")


def main() -> None:
    write_catalog("cidade-da-paz", "Cidade da Paz Eterna — Missões Globais", CIDADE_DA_PAZ)
    write_catalog("tianyu", "Cidade de Tianyu — Jornadas", TIANYU)


if __name__ == "__main__":
    main()
