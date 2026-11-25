"""Importa pontos Quedanunca: diárias locais + teleporte/banco/ferreiro/recursos do RuPW."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "data/fixtures/maps/continente-ocidental.json"
QUESTS = ROOT / "data/fixtures/quests/continente-ocidental.json"
NPCS_BR = ROOT / "data/fixtures/sources/client-br-levelup/npcs/npcs.all.json"
TMP = Path(__import__("os").environ["TEMP"])

ICON = {
    "quest": "/icons/pw-map/quest-icon.webp",
    "resource": "/icons/pw-map/grib-icon.webp",
    "teleport": "/icons/pw-map/icons_1784109905068661400.png",
    "npc": "/icons/npc.svg",
    "chest": "/icons/pw-map/icons_1784113895501464640.webp",
    "quest-imagem": "/icons/quest/imagem.svg",
}

# Traduções manuais RU → PT (recursos / papéis).
RU_PT = {
    "Алтарь отшельника": "Altar do eremita",
    "Артефакт": "Artefato",
    "Безымянное надгробие": "Lápide sem nome",
    "Брошенная древесина": "Madeira abandonada",
    "Вулканический кристалл": "Cristal vulcânico",
    "Голодный великан": "Gigante faminto",
    "Громовые камни": "Pedras do trovão",
    "Древний фонарь": "Lanterna antiga",
    "Дух подсолнухов": "Espírito dos girassóis",
    "Загадочное письмо": "Carta misteriosa",
    "Загадочный коралл": "Coral misterioso",
    "Заживляющие травы": "Ervas curativas",
    "Запрещенные книги": "Livros proibidos",
    "Змеиное яйцо": "Ovo de serpente",
    "Золотая потерянная вещь": "Objeto dourado perdido",
    "Изумрудный орумник": "Orumnita esmeralda",
    "Каланхоэ": "Kalanchoe",
    "Камень Лоренца": "Pedra de Lorenz",
    "Колонна небесной силы": "Coluna do poder celestial",
    "Кольцо темной силы": "Anel do poder sombrio",
    "Костер": "Fogueira",
    "Котел": "Caldeirão",
    "Кристалл славы - Врата города": "Cristal da glória — Portão da cidade",
    "Кристалл славы - Храм": "Cristal da glória — Templo",
    "Кристалл старого колодца": "Cristal do poço antigo",
    "Кровь гигантских зверей": "Sangue das bestas gigantes",
    "Легкие доллока": "Pulmões de dollok",
    "Ледяная зерновка": "Grão gelado",
    "Магический барьер": "Barreira mágica",
    "Медвежонок Элис": "Ursinho Alice",
    "Место для отправки писем": "Local de envio de cartas",
    "Новогодние подарки": "Presentes de Ano Novo",
    "Обычная потерянная вещь": "Objeto perdido comum",
    "Перья темного джинна": "Penas do gênio sombrio",
    "Пламя священной горы": "Chama da montanha sagrada",
    "Предупреждающий знак": "Placa de aviso",
    "Призрачный строй": "Formação fantasma",
    "Раненый кролик": "Coelho ferido",
    "Роза": "Rosa",
    "Светящееся место": "Local brilhante",
    "Свежий мед в сотах": "Mel fresco no favo",
    "Серебряная потерянная вещь": "Objeto perdido prateado",
    "Собранная энергия ветра": "Energia do vento reunida",
    "Строй высиживаемых орро": "Ninho de orros",
    "Строй магии воскрешения": "Formação de magia da ressurreição",
    "Сундук в кабинете Александра": "Baú no gabinete de Alexander",
    "Сундук с короной": "Baú com coroa",
    "Сфера призыва": "Esfera de invocação",
    "Энергетическая точка": "Ponto de energia",
    "Мастер телепортации": "Mestre de Teleporte",
    "Банкир": "Banqueiro",
    "Кузнец": "Ferreiro",
    "Ветеран Робертс": "Veterano Roberts",
    "Колорте": "Kolorte",
    "Алтея": "Althea",
    "Алтея, Императрица Света": "Althea, Imperatriz da Luz",
}

ROLE_KEEP = (
    "Мастер телепортации",
    "Банкир",
    "Кузнец",
    "Ветеран Робертс",
    "Колорте",
)


def parse_rupw(kind: str):
    text = (TMP / f"rupw-a78-{kind}.html").read_text(encoding="utf-8", errors="replace")
    return re.findall(
        r'<a href="\./\?ds=174&amp;p=(mine|npc|mob)&amp;id=(\d+)">([^<]+)</a></td>'
        r'<td class="num">([^<]*)</td>\s*'
        r'<td>(?:(\d+)\s+(\d+)\s*<span class="alt">\((\d+)\)</span>)?</td>'
        r'<td class="num">(\d+)</td><td class="num">(\d+)</td>',
        text,
    )


def translate(name_ru: str) -> str:
    if name_ru in RU_PT:
        return RU_PT[name_ru]
    for prefix, pt in (
        ("Мастер телепортации ", "Mestre de Teleporte "),
        ("Мастер телепортации", "Mestre de Teleporte"),
        ("Банкир ", "Banqueiro "),
        ("Кузнец ", "Ferreiro "),
    ):
        if name_ru.startswith(prefix):
            rest = name_ru[len(prefix) :].strip()
            return f"{pt}{rest}".strip()
    return name_ru


def load_br_names() -> dict[int, str]:
    raw = json.loads(NPCS_BR.read_text(encoding="utf-8"))
    out: dict[int, str] = {}
    for n in raw.get("npcs", []):
        try:
            out[int(n["id"])] = n["name_pt_br"]
        except (KeyError, TypeError, ValueError):
            continue
    return out


def point(
    *,
    pid: str,
    name: str,
    category: str,
    icon_key: str,
    x: int,
    y: int,
    altitude: int | None,
    tip: str | None,
    type_label: str,
    aliases: list[str] | None = None,
    reset_policy: str = "permanent",
    origin: str = "third_party",
    icon: str | None = None,
):
    return {
        "id": pid,
        "name": name,
        "aliases": aliases or [],
        "category": category,
        "icon_key": icon_key,
        "icon": icon or ICON.get(icon_key) or ICON["quest"],
        "x": x,
        "y": y,
        "altitude": altitude,
        "zone": "Continente Ocidental",
        "reset_policy": reset_policy,
        "tip": tip,
        "access_conditions": None,
        "review_status": "foreign_reference",
        "origin": origin,
        "type_label": type_label,
    }


def main() -> None:
    br = load_br_names()
    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))

    points = []

    # --- Diárias / hubs (guias PT) ---
    dailies = [
        ("npc-espirito-sagrado", "Espírito Sagrado", 586, 505, 12, "Início da escolta e Memórias do Passado", "Diária"),
        ("npc-portal-da-vida", "Oficial Portal da Vida", 504, 499, 12, "Entrega Esforço da Guerra I", "Diária"),
        ("npc-cerne-quebrado", "Oficial Cerne Quebrado", 448, 520, 10, "Entrega Esforço da Guerra II", "Diária"),
        ("npc-garganta-uivante", "Oficial Garganta Uivante", 446, 559, 11, "Entrega Esforço da Guerra III", "Diária"),
        ("npc-althea", "Althea — Salões Luz Aurora", 442, 627, 3, "Entrega final da escolta", "Diária"),
        ("npc-roberts", "Veterano Roberts", 478, 593, None, "Diária A Cidade das Bestas (Magnier)", "Diária"),
        ("npc-kolorte", "Kolorte", 544, 584, None, "Diária Dragão Topo das Nuvens (Nicada)", "Diária"),
    ]
    for pid, name, x, y, alt, tip, label in dailies:
        points.append(
            point(
                pid=pid,
                name=name,
                category="quest_objective",
                icon_key="quest",
                x=x,
                y=y,
                altitude=alt,
                tip=tip,
                type_label=label,
                reset_policy="daily",
                origin="community_observed",
            )
        )

    # --- Fotos Memórias do Passado (diária de Vigor) ---
    quests = json.loads(QUESTS.read_text(encoding="utf-8"))
    for quest in quests.get("quests", []):
        if quest.get("slug") != "esforco-da-guerra":
            continue
        for step in quest.get("steps", []):
            image_url = step.get("image_url")
            coords = step.get("coords") or []
            if not image_url or "/photo-" not in image_url or not coords:
                continue
            c0 = coords[0]
            x, y = int(c0["x"]), int(c0["y"])
            alt = c0.get("altitude")
            title = step.get("title_pt_br") or "Memória"
            name = title.replace("Foto — ", "").replace("Foto - ", "").strip()
            tip_bits = ["Memórias do Passado · alinhe a vista com a foto"]
            if step.get("notes"):
                tip_bits.append(step["notes"])
            points.append(
                point(
                    pid=f"memoria-{step['id']}",
                    name=name,
                    category="quest_objective",
                    icon_key="quest-imagem",
                    x=x,
                    y=y,
                    altitude=alt,
                    tip=" · ".join(tip_bits),
                    type_label="Memória / foto",
                    aliases=[a for a in [step.get("image_alt")] if a],
                    reset_policy="daily",
                    origin="community_observed",
                    icon=image_url,
                )
            )

    seen_xy: set[tuple[int, int, str]] = {(p["x"], p["y"], p["category"]) for p in points}

    # --- NPCs úteis do RuPW (teleporte / banco / ferreiro + hubs) ---
    for kind, nid, name_ru, _lvl, xs, ys, alt, _pts, _qty in parse_rupw("npc"):
        if not xs:
            continue
        if not any(name_ru == r or name_ru.startswith(r + " ") or name_ru.startswith(r) for r in ROLE_KEEP):
            # allow exact known hubs
            if name_ru not in ("Ветеран Робертс", "Колорте"):
                if not (
                    name_ru.startswith("Мастер телепортации")
                    or name_ru.startswith("Банкир ")
                    or name_ru.startswith("Кузнец ")
                ):
                    continue
        x, y = int(xs), int(ys)
        altitude = int(alt) if alt else None
        npc_id = int(nid)

        if name_ru.startswith("Мастер телепортации"):
            category, icon_key, label, tip = "teleport", "teleport", "Teleporte", "Mestre de teleporte"
        elif name_ru.startswith("Банкир"):
            category, icon_key, label, tip = "npc", "npc", "Banco", "Banqueiro"
        elif name_ru.startswith("Кузнец"):
            category, icon_key, label, tip = "npc", "npc", "Ferreiro", "Ferreiro"
        else:
            category, icon_key, label, tip = "npc", "npc", "NPC", None

        # skip if we already have a daily hub on same tile
        if any(p["x"] == x and p["y"] == y and p["category"] == "quest_objective" for p in points):
            continue
        key = (x, y, category)
        if key in seen_xy:
            continue
        seen_xy.add(key)

        name = br.get(npc_id) or translate(name_ru)
        points.append(
            point(
                pid=f"rupw-npc-{npc_id}-{x}-{y}",
                name=name,
                category=category,
                icon_key=icon_key,
                x=x,
                y=y,
                altitude=altitude,
                tip=tip,
                type_label=label,
                aliases=[name_ru] if name != name_ru else [],
            )
        )

    # --- Recursos / baús com 1 coordenada ---
    for kind, nid, name_ru, _lvl, xs, ys, alt, _pts, _qty in parse_rupw("res"):
        if not xs:
            continue
        x, y = int(xs), int(ys)
        altitude = int(alt) if alt else None
        name = translate(name_ru)
        is_chest = "Сундук" in name_ru
        category = "chest" if is_chest else "daily_resource"
        icon_key = "chest" if is_chest else "resource"
        tip = "Baú no mapa" if is_chest else "Recurso / interação no mapa"
        label = "Baú" if is_chest else "Recurso"
        reset = "permanent" if is_chest else "daily"
        key = (x, y, category)
        if key in seen_xy:
            continue
        seen_xy.add(key)
        points.append(
            point(
                pid=f"rupw-mine-{nid}-{x}-{y}",
                name=name,
                category=category,
                icon_key=icon_key,
                x=x,
                y=y,
                altitude=altitude,
                tip=tip,
                type_label=label,
                aliases=[name_ru] if name != name_ru else [],
                reset_policy=reset,
            )
        )

    # order: dailies, teleports, services, chests, resources
    order = {
        "quest_objective": 0,
        "teleport": 1,
        "npc": 2,
        "chest": 3,
        "daily_resource": 4,
    }

    def sort_key(p: dict):
        # fotos depois dos hubs de diária
        foto = 1 if p.get("icon_key") == "quest-imagem" else 0
        return (order.get(p["category"], 9), foto, p["name"], p["x"], p["y"])

    points.sort(key=sort_key)

    fixture["points"] = points
    fixture["notice"] = (
        "Mapa Western Steppes (Quedanunca) da PWpedia. "
        "Pontos: diárias + 20 fotos Memórias, teleportes/bancos/ferreiros/recursos do RuPW. "
        "Sem dump completo de NPCs. foreign_reference."
    )
    fixture["source_url"] = "https://rupw.org/pwdb/?ds=174&p=map&m=a78&t=npc"
    fixture["coverage_status"] = "partial"
    FIXTURE.write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    from collections import Counter

    c = Counter(p["category"] for p in points)
    print("wrote", len(points), "points", dict(c))


if __name__ == "__main__":
    main()
