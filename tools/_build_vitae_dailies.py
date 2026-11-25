#!/usr/bin/env python3
"""Gera catálogo Mundo Primitivo + completa diárias Vitae do Continente Ocidental."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUESTS = ROOT / "data" / "fixtures" / "quests"
MAPS = ROOT / "data" / "fixtures" / "maps"
NOTICE = "PWpedia + cliente BR. foreign_reference — validar no BR."


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


def quest(
    *,
    qid: str,
    slug: str,
    map_slug: str,
    order: int,
    name: str,
    aliases: list[str],
    excerpt: str,
    summary: str,
    prerequisite: str,
    rewards: str,
    source: str,
    steps: list[dict],
    published: str | None = None,
) -> dict:
    return {
        "id": qid,
        "slug": slug,
        "map_slug": map_slug,
        "kind": "daily",
        "order": order,
        "name_pt_br": name,
        "aliases": aliases,
        "excerpt_pt_br": excerpt,
        "summary_pt_br": summary,
        "prerequisite_pt_br": prerequisite,
        "rewards_pt_br": rewards,
        "published_at": published,
        "coverage_status": "partial",
        "review_status": "foreign_reference",
        "origin": "community_observed",
        "source_url": source,
        "notice": NOTICE,
        "steps": steps,
    }


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)}")


def map_mundo_primitivo() -> dict:
    return {
        "id": "map-mundo-primitivo",
        "slug": "mundo-primitivo",
        "name_pt_br": "Mundo Primitivo",
        "aliases": ["Primal World", "Kirin Town", "Cidade Kirin"],
        "coverage_status": "partial",
        "width": 875,
        "height": 850,
        "asset": "/maps/mundo-primitivo.svg",
        "transform": {"a": 1, "b": 0, "c": 0, "d": 0, "e": -1, "f": 850},
        "notice": (
            "Mapa base limpo — calibração completa em breve. "
            "Pontos das diárias de Vigor listados como referência aproximada."
        ),
        "synthetic": True,
        "origin": "community_observed",
        "source_url": "https://pwi.fandom.com/wiki/List_of_Vitae_Dailies",
        "points": [
            {
                "id": "npc-spy-sky-owl",
                "name": "Espião Força de Resistência (Sky Owl)",
                "aliases": [],
                "category": "quest_objective",
                "x": 349,
                "y": 469,
                "altitude": None,
                "zone": "Mundo Primitivo",
                "reset_policy": "daily",
                "tip": "Ataque a Fortaleza — pegar fora do Story Mode",
                "access_conditions": None,
                "review_status": "foreign_reference",
                "origin": "community_observed",
                "type_label": "Diária",
                "icon_key": "quest",
            },
            {
                "id": "npc-melancholy",
                "name": "Soldado Melancólico",
                "aliases": [],
                "category": "quest_objective",
                "x": 383,
                "y": 626,
                "altitude": None,
                "zone": "Mundo Primitivo",
                "reset_policy": "daily",
                "tip": "Herói Épico / Story Mode (Dragon Pond)",
                "access_conditions": None,
                "review_status": "foreign_reference",
                "origin": "community_observed",
                "type_label": "Diária",
                "icon_key": "quest",
            },
            {
                "id": "npc-executor",
                "name": "Executor (Campo Goblin de Gelo)",
                "aliases": [],
                "category": "quest_objective",
                "x": 443,
                "y": 559,
                "altitude": None,
                "zone": "Mundo Primitivo",
                "reset_policy": "daily",
                "tip": "Alguma coisa na Neve",
                "access_conditions": None,
                "review_status": "foreign_reference",
                "origin": "community_observed",
                "type_label": "Diária",
                "icon_key": "quest",
            },
            {
                "id": "npc-feng",
                "name": "Comandante Feng",
                "aliases": [],
                "category": "quest_objective",
                "x": 405,
                "y": 586,
                "altitude": None,
                "zone": "Mundo Primitivo",
                "reset_policy": "daily",
                "tip": "Tempestade de Neve / This War O' Mine",
                "access_conditions": None,
                "review_status": "foreign_reference",
                "origin": "community_observed",
                "type_label": "Diária",
                "icon_key": "quest",
            },
        ],
    }


def catalog_mundo_primitivo() -> dict:
    quests = [
        quest(
            qid="quest-mundo-primitivo-ataque-a-fortaleza",
            slug="ataque-a-fortaleza",
            map_slug="mundo-primitivo",
            order=1,
            name="Ataque a Fortaleza",
            aliases=["Stronghold Assault", "Assault on Sky Owl", "Céu Arcano"],
            excerpt="Diária de Vigor do Céu Arcano — Story Mode no Forte Coruja do Céu.",
            summary=(
                "Pegue fora do Story Mode no Espião da Força de Resistência, "
                "entre no Story Mode, cave Madeiras Obsoletas e mate 4 Defensores."
            ),
            prerequisite="Nv 90+ (BR tipicamente 100+), Reborn, Céu Arcano I–X.",
            rewards="1.600.000 exp; 4.000 Vitae; Moeda Brilhante ×8; Sangue Primordial ×4.",
            source="https://pwi.fandom.com/wiki/Stronghold_Assault",
            published="2014-04-24",
            steps=[
                step(
                    1,
                    "step-01-pegar",
                    "Pegar fora do Story Mode",
                    "Fale com o Espião da Força de Resistência perto do Forte Coruja do Céu. A diária não aparece dentro do Story Mode.",
                    npc="Espião Força de Resistência",
                    coords=[C(349, 469)],
                ),
                step(
                    2,
                    "step-02-story",
                    "Entrar no Story Mode e cavar",
                    "Pelo mesmo NPC entre no Story Mode. Cave Madeira Obsoleta até obter 4 Brasas (Cinders).",
                    notes="Story Mode: mesmo mapa sem mobs/NPCs normais.",
                ),
                step(
                    3,
                    "step-03-centro",
                    "Centro do forte",
                    "Vá ao centro do forte e fique parado até a próxima etapa. Recomenda-se voar e descer com imunidade física — os Defensores têm ranged forte.",
                    coords=[C(336, 476)],
                ),
                step(
                    4,
                    "step-04-kill",
                    "Matar 4 Defensores Coruja do Céu",
                    "Mate 4 Sky Owl Defenders (idealmente no ar / um a um). O Saco de Grãos abre sozinho com a recompensa.",
                    notes="10% de chance de spawnar a diária oculta Escort Provision Convoy.",
                ),
            ],
        ),
        quest(
            qid="quest-mundo-primitivo-heroi-epico",
            slug="heroi-epico",
            map_slug="mundo-primitivo",
            order=2,
            name="Herói Épico",
            aliases=["Heroic Warsong", "Epic Hero", "Céu Miragem"],
            excerpt="Diária de Vigor do Céu Miragem — reviva soldados com Pílulas de Madeira Esmeralda.",
            summary=(
                "No Story Mode (Dragon Pond / Soldado Melancólico), use 10 pílulas "
                "para obter 8 Insígnias de Elite cavando soldados mortos ou "
                "revivendo soldados Imperiais da Luz."
            ),
            prerequisite="Nv 100+, Reborn II, Céu Miragem I–X.",
            rewards="2.500.000 exp; 8.000 Vitae; Moeda Brilhante ×8; Sangue Primordial ×4.",
            source="https://pwi.fandom.com/wiki/Heroic_Warsong",
            published="2014-04-24",
            steps=[
                step(
                    1,
                    "step-01-story",
                    "Entrar no Story Mode",
                    "Fale com o Lago do Dragão (Dragon Pond) a noroeste da Vila Outono para ir ao Story Mode, ou direto com o Soldado Melancólico.",
                    npc="Lago do Dragão / Soldado Melancólico",
                    coords=[C(383, 626)],
                ),
                step(
                    2,
                    "step-02-pegar",
                    "Aceitar Herói Épico",
                    "Aceite no Soldado Melancólico e receba 10 Pílulas de Madeira Esmeralda. Vá à Fortaleza do Lorde Tirano (leste).",
                    npc="Soldado Melancólico",
                ),
                step(
                    3,
                    "step-03-insignias",
                    "Obter 8 Insígnias de Elite",
                    (
                        "• Cave Soldados Mortos; ou\n"
                        "• Use a pílula em Soldados Imperiais da Luz com <50% HP "
                        "(debuff visível) → mate o Fantasma da Valentia.\n"
                        "Em dobro de drop, 2 insígnias por fantasma."
                    ),
                    notes="Sem pílulas: missões Get Emerald Wood Pills no mesmo NPC (espere 30s).",
                ),
                step(
                    4,
                    "step-04-entregar",
                    "Entregar",
                    "Volte ao Soldado Melancólico e entregue as 8 Insígnias.",
                    npc="Soldado Melancólico",
                    coords=[C(383, 626)],
                ),
            ],
        ),
        quest(
            qid="quest-mundo-primitivo-alguma-coisa-na-neve",
            slug="alguma-coisa-na-neve",
            map_slug="mundo-primitivo",
            order=3,
            name="Alguma coisa na Neve",
            aliases=["Something in the Snow", "Strangeness in the Snow", "Céu Astral"],
            excerpt="Diária de Vigor do Céu Astral — corda de neve e Ice Thralls na Prisão Glacial.",
            summary=(
                "Cave Fontes de Gelo e Neve, receba Corda Jadesnow no Cavaleiro "
                "do Gelo e puxe Ice Thralls até os Armadilheiros."
            ),
            prerequisite="Nv 100+, Reborn II, Céu Astral I–X.",
            rewards="2.850.000 exp; 12.000 Vitae; Moeda Brilhante ×8; Sangue Primordial ×4.",
            source="https://pwi.fandom.com/wiki/Something_in_the_Snow",
            published="2014-04-24",
            steps=[
                step(
                    1,
                    "step-01-executor",
                    "Aceitar no Executor",
                    "No Campo dos Goblins de Gelo, fale com o Executor (entrada Story Mode se necessário).",
                    npc="Executor",
                    coords=[C(443, 559)],
                ),
                step(
                    2,
                    "step-02-cavar",
                    "Cavar Fontes",
                    "Cave 5 Fontes de Gelo e Neve a noroeste do acampamento.",
                ),
                step(
                    3,
                    "step-03-corda",
                    "Corda Jadesnow",
                    "Entregue ao Cavaleiro do Gelo (Frost Knight) na Prisão Glacial e receba a Corda Jadesnow.",
                    npc="Cavaleiro do Gelo",
                ),
                step(
                    4,
                    "step-04-thrall",
                    "Puxar Ice Thrall",
                    (
                        "Thralls são imunes a dano. Alvo → use a Corda (inventário ou prompt) "
                        "a curta distância e puxe até um Armadilheiro (Trapper) leste/oeste "
                        "do lago. Repita até o Armadilheiro matar. Depois entregue no Executor."
                    ),
                    notes="Se demorar demais no puxão, o Thrall pode soltar.",
                ),
            ],
        ),
        quest(
            qid="quest-mundo-primitivo-tempestade-de-neve",
            slug="tempestade-de-neve",
            map_slug="mundo-primitivo",
            order=4,
            name="Tempestade de Neve",
            aliases=["This War O' Mine", "Essa Minha Guerra", "Céu Oscilante"],
            excerpt="Diária de Vigor do Céu Oscilante — escolta de pacotes em Story Mode (5 NPCs).",
            summary=(
                "No Posto de Might, carregue pacotes sem buff de velocidade/voo "
                "por Inkstone → Miststone → Luneska → Campo Goblin de Gelo."
            ),
            prerequisite="Nv 100+, Reborn II, Céu Oscilante I–X (cliente: após Trono do Templo / Oscilante II).",
            rewards=(
                "3.400.000 exp; 16.000 Vitae; Moeda Brilhante ×8; Sangue Primordial ×4; "
                "Sangue Bárbaro ×4; Baú Astrolábios; Espírito Sagrado Oscilante."
            ),
            source="https://pwi.fandom.com/wiki/This_War_o%27_Mine",
            published="2014-04-24",
            steps=[
                step(
                    1,
                    "step-01-feng",
                    "Comandante Feng",
                    "Aceite no Comandante Feng no Posto Avançado de Might. Fora do Story Mode ele teleporta para dentro.",
                    npc="Comandante Feng",
                    coords=[C(405, 586)],
                    notes="Pacote nas costas: sem speed buff, sem voar, sem furtividade. Teleport/salto ok. 15 min por perna.",
                ),
                step(
                    2,
                    "step-02-inkstone",
                    "Entrega 1 → Ancião Inkstone",
                    "Entregue o pacote ao Ancião Inkstone (Inkstone Village) e pegue o próximo.",
                    npc="Ancião Inkstone",
                    coords=[C(410, 621)],
                ),
                step(
                    3,
                    "step-03-luneskan",
                    "Entrega 2 → Guardiã Luneskan",
                    "Entregue à Guardiã da Alma Luneskan nas Ruínas Miststone.",
                    npc="Guardiã da Alma Luneskan",
                ),
                step(
                    4,
                    "step-04-diving",
                    "Entrega 3 → Soldado Mergulhador",
                    "Entregue ao Soldado Mergulhador em Luneska.",
                    npc="Soldado Mergulhador",
                ),
                step(
                    5,
                    "step-05-becket",
                    "Entrega 4 → Tenente Becket",
                    "Entregue ao Tenente Becket no Campo dos Goblins de Gelo. O Pacote de Suprimentos traz a recompensa.",
                    npc="Tenente Becket",
                    coords=[C(444, 562)],
                    notes="5% de chance de spawnar o Pirate King. Morrer/PK/sair do Story Mode falha a perna.",
                ),
            ],
        ),
        quest(
            qid="quest-mundo-primitivo-espiritos-sagrados",
            slug="espiritos-sagrados-mp",
            map_slug="mundo-primitivo",
            order=5,
            name="Espíritos Sagrados (Mundo Primitivo)",
            aliases=["Sacred Spirits Primal", "Vitae Mobs MP"],
            excerpt="Packs de farm de Vitae no Mundo Primitivo (Arcano→Oscilante).",
            summary="Grupos de Espíritos Sagrados por Céu ao redor de Mirrorflower, Snow Ape, Prisão Glacial e Waverun.",
            prerequisite="Reborn + Céu correspondente.",
            rewards="Vitae até o cap diário do Céu.",
            source="https://pwi.fandom.com/wiki/Sacred_Spirits",
            published="2018-09-19",
            steps=[
                step(
                    1,
                    "step-01-arcano",
                    "Céu Arcano — Mirrorflower",
                    "Grupos: 318,557 · 332,551 · 351,551 · 348,566 · 354,574 · 326,579",
                    coords=[
                        C(318, 557),
                        C(332, 551),
                        C(351, 551),
                        C(348, 566),
                        C(354, 574),
                        C(326, 579),
                    ],
                ),
                step(
                    2,
                    "step-02-miragem",
                    "Céu Miragem — Snow Ape / Tirano / Outono",
                    "Grupos: 373,580 · 368,590 · 378,595 · 373,607 · 363,601 · 365,615",
                    coords=[
                        C(373, 580),
                        C(368, 590),
                        C(378, 595),
                        C(373, 607),
                        C(363, 601),
                        C(365, 615),
                    ],
                ),
                step(
                    3,
                    "step-03-astral",
                    "Céu Astral — Prisão Glacial",
                    "Grupos: 448,597 · 437,587 · 441,605 · 427,596 · 421,588 · 428,576",
                    coords=[
                        C(448, 597),
                        C(437, 587),
                        C(441, 605),
                        C(427, 596),
                        C(421, 588),
                        C(428, 576),
                    ],
                ),
                step(
                    4,
                    "step-04-oscilante",
                    "Céu Oscilante — Ruínas Waverun",
                    "Grupos: 459,521(21) · 456,536(19) · 451,526(20) · 447,521(19) · 436,524(22) · 443,538(21)",
                    coords=[
                        C(459, 521, 21),
                        C(456, 536, 19),
                        C(451, 526, 20),
                        C(447, 521, 19),
                        C(436, 524, 22),
                        C(443, 538, 21),
                    ],
                    notes="Packs de Crepúsculo+ ficam no Continente Ocidental (/missoes/continente-ocidental/espiritos-sagrados).",
                ),
            ],
        ),
    ]
    return {
        "schema_version": 1,
        "id": "quest-catalog-mundo-primitivo",
        "map_slug": "mundo-primitivo",
        "name_pt_br": "Mundo Primitivo — Diárias de Vigor",
        "generated_at": "2026-11-24",
        "synthetic": False,
        "origin": "community_observed",
        "review_status": "foreign_reference",
        "notice": NOTICE,
        "sources": [
            "https://pwi.fandom.com/wiki/List_of_Vitae_Dailies",
            "https://pwi.fandom.com/wiki/Sacred_Spirits",
            "https://forum.lmspw.com/viewtopic.php?f=2&t=15323",
            "cliente BR tasks.data",
        ],
        "quests": quests,
    }


def western_extra_quests() -> list[dict]:
    return [
        quest(
            qid="quest-continente-ocidental-dias-de-aposentadoria",
            slug="dias-de-aposentadoria",
            map_slug="continente-ocidental",
            order=4,
            name="Dias de Aposentadoria",
            aliases=["Retired Days", "Swords to Plowshares", "Céu Crepúsculo", "Diária: Dias de Aposentadoria"],
            excerpt="Diária de Vigor do Céu Crepúsculo em Quedanunca.",
            summary=(
                "Diária única do Céu Crepúsculo (cliente 37207). Recompensa inclui "
                "Espírito Sagrado Crepúsculo. Rota ainda parcial — validar no cliente BR."
            ),
            prerequisite="Nv 100+, Reborn II, Céu Crepúsculo I–X.",
            rewards=(
                "4.000.000 exp; 20.000 Vitae; Insígnia Escudeiro ×2; Pedra Yin Yang; "
                "Sangue Primordial/Bárbaro; Baú Astrolábios; Espírito Sagrado Crepúsculo."
            ),
            source="https://pwi.fandom.com/wiki/List_of_Vitae_Dailies",
            published="2024-11-24",
            steps=[
                step(
                    1,
                    "step-01",
                    "Aceitar a diária",
                    "Com Céu Crepúsculo, aceite Diária: Dias de Aposentadoria (rótulo EN: Retired Days).",
                    notes="Passos finos de mapa: completar com screenshots BR / PWpedia Swords to Plowshares se aplicável.",
                ),
            ],
        ),
        quest(
            qid="quest-continente-ocidental-cidade-das-bestas",
            slug="cidade-das-bestas",
            map_slug="continente-ocidental",
            order=5,
            name="A Cidade das Bestas",
            aliases=["The Town of Beasts", "WC: The Town of Beasts", "Céu Real"],
            excerpt="Diária de Vigor do Céu Real — Veterano Roberts em Magnier.",
            summary=(
                "Aceite com o Veterano Roberts (478,593). Cadeia contra lobisomens/"
                "criaturas noturnas (Lurking Werewolves, Town in Crisis, etc.)."
            ),
            prerequisite="Nv 100+, Reborn II, Céu Real I–X.",
            rewards=(
                "4.000.000 exp; 30.000 Vitae; Cristal Sangue Bárbaro ×15; Insígnia ×4; "
                "Pedra Yin Yang; Moeda Brilhante; Espírito Sagrado Real."
            ),
            source="https://www.pwdatabase.com/pwi/quest/37710",
            published="2024-11-24",
            steps=[
                step(
                    1,
                    "step-01",
                    "Veterano Roberts",
                    "Em Magnier, fale com o Veterano Roberts e aceite A Cidade das Bestas.",
                    npc="Veterano Roberts",
                    coords=[C(478, 593, 10)],
                ),
                step(
                    2,
                    "step-02",
                    "Submissões",
                    "Complete a cadeia do dia (ex.: Lobisomens à Espreita, Cidade em Crise, Corra ou Morra, Mestres do Disfarce) conforme o objetivo sorteado.",
                    notes="Descrições das submissões ainda parciais — expandir com guia BR.",
                ),
            ],
        ),
        quest(
            qid="quest-continente-ocidental-dragao-topo-nuvens",
            slug="dragao-topo-das-nuvens",
            map_slug="continente-ocidental",
            order=6,
            name="Dragão Topo das Nuvens",
            aliases=["Cloud Top Dragon", "WC: Cloud Top Dragon", "Céu Ápice"],
            excerpt="Corrida nas muralhas de Nicada — Vigor conforme o tempo.",
            summary=(
                "Kolorte em Nicada: passe 7 Contas de Jade em ordem em até 20 min. "
                "Quanto mais rápido, mais Vitae."
            ),
            prerequisite="Nv 102+, Reborn II, Céu Ápice I–X (histórico: após Operação Fada).",
            rewards=(
                "Vitae por faixa de tempo (List of Vitae Dailies "
                "atual: 35–90k); Moeda Brilhante; Sangues; Insígnia; Pedra Yin Yang; "
                "Espírito Sagrado Ápice."
            ),
            source=None,
            published="2022-01-06",
            steps=[
                step(
                    1,
                    "step-01",
                    "Aceitar em Nicada",
                    "Fale com Kolorte e aceite Dragão Topo das Nuvens. Cair da pista / teleport / deslogar falha; Kolorte pode teleportar ao último checkpoint.",
                    npc="Kolorte",
                    coords=[C(544, 584, 10)],
                ),
                step(
                    2,
                    "step-02",
                    "Checkpoints (7 Contas)",
                    (
                        "Passe nas Contas de Jade na ordem:\n"
                        "1) 546,585(11) · 2) 547,579(12) · 3) 540,579(11) · "
                        "4) 539,590(12) · 5) 537,592(12) · 6) 536,574(11) · "
                        "7) 546,574(11) · Final 550,581(11)"
                    ),
                    coords=[
                        C(546, 585, 11),
                        C(547, 579, 12),
                        C(540, 579, 11),
                        C(539, 590, 12),
                        C(537, 592, 12),
                        C(536, 574, 11),
                        C(546, 574, 11),
                        C(550, 581, 11),
                    ],
                    notes="Armadilhas: Batida (empurra), Gancho (puxa), Atordoante (inverte movimento).",
                ),
                step(
                    3,
                    "step-03",
                    "Tempo e recompensa",
                    "Limite 20 min. Faixas de Vigor sobem com a velocidade (lista atual PWpedia: 35k/50k/75k/90k).",
                ),
            ],
        ),
        quest(
            qid="quest-continente-ocidental-agua-de-ymir",
            slug="agua-de-ymir",
            map_slug="continente-ocidental",
            order=7,
            name="A Água de Ymir",
            aliases=["The Water of Imar", "Água de Imar", "Céu Majestoso"],
            excerpt="Diária de Vigor do Céu Majestoso — Landar na Floresta Vidal / Reino Congelado.",
            summary=(
                "Ajude Landar contra Viora: mate Demônios/Thralls Gélidos quando "
                "os símbolos vermelhos aparecerem para obter Alma Congelada."
            ),
            prerequisite="Nv 100+, Reborn II, Céu Majestoso (Rising Sky) I–X.",
            rewards=(
                "4.000.000 exp; 110.000 Vitae (lista atual); Moeda Brilhante; Sangues; "
                "Insígnia; Pedra Yin Yang; Espírito Sagrado Majestoso; item Água de Ymir."
            ),
            source="https://pwi.fandom.com/wiki/List_of_Vitae_Dailies",
            published="2022-08-10",
            steps=[
                step(
                    1,
                    "step-01",
                    "Aceitar com Landar",
                    "Na Floresta Vidal, fale com Landar e aceite A Água de Ymir.",
                    npc="Landar",
                    notes="Coord exata do NPC ainda parcial — use o ícone da missão.",
                ),
                step(
                    2,
                    "step-02",
                    "Reino Congelado",
                    (
                        "Viora é invencível. Quando símbolos vermelhos cercam os thralls/"
                        "demônios, mate-os antes dos símbolos sumirem para pegar Alma "
                        "Congelada. Se sumirem, espere o próximo ciclo."
                    ),
                ),
            ],
        ),
    ]


def merge_continente() -> None:
    path = QUESTS / "continente-ocidental.json"
    cat = json.loads(path.read_text(encoding="utf-8"))
    extras = {q["slug"]: q for q in western_extra_quests()}
    kept = [q for q in cat["quests"] if q["slug"] not in extras]
    kept.extend(extras.values())
    order_map = {
        "esforco-da-guerra": 1,
        "espiritos-sagrados": 2,
        "chama-da-vinganca": 3,
        "dias-de-aposentadoria": 4,
        "cidade-das-bestas": 5,
        "dragao-topo-das-nuvens": 6,
        "agua-de-ymir": 7,
    }
    for q in kept:
        if q["slug"] in order_map:
            q["order"] = order_map[q["slug"]]
    kept.sort(key=lambda q: (q["order"], q["slug"]))
    cat["quests"] = kept
    cat["name_pt_br"] = "Quedanunca — Diárias e Vigor"
    cat["generated_at"] = "2026-11-24"
    for src in [
        "https://pwi.fandom.com/wiki/List_of_Vitae_Dailies",
    ]:
        if src not in cat["sources"]:
            cat["sources"].append(src)
    write_json(path, cat)


def main() -> None:
    print("Building Vitae dailies…")
    write_json(MAPS / "mundo-primitivo.json", map_mundo_primitivo())
    write_json(QUESTS / "mundo-primitivo.json", catalog_mundo_primitivo())
    merge_continente()
    print("Done.")


if __name__ == "__main__":
    main()
