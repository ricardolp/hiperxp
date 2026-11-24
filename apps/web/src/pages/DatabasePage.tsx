import {
  useDeferredValue,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import type {
  DatabaseItemEntry,
  DatabaseNpcCapabilities,
  DatabaseNpcEntry,
  DatabaseQuestEntry,
  DatabaseRecipe,
} from "@hiperxp/contracts";
import { ForgeCard } from "../components/ForgeCard";
import { NpcForgePanel } from "../components/NpcForgePanel";
import { NpcShopPanel } from "../components/NpcShopPanel";
import {
  DatabaseBrowseSkeleton,
  DatabaseDetailSkeleton,
} from "../components/Skeleton";
import {
  browseDatabaseItems,
  browseDatabaseQuests,
  chestIconSrc,
  compactDescription,
  databaseCounts,
  databaseItemIconSrc,
  databaseListLabel,
  dropTablesForItem,
  ensureDatabaseDetailsLoaded,
  ensureDatabaseSource,
  getDatabaseItem,
  getDatabaseManifest,
  getDatabaseNpc,
  getDatabaseQuest,
  getDatabaseSourceMode,
  getItemDescription,
  getItemQuestLinks,
  getQuestDetail,
  getRecipe,
  listDatabaseCategories,
  listRecipesForNpc,
  recipePrimaryTarget,
  resolveRecipes,
  type DatabaseCategory,
  type DatabaseSourceMode,
  type DatabaseTab,
  type ItemDropTableHit,
} from "../lib/database";
import {
  apiCategories,
  apiPopular,
  apiSearchItems,
  apiSearchQuests,
  recordDatabaseView,
  type PopularRow,
} from "../lib/database-api";
import { compareLocaleNames } from "../lib/search";

function npcHref(npcId: number, opts?: { itemId?: number; recipeId?: number }) {
  const params = new URLSearchParams();
  if (opts?.itemId) params.set("item", String(opts.itemId));
  if (opts?.recipeId) params.set("recipe", String(opts.recipeId));
  const q = params.toString();
  return q ? `/database/npcs/${npcId}?${q}` : `/database/npcs/${npcId}`;
}

const PAGE_ITEMS = 120;
const PAGE_QUESTS = 80;

function useAsyncReady(loader: () => Promise<void>) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loader()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar o Database.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loader]);

  return { ready, error };
}

function useDatabaseDetailsReady() {
  return useAsyncReady(ensureDatabaseDetailsLoaded);
}

function useDatabaseSource() {
  const [mode, setMode] = useState<DatabaseSourceMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureDatabaseSource()
      .then((resolved) => {
        if (!cancelled) {
          setMode(resolved);
          if (resolved === "unavailable") {
            setError("Catálogo indisponível no momento.");
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMode("unavailable");
          setError(
            err instanceof Error ? err.message : "Falha ao carregar o Database.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { mode, error, ready: mode === "api" || mode === "static" };
}

function useRecordView(
  kind: "item" | "quest" | "npc" | "recipe",
  id: number,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || !Number.isFinite(id) || id <= 0) return;
    if (getDatabaseSourceMode() !== "api") return;
    recordDatabaseView(kind, id);
  }, [kind, id, enabled]);
}

function DbIcon({ id, className }: { id: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={className ?? "db-icon"} aria-hidden>
      {!failed ? (
        <img
          src={databaseItemIconSrc(id)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="db-icon-fallback">◇</span>
      )}
    </span>
  );
}

function tabFromParam(value: string | null): DatabaseTab {
  return value === "missoes" ? "missoes" : "itens";
}

function listFromParam(value: string | null): number | null {
  if (value == null || value === "" || value === "all") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function setDatabaseParams(
  setParams: ReturnType<typeof useSearchParams>[1],
  patch: { tab?: DatabaseTab; q?: string; list?: number | null },
) {
  setParams(
    (prev) => {
      const next = new URLSearchParams(prev);
      if (patch.tab === "missoes") next.set("tab", "missoes");
      else if (patch.tab === "itens") next.delete("tab");
      if (patch.q !== undefined) {
        // Keep spaces while typing — never trim the live draft.
        if (patch.q.length > 0) next.set("q", patch.q);
        else next.delete("q");
      }
      if (patch.list !== undefined) {
        if (patch.list == null) next.delete("list");
        else next.set("list", String(patch.list));
      }
      return next;
    },
    { replace: true },
  );
}

function SearchGlyph() {
  return (
    <svg className="db-search-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.25 4.25-1.4 1.4-4.25-4.25A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
      />
    </svg>
  );
}

function ItemTile({ item }: { item: DatabaseItemEntry }) {
  return (
    <Link className="db-tile" to={`/database/itens/${item.id}`} title={item.name_pt_br}>
      <DbIcon id={item.id} className="db-icon db-icon--tile" />
      <span className="db-tile-body">
        <span className="db-tile-title">{item.name_pt_br}</span>
        <span className="db-tile-meta">#{item.id}</span>
      </span>
    </Link>
  );
}

function QuestRow({ quest }: { quest: DatabaseQuestEntry }) {
  return (
    <Link className="db-quest-row" to={`/database/missoes/${quest.id}`}>
      <span className="db-quest-mark" aria-hidden>
        <span />
      </span>
      <span className="db-quest-body">
        <span className="db-quest-title">{quest.name_pt_br}</span>
        <span className="db-quest-id">#{quest.id}</span>
      </span>
    </Link>
  );
}

function PopularStrip({
  title,
  rows,
  kind,
}: {
  title: string;
  rows: PopularRow[];
  kind: "item" | "quest" | "npc";
}) {
  if (!rows.length) return null;
  return (
    <section className="db-popular" aria-label={title}>
      <div className="db-popular-head">
        <h2>{title}</h2>
        <p className="muted">Com base nas visitas recentes</p>
      </div>
      <div className="db-popular-row">
        {rows.map((row) => {
          const to =
            kind === "item"
              ? `/database/itens/${row.id}`
              : kind === "quest"
                ? `/database/missoes/${row.id}`
                : `/database/npcs/${row.id}`;
          return (
            <Link key={`${kind}-${row.id}`} className="db-popular-chip" to={to}>
              {kind === "item" ? (
                <DbIcon id={row.id} className="db-icon db-icon--chip" />
              ) : null}
              <span className="db-popular-chip-body">
                <span className="db-popular-chip-title">{row.name_pt_br}</span>
                <span className="db-popular-chip-meta muted">
                  #{row.id}
                  {row.views > 0
                    ? ` · ${row.views.toLocaleString("pt-BR")} views`
                    : ""}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function DatabaseIndexPage() {
  const { mode, ready, error } = useDatabaseSource();
  const [params, setParams] = useSearchParams();
  const tab = tabFromParam(params.get("tab"));
  const query = params.get("q") ?? "";
  const listFilter = listFromParam(params.get("list"));
  const [draftQuery, setDraftQuery] = useState(query);
  const deferredQuery = useDeferredValue(draftQuery);
  const [visible, setVisible] = useState(PAGE_ITEMS);
  const [categories, setCategories] = useState<DatabaseCategory[]>([]);
  const [itemPage, setItemPage] = useState<{
    items: DatabaseItemEntry[];
    total: number;
  }>({ items: [], total: 0 });
  const [questPage, setQuestPage] = useState<{
    quests: DatabaseQuestEntry[];
    total: number;
  }>({ quests: [], total: 0 });
  const [searching, setSearching] = useState(false);
  const [popularItems, setPopularItems] = useState<PopularRow[]>([]);
  const [popularQuests, setPopularQuests] = useState<PopularRow[]>([]);
  const [popularNpcs, setPopularNpcs] = useState<PopularRow[]>([]);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    setVisible(tab === "itens" ? PAGE_ITEMS : PAGE_QUESTS);
  }, [tab, listFilter, deferredQuery]);

  useEffect(() => {
    if (!ready) return;
    if (mode === "static") {
      setCategories(listDatabaseCategories());
      return;
    }
    if (mode !== "api") return;
    let cancelled = false;
    apiCategories()
      .then((rows) => {
        if (!cancelled) {
          setCategories(
            rows.map((r) => ({
              list: r.list,
              label: r.label,
              count: r.count,
            })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, mode]);

  useEffect(() => {
    if (mode !== "api") return;
    let cancelled = false;
    Promise.all([
      apiPopular("item", 10),
      apiPopular("quest", 8),
      apiPopular("npc", 8),
    ])
      .then(([items, quests, npcs]) => {
        if (cancelled) return;
        setPopularItems(items);
        setPopularQuests(quests);
        setPopularNpcs(npcs);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (!ready) return;
    if (mode === "static") {
      if (tab === "itens") {
        setItemPage(
          browseDatabaseItems({
            list: listFilter,
            query: deferredQuery,
            offset: 0,
            limit: visible,
          }),
        );
      } else {
        setQuestPage(
          browseDatabaseQuests({
            query: deferredQuery,
            offset: 0,
            limit: visible,
          }),
        );
      }
      return;
    }
    if (mode !== "api") return;

    let cancelled = false;
    setSearching(true);
    const run =
      tab === "itens"
        ? apiSearchItems({
            q: deferredQuery,
            list: listFilter,
            limit: visible,
            offset: 0,
          }).then((res) => {
            if (!cancelled) setItemPage({ items: res.items, total: res.total });
          })
        : apiSearchQuests({
            q: deferredQuery,
            limit: visible,
            offset: 0,
          }).then((res) => {
            if (!cancelled)
              setQuestPage({ quests: res.quests, total: res.total });
          });

    run
      .catch(() => {
        if (!cancelled) {
          if (tab === "itens") setItemPage({ items: [], total: 0 });
          else setQuestPage({ quests: [], total: 0 });
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, mode, tab, listFilter, deferredQuery, visible]);

  const counts =
    mode === "static"
      ? databaseCounts()
      : {
          items: getDatabaseManifest()?.items_count ?? 0,
          quests: getDatabaseManifest()?.quests_count ?? 0,
        };
  const manifest = ready ? getDatabaseManifest() : null;
  const total = tab === "itens" ? itemPage.total : questPage.total;
  const shown =
    tab === "itens" ? itemPage.items.length : questPage.quests.length;
  const hasMore = shown < total;
  const activeCat =
    categories.find((c) => c.list === listFilter) ?? categories[0];
  const showPopular =
    mode === "api" &&
    !deferredQuery.trim() &&
    (popularItems.length > 0 ||
      popularQuests.length > 0 ||
      popularNpcs.length > 0);

  return (
    <main className="db-shell">
      <header className="db-top">
        <div className="db-top-inner">
          <div className="db-top-copy">
            <p className="db-kicker">Enciclopédia</p>
            <h1>Database</h1>
          </div>
          <div className="db-search">
            <SearchGlyph />
            <label className="visually-hidden" htmlFor="db-search-input">
              Buscar no Database
            </label>
            <input
              id="db-search-input"
              type="text"
              value={draftQuery}
              onChange={(e) => {
                const value = e.target.value;
                setDraftQuery(value);
                setDatabaseParams(setParams, { q: value, tab });
              }}
              placeholder={
                tab === "itens"
                  ? "Nome ou ID do item…"
                  : "Nome ou ID da missão…"
              }
              autoComplete="off"
              spellCheck={false}
            />
            {draftQuery ? (
              <button
                type="button"
                className="db-search-clear"
                onClick={() => {
                  setDraftQuery("");
                  setDatabaseParams(setParams, { q: "", tab });
                }}
                aria-label="Limpar busca"
              >
                ✕
              </button>
            ) : null}
          </div>
          <p className="db-top-meta muted">
            {ready
              ? `${counts.items.toLocaleString("pt-BR")} itens · ${counts.quests.toLocaleString("pt-BR")} missões${
                  mode === "api" ? " · ao vivo" : ""
                }${mode === "static" ? " · offline JSON" : ""}`
              : "Carregando catálogo…"}
          </p>
        </div>
      </header>

      <div className="db-body">
        <div className="db-toolbar">
          <nav className="db-tabs" aria-label="Seções do Database">
            <button
              type="button"
              className={`db-tab${tab === "itens" ? " is-active" : ""}`}
              onClick={() => setDatabaseParams(setParams, { tab: "itens" })}
            >
              Itens
            </button>
            <button
              type="button"
              className={`db-tab${tab === "missoes" ? " is-active" : ""}`}
              onClick={() =>
                setDatabaseParams(setParams, { tab: "missoes", list: null })
              }
            >
              Missões
            </button>
          </nav>

          {tab === "itens" && ready ? (
            <div className="db-cats" role="listbox" aria-label="Categorias">
              {categories.map((cat) => {
                const active = cat.list === listFilter;
                return (
                  <button
                    key={cat.list ?? "all"}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`db-cat${active ? " is-active" : ""}`}
                    onClick={() =>
                      setDatabaseParams(setParams, {
                        tab: "itens",
                        list: cat.list,
                      })
                    }
                  >
                    <span>{cat.label}</span>
                    <span className="db-cat-count">
                      {cat.count.toLocaleString("pt-BR")}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {error ? <p className="db-status db-status--error">{error}</p> : null}

        {showPopular ? (
          <div className="db-popular-stack">
            <PopularStrip
              title="Itens mais vistos"
              rows={popularItems}
              kind="item"
            />
            <PopularStrip
              title="Missões mais vistas"
              rows={popularQuests}
              kind="quest"
            />
            <PopularStrip
              title="NPCs mais vistos"
              rows={popularNpcs}
              kind="npc"
            />
          </div>
        ) : null}

        {!ready && !error ? (
          <section className="db-results" aria-live="polite">
            <div className="db-results-head">
              <h2>{tab === "itens" ? "Itens" : "Missões"}</h2>
              <p className="muted">Carregando…</p>
            </div>
            <DatabaseBrowseSkeleton tab={tab} />
          </section>
        ) : null}

        {ready ? (
          <section className="db-results" aria-live="polite">
            <div className="db-results-head">
              <h2>
                {tab === "itens"
                  ? (activeCat?.label ?? "Itens")
                  : deferredQuery.trim()
                    ? "Resultados"
                    : "Missões"}
              </h2>
              <p className="muted">
                {searching
                  ? "Buscando…"
                  : `${shown.toLocaleString("pt-BR")} de ${total.toLocaleString("pt-BR")}${
                      deferredQuery.trim()
                        ? ` · “${deferredQuery.trim()}”`
                        : ""
                    }`}
              </p>
            </div>

            {searching ? <DatabaseBrowseSkeleton tab={tab} /> : null}

            {!searching && total === 0 ? (
              <p className="db-empty">Nada encontrado.</p>
            ) : null}

            {!searching && tab === "itens" ? (
              <div className="db-grid">
                {itemPage.items.map((item) => (
                  <ItemTile key={item.id} item={item} />
                ))}
              </div>
            ) : null}

            {!searching && tab === "missoes" ? (
              <div className="db-quest-list">
                {questPage.quests.map((quest) => (
                  <QuestRow key={quest.id} quest={quest} />
                ))}
              </div>
            ) : null}

            {!searching && hasMore ? (
              <div className="db-more">
                <button
                  type="button"
                  className="db-more-btn"
                  onClick={() =>
                    setVisible(
                      (n) => n + (tab === "itens" ? PAGE_ITEMS : PAGE_QUESTS),
                    )
                  }
                >
                  Mostrar mais
                  <span className="muted">
                    {" "}
                    (+
                    {Math.min(
                      tab === "itens" ? PAGE_ITEMS : PAGE_QUESTS,
                      total - shown,
                    ).toLocaleString("pt-BR")}
                    )
                  </span>
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {manifest?.notice ? (
          <p className="db-footnote">{manifest.notice}</p>
        ) : null}
      </div>
    </main>
  );
}

function DetailShell({
  children,
  loading,
  error,
  skeleton = "item",
}: {
  children?: ReactNode;
  loading?: boolean;
  error?: string | null;
  skeleton?: "item" | "npc" | "quest";
}) {
  return (
    <main className="db-shell db-shell--detail">
      <div className="db-body db-body--detail">
        {error ? <p className="db-status db-status--error">{error}</p> : null}
        {loading ? <DatabaseDetailSkeleton variant={skeleton} /> : null}
        {!loading && !error ? children : null}
      </div>
    </main>
  );
}

function QuestLinkList({
  links,
}: {
  links: { quest_id: number; quantity: number; probability?: number }[];
}) {
  if (!links.length) return null;
  return (
    <ul className="db-rel-list">
      {links.map((link) => {
        const quest = getDatabaseQuest(link.quest_id);
        return (
          <li key={`${link.quest_id}-${link.quantity}`}>
            <Link to={`/database/missoes/${link.quest_id}`}>
              {quest?.name_pt_br ?? `Missão #${link.quest_id}`}
            </Link>
            <span className="muted">
              {" "}
              · ×{link.quantity}
              {link.probability != null &&
              link.probability > 0 &&
              link.probability < 1
                ? ` · ${(link.probability * 100).toFixed(0)}%`
                : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function mergeItemRefs(
  items: { id: number; quantity?: number; probability?: number }[],
) {
  const map = new Map<
    string,
    { id: number; quantity: number; probability?: number }
  >();
  for (const item of items) {
    const qty = item.quantity ?? 1;
    const key = `${item.id}:${item.probability ?? ""}`;
    const prev = map.get(key);
    if (prev) prev.quantity += qty;
    else {
      map.set(key, {
        id: item.id,
        quantity: qty,
        probability: item.probability,
      });
    }
  }
  return [...map.values()];
}

function ItemRefList({
  items,
}: {
  items: { id: number; quantity?: number; probability?: number }[];
}) {
  const merged = mergeItemRefs(items);
  if (!merged.length) return null;
  return (
    <ul className="db-rel-list">
      {merged.map((item) => {
        const row = getDatabaseItem(item.id);
        const prob = item.probability;
        return (
          <li key={`${item.id}-${item.quantity}-${prob ?? ""}`}>
            <Link className="db-rel-item" to={`/database/itens/${item.id}`}>
              <DbIcon id={item.id} className="db-icon db-icon--sm" />
              <span>
                {row?.name_pt_br ?? `Item #${item.id}`}
                <span className="muted">
                  {" "}
                  · ×{item.quantity}
                  {prob != null && prob > 0 && prob < 0.999
                    ? ` · ${(prob * 100).toFixed(0)}%`
                    : ""}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function formatDropChance(value: number): string {
  if (value >= 99.95) return "100%";
  if (value >= 10) return `${value.toFixed(1)}%`;
  if (value >= 1) return `${value.toFixed(2)}%`;
  return `${value.toFixed(3)}%`;
}

function MaterialRecipeCard({
  recipe,
  materialItemId,
}: {
  recipe: DatabaseRecipe;
  materialItemId?: number;
}) {
  const [open, setOpen] = useState(false);
  const product = recipePrimaryTarget(recipe);
  const productItem = product ? getDatabaseItem(product.id) : undefined;
  const productName =
    productItem?.name_pt_br ??
    (product ? `Item #${product.id}` : recipe.name_pt_br);
  const npcs = recipe.npcs ?? [];
  const primaryNpc = npcs[0];
  const meta = [
    recipe.major_name_pt_br,
    recipe.sub_name_pt_br,
    recipe.level ? `Nv. ${recipe.level}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const materialQty =
    materialItemId != null
      ? recipe.materials.find((m) => m.id === materialItemId)?.quantity
      : undefined;

  return (
    <article className={`mat-card${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="mat-card-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mat-card-product">
          {product ? (
            <Link
              className="mat-card-icon-link"
              to={`/database/itens/${product.id}`}
              title={productName}
              onClick={(e) => e.stopPropagation()}
            >
              <DbIcon id={product.id} className="db-icon db-icon--md" />
            </Link>
          ) : (
            <span className="db-icon db-icon--md" aria-hidden>
              ◇
            </span>
          )}
          <span className="mat-card-copy">
            <span className="mat-card-name">{productName}</span>
            <span className="mat-card-meta muted">
              {product?.quantity != null ? `×${product.quantity}` : "×1"}
              {product?.probability != null &&
              product.probability > 0 &&
              product.probability < 0.999
                ? ` · ${(product.probability * 100).toFixed(0)}%`
                : ""}
              {materialQty != null ? ` · usa ×${materialQty}` : ""}
              {meta ? ` · ${meta}` : ""}
            </span>
          </span>
        </span>
        <span className="mat-card-aside">
          {primaryNpc ? (
            <span className="mat-card-npc" title={primaryNpc.name_pt_br}>
              <span className="mat-card-npc-name">
                {primaryNpc.name_pt_br}
                {npcs.length > 1 ? ` +${npcs.length - 1}` : ""}
              </span>
            </span>
          ) : (
            <span className="mat-card-npc mat-card-npc--empty muted">
              Sem NPC
            </span>
          )}
          <span className="mat-card-chevron" aria-hidden>
            {open ? "▾" : "▸"}
          </span>
        </span>
      </button>

      {open ? (
        <div className="mat-card-body">
          <div className="mat-card-grid">
            {recipe.materials.length ? (
              <div className="db-recipe-block">
                <p className="db-recipe-label">Materiais</p>
                <ItemRefList items={recipe.materials} />
              </div>
            ) : null}
            {recipe.targets.length > 1 ? (
              <div className="db-recipe-block">
                <p className="db-recipe-label">Resultados</p>
                <ItemRefList items={recipe.targets} />
              </div>
            ) : product ? (
              <div className="db-recipe-block">
                <p className="db-recipe-label">Produz</p>
                <ItemRefList items={[product]} />
              </div>
            ) : null}
          </div>

          {npcs.length ? (
            <div className="db-recipe-block">
              <p className="db-recipe-label">NPC de forja</p>
              <ul className="craft-npcs">
                {npcs.map((npc) => (
                  <li key={`${recipe.id}-${npc.id}`}>
                    <Link
                      className="craft-npc"
                      to={npcHref(npc.id, {
                        recipeId: recipe.id,
                        itemId: product?.id,
                      })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="craft-npc-name">{npc.name_pt_br}</span>
                      {npc.service_name_pt_br ? (
                        <span className="craft-npc-service">
                          {npc.service_name_pt_br}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="db-panel-empty">NPC não encontrado nesta receita.</p>
          )}

          <p className="mat-card-recipe muted">
            Receita #{recipe.id}
            {recipe.name_pt_br ? ` · ${recipe.name_pt_br}` : ""}
            {product ? (
              <>
                {" "}
                ·{" "}
                <Link to={`/database/itens/${product.id}`}>{productName}</Link>
              </>
            ) : null}
          </p>
        </div>
      ) : null}
    </article>
  );
}

const MATERIAL_PREVIEW = 2;

function RecipeLinkList({
  links,
  empty,
  materialItemId,
}: {
  links: { recipe_id: number; quantity?: number; probability?: number }[];
  empty: string;
  materialItemId?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!links.length) {
    return <p className="db-panel-empty">{empty}</p>;
  }
  const seen = new Set<number>();
  const recipes: DatabaseRecipe[] = [];
  for (const link of links) {
    if (seen.has(link.recipe_id)) continue;
    seen.add(link.recipe_id);
    const recipe = getRecipe(link.recipe_id);
    if (recipe) recipes.push(recipe);
  }
  if (!recipes.length) {
    return <p className="db-panel-empty">{empty}</p>;
  }
  recipes.sort((a, b) => {
    const aNpcs = a.npcs?.length ? 0 : 1;
    const bNpcs = b.npcs?.length ? 0 : 1;
    if (aNpcs !== bNpcs) return aNpcs - bNpcs;
    const aTarget = recipePrimaryTarget(a);
    const bTarget = recipePrimaryTarget(b);
    const aName =
      (aTarget ? getDatabaseItem(aTarget.id)?.name_pt_br : undefined) ??
      a.name_pt_br;
    const bName =
      (bTarget ? getDatabaseItem(bTarget.id)?.name_pt_br : undefined) ??
      b.name_pt_br;
    return compareLocaleNames(aName, bName);
  });

  const hidden = Math.max(0, recipes.length - MATERIAL_PREVIEW);
  const visible = expanded ? recipes : recipes.slice(0, MATERIAL_PREVIEW);

  return (
    <div className="mat-card-list">
      {visible.map((recipe) => (
        <MaterialRecipeCard
          key={recipe.id}
          recipe={recipe}
          materialItemId={materialItemId}
        />
      ))}
      {hidden > 0 ? (
        <button
          type="button"
          className="mat-card-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Exibir menos" : `Exibir mais (${hidden})`}
        </button>
      ) : null}
    </div>
  );
}

function ChestDropCards({ drops }: { drops: ItemDropTableHit[] }) {
  if (!drops.length) return null;
  return (
    <ul className="chest-drop-list">
      {drops.map((table) => (
        <li key={table.slug}>
          <Link className="chest-drop-card" to={`/simulador/${table.slug}`}>
            <span className="chest-drop-icon" aria-hidden>
              <img
                src={chestIconSrc(table.chestIndex)}
                alt=""
                loading="lazy"
              />
            </span>
            <span className="chest-drop-copy">
              <strong>{table.name_pt_br}</strong>
              <span className="muted">
                ×{table.quantity} · {formatDropChance(table.chancePercent)}
              </span>
            </span>
            <span className="chest-drop-go" aria-hidden>
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DetailSection({
  title,
  children,
  empty,
  wide,
  card,
  collapsible,
  defaultOpen = true,
  count,
}: {
  title: string;
  children?: ReactNode;
  empty?: boolean;
  wide?: boolean;
  card?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const heading = (
    <>
      {title}
      {count != null ? (
        <span className="db-section-count">{count}</span>
      ) : null}
    </>
  );
  const className = [
    "db-section",
    wide ? "db-section--wide" : "",
    card ? "db-section--card" : "",
    collapsible ? "db-section--collapse" : "",
    collapsible && open ? "is-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = empty ? (
    <p className="db-panel-empty">{children}</p>
  ) : (
    children
  );

  if (!collapsible) {
    return (
      <section className={className}>
        <h2>{heading}</h2>
        {body}
      </section>
    );
  }

  return (
    <section className={className}>
      <button
        type="button"
        className="db-section-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <h2>{heading}</h2>
        <span className="db-section-chevron" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? body : null}
    </section>
  );
}

export function DatabaseItemPage() {
  const { itemId } = useParams();
  const id = Number(itemId);
  const { ready, error } = useDatabaseDetailsReady();
  useRecordView("item", id, ready && !error);

  if (!Number.isFinite(id) || id <= 0) {
    return <Navigate to="/database" replace />;
  }

  if (error) return <DetailShell error={error} />;
  if (!ready) return <DetailShell loading skeleton="item" />;

  const item = getDatabaseItem(id);
  if (!item) {
    return (
      <DetailShell>
        <p className="db-status">Item {id} não encontrado no catálogo.</p>
        <Link className="db-back" to="/database">
          ← Voltar ao Database
        </Link>
      </DetailShell>
    );
  }

  const rawDescription = getItemDescription(id);
  const description = rawDescription
    ? compactDescription(rawDescription)
    : null;
  const links = getItemQuestLinks(id);
  const drops = dropTablesForItem(id);
  const crafted = links.crafted_by ?? [];
  const materialIn = links.material_in ?? [];
  const craftRecipes = resolveRecipes(crafted.map((link) => link.recipe_id));
  const hasQuests =
    links.rewarded_by.length > 0 || links.required_by.length > 0;

  return (
    <DetailShell>
      <nav className="db-crumb" aria-label="Breadcrumb">
        <Link to="/database">Database</Link>
        <span aria-hidden>/</span>
        <Link to={`/database?list=${item.list}`}>
          {databaseListLabel(item.list)}
        </Link>
        <span aria-hidden>/</span>
        <span>{item.name_pt_br}</span>
      </nav>

      <header className="db-detail-hero">
        <DbIcon id={item.id} className="db-icon db-icon--hero" />
        <div className="db-detail-copy">
          <p className="db-kicker">
            {databaseListLabel(item.list)} · #{item.id}
          </p>
          <h1>{item.name_pt_br}</h1>
          {description ? (
            <pre className="db-description db-description--hero">
              {description}
            </pre>
          ) : null}
        </div>
      </header>

      <div
        className={`db-detail-layout${hasQuests ? "" : " db-detail-layout--solo"}`}
      >
        <div className="db-detail-main">
          <DetailSection
            title="Como craftar"
            wide
            card
            collapsible
            defaultOpen
            empty={!craftRecipes.length}
            count={craftRecipes.length || undefined}
          >
            {craftRecipes.length ? (
              <ForgeCard recipes={craftRecipes} focusItemId={id} />
            ) : (
              "Nenhuma receita produz este item."
            )}
          </DetailSection>

          {materialIn.length ? (
            <DetailSection
              title="Usado como material"
              wide
              card
              collapsible
              defaultOpen
              count={materialIn.length}
            >
              <RecipeLinkList
                links={materialIn}
                empty=""
                materialItemId={id}
              />
            </DetailSection>
          ) : null}

          {drops.length > 0 ? (
            <DetailSection
              title="Baús que dropam"
              wide
              card
              collapsible
              defaultOpen
              count={drops.length}
            >
              <ChestDropCards drops={drops} />
            </DetailSection>
          ) : null}
        </div>

        {hasQuests ? (
          <aside className="db-detail-aside">
            {links.rewarded_by.length ? (
              <DetailSection title="Missões que dão">
                <QuestLinkList links={links.rewarded_by} />
              </DetailSection>
            ) : null}

            {links.required_by.length ? (
              <DetailSection title="Missões que pedem">
                <QuestLinkList links={links.required_by} />
              </DetailSection>
            ) : null}
          </aside>
        ) : null}
      </div>
    </DetailShell>
  );
}

const NPC_CAPABILITY_ROWS: {
  key: keyof DatabaseNpcCapabilities;
  label: string;
}[] = [
  { key: "make", label: "Fabricar" },
  { key: "engrave", label: "Gravura" },
  { key: "engrave_advanced", label: "Gravura avançada" },
  { key: "sell", label: "Loja" },
  { key: "buy", label: "Compra do jogador" },
  { key: "repair", label: "Consertar" },
  { key: "storage", label: "Armazém" },
  { key: "decompose", label: "Desmontar" },
  { key: "install", label: "Instalar pedra" },
  { key: "uninstall", label: "Remover pedra" },
  { key: "teleport", label: "Teleporte" },
  { key: "teach", label: "Ensinar habilidade" },
  { key: "heal", label: "Curar" },
  { key: "task_in", label: "Receber missões" },
  { key: "task_out", label: "Entregar missões" },
];

function NpcInfoPanel({
  npc,
  forge,
  shop,
}: {
  npc: DatabaseNpcEntry;
  forge: ReactNode;
  shop?: ReactNode;
}) {
  const caps: DatabaseNpcCapabilities = {
    ...(npc.capabilities ?? {}),
  };
  if (npc.recipe_count > 0) caps.make = true;
  if (npc.shop_item_ids?.length || npc.shop_pages?.length) caps.sell = true;

  const active = NPC_CAPABILITY_ROWS.filter((row) => caps[row.key]);
  const inactive = NPC_CAPABILITY_ROWS.filter((row) => !caps[row.key]);
  const hasWindows = Boolean(shop) || Boolean(forge);

  return (
    <div className="npc-detail">
      <section className="db-section db-section--card npc-meta-card">
        <h2>Sobre o NPC</h2>
        {npc.hello_pt_br ? (
          <p className="npc-hello">{npc.hello_pt_br}</p>
        ) : null}

        {active.length || npc.service_labels?.length ? (
          <ul className="npc-service-chips" aria-label="Serviços">
            {(npc.service_labels?.length
              ? npc.service_labels
              : active.map((row) => row.label)
            ).map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        ) : (
          <p className="db-panel-empty">Nenhum serviço marcado neste NPC.</p>
        )}

        {inactive.length ? (
          <details className="npc-meta-more">
            <summary>Outros serviços ({inactive.length})</summary>
            <ul className="npc-cap-list">
              {inactive.map((row) => (
                <li key={row.key} className="npc-cap">
                  <span>{row.label}</span>
                  <span className="muted">Não</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      {hasWindows ? (
        <div className="npc-windows">
          {shop ? (
            <section className="db-section db-section--card npc-shop-slot">
              <h2>Loja</h2>
              <div className="npc-window-frame">
                <div className="npc-shop-body">{shop}</div>
              </div>
            </section>
          ) : null}

          <section className="db-section db-section--card npc-forge-slot">
            <h2>Fabricar</h2>
            <div className="npc-window-frame">
              <div className="npc-forge-body">{forge}</div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function DatabaseNpcPage() {
  const { npcId } = useParams();
  const [params] = useSearchParams();
  const id = Number(npcId);
  const focusItemId = Number(params.get("item"));
  const focusRecipeId = Number(params.get("recipe"));
  const { ready, error } = useDatabaseDetailsReady();
  useRecordView("npc", id, ready && !error);

  if (!Number.isFinite(id) || id <= 0) {
    return <Navigate to="/database" replace />;
  }

  if (error) return <DetailShell error={error} />;
  if (!ready) return <DetailShell loading skeleton="npc" />;

  const npc = getDatabaseNpc(id);
  if (!npc) {
    return (
      <DetailShell>
        <p className="db-status">NPC {id} não encontrado no catálogo.</p>
        <Link className="db-back" to="/database">
          ← Voltar ao Database
        </Link>
      </DetailShell>
    );
  }

  const recipes = listRecipesForNpc(id);
  const focusItem =
    Number.isFinite(focusItemId) && focusItemId > 0
      ? getDatabaseItem(focusItemId)
      : undefined;

  return (
    <DetailShell>
      <nav className="db-crumb" aria-label="Breadcrumb">
        <Link to="/database">Database</Link>
        <span aria-hidden>/</span>
        <span>NPCs</span>
        <span aria-hidden>/</span>
        <span>{npc.name_pt_br}</span>
      </nav>

      <header className="db-detail-hero">
        <span className="db-icon db-icon--hero db-icon--quest" aria-hidden>
          ♘
        </span>
        <div className="db-detail-copy">
          <p className="db-kicker">NPC · #{npc.id}</p>
          <h1>{npc.name_pt_br}</h1>
          <p className="db-detail-npcs">
            {npc.recipe_count} receita{npc.recipe_count === 1 ? "" : "s"}
            {npc.services.length
              ? ` · ${npc.services.map((s) => s.name_pt_br).join(", ")}`
              : ""}
            {focusItem ? (
              <>
                {" "}
                · foco{" "}
                <Link to={`/database/itens/${focusItem.id}`}>
                  {focusItem.name_pt_br}
                </Link>
              </>
            ) : null}
          </p>
        </div>
      </header>

      <NpcInfoPanel
        npc={npc}
        shop={
          npc.shop_item_ids?.length || npc.shop_pages?.length ? (
            <NpcShopPanel
              itemIds={npc.shop_item_ids ?? []}
              pages={npc.shop_pages}
              prices={npc.shop_prices}
              shopName={npc.shop_name_pt_br}
              npcName={npc.name_pt_br}
              focusItemId={
                Number.isFinite(focusItemId) && focusItemId > 0
                  ? focusItemId
                  : undefined
              }
            />
          ) : undefined
        }
        forge={
          <NpcForgePanel
            recipes={recipes}
            npcName={npc.name_pt_br}
            focusItemId={
              Number.isFinite(focusItemId) && focusItemId > 0
                ? focusItemId
                : undefined
            }
            focusRecipeId={
              Number.isFinite(focusRecipeId) && focusRecipeId > 0
                ? focusRecipeId
                : undefined
            }
          />
        }
      />
    </DetailShell>
  );
}

export function DatabaseQuestPage() {
  const { questId } = useParams();
  const id = Number(questId);
  const { ready, error } = useDatabaseDetailsReady();
  useRecordView("quest", id, ready && !error);

  if (!Number.isFinite(id) || id <= 0) {
    return <Navigate to="/database?tab=missoes" replace />;
  }

  if (error) return <DetailShell error={error} />;
  if (!ready) return <DetailShell loading skeleton="quest" />;

  const quest = getDatabaseQuest(id);
  if (!quest) {
    return (
      <DetailShell>
        <p className="db-status">Missão {id} não encontrada no catálogo.</p>
        <Link className="db-back" to="/database?tab=missoes">
          ← Voltar ao Database
        </Link>
      </DetailShell>
    );
  }

  const detail = getQuestDetail(id);
  const prev = detail?.series?.previous_id
    ? getDatabaseQuest(detail.series.previous_id)
    : null;
  const next = detail?.series?.next_id
    ? getDatabaseQuest(detail.series.next_id)
    : null;

  return (
    <DetailShell>
      <nav className="db-crumb" aria-label="Breadcrumb">
        <Link to="/database">Database</Link>
        <span aria-hidden>/</span>
        <Link to="/database?tab=missoes">Missões</Link>
        <span aria-hidden>/</span>
        <span>{quest.name_pt_br}</span>
      </nav>

      <header className="db-detail-hero">
        <span className="db-icon db-icon--hero db-icon--quest" aria-hidden>
          !
        </span>
        <div className="db-detail-copy">
          <p className="db-kicker">Missão · #{quest.id}</p>
          <h1>{quest.name_pt_br}</h1>
        </div>
      </header>

      <div className="db-detail-stack">
        <DetailSection
          title="Descrição"
          wide
          empty={!detail?.description_pt_br}
        >
          {detail?.description_pt_br ? (
            <pre className="db-description">{detail.description_pt_br}</pre>
          ) : (
            "Sem texto extraído para esta missão."
          )}
        </DetailSection>

        <div className="db-detail-cols">
          <DetailSection
            title="Série"
            empty={!(detail?.series && (prev || next))}
          >
            {detail?.series && (prev || next) ? (
              <ul className="db-rel-list">
                {prev ? (
                  <li>
                    <span className="muted">Anterior · </span>
                    <Link to={`/database/missoes/${prev.id}`}>
                      {prev.name_pt_br}
                    </Link>
                  </li>
                ) : null}
                {next ? (
                  <li>
                    <span className="muted">Próxima · </span>
                    <Link to={`/database/missoes/${next.id}`}>
                      {next.name_pt_br}
                    </Link>
                  </li>
                ) : null}
              </ul>
            ) : (
              "Sem série numerada detectada."
            )}
          </DetailSection>

          <DetailSection
            title="Recompensas"
            empty={!detail?.reward_items?.length}
          >
            {detail?.reward_items?.length ? (
              <ItemRefList items={detail.reward_items} />
            ) : (
              "Nenhuma recompensa identificada."
            )}
          </DetailSection>

          <DetailSection
            title="Itens exigidos"
            empty={!detail?.premise_items?.length}
          >
            {detail?.premise_items?.length ? (
              <ItemRefList items={detail.premise_items} />
            ) : (
              "Nenhum item de premissa identificado."
            )}
          </DetailSection>
        </div>
      </div>

      <p className="db-footnote">
        Guias passo a passo: aba <Link to="/missoes">Missões</Link>.
      </p>
    </DetailShell>
  );
}
