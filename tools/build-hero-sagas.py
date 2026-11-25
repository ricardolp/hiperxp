#!/usr/bin/env python3
"""Gera data/fixtures/quests/mundo-normal.json — Saga do Herói.

Prioridade de fonte:
1. Guias BR em data/fixtures/sources/quest-guides/br-saga/*.md
2. Fallback PWpedia EN: perfect-world-hero-saga.pwpedia.txt
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from parse_quest_guide_md import parse_quest_guide_md  # noqa: E402

BR_DIR = ROOT / "data/fixtures/sources/quest-guides/br-saga"
PWPEDIA = (
    ROOT / "data/fixtures/sources/quest-guides/perfect-world-hero-saga.pwpedia.txt"
)
OUT = ROOT / "data/fixtures/quests/mundo-normal.json"
QUESTS_DB = ROOT / "data/fixtures/database/quests.json"

NOTICE_BR = (
    "Guia comunitário BR estruturado. foreign_reference — validar no cliente."
)
NOTICE_EN = (
    "Fallback PWpedia (EN). Sem guia BR completo ainda. foreign_reference."
)
SOURCE_URL = "https://pwi.fandom.com/wiki/Perfect_World_Hero_Saga"
META_URL = "https://metapw.com.br/187/guias/saga-do-heroi"

# Ordem ≈ Meta PW / TOC. br_md = arquivo preferencial BR.
HEROES: list[dict] = [
    {
        "en": "Blademaster General Chung",
        "slug": "saga-guerreiro-chung",
        "name": "Saga do Herói: Guerreiro — Chung",
        "class_pt": "Guerreiro",
        "hero": "Chung",
        "aliases": ["Blademaster General Chung", "General Chung", "Espadachim Chung"],
        "br_md": "guerreiro-chung.md",
        "title_reward": "Época Passada",
        "pet_reward": "Mini Chung",
    },
    {
        "en": "Wizard Tensa",
        "slug": "saga-mago-tensa",
        "name": "Saga do Herói: Mago — Tensa",
        "class_pt": "Mago",
        "hero": "Tensa",
        "aliases": ["Wizard Tensa", "Feiticeira Tensa", "Tensa Saga"],
        "br_md": "mago-tensa.md",
        "title_reward": "Uma História Memorável",
        "pet_reward": "Mini Tensa",
    },
    {
        "en": "Technician Atiya",
        "slug": "saga-atiradora-atiya",
        "name": "Saga do Herói: Atiradora — Atiya",
        "class_pt": "Atiradora",
        "hero": "Atiya",
        "aliases": ["Technician Atiya", "Atiya"],
        "br_md": "atiradora-atiya.md",
        "title_reward": "Tempo Aproveitado",
        "pet_reward": "Mini Atiya",
    },
    {
        "en": "Wildwalker Syvos",
        "slug": "saga-andarilho-syvos",
        "name": "Saga do Herói: Andarilho — Syvos",
        "class_pt": "Andarilho",
        "hero": "Syvos",
        "aliases": ["Wildwalker Syvos", "Syvos", "Caminhante Syvos"],
        "br_md": "andarilho-syvos.md",
        "title_reward": "Flor de Pessegueiro Primaveril",
        "pet_reward": "Syvos Pequeno",
    },
    {
        "en": "Barbarian Viensa",
        "slug": "saga-barbaro-viensa",
        "name": "Saga do Herói: Bárbaro — Viensa",
        "class_pt": "Bárbaro",
        "hero": "Viensa",
        "aliases": ["Barbarian Viensa", "Viensa"],
        "br_md": "barbaro-viensa.md",
        "title_reward": "Façanhas de Um Herói",
        "pet_reward": "Mini Viensa",
    },
    {
        "en": "Venomancer Yeona",
        "slug": "saga-feiticeira-yeona",
        "name": "Saga do Herói: Feiticeira — Yeona",
        "class_pt": "Feiticeira",
        "hero": "Yeona",
        "aliases": ["Venomancer Yeona", "Yeona", "Toximante Yeona"],
        "br_md": "feiticeira-yeona.md",
        "title_reward": "Um Grão no Universo",
        "pet_reward": "Mini Yeona",
    },
    {
        "en": "Archer Yi the Mighty Wing",
        "slug": "saga-arqueiro-yi",
        "name": "Saga do Herói: Arqueiro — Yi Yunyang",
        "class_pt": "Arqueiro",
        "hero": "Yi Yunyang",
        "aliases": ["Archer Yi the Mighty Wing", "Yi the Mighty Wing", "Yi Yunyang"],
        "br_md": None,
        "title_reward": "Sopra o Vento da Paz",
        "pet_reward": "Mini Yunyang",
    },
    {
        "en": "Cleric Yuusa",
        "slug": "saga-sacerdote-yuusa",
        "name": "Saga do Herói: Sacerdote — Yuusa",
        "class_pt": "Sacerdote",
        "hero": "Yuusa",
        "aliases": ["Cleric Yuusa", "Yuusa", "Clérigo Yuusa"],
        "br_md": "sacerdote-yuusa.md",
        "title_reward": "Destinado à Lua",
        "pet_reward": "Mini Yuusa",
    },
    {
        "en": "Edgerunner Tevin",
        "slug": "saga-paladino-tian-yi",
        "name": "Saga do Herói: Paladino — Tian Yi",
        "class_pt": "Paladino",
        "hero": "Tian Yi",
        "aliases": ["Edgerunner Tevin", "Tevin", "Tian Yi", "Paladino Tian Yi"],
        "br_md": "paladino-tian-yi.md",
        "title_reward": "Os Verdadeiros Heróis!",
        "pet_reward": "Mini Tian Yi",
    },
    {
        "en": "Psychic Donfang Meng",
        "slug": "saga-espiritualista-dongfang-meng",
        "name": "Saga do Herói: Espiritualista — Dongfang Meng",
        "class_pt": "Espiritualista",
        "hero": "Dongfang Meng",
        "aliases": ["Psychic Donfang Meng", "Dongfang Meng", "Psíquico Dongfang Meng"],
        "br_md": None,
        "title_reward": "Grou e Humano Unidos",
        "pet_reward": "Pequena Dongfang Meng",
    },
    {
        "en": "Bard Donfang Liqing",
        "slug": "saga-bardo-dongfang-liqing",
        "name": "Saga do Herói: Bardo — Dongfang Liqing",
        "class_pt": "Bardo",
        "hero": "Dongfang Liqing",
        "aliases": ["Bard Donfang Liqing", "Dongfang Liqing", "DF Liqing"],
        "br_md": None,
        "title_reward": "Lua ao Som Magnífico",
        "pet_reward": "Pequena Liqing",
    },
    {
        "en": "Assassin Dongfang Lie",
        "slug": "saga-mercenario-dongfang-lie",
        "name": "Saga do Herói: Mercenário — Dongfang Lie",
        "class_pt": "Mercenário",
        "hero": "Dongfang Lie",
        "aliases": ["Assassin Dongfang Lie", "Dongfang Lie"],
        "br_md": "mercenario-dongfang-lie.md",
        "title_reward": "Dança da Lua e Maré",
        "pet_reward": "Pequeno Dongfang Lie",
    },
    {
        "en": "Mystic Yuanruo",
        "slug": "saga-mistico-yuanruo",
        "name": "Saga do Herói: Místico — Yuan Ruo",
        "class_pt": "Místico",
        "hero": "Yuan Ruo",
        "aliases": ["Mystic Yuanruo", "Yuanruo", "Yuan Ruo"],
        "br_md": None,
        "title_reward": "Fragrância da Memória",
        "pet_reward": "Pequeno Yuan Ruo",
    },
    {
        "en": "Seeker Mu Sui Liang",
        "slug": "saga-arcano-mu-suiliang",
        "name": "Saga do Herói: Arcano — Mu Suiliang",
        "class_pt": "Arcano",
        "hero": "Mu Suiliang",
        "aliases": ["Seeker Mu Sui Liang", "Mu Sui Liang", "Mu Suiliang", "Buscador"],
        "br_md": "arcano-mu-suiliang.md",
        "title_reward": "Espada do Renascimento",
        "pet_reward": "Pequeno Mu Suiliang",
    },
    {
        "en": "Stormbringer Ye Hansu",
        "slug": "saga-tormentador-ye-hansu",
        "name": "Saga do Herói: Tormentador — Ye Hansu",
        "class_pt": "Tormentador",
        "hero": "Ye Hansu",
        "aliases": ["Stormbringer Ye Hansu", "Ye Hansu", "Tempestuoso Ye Hansu"],
        "br_md": None,
        "title_reward": "Rigidez com Ternura",
        "pet_reward": "Pequena Hansu",
    },
    {
        "en": "Duskblade Feng Jie'ao",
        "slug": "saga-retalhador-feng-jieao",
        "name": "Saga do Herói: Retalhador — Feng Jie'ao",
        "class_pt": "Retalhador",
        "hero": "Feng Jie'ao",
        "aliases": ["Duskblade Feng Jie'ao", "Feng Jie'ao", "Lâmina do Crepúsculo"],
        "br_md": None,
        "title_reward": "Andarilho Solitário",
        "pet_reward": "Pequeno Feng Jie'ao",
    },
    {
        "en": None,  # não está no dump PWpedia local das 16 classes clássicas
        "slug": "saga-ceifador-tianshou",
        "name": "Saga do Herói: Ceifador — Tianshou",
        "class_pt": "Ceifador",
        "hero": "Tianshou",
        "aliases": ["Tianshou", "Chunchu", "Ceifador", "Saga de Tianshou"],
        "br_md": "ceifador-tianshou.md",
        "title_reward": "Outono do Mundo",
        "pet_reward": "Tianshou Pequeno",
    },
]

# Meta PW card art (baixada em apps/web/public/quests/saga-do-heroi/)
META_CARDS_PATH = BR_DIR / "meta-cards.json"
ART_BASE = "/quests/saga-do-heroi"

LOC = {
    "Archosaur": "Cidade do Dragão",
    "Etherblade Outskirts": "Arredores da Cidade das Espadas",
    "Etherblade": "Cidade das Espadas",
    "Midlands": "Planícies",
    "Mainlands": "Planícies",
    "Firecrag Grotto": "Caverna de Fogo",
    "Inn of the Eagle": "Estalagem da Águia",
    "Tradewind Village": "Vila do Vento",
    "Unicorn Village": "Vila do Unicórnio",
    "Sumor Camp": "Campo de Su Muer",
    "Rook's Valley": "Vale do Rook",
    "Timberfield": "Galpão dos Lenhadores",
    "Village of Brutes": "Vila dos Brutos",
    "City of the Plume": "Cidade das Plumas",
    "Avalanche Village": "Vila da Avalanche",
    "Town of Arrivals": "Cidade das Chegadas",
    "City of the Lost": "Cidade dos Perdidos",
    "Tellus City": "Cidade Tellus",
    "Spire of Awakening": "Pináculo do Despertar",
    "Twilight Temple": "Templo do Crepúsculo",
    "Hidden Heroes Village": "Vila dos Heróis Ocultos",
    "Silver Pool": "Poço Prateado",
    "Camp of the Fallen Phoenix": "Acampamento da Fênix Caída",
    "Peach Blossom Grove": "Bosque das Flores de Pêssego",
    "Hidden Orchid": "Orquídea Oculta",
    "Village of Naught": "Vila do Nada",
    "Hunter Cabin": "Cabana do Caçador",
    "Originia River": "Rio Originia",
}

NPC = {
    "Library Chief Cheng": "Bibliotecário Cheng Zigeng",
    "Librarian Yua": "Bibliotecário Yua",
    "Forgotten Elder": "Ancião Recluso",
    "Old General Chung": "Velho General Chung",
    "Apothecary Hui": "Boticário Hitzerin Reut",
    "Mysterious Wiseman": "Sábio Misterioso",
    "Shepherd Boy": "Garoto Pastor",
    "Strange Soldier": "Soldado Estranho",
    "Villager Ergo": "Aldeão Ergo",
    "Villager Panhai": "Aldeão Panhai",
    "Guard Latu": "Guarda La Tu",
    "Elder of Etherblade": "Ancião da Cidade das Espadas",
}

PHRASE = [
    (re.compile(r"\bTalk to\b", re.I), "Fale com"),
    (re.compile(r"\bDig\b", re.I), "Cave"),
    (re.compile(r"\bKill\b", re.I), "Mate"),
    (re.compile(r"\bTravel to\b", re.I), "Vá até"),
    (re.compile(r"\bWatch or skip the cutscene\b", re.I), "Assista ou pule a cutscene"),
    (re.compile(r"\bWatch the cutscene\b", re.I), "Assista a cutscene"),
    (re.compile(r"\bWait (\d+) seconds?\b", re.I), r"Espere \1 segundos"),
    (re.compile(r"\bConfirm the prompt\b", re.I), "Confirme o pop-up"),
    (re.compile(r"\bA pop-up will appear on-screen\b", re.I), "Um pop-up aparece na tela"),
    (re.compile(r"\bThe player will be transported to\b", re.I), "Você é teleportado para"),
    (re.compile(r"\bThis quest automatically completes upon picking it up\b", re.I), "Conclui ao aceitar"),
    (re.compile(r"\bThis quest will appear automatically\b", re.I), "Missão automática"),
    (re.compile(r"\bon the ground\b", re.I), "a pé"),
    (re.compile(r"\bto obtain\b", re.I), "para obter"),
    (re.compile(r"\bQuest Dispatcher:\s*", re.I), "NPC: "),
    (re.compile(r"\bRewards:\s*", re.I), "Recompensas: "),
    (re.compile(r"\bExperience\b", re.I), "Exp"),
    (re.compile(r"\bSpirit\b", re.I), "Vital"),
]

COORD_RE = re.compile(
    r"\((\d+)\s*[,,]?\s*(\d+)(?:\s*[↑^]\s*(\d+)|\s*/\s*(\d+))?\)"
)


def C(x: int, y: int, z: int | None = None) -> dict:
    return {"x": x, "y": y, "altitude": z}


def slugify(text: str, max_len: int = 48) -> str:
    s = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in text.lower())
    while "--" in s:
        s = s.replace("--", "-")
    return s.strip("-")[:max_len] or "step"


def translate_places(text: str) -> str:
    for en, pt in sorted({**NPC, **LOC}.items(), key=lambda kv: -len(kv[0])):
        text = re.sub(re.escape(en), pt, text, flags=re.I)
    return text


def translate_phrases(text: str) -> str:
    for rx, repl in PHRASE:
        text = rx.sub(repl, text)
    return text


def extract_coords(text: str) -> list[dict]:
    out: list[dict] = []
    seen: set[tuple] = set()
    for m in COORD_RE.finditer(text):
        x, y = int(m.group(1)), int(m.group(2))
        z = m.group(3) or m.group(4)
        key = (x, y, int(z) if z else None)
        if key in seen:
            continue
        seen.add(key)
        out.append(C(x, y, int(z) if z else None))
    return out


def extract_npc(block: str) -> str | None:
    m = re.search(r"Quest Dispatcher:\s*([^,\n(]+)", block, re.I)
    if m:
        return translate_places(m.group(1).strip())
    m = re.search(r"Talk to\s+([A-Z][^(\n,]{2,40})", block)
    if m:
        return translate_places(m.group(1).strip())
    return None


def compress_instruction(block: str) -> str:
    lines = []
    for raw in block.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if re.match(r"^\d+(\.\d+)*\s+\S+ Saga Rewards$", line):
            continue
        lines.append(line)
    text = "\n".join(lines).strip()
    text = translate_places(text)
    text = translate_phrases(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    if len(text) > 900:
        text = text[:897].rstrip() + "…"
    return text


def chapter_label(title: str) -> str | None:
    t = title.strip()
    if t.lower().startswith("activation"):
        return "Ativação"
    m = re.match(r"Chapter\s+(Four|4|Three|3|Two|2|One|1)\b", t, re.I)
    if not m:
        return None
    num = {
        "one": "1",
        "1": "1",
        "two": "2",
        "2": "2",
        "three": "3",
        "3": "3",
        "four": "4",
        "4": "4",
    }[m.group(1).lower()]
    return f"Capítulo {num}"


def parse_wiki(text: str) -> dict[str, dict]:
    start = text.find("### Blademaster General Chung")
    if start < 0:
        raise SystemExit("Hero section not found in PWpedia dump")
    text = text[start:]
    hero_pat = re.compile(r"^### (.+)$", re.M)
    heroes = list(hero_pat.finditer(text))
    result: dict[str, dict] = {}
    for i, hm in enumerate(heroes):
        name = hm.group(1).strip()
        end = heroes[i + 1].start() if i + 1 < len(heroes) else len(text)
        body = text[hm.end() : end]
        first_h4 = re.search(r"^#### ", body, re.M)
        intro = body[: first_h4.start()].strip() if first_h4 else body.strip()
        chapters: list[dict] = []
        h4s = list(re.finditer(r"^#### (.+)$", body, re.M))
        for j, cm in enumerate(h4s):
            ctitle = cm.group(1).strip()
            cend = h4s[j + 1].start() if j + 1 < len(h4s) else len(body)
            cbody = body[cm.end() : cend]
            blocks: list[dict] = []
            h5s = list(re.finditer(r"^##### (.+)$", cbody, re.M))
            if not h5s:
                blocks.append({"title": ctitle, "body": cbody.strip()})
            else:
                lead = cbody[: h5s[0].start()].strip()
                if lead:
                    blocks.append({"title": ctitle, "body": lead})
                for k, qm in enumerate(h5s):
                    qtitle = qm.group(1).strip()
                    qend = h5s[k + 1].start() if k + 1 < len(h5s) else len(cbody)
                    blocks.append({"title": qtitle, "body": cbody[qm.end() : qend].strip()})
            chapters.append({"title": ctitle, "blocks": blocks})
        result[name] = {"intro": intro, "chapters": chapters}
    return result


def scrub_trivia(text: str) -> str:
    """Remove menções públicas a Trivia (não publicar a marca)."""
    text = re.sub(
        r"\s*Nota\s*\(Trivia(?:\s*PW)?\)\s*:\s*",
        "\nNota: ",
        text,
        flags=re.I,
    )
    text = re.sub(r"\bTrivia(?:\s*PW)?\b\s*[:\-–—]?\s*", "", text, flags=re.I)
    text = re.sub(r"\s*/\s*Trivia\b", "", text, flags=re.I)
    text = re.sub(r"\(\s*Trivia[^)]*\)", "", text, flags=re.I)
    text = re.sub(r"https?://\S*triviapw\.com\.br\S*", "", text, flags=re.I)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip(" \n\t-·")


def clean_br_instruction(text: str) -> str:
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    text = scrub_trivia(text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if len(text) > 900:
        text = text[:897].rstrip() + "…"
    return text


def clean_br_title(title: str) -> str:
    title = scrub_trivia(title)
    title = re.sub(r"\s{2,}", " ", title).strip(" -–—")
    # "Sonho Sobre o Passado ( \"O Pássaro Solitário\")" → keep alt name cleanly
    title = re.sub(r"\(\s*[\"“]([^\"”]+)[\"”]\s*\)", r"(\1)", title)
    return title.strip()


def load_meta_cards() -> dict[str, dict]:
    if not META_CARDS_PATH.exists():
        return {}
    rows = json.loads(META_CARDS_PATH.read_text(encoding="utf-8"))
    by_class: dict[str, dict] = {}
    for row in rows:
        key = (row.get("class_pt") or "").strip().lower()
        if key:
            by_class[key] = row
    return by_class


def attach_hero_card(quest: dict, meta: dict, cards: dict[str, dict]) -> dict:
    card = cards.get((meta.get("class_pt") or "").strip().lower())
    hero_name = meta["hero"]
    eyebrow = "Herói lendário"
    blurb = quest.get("summary_pt_br") or quest.get("excerpt_pt_br")
    art = None
    icon = None
    if card:
        hero_name = (card.get("hero") or hero_name).replace("&#039;", "'")
        eyebrow = card.get("eyebrow") or eyebrow
        if card.get("blurb"):
            blurb = card["blurb"]
        if card.get("art"):
            art = f"{ART_BASE}/{card['art']}"
        if card.get("icon"):
            icon = f"{ART_BASE}/{card['icon']}"
        rewards = card.get("rewards") or []
        if rewards and not quest.get("rewards_pt_br"):
            quest["rewards_pt_br"] = "; ".join(rewards)
    quest["hero_name_pt_br"] = hero_name
    quest["hero_class_pt_br"] = meta["class_pt"]
    quest["hero_eyebrow_pt_br"] = eyebrow
    quest["cover_image"] = art
    quest["hero_icon"] = icon
    if blurb:
        quest["excerpt_pt_br"] = blurb if len(blurb) <= 160 else blurb[:157].rstrip() + "…"
        quest["summary_pt_br"] = blurb
    return quest


def build_from_br(meta: dict, order: int) -> dict:
    path = BR_DIR / meta["br_md"]
    raw_steps = parse_quest_guide_md(path, max_steps=100)
    # Drop pure "Recompensas" trailing section into rewards text
    steps = []
    reward_bits = []
    for s in raw_steps:
        title = clean_br_title(s["title_pt_br"])
        if title.lower().startswith("recompensa"):
            reward_bits.append(clean_br_instruction(s["instruction_pt_br"]))
            continue
        instruction = clean_br_instruction(s["instruction_pt_br"])
        steps.append(
            {
                **s,
                "id": f"step-{len(steps)+1:02d}-{slugify(title)}",
                "order": len(steps) + 1,
                "title_pt_br": title,
                "instruction_pt_br": instruction,
                "image_url": None,
                "image_alt": None,
                "notes": None,
            }
        )

    header = path.read_text(encoding="utf-8", errors="ignore").split("###", 1)[0]
    summary = None
    for line in header.splitlines():
        if line.lower().startswith("expansão:") or line.lower().startswith("pré-requisito"):
            continue
        if line.startswith("Fonte") or line.startswith("#") or line.startswith("- http"):
            continue
        if line.strip():
            summary = line.strip()
            break
    if not summary:
        summary = (
            f"Saga do Herói da classe {meta['class_pt']} ({meta['hero']}), "
            f"com coordenadas e nomes do cliente BR."
        )

    rewards = (
        f"Título «{meta['title_reward']}» (+100 HP); {meta['pet_reward']} (Códice). "
        "Resgate no baú do retrato na interface Saga do Herói."
    )
    if reward_bits:
        rewards = scrub_trivia(" ".join(reward_bits))[:400]

    # Never publish Trivia/Meta URLs.
    source_url = None
    for line in header.splitlines():
        low = line.lower()
        if "triviapw.com.br" in low or "metapw.com.br" in low:
            continue
        if "wikipw.com.br" in low:
            m = re.search(r"https?://\S+", line)
            if m:
                source_url = m.group(0).rstrip(").,]")
                break

    excerpt = f"Saga BR da {meta['class_pt']} {meta['hero']}: {len(steps)} etapas."
    return {
        "id": f"quest-mundo-normal-{meta['slug']}",
        "slug": meta["slug"],
        "map_slug": "mundo-normal",
        "kind": "journey",
        "order": order,
        "name_pt_br": meta["name"],
        "aliases": meta["aliases"],
        "excerpt_pt_br": excerpt[:160],
        "summary_pt_br": summary[:500],
        "prerequisite_pt_br": (
            "Nv. 80+ e cultivo Mahayana. Abrir Missões → Saga do Herói e selecionar a classe. "
            "Exp/Vital escalam até Nv. 100."
        ),
        "rewards_pt_br": rewards,
        "published_at": "2026-11-25",
        "coverage_status": "partial",
        "review_status": "foreign_reference",
        "origin": "community_observed",
        "source_url": source_url,
        "notice": NOTICE_BR,
        "steps": steps,
    }


def build_from_pwpedia(meta: dict, parsed: dict, order: int) -> dict:
    data = parsed[meta["en"]]
    steps: list[dict] = []
    step_order = 0
    for chapter in data["chapters"]:
        clabel = chapter_label(chapter["title"]) or translate_places(chapter["title"])
        if re.search(r"Saga Rewards", chapter["title"], re.I):
            reward_text = compress_instruction(
                "\n".join(b["body"] for b in chapter["blocks"])
            )
            if steps:
                prev = steps[-1]
                note = prev.get("notes") or ""
                prev["notes"] = (
                    (note + "\n" if note else "")
                    + f"Recompensa da saga (baú no retrato): {reward_text}"
                )[:500]
            continue
        for block in chapter["blocks"]:
            title = block["title"]
            body = block["body"]
            if title == chapter["title"] and clabel == "Ativação":
                act = re.sub(r"^Activation:\s*", "", title, flags=re.I).strip()
                step_title = f"Ativação — {act}"
            elif title == chapter["title"]:
                step_title = clabel
            elif clabel.startswith("Capítulo"):
                step_title = f"{clabel} · {title}"
            else:
                step_title = title
            instruction = compress_instruction(body)
            if not instruction:
                continue
            step_order += 1
            steps.append(
                {
                    "id": f"step-{step_order:02d}-{slugify(step_title)}",
                    "order": step_order,
                    "title_pt_br": step_title[:120],
                    "instruction_pt_br": instruction,
                    "npc": extract_npc(body),
                    "coords": extract_coords(body),
                    "dialog_hint": None,
                    "notes": "Fallback PWpedia EN — aguardando guia BR indexado.",
                    "image_url": None,
                    "image_alt": None,
                }
            )

    intro = compress_instruction(data["intro"]) or (
        f"Saga do Herói da classe {meta['class_pt']} ({meta['hero']})."
    )
    return {
        "id": f"quest-mundo-normal-{meta['slug']}",
        "slug": meta["slug"],
        "map_slug": "mundo-normal",
        "kind": "journey",
        "order": order,
        "name_pt_br": meta["name"],
        "aliases": meta["aliases"],
        "excerpt_pt_br": (
            f"Saga {meta['class_pt']} {meta['hero']} (PWpedia EN, {len(steps)} etapas). "
            "Sem guia BR completo indexado ainda."
        )[:160],
        "summary_pt_br": intro[:500],
        "prerequisite_pt_br": (
            "Nv. 80+ e cultivo Mahayana (Consciência do Vazio). "
            "Abrir Missões → Saga do Herói."
        ),
        "rewards_pt_br": (
            f"Título «{meta['title_reward']}» (+100 HP); {meta['pet_reward']} (Códice). "
            "Baú do retrato na interface."
        ),
        "published_at": "2026-11-25",
        "coverage_status": "partial",
        "review_status": "foreign_reference",
        "origin": "community_observed",
        "source_url": SOURCE_URL,
        "notice": NOTICE_EN,
        "steps": steps,
    }


def overview_quest() -> dict:
    lines = []
    for h in HEROES:
        label = f"{h['class_pt']} — {h['hero']}"
        lines.append(f"[[guia:mundo-normal/{h['slug']}|{label}]]")
    return {
        "id": "quest-mundo-normal-saga-do-heroi",
        "slug": "saga-do-heroi",
        "map_slug": "mundo-normal",
        "kind": "journey",
        "order": 0,
        "name_pt_br": "Saga do Herói — Como funciona",
        "aliases": [
            "Perfect World Hero Saga",
            "Hero Saga",
            "Saga dos Heróis",
            "Saga do Herói I",
            "Saga do Herói II",
        ],
        "excerpt_pt_br": "Visão geral das Sagas do Herói: ativação, requisitos, recompensas e índice por classe.",
        "summary_pt_br": (
            "A Saga do Herói conta a origem de um herói por classe. "
            "Nv. 80 + cultivo Mahayana. Menu Missões → Saga do Herói. "
            "Ao concluir: título (+100 HP) e mascote ornamental no baú do retrato."
        ),
        "prerequisite_pt_br": "Nv. 80+ e cultivo Mahayana.",
        "rewards_pt_br": "Por saga: título (+100 HP) e ovo de mascote (Códice), uma vez.",
        "published_at": "2026-11-25",
        "coverage_status": "partial",
        "review_status": "foreign_reference",
        "origin": "community_observed",
        "source_url": None,
        "notice": NOTICE_BR,
        "steps": [
            {
                "id": "step-01-ativar",
                "order": 1,
                "title_pt_br": "Abrir a interface",
                "instruction_pt_br": (
                    "No menu de missões (canto inferior direito), escolha Saga do Herói. "
                    "Na primeira vez aparece um poema; depois, retratos por raça com setas laterais."
                ),
                "npc": None,
                "coords": [],
                "dialog_hint": None,
                "notes": None,
                "image_url": None,
                "image_alt": None,
            },
            {
                "id": "step-02-requisitos",
                "order": 2,
                "title_pt_br": "Requisitos",
                "instruction_pt_br": (
                    "Nv. 80+ e cultivo Mahayana. Algumas sagas pedem Nv. 80 ativo. "
                    "Para eficiência de exp, espere Nv. 100."
                ),
                "npc": None,
                "coords": [],
                "dialog_hint": None,
                "notes": None,
                "image_url": None,
                "image_alt": None,
            },
            {
                "id": "step-03-recompensas",
                "order": 3,
                "title_pt_br": "Recompensas",
                "instruction_pt_br": (
                    "Com a saga concluída, abra o retrato do herói e clique no baú brilhante "
                    "para título (+100 HP) e ovo de mascote (Códice). Só uma vez por saga."
                ),
                "npc": None,
                "coords": [],
                "dialog_hint": None,
                "notes": None,
                "image_url": None,
                "image_alt": None,
            },
            {
                "id": "step-04-indice",
                "order": 4,
                "title_pt_br": "Índice das sagas",
                "instruction_pt_br": "\n".join(lines),
                "npc": None,
                "coords": [],
                "dialog_hint": None,
                "notes": None,
                "image_url": None,
                "image_alt": None,
            },
        ],
    }


def main() -> None:
    parsed = parse_wiki(PWPEDIA.read_text(encoding="utf-8"))
    cards = load_meta_cards()
    quests = [overview_quest()]
    for i, h in enumerate(HEROES, start=1):
        br_path = BR_DIR / h["br_md"] if h.get("br_md") else None
        if br_path and br_path.exists():
            q = build_from_br(h, i)
            src = "BR"
        elif h.get("en") and h["en"] in parsed:
            q = build_from_pwpedia(h, parsed, i)
            src = "EN"
        else:
            raise SystemExit(f"No BR md and no PWpedia for {h['slug']}")
        quests.append(attach_hero_card(q, h, cards))
        print(f"  {i:2d}. [{src}] {h['slug']:40s} {len(quests[-1]['steps']):3d} steps")

    catalog = {
        "schema_version": 1,
        "id": "quest-catalog-mundo-normal",
        "map_slug": "mundo-normal",
        "name_pt_br": "Mundo Normal — Saga do Herói",
        "generated_at": "2026-11-25",
        "synthetic": False,
        "origin": "community_observed",
        "review_status": "foreign_reference",
        "notice": NOTICE_BR,
        "sources": [
            "data/fixtures/sources/quest-guides/br-saga/",
            "https://wikipw.com.br/",
            SOURCE_URL,
            "data/fixtures/sources/quest-guides/perfect-world-hero-saga.pwpedia.txt",
            "cliente BR tasks.data (validação Ceifador 52481–52548)",
        ],
        "quests": quests,
    }
    OUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(len(q["steps"]) for q in quests)
    br_n = sum(1 for q in quests[1:] if q.get("notice") == NOTICE_BR)
    print(f"Wrote {OUT.relative_to(ROOT)} — {len(quests)} entries, {total} steps ({br_n} BR)")


if __name__ == "__main__":
    main()
