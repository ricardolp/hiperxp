#!/usr/bin/env python3
"""Build slim public Database catalogs from client extractions.

Reads:
  - items.all.json (+ optional descriptions from cotacao / fixtures items)
  - quests.all.json (rich extract)
  - recipes.all.json (RECIPE_ESSENCE from elements.data)
  - npcs.all.json / shops.all.json (NPC_ESSENCE + sell list 40)

Writes under data/fixtures/database and apps/web/public/database:
  - items.json, quests.json, descriptions.json
  - quest-details.json (id -> description/rewards/premise/series)
  - recipes.json (id -> materials/targets)
  - npcs.json (hello/capabilities + shop_item_ids)
  - shops.json (sell services)
  - item-links.json (item -> quest + craft links)
  - manifest.json
"""
from __future__ import annotations

import argparse
import json
import shutil
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Recipe / type sheets are not inventory items.
SKIP_ITEM_LISTS = {66, 67, 68}

LIST_LABELS: dict[int, str] = {
    3: "Armas",
    6: "Armaduras",
    9: "Ornamentos",
    12: "Poções / comida",
    15: "Materiais",
    21: "Livros de habilidade",
    22: "Montarias / voadores",
    28: "Missão / história",
    58: "Materiais",
    62: "Consumíveis",
    73: "Amuletos / pergaminhos",
    74: "Materiais diversos",
    82: "Fashion / peças",
    93: "Joias",
    94: "Acessórios",
}

PUBLIC_FILES = (
    "items.json",
    "quests.json",
    "descriptions.json",
    "quest-details.json",
    "recipes.json",
    "npcs.json",
    "shops.json",
    "item-links.json",
    "manifest.json",
)

NPC_CAPABILITY_LABELS: dict[str, str] = {
    "make": "Fabricar",
    "engrave": "Gravura",
    "engrave_advanced": "Gravura avançada",
    "sell": "Loja",
    "buy": "Compra do jogador",
    "repair": "Consertar",
    "install": "Instalar pedra",
    "uninstall": "Remover pedra",
    "storage": "Armazém",
    "teleport": "Teleporte",
    "teach": "Ensinar habilidade",
    "heal": "Curar",
    "decompose": "Desmontar",
    "task_in": "Receber missões",
    "task_out": "Entregar missões",
}


def load_json(path: Path) -> dict | list:
    return json.loads(path.read_text(encoding="utf-8"))


def merge_descriptions(
    cotacao_path: Path | None,
    fixture_items_path: Path | None,
) -> dict[int, str]:
    out: dict[int, str] = {}
    if cotacao_path and cotacao_path.is_file():
        raw = load_json(cotacao_path)
        if isinstance(raw, dict):
            items = raw.get("items") or raw.get("descriptions") or raw
            if isinstance(items, dict):
                for k, v in items.items():
                    if isinstance(v, str) and v.strip():
                        out[int(k)] = v.strip()
                    elif isinstance(v, dict):
                        text = (
                            v.get("description_pt_br")
                            or v.get("description")
                            or ""
                        ).strip()
                        if text:
                            out[int(k)] = text
            elif isinstance(items, list):
                for row in items:
                    if not isinstance(row, dict):
                        continue
                    iid = row.get("id") or row.get("item_id")
                    text = (
                        row.get("description_pt_br")
                        or row.get("description")
                        or row.get("text")
                        or ""
                    ).strip()
                    if iid is not None and text:
                        out[int(str(iid).removeprefix("pw-"))] = text
        elif isinstance(raw, list):
            for row in raw:
                if not isinstance(row, dict):
                    continue
                iid = row.get("id")
                text = (row.get("description_pt_br") or row.get("text") or "").strip()
                if iid is not None and text:
                    out[int(str(iid).removeprefix("pw-"))] = text

    if fixture_items_path and fixture_items_path.is_file():
        rows = load_json(fixture_items_path)
        if isinstance(rows, list):
            for row in rows:
                if not isinstance(row, dict):
                    continue
                iid = row.get("id")
                text = (row.get("description_pt_br") or "").strip()
                if not iid or not text:
                    continue
                num = int(str(iid).removeprefix("pw-"))
                out.setdefault(num, text)
    return out


def build_items(
    items_all: Path,
    descriptions: dict[int, str],
    linked_ids: set[int],
    craft_ids: set[int],
) -> list[dict]:
    payload = load_json(items_all)
    rows = payload["items"] if isinstance(payload, dict) else payload
    catalog: list[dict] = []
    for row in rows:
        name = (row.get("name_pt_br") or "").strip()
        if not name:
            continue
        list_id = int(row.get("list") or 0)
        if list_id in SKIP_ITEM_LISTS:
            continue
        iid = int(row["id"])
        entry = {
            "id": iid,
            "list": list_id,
            "name_pt_br": name,
        }
        if iid in descriptions:
            entry["has_description"] = True
        if iid in linked_ids:
            entry["has_quest_links"] = True
        if iid in craft_ids:
            entry["has_recipes"] = True
        catalog.append(entry)
    catalog.sort(key=lambda x: x["id"])
    return catalog


def build_recipes(recipes_all: Path) -> tuple[dict[str, dict], dict[int, list], dict[int, list]]:
    payload = load_json(recipes_all)
    rows = payload["recipes"] if isinstance(payload, dict) else payload
    by_id: dict[str, dict] = {}
    crafted_by: dict[int, list] = defaultdict(list)
    material_in: dict[int, list] = defaultdict(list)

    for row in rows:
        if not isinstance(row, dict):
            continue
        rid = int(row["id"])
        name = (row.get("name_pt_br") or "").strip()
        if not name:
            continue
        targets = row.get("targets") or []
        materials = row.get("materials") or []
        slim = {
            "id": rid,
            "name_pt_br": name,
            "level": int(row.get("level") or 0),
            "targets": [
                {
                    "id": int(t["id"]),
                    "probability": float(t.get("probability") or 0),
                }
                for t in targets
                if t.get("id")
            ],
            "materials": [
                {
                    "id": int(m["id"]),
                    "quantity": int(m.get("quantity") or 1),
                }
                for m in materials
                if m.get("id")
            ],
        }
        if row.get("major_name_pt_br"):
            slim["major_name_pt_br"] = row["major_name_pt_br"]
        if row.get("sub_name_pt_br"):
            slim["sub_name_pt_br"] = row["sub_name_pt_br"]
        npcs = row.get("npcs") or []
        if npcs:
            slim["npcs"] = [
                {
                    "id": int(n["id"]),
                    "name_pt_br": n.get("name_pt_br") or f"NPC #{n['id']}",
                    "service_name_pt_br": n.get("service_name_pt_br"),
                }
                for n in npcs
                if n.get("id")
            ]
        by_id[str(rid)] = slim

        for t in slim["targets"]:
            crafted_by[t["id"]].append(
                {
                    "recipe_id": rid,
                    "probability": t["probability"],
                }
            )
        for m in slim["materials"]:
            material_in[m["id"]].append(
                {
                    "recipe_id": rid,
                    "quantity": m["quantity"],
                }
            )

    return by_id, crafted_by, material_in


def build_quest_catalog(quests_all: Path) -> tuple[list[dict], dict[str, dict], dict]:
    payload = load_json(quests_all)
    rows = payload["quests"] if isinstance(payload, dict) else payload
    catalog: list[dict] = []
    details: dict[str, dict] = {}
    rewarded_by: dict[int, list[dict]] = defaultdict(list)
    required_by: dict[int, list[dict]] = defaultdict(list)

    for row in rows:
        name = (row.get("name_pt_br") or "").strip()
        if not name:
            continue
        qid = int(row["id"])
        desc = (row.get("description_pt_br") or "").strip() or None
        rewards = row.get("reward_items") or []
        premises = row.get("premise_items") or []
        series = row.get("series")
        entry = {"id": qid, "name_pt_br": name}
        if desc:
            entry["has_description"] = True
        if rewards:
            entry["has_rewards"] = True
        if premises:
            entry["has_premises"] = True
        if series:
            entry["has_series"] = True
        catalog.append(entry)

        if desc or rewards or premises or series:
            detail: dict = {}
            if desc:
                detail["description_pt_br"] = desc
            if rewards:
                detail["reward_items"] = rewards
            if premises:
                detail["premise_items"] = premises
            if series:
                detail["series"] = series
            details[str(qid)] = detail

        for item in rewards:
            rewarded_by[int(item["id"])].append(
                {
                    "quest_id": qid,
                    "quantity": int(item.get("quantity") or 1),
                    "probability": float(item.get("probability") or 0),
                }
            )
        for item in premises:
            required_by[int(item["id"])].append(
                {
                    "quest_id": qid,
                    "quantity": int(item.get("quantity") or 1),
                }
            )

    catalog.sort(key=lambda x: x["id"])
    links = {
        str(iid): {
            "rewarded_by": rewarded_by.get(iid, []),
            "required_by": required_by.get(iid, []),
        }
        for iid in sorted(set(rewarded_by) | set(required_by))
    }
    return catalog, details, links


def merge_item_links(
    quest_links: dict,
    crafted_by: dict[int, list],
    material_in: dict[int, list],
) -> dict:
    ids = (
        {int(k) for k in quest_links}
        | set(crafted_by)
        | set(material_in)
    )
    out: dict[str, dict] = {}
    for iid in sorted(ids):
        key = str(iid)
        base = quest_links.get(key, {})
        entry = {
            "rewarded_by": base.get("rewarded_by", []),
            "required_by": base.get("required_by", []),
            "crafted_by": crafted_by.get(iid, []),
            "material_in": material_in.get(iid, []),
        }
        if any(entry.values()):
            out[key] = entry
    return out


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )


def build_shop_index(shops_all: Path) -> tuple[dict[str, dict], dict[int, dict]]:
    """Return (shops_by_id slim, npc_id -> shop summary)."""
    shops_by_id: dict[str, dict] = {}
    npc_shop: dict[int, dict] = {}
    if not shops_all.is_file():
        return shops_by_id, npc_shop

    payload = load_json(shops_all)
    rows = payload.get("shops") if isinstance(payload, dict) else payload
    for row in rows or []:
        sid = int(row["id"])
        item_ids = [int(x) for x in (row.get("item_ids") or []) if int(x) > 0]
        pages_out: list[dict] = []
        for page in row.get("pages") or []:
            goods = page.get("goods") or []
            page_ids = [int(g["id"]) for g in goods if g.get("id")]
            if not page_ids:
                continue
            pages_out.append(
                {
                    "index": int(page.get("index", len(pages_out))),
                    "item_ids": page_ids,
                }
            )
        prices_raw = row.get("shop_prices") or {}
        shop_prices = {
            str(int(k)): int(v)
            for k, v in prices_raw.items()
            if int(v) > 0
        }
        slim = {
            "id": sid,
            "name_pt_br": row.get("name_pt_br") or f"Loja #{sid}",
            "item_ids": item_ids,
            "item_count": len(item_ids),
            "pages": pages_out,
        }
        if shop_prices:
            slim["shop_prices"] = shop_prices
        npcs = row.get("npcs") or []
        if npcs:
            slim["npc_ids"] = [int(n["id"]) for n in npcs if n.get("id")]
        shops_by_id[str(sid)] = slim
        for npc in npcs:
            nid = int(npc["id"])
            # First shop wins if an NPC somehow has multiple sell ids.
            if nid in npc_shop:
                continue
            entry = {
                "shop_id": sid,
                "shop_name_pt_br": slim["name_pt_br"],
                "shop_item_ids": item_ids,
                "shop_pages": pages_out,
            }
            if shop_prices:
                entry["shop_prices"] = shop_prices
            npc_shop[nid] = entry
    return shops_by_id, npc_shop


def build_npcs(
    npcs_all: Path,
    recipes: dict[str, dict],
    npc_shop: dict[int, dict] | None = None,
) -> dict[str, dict]:
    """Slim NPCs that appear on recipes/shops, enriched with essence hello/capabilities."""
    keep_ids: set[int] = set()
    for recipe in recipes.values():
        for npc in recipe.get("npcs") or []:
            if npc.get("id"):
                keep_ids.add(int(npc["id"]))
    if npc_shop:
        keep_ids.update(npc_shop.keys())

    by_id: dict[str, dict] = {}
    if npcs_all.is_file():
        payload = load_json(npcs_all)
        rows = payload.get("npcs") if isinstance(payload, dict) else payload
        for row in rows or []:
            nid = int(row["id"])
            if keep_ids and nid not in keep_ids:
                continue
            services = row.get("services") or {}
            capabilities = {key: True for key in services}
            labels: list[str] = []
            seen_labels: set[str] = set()
            for key in NPC_CAPABILITY_LABELS:
                if key not in services:
                    continue
                label = NPC_CAPABILITY_LABELS[key]
                if label not in seen_labels:
                    seen_labels.add(label)
                    labels.append(label)
            # Keep distinctive craft shop name (ex.: Negociação).
            make_meta = services.get("make")
            if isinstance(make_meta, dict):
                name = (make_meta.get("name_pt_br") or "").strip()
                if (
                    name
                    and name not in seen_labels
                    and name.lower() != (row.get("name_pt_br") or "").strip().lower()
                ):
                    seen_labels.add(name)
                    labels.append(name)
            slim: dict = {
                "id": nid,
                "name_pt_br": row.get("name_pt_br") or f"NPC #{nid}",
            }
            hello = (row.get("hello_pt_br") or "").strip()
            if hello:
                slim["hello_pt_br"] = hello
            if capabilities:
                slim["capabilities"] = capabilities
            if labels:
                slim["service_labels"] = labels
            locations = row.get("locations") or []
            if locations:
                slim["locations"] = locations
            shop = (npc_shop or {}).get(nid)
            if shop and shop.get("shop_item_ids"):
                slim["shop_item_ids"] = shop["shop_item_ids"]
                slim["shop_name_pt_br"] = shop.get("shop_name_pt_br")
                if shop.get("shop_pages"):
                    slim["shop_pages"] = shop["shop_pages"]
                if shop.get("shop_prices"):
                    slim["shop_prices"] = shop["shop_prices"]
                caps = slim.setdefault("capabilities", {})
                caps["sell"] = True
            by_id[str(nid)] = slim

    # Ensure every recipe NPC has at least an id/name stub.
    for recipe in recipes.values():
        for npc in recipe.get("npcs") or []:
            nid = int(npc["id"])
            key = str(nid)
            if key in by_id:
                continue
            stub: dict = {
                "id": nid,
                "name_pt_br": npc.get("name_pt_br") or f"NPC #{nid}",
            }
            shop = (npc_shop or {}).get(nid)
            if shop and shop.get("shop_item_ids"):
                stub["shop_item_ids"] = shop["shop_item_ids"]
                stub["shop_name_pt_br"] = shop.get("shop_name_pt_br")
                if shop.get("shop_pages"):
                    stub["shop_pages"] = shop["shop_pages"]
                if shop.get("shop_prices"):
                    stub["shop_prices"] = shop["shop_prices"]
                stub["capabilities"] = {"sell": True}
            by_id[key] = stub

    # Shop-only NPCs not present in essence dump.
    for nid, shop in (npc_shop or {}).items():
        key = str(nid)
        if key in by_id:
            continue
        if not shop.get("shop_item_ids"):
            continue
        entry = {
            "id": nid,
            "name_pt_br": f"NPC #{nid}",
            "shop_item_ids": shop["shop_item_ids"],
            "shop_name_pt_br": shop.get("shop_name_pt_br"),
            "capabilities": {"sell": True},
            "service_labels": ["Loja"],
        }
        if shop.get("shop_pages"):
            entry["shop_pages"] = shop["shop_pages"]
        if shop.get("shop_prices"):
            entry["shop_prices"] = shop["shop_prices"]
        by_id[key] = entry

    return by_id


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--items-all",
        type=Path,
        default=ROOT
        / "data/fixtures/sources/client-br-levelup/items/items.all.json",
    )
    ap.add_argument(
        "--quests-all",
        type=Path,
        default=ROOT
        / "data/fixtures/sources/client-br-levelup/quests/quests.all.json",
    )
    ap.add_argument(
        "--recipes-all",
        type=Path,
        default=ROOT
        / "data/fixtures/sources/client-br-levelup/recipes/recipes.all.json",
    )
    ap.add_argument(
        "--npcs-all",
        type=Path,
        default=ROOT
        / "data/fixtures/sources/client-br-levelup/npcs/npcs.all.json",
    )
    ap.add_argument(
        "--shops-all",
        type=Path,
        default=ROOT
        / "data/fixtures/sources/client-br-levelup/shops/shops.all.json",
    )
    ap.add_argument(
        "--cotacao",
        type=Path,
        default=ROOT
        / "data/fixtures/sources/client-br-levelup/items/descriptions.cotacao.json",
    )
    ap.add_argument(
        "--fixture-items",
        type=Path,
        default=ROOT / "data/fixtures/items.json",
    )
    ap.add_argument(
        "--out-dir",
        type=Path,
        default=ROOT / "data/fixtures/database",
    )
    ap.add_argument(
        "--public-dir",
        type=Path,
        default=ROOT / "apps/web/public/database",
    )
    args = ap.parse_args()

    if not args.items_all.is_file():
        raise SystemExit(f"missing {args.items_all}")
    if not args.quests_all.is_file():
        raise SystemExit(
            f"missing {args.quests_all} — run tools/extract-client-tasks.py first"
        )
    if not args.recipes_all.is_file():
        raise SystemExit(
            f"missing {args.recipes_all} — run tools/extract-client-recipes.py first"
        )

    descriptions = merge_descriptions(args.cotacao, args.fixture_items)
    quests, quest_details, quest_item_links = build_quest_catalog(args.quests_all)
    recipes, crafted_by, material_in = build_recipes(args.recipes_all)
    shops, npc_shop = build_shop_index(args.shops_all)
    npcs = build_npcs(args.npcs_all, recipes, npc_shop)
    item_links = merge_item_links(quest_item_links, crafted_by, material_in)
    linked_ids = {int(k) for k in quest_item_links}
    craft_ids = set(crafted_by) | set(material_in)
    items = build_items(args.items_all, descriptions, linked_ids, craft_ids)
    now = datetime.now(timezone.utc).isoformat()

    with_desc = sum(1 for q in quests if q.get("has_description"))
    with_rewards = sum(1 for q in quests if q.get("has_rewards"))

    payloads = {
        "items.json": {
            "meta": {
                "kind": "database_items",
                "generated_at": now,
                "count": len(items),
                "origin": "client_extracted",
                "notice": (
                    "Catálogo slim do elements.data BR. Descrições longas ainda "
                    "parciais (fonte comunitária). Vínculos de missão e craft "
                    "vêm do tasks.data / RECIPE_ESSENCE."
                ),
            },
            "items": items,
        },
        "quests.json": {
            "meta": {
                "kind": "database_quests",
                "generated_at": now,
                "count": len(quests),
                "with_description": with_desc,
                "with_rewards": with_rewards,
                "origin": "client_extracted",
                "notice": (
                    "Índice do tasks.data. Detalhes (texto, recompensas, série) em "
                    "quest-details.json."
                ),
            },
            "quests": quests,
        },
        "descriptions.json": {
            "meta": {
                "kind": "database_item_descriptions",
                "generated_at": now,
                "count": len(descriptions),
                "origin": "community_observed",
            },
            "descriptions": {str(k): v for k, v in sorted(descriptions.items())},
        },
        "quest-details.json": {
            "meta": {
                "kind": "database_quest_details",
                "generated_at": now,
                "count": len(quest_details),
                "origin": "client_extracted",
            },
            "details": quest_details,
        },
        "recipes.json": {
            "meta": {
                "kind": "database_recipes",
                "generated_at": now,
                "count": len(recipes),
                "origin": "client_extracted",
                "notice": (
                    "RECIPE_ESSENCE (lista 68) do elements.data BR v0x25a — "
                    "layout clássico materials/targets."
                ),
            },
            "recipes": recipes,
        },
        "item-links.json": {
            "meta": {
                "kind": "database_item_links",
                "generated_at": now,
                "item_count": len(item_links),
                "origin": "client_extracted",
                "notice": (
                    "Missões: cadeias ITEM_WANTED 21-byte do tasks.data. "
                    "Craft: RECIPE_ESSENCE lista 68."
                ),
            },
            "links": item_links,
        },
        "npcs.json": {
            "meta": {
                "kind": "database_npcs",
                "generated_at": now,
                "count": len(npcs),
                "origin": "client_extracted",
                "notice": (
                    "NPC_ESSENCE lista 57 — hello + serviços. "
                    "shop_item_ids vêm da lista 40 (loja). "
                    "Coordenadas de mundo exigem npcgen (ausente no cliente BR)."
                ),
            },
            "npcs": npcs,
        },
        "shops.json": {
            "meta": {
                "kind": "database_shops",
                "generated_at": now,
                "count": len(shops),
                "origin": "client_extracted",
                "notice": (
                    "NPC sell service lista 40 — itens que o jogador COMPRA do NPC. "
                    "Lista 41 (NPC compra do jogador) não entra aqui."
                ),
            },
            "shops": shops,
        },
        "manifest.json": {
            "schema_version": 5,
            "generated_at": now,
            "origin": "client_extracted",
            "items_count": len(items),
            "quests_count": len(quests),
            "descriptions_count": len(descriptions),
            "quest_details_count": len(quest_details),
            "recipes_count": len(recipes),
            "npcs_count": len(npcs),
            "shops_count": len(shops),
            "linked_items_count": len(item_links),
            "files": {name: name for name in PUBLIC_FILES if name != "manifest.json"},
            "list_labels": LIST_LABELS,
            "notice": (
                "Database estilo PWDatabase — itens/missões/receitas/NPCs/lojas do cliente BR."
            ),
        },
    }

    for directory in (args.out_dir, args.public_dir):
        for name, data in payloads.items():
            write_json(directory / name, data)

    if args.out_dir.resolve() != args.public_dir.resolve():
        for name in PUBLIC_FILES:
            shutil.copy2(args.out_dir / name, args.public_dir / name)

    print(
        f"database catalog: {len(items)} items, {len(quests)} quests, "
        f"{len(recipes)} recipes, {len(npcs)} npcs, {len(shops)} shops, "
        f"{with_desc} quest texts, {len(item_links)} linked items, "
        f"{len(descriptions)} item descriptions → {args.public_dir}"
    )


if __name__ == "__main__":
    main()
