#!/usr/bin/env python3
"""Import data/fixtures/database/*.json into Postgres (hiperxp catalog).

Requires:
  DATABASE_URL  postgresql://user:pass@host:5432/hiperxp
  Optional:     DATABASE_SSLMODE=require

Usage:
  python tools/import-database-pg.py
  python tools/import-database-pg.py --fixtures data/fixtures/database
  python tools/import-database-pg.py --apply-schema
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FIXTURES = ROOT / "data" / "fixtures" / "database"
SCHEMA_PATH = ROOT / "infra" / "postgres" / "001_schema.sql"


def normalize_search(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    stripped = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return stripped.lower().strip()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def require_psycopg():
    try:
        import psycopg  # type: ignore
        from psycopg.types.json import Jsonb  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "psycopg is required. Install with: pip install 'psycopg[binary]'"
        ) from exc
    return psycopg, Jsonb


def build_npc_index(recipes: dict[str, dict], npc_base: dict[str, dict]) -> dict[int, dict]:
    """Merge NPC_ESSENCE rows with recipe.npcs craft index (same idea as web buildNpcIndex)."""
    acc: dict[int, dict] = {}

    for recipe in recipes.values():
        rid = int(recipe["id"])
        for npc in recipe.get("npcs") or []:
            nid = int(npc["id"])
            row = acc.get(nid)
            if row is None:
                row = {
                    "id": nid,
                    "name_pt_br": npc.get("name_pt_br") or f"NPC {nid}",
                    "services": defaultdict(set),
                    "recipe_ids": set(),
                }
                acc[nid] = row
            if npc.get("name_pt_br"):
                row["name_pt_br"] = npc["name_pt_br"]
            row["recipe_ids"].add(rid)
            service = (npc.get("service_name_pt_br") or "Fabricar").strip() or "Fabricar"
            row["services"][service].add(rid)

    out: dict[int, dict] = {}
    for nid, row in acc.items():
        base = npc_base.get(str(nid)) or npc_base.get(nid) or {}  # type: ignore[arg-type]
        services = [
            {"name_pt_br": name, "recipe_ids": sorted(ids)}
            for name, ids in sorted(row["services"].items(), key=lambda x: x[0].lower())
        ]
        recipe_ids = sorted(row["recipe_ids"])
        payload = {
            "id": nid,
            "name_pt_br": base.get("name_pt_br") or row["name_pt_br"],
            "services": services,
            "recipe_ids": recipe_ids,
            "recipe_count": len(recipe_ids),
        }
        if base.get("hello_pt_br"):
            payload["hello_pt_br"] = base["hello_pt_br"]
        if base.get("capabilities"):
            payload["capabilities"] = base["capabilities"]
        if base.get("service_labels"):
            payload["service_labels"] = base["service_labels"]
        if base.get("locations"):
            payload["locations"] = base["locations"]
        out[nid] = payload

    # Essence-only NPCs (no recipes yet)
    for key, base in npc_base.items():
        nid = int(base.get("id") or key)
        if nid in out:
            continue
        payload = {
            "id": nid,
            "name_pt_br": base.get("name_pt_br") or f"NPC {nid}",
            "services": [],
            "recipe_ids": [],
            "recipe_count": 0,
        }
        if base.get("hello_pt_br"):
            payload["hello_pt_br"] = base["hello_pt_br"]
        if base.get("capabilities"):
            payload["capabilities"] = base["capabilities"]
        if base.get("service_labels"):
            payload["service_labels"] = base["service_labels"]
        if base.get("locations"):
            payload["locations"] = base["locations"]
        out[nid] = payload

    return out


def connect(database_url: str):
    psycopg, _ = require_psycopg()
    kwargs = {"conninfo": database_url}
    sslmode = os.environ.get("DATABASE_SSLMODE")
    if sslmode:
        # Append if not already present in URL.
        if "sslmode=" not in database_url:
            sep = "&" if "?" in database_url else "?"
            kwargs["conninfo"] = f"{database_url}{sep}sslmode={sslmode}"
    return psycopg.connect(kwargs["conninfo"])


def apply_schema(conn) -> None:
    sql = SCHEMA_PATH.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print(f"Applied schema from {SCHEMA_PATH}")


def import_catalog(conn, fixtures: Path) -> None:
    _, Jsonb = require_psycopg()

    manifest = load_json(fixtures / "manifest.json")
    items_file = load_json(fixtures / "items.json")
    quests_file = load_json(fixtures / "quests.json")
    desc_file = load_json(fixtures / "descriptions.json")
    details_file = load_json(fixtures / "quest-details.json")
    recipes_file = load_json(fixtures / "recipes.json")
    links_file = load_json(fixtures / "item-links.json")
    npcs_file = load_json(fixtures / "npcs.json") if (fixtures / "npcs.json").exists() else {"npcs": {}}

    items = items_file["items"]
    quests = quests_file["quests"]
    descriptions = desc_file.get("descriptions") or {}
    details = details_file.get("details") or {}
    recipes = recipes_file.get("recipes") or {}
    links = links_file.get("links") or {}
    npc_base = npcs_file.get("npcs") or {}
    if isinstance(npc_base, list):
        npc_base = {str(n["id"]): n for n in npc_base}

    npcs = build_npc_index(recipes, npc_base)

    print(
        f"Loaded fixtures: {len(items)} items, {len(quests)} quests, "
        f"{len(recipes)} recipes, {len(npcs)} npcs"
    )

    with conn.cursor() as cur:
        cur.execute("TRUNCATE descriptions, quest_details, item_links, recipes, npcs, items, quests RESTART IDENTITY")
        # Keep entity_views across reimports.

        item_rows = []
        for item in items:
            iid = int(item["id"])
            name = item.get("name_pt_br") or f"Item {iid}"
            item_rows.append(
                (
                    iid,
                    int(item.get("list") or 0),
                    name,
                    normalize_search(f"{name} {iid}"),
                    bool(item.get("has_description")),
                    bool(item.get("has_quest_links")),
                    bool(item.get("has_recipes")),
                    Jsonb({k: v for k, v in item.items() if k not in {"id", "list", "name_pt_br"}}),
                )
            )
        cur.executemany(
            """
            INSERT INTO items (
              id, list_id, name_pt_br, search_norm,
              has_description, has_quest_links, has_recipes, attrs
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            item_rows,
        )

        quest_rows = []
        for quest in quests:
            qid = int(quest["id"])
            name = quest.get("name_pt_br") or f"Missão {qid}"
            quest_rows.append(
                (
                    qid,
                    name,
                    normalize_search(f"{name} {qid}"),
                    bool(quest.get("has_description")),
                    bool(quest.get("has_rewards")),
                    bool(quest.get("has_premises")),
                    bool(quest.get("has_series")),
                    Jsonb({k: v for k, v in quest.items() if k not in {"id", "name_pt_br"}}),
                )
            )
        cur.executemany(
            """
            INSERT INTO quests (
              id, name_pt_br, search_norm,
              has_description, has_rewards, has_premises, has_series, attrs
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            quest_rows,
        )

        desc_rows = []
        item_ids = {int(i["id"]) for i in items}
        for key, body in descriptions.items():
            iid = int(key)
            if iid not in item_ids:
                continue
            text = str(body or "").strip()
            if text:
                desc_rows.append((iid, text))
        if desc_rows:
            cur.executemany(
                "INSERT INTO descriptions (item_id, body) VALUES (%s,%s)",
                desc_rows,
            )

        detail_rows = []
        quest_ids = {int(q["id"]) for q in quests}
        for key, payload in details.items():
            qid = int(key)
            if qid not in quest_ids:
                continue
            detail_rows.append((qid, Jsonb(payload)))
        if detail_rows:
            cur.executemany(
                "INSERT INTO quest_details (quest_id, payload) VALUES (%s,%s)",
                detail_rows,
            )

        recipe_rows = []
        for key, recipe in recipes.items():
            rid = int(recipe.get("id") or key)
            name = recipe.get("name_pt_br") or f"Receita {rid}"
            recipe_rows.append(
                (
                    rid,
                    name,
                    normalize_search(f"{name} {rid}"),
                    recipe.get("level"),
                    recipe.get("major_name_pt_br"),
                    recipe.get("sub_name_pt_br"),
                    Jsonb(recipe),
                )
            )
        if recipe_rows:
            cur.executemany(
                """
                INSERT INTO recipes (
                  id, name_pt_br, search_norm, level,
                  major_name_pt_br, sub_name_pt_br, payload
                ) VALUES (%s,%s,%s,%s,%s,%s,%s)
                """,
                recipe_rows,
            )

        link_rows = []
        for key, payload in links.items():
            iid = int(key)
            if iid not in item_ids:
                continue
            link_rows.append((iid, Jsonb(payload)))
        if link_rows:
            cur.executemany(
                "INSERT INTO item_links (item_id, payload) VALUES (%s,%s)",
                link_rows,
            )

        npc_rows = []
        for nid, payload in npcs.items():
            name = payload.get("name_pt_br") or f"NPC {nid}"
            npc_rows.append(
                (
                    int(nid),
                    name,
                    normalize_search(f"{name} {nid}"),
                    int(payload.get("recipe_count") or 0),
                    Jsonb(payload),
                )
            )
        if npc_rows:
            cur.executemany(
                """
                INSERT INTO npcs (id, name_pt_br, search_norm, recipe_count, payload)
                VALUES (%s,%s,%s,%s,%s)
                """,
                npc_rows,
            )

        catalog = {
            **manifest,
            "items_count": len(items),
            "quests_count": len(quests),
            "descriptions_count": len(desc_rows),
            "quest_details_count": len(detail_rows),
            "recipes_count": len(recipe_rows),
            "linked_items_count": len(link_rows),
            "npcs_count": len(npc_rows),
            "source": "postgres",
        }
        cur.execute(
            """
            INSERT INTO meta (key, value, updated_at)
            VALUES ('catalog', %s, now())
            ON CONFLICT (key) DO UPDATE
              SET value = EXCLUDED.value, updated_at = now()
            """,
            (Jsonb(catalog),),
        )

    conn.commit()
    print(
        f"Import OK: items={len(item_rows)} quests={len(quest_rows)} "
        f"recipes={len(recipe_rows)} npcs={len(npc_rows)} "
        f"details={len(detail_rows)} links={len(link_rows)} desc={len(desc_rows)}"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Import HiperXP database fixtures into Postgres")
    parser.add_argument(
        "--fixtures",
        type=Path,
        default=DEFAULT_FIXTURES,
        help="Path to data/fixtures/database",
    )
    parser.add_argument(
        "--apply-schema",
        action="store_true",
        help="Apply infra/postgres/001_schema.sql before import",
    )
    parser.add_argument(
        "--database-url",
        default=os.environ.get("DATABASE_URL", ""),
        help="Postgres URL (default: env DATABASE_URL)",
    )
    args = parser.parse_args()

    if not args.database_url:
        print("DATABASE_URL is required", file=sys.stderr)
        return 2
    if not args.fixtures.is_dir():
        print(f"Fixtures dir not found: {args.fixtures}", file=sys.stderr)
        return 2

    # Strip accidental quotes from Railway-style env pastes
    database_url = args.database_url.strip().strip('"').strip("'")
    # Guard: refuse obvious Umami default db names only if path ends with /umami and user forgot
    if re.search(r"/umami(\?|$)", database_url) and "hiperxp" not in database_url:
        print(
            "Refusing DATABASE_URL that points at /umami. Use database hiperxp on the same instance.",
            file=sys.stderr,
        )
        return 2

    with connect(database_url) as conn:
        if args.apply_schema:
            apply_schema(conn)
        import_catalog(conn, args.fixtures)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
