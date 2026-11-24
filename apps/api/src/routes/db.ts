import { Hono } from "hono";
import { getPool } from "../db.js";
import {
  allowViewOnce,
  clientIp,
  takeToken,
} from "../rateLimit.js";
import {
  clampLimit,
  normalizeSearch,
  parseKind,
  parsePositiveInt,
  type EntityKind,
} from "../normalize.js";

const readLimit = () => Number(process.env.RATE_LIMIT_READ_PER_MIN ?? 120);
const viewLimit = () => Number(process.env.RATE_LIMIT_VIEW_PER_MIN ?? 30);

function err(
  c: {
    json: (body: unknown, status?: number) => Response;
    req: { header: (name: string) => string | undefined };
  },
  status: number,
  code: string,
  message: string,
) {
  return c.json(
    {
      code,
      message,
      request_id: c.req.header("X-Request-Id") ?? null,
    },
    status as 400,
  );
}

function cacheHeaders(seconds = 120): Record<string, string> {
  return {
    "Cache-Control": `public, max-age=${seconds}, stale-while-revalidate=60`,
  };
}

export const dbRoutes = new Hono();

dbRoutes.use("*", async (c, next) => {
  const ip = clientIp(c.req.raw.headers);
  const limit = c.req.method === "POST" ? viewLimit() : readLimit();
  const bucket = takeToken(`read:${ip}:${c.req.method}`, limit);
  c.header("X-RateLimit-Limit", String(limit));
  c.header("X-RateLimit-Remaining", String(bucket.remaining));
  if (!bucket.allowed) {
    c.header("Retry-After", String(bucket.retryAfterSec));
    return err(c, 429, "rate_limited", "Too many requests");
  }
  await next();
});

dbRoutes.get("/meta", async (c) => {
  const { rows } = await getPool().query<{ value: Record<string, unknown> }>(
    `SELECT value FROM meta WHERE key = 'catalog' LIMIT 1`,
  );
  if (!rows[0]) return err(c, 503, "catalog_missing", "Catalog not imported yet");
  return c.json(rows[0].value, 200, cacheHeaders(60));
});

dbRoutes.get("/search", async (c) => {
  const tab = (c.req.query("tab") ?? "itens").toLowerCase();
  const qRaw = c.req.query("q") ?? "";
  const q = normalizeSearch(qRaw);
  const listId = parsePositiveInt(c.req.query("list_id") ?? c.req.query("list"));
  const limit = clampLimit(c.req.query("limit"), 24, 50);
  const offset = Math.max(0, Number(c.req.query("offset") ?? 0) || 0);

  if (tab === "missoes" || tab === "quests") {
    return searchQuests(c, q, qRaw, limit, offset);
  }
  if (tab === "npcs") {
    return searchNpcs(c, q, qRaw, limit, offset);
  }
  return searchItems(c, q, qRaw, listId, limit, offset);
});

async function searchItems(
  c: Parameters<typeof err>[0] & {
    json: (body: unknown, status?: number, headers?: Record<string, string>) => Response;
  },
  q: string,
  qRaw: string,
  listId: number | null,
  limit: number,
  offset: number,
) {
  const params: unknown[] = [];
  const where: string[] = ["TRUE"];
  if (listId != null) {
    params.push(listId);
    where.push(`list_id = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    const likeIdx = params.length;
    params.push(qRaw.trim());
    const idIdx = params.length;
    where.push(`(search_norm LIKE $${likeIdx} OR CAST(id AS text) = $${idIdx})`);
  }
  const whereSql = where.join(" AND ");

  const countRes = await getPool().query<{ count: string }>(
    `SELECT count(*)::text AS count FROM items WHERE ${whereSql}`,
    params,
  );
  params.push(limit, offset);
  const { rows } = await getPool().query(
    `
    SELECT id, list_id AS list, name_pt_br, has_description, has_quest_links, has_recipes
    FROM items
    WHERE ${whereSql}
    ORDER BY name_pt_br ASC, id ASC
    LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params,
  );
  return c.json(
    {
      tab: "itens",
      total: Number(countRes.rows[0]?.count ?? 0),
      items: rows,
    },
    200,
    cacheHeaders(30),
  );
}

async function searchQuests(
  c: Parameters<typeof searchItems>[0],
  q: string,
  qRaw: string,
  limit: number,
  offset: number,
) {
  const params: unknown[] = [];
  const where: string[] = ["TRUE"];
  if (q) {
    params.push(`%${q}%`);
    const likeIdx = params.length;
    params.push(qRaw.trim());
    const idIdx = params.length;
    where.push(`(search_norm LIKE $${likeIdx} OR CAST(id AS text) = $${idIdx})`);
  }
  const whereSql = where.join(" AND ");
  const countRes = await getPool().query<{ count: string }>(
    `SELECT count(*)::text AS count FROM quests WHERE ${whereSql}`,
    params,
  );
  params.push(limit, offset);
  const { rows } = await getPool().query(
    `
    SELECT id, name_pt_br, has_description, has_rewards, has_premises, has_series
    FROM quests
    WHERE ${whereSql}
    ORDER BY name_pt_br ASC, id ASC
    LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params,
  );
  return c.json(
    {
      tab: "missoes",
      total: Number(countRes.rows[0]?.count ?? 0),
      quests: rows,
    },
    200,
    cacheHeaders(30),
  );
}

async function searchNpcs(
  c: Parameters<typeof searchItems>[0],
  q: string,
  qRaw: string,
  limit: number,
  offset: number,
) {
  const params: unknown[] = [];
  const where: string[] = ["TRUE"];
  if (q) {
    params.push(`%${q}%`);
    const likeIdx = params.length;
    params.push(qRaw.trim());
    const idIdx = params.length;
    where.push(`(search_norm LIKE $${likeIdx} OR CAST(id AS text) = $${idIdx})`);
  }
  const whereSql = where.join(" AND ");
  const countRes = await getPool().query<{ count: string }>(
    `SELECT count(*)::text AS count FROM npcs WHERE ${whereSql}`,
    params,
  );
  params.push(limit, offset);
  const { rows } = await getPool().query(
    `
    SELECT id, name_pt_br, recipe_count, payload
    FROM npcs
    WHERE ${whereSql}
    ORDER BY name_pt_br ASC, id ASC
    LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params,
  );
  return c.json(
    {
      tab: "npcs",
      total: Number(countRes.rows[0]?.count ?? 0),
      npcs: rows.map((r) => ({
        id: r.id,
        name_pt_br: r.name_pt_br,
        recipe_count: r.recipe_count,
      })),
    },
    200,
    cacheHeaders(30),
  );
}

dbRoutes.get("/items/:id", async (c) => {
  const id = parsePositiveInt(c.req.param("id"));
  if (id == null) return err(c, 400, "invalid_id", "Invalid item id");
  const { rows } = await getPool().query(
    `
    SELECT i.id, i.list_id AS list, i.name_pt_br,
           i.has_description, i.has_quest_links, i.has_recipes,
           d.body AS description_pt_br
    FROM items i
    LEFT JOIN descriptions d ON d.item_id = i.id
    WHERE i.id = $1
    `,
    [id],
  );
  if (!rows[0]) return err(c, 404, "not_found", "Item not found");
  return c.json({ item: rows[0] }, 200, cacheHeaders(300));
});

dbRoutes.get("/items/:id/links", async (c) => {
  const id = parsePositiveInt(c.req.param("id"));
  if (id == null) return err(c, 400, "invalid_id", "Invalid item id");
  const { rows } = await getPool().query(
    `SELECT payload FROM item_links WHERE item_id = $1`,
    [id],
  );
  const payload = rows[0]?.payload ?? {
    rewarded_by: [],
    required_by: [],
    crafted_by: [],
    material_in: [],
  };
  return c.json({ item_id: id, links: payload }, 200, cacheHeaders(300));
});

dbRoutes.get("/quests/:id", async (c) => {
  const id = parsePositiveInt(c.req.param("id"));
  if (id == null) return err(c, 400, "invalid_id", "Invalid quest id");
  const { rows } = await getPool().query(
    `
    SELECT q.id, q.name_pt_br, q.has_description, q.has_rewards,
           q.has_premises, q.has_series, d.payload AS detail
    FROM quests q
    LEFT JOIN quest_details d ON d.quest_id = q.id
    WHERE q.id = $1
    `,
    [id],
  );
  if (!rows[0]) return err(c, 404, "not_found", "Quest not found");
  const { detail, ...quest } = rows[0];
  return c.json({ quest, detail: detail ?? null }, 200, cacheHeaders(300));
});

dbRoutes.get("/recipes/:id", async (c) => {
  const id = parsePositiveInt(c.req.param("id"));
  if (id == null) return err(c, 400, "invalid_id", "Invalid recipe id");
  const { rows } = await getPool().query(
    `SELECT payload FROM recipes WHERE id = $1`,
    [id],
  );
  if (!rows[0]) return err(c, 404, "not_found", "Recipe not found");
  return c.json({ recipe: rows[0].payload }, 200, cacheHeaders(300));
});

dbRoutes.get("/npcs/:id", async (c) => {
  const id = parsePositiveInt(c.req.param("id"));
  if (id == null) return err(c, 400, "invalid_id", "Invalid npc id");
  const { rows } = await getPool().query(
    `SELECT payload FROM npcs WHERE id = $1`,
    [id],
  );
  if (!rows[0]) return err(c, 404, "not_found", "NPC not found");
  return c.json({ npc: rows[0].payload }, 200, cacheHeaders(300));
});

dbRoutes.get("/categories", async (c) => {
  const { rows: labelsRow } = await getPool().query<{ value: Record<string, unknown> }>(
    `SELECT value FROM meta WHERE key = 'catalog' LIMIT 1`,
  );
  const listLabels = (labelsRow[0]?.value?.list_labels ?? {}) as Record<string, string>;
  const { rows } = await getPool().query<{ list_id: number; count: string }>(
    `
    SELECT list_id, count(*)::text AS count
    FROM items
    GROUP BY list_id
    ORDER BY count(*) DESC, list_id ASC
    `,
  );
  const categories = [
    { list: null as number | null, label: "Todas", count: rows.reduce((n, r) => n + Number(r.count), 0) },
    ...rows.map((r) => ({
      list: r.list_id,
      label: listLabels[String(r.list_id)] ?? `Lista ${r.list_id}`,
      count: Number(r.count),
    })),
  ];
  return c.json({ categories }, 200, cacheHeaders(300));
});

dbRoutes.get("/popular", async (c) => {
  const kind = parseKind(c.req.query("kind") ?? "item") ?? "item";
  const limit = clampLimit(c.req.query("limit"), 12, 30);
  const table =
    kind === "item"
      ? "items"
      : kind === "quest"
        ? "quests"
        : kind === "npc"
          ? "npcs"
          : "recipes";

  const { rows } = await getPool().query(
    `
    SELECT v.kind, v.entity_id AS id, v.views, e.name_pt_br
    FROM entity_views v
    JOIN ${table} e ON e.id = v.entity_id
    WHERE v.kind = $1
    ORDER BY v.views DESC, e.name_pt_br ASC
    LIMIT $2
    `,
    [kind, limit],
  );
  return c.json({ kind, items: rows }, 200, cacheHeaders(60));
});

dbRoutes.post("/view", async (c) => {
  const ip = clientIp(c.req.raw.headers);
  let body: { kind?: string; id?: number | string };
  try {
    body = await c.req.json();
  } catch {
    return err(c, 400, "invalid_json", "Invalid JSON body");
  }
  const kind = parseKind(body.kind ?? null);
  const id =
    typeof body.id === "number"
      ? parsePositiveInt(String(body.id))
      : parsePositiveInt(body.id ?? null);
  if (!kind || id == null) {
    return err(c, 400, "invalid_body", "Expected { kind, id }");
  }

  if (!allowViewOnce(`viewdedup:${ip}:${kind}:${id}`)) {
    return c.body(null, 204);
  }

  // Ensure entity exists before counting (prevents garbage ids filling the table).
  const exists = await entityExists(kind, id);
  if (!exists) return err(c, 404, "not_found", "Entity not found");

  await getPool().query(
    `
    INSERT INTO entity_views (kind, entity_id, views, updated_at)
    VALUES ($1, $2, 1, now())
    ON CONFLICT (kind, entity_id)
    DO UPDATE SET views = entity_views.views + 1, updated_at = now()
    `,
    [kind, id],
  );
  return c.body(null, 204);
});

async function entityExists(kind: EntityKind, id: number): Promise<boolean> {
  const table =
    kind === "item"
      ? "items"
      : kind === "quest"
        ? "quests"
        : kind === "npc"
          ? "npcs"
          : "recipes";
  const { rowCount } = await getPool().query(
    `SELECT 1 FROM ${table} WHERE id = $1 LIMIT 1`,
    [id],
  );
  return (rowCount ?? 0) > 0;
}
