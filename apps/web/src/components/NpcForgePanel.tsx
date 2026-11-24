import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { DatabaseRecipe, DatabaseRecipeItemRef } from "@hiperxp/contracts";
import {
  databaseItemIconSrc,
  getDatabaseItem,
  recipePrimaryTarget,
} from "../lib/database";
import { ItemHoverTip } from "./ItemHoverTip";

/**
 * Chrome clássico BR: surfaces/人鱼传说新界面 (mesmo sample do cliente).
 * Coordenadas baseadas em produce1.dtf + print Wang Cai.
 */
const FORGE = {
  width: 311,
  height: 431,
  cols: 8,
  rows: 4,
  icon: 32,
  step: 34,
  gridOrigin: { x: 21, y: 102 },
  tab: { x: 19, y: 75, w: 35, h: 24, step: 34, count: 8 },
  title: { x: 16, y: 20, w: 283, h: 32 },
  close: { x: 285, y: 6, w: 19, h: 19 },
  skill: { x: 16, y: 52, w: 283, h: 18 },
  goldBtn: { x: 156, y: 247, w: 24, h: 15 },
  goldTxt: { x: 182, y: 245, w: 56, h: 18 },
  matsOrigin: { x: 18, y: 272 },
  matsCols: 4,
  matsStepX: 74,
  matsStepY: 42,
  result: { x: 120, y: 352, w: 32, h: 32 },
  start: { x: 91, y: 395, w: 65, h: 24 },
  cancel: { x: 161, y: 395, w: 65, h: 24 },
} as const;

const GRID_SLOTS = FORGE.cols * FORGE.rows;
const MAT_SLOTS = 8;

const TEX = {
  frame: "/ui/forge/classic__未命名-1副本.png",
  title: "/ui/forge/classic__title.png",
  slot: "/ui/forge/Window__图标_物品栏t.png",
  slotAlt: "/ui/forge/version02__输入框图标框__图标框_通用.png",
  tab: "/ui/forge/Button__按钮_文本1.png",
  tabActive: "/ui/forge/Button__按钮_文本2.png",
  btn: "/ui/forge/Button__按钮_文本1.png",
  btnHover: "/ui/forge/Button__按钮_文本2.png",
  coin: "/ui/forge/version02__按钮__图形按钮__钱_普通.png",
  close: "/ui/forge/classic__面板关闭按钮_1.png",
  closeHover: "/ui/forge/classic__面板关闭按钮_3.png",
  maxBtn: "/ui/forge/Button__按钮_文本1.png",
  goldBox: "/ui/forge/version02__输入框图标框__金钱写字框.png",
} as const;

function ForgeIcon({ id, className }: { id: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [id]);
  return (
    <span className={className ?? "forge-icon"} aria-hidden>
      {!failed ? (
        <img
          src={databaseItemIconSrc(id)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="forge-icon-fallback">◇</span>
      )}
    </span>
  );
}

function itemName(id: number): string {
  return getDatabaseItem(id)?.name_pt_br ?? `Item #${id}`;
}

function shortLabel(raw: string, max = 7): string {
  const t = raw.trim();
  if (!t) return "Geral";
  return t.length > max ? `${t.slice(0, max - 1)}.` : t;
}

function tabKey(recipe: DatabaseRecipe): string {
  return `${recipe.major_name_pt_br ?? ""}\0${recipe.sub_name_pt_br ?? ""}`;
}

function tabLabel(recipe: DatabaseRecipe): string {
  return shortLabel(
    recipe.sub_name_pt_br?.trim() ||
      recipe.major_name_pt_br?.trim() ||
      "Geral",
  );
}

function mergeMaterials(
  materials: DatabaseRecipeItemRef[],
): DatabaseRecipeItemRef[] {
  const map = new Map<number, DatabaseRecipeItemRef>();
  for (const mat of materials) {
    const qty = mat.quantity ?? 1;
    const prev = map.get(mat.id);
    if (prev) {
      map.set(mat.id, { ...prev, quantity: (prev.quantity ?? 1) + qty });
    } else {
      map.set(mat.id, { ...mat, quantity: qty });
    }
  }
  return [...map.values()];
}

function resolveResult(
  recipe: DatabaseRecipe,
  focusItemId?: number,
): DatabaseRecipeItemRef | null {
  if (focusItemId != null) {
    const focused = recipe.targets.find((t) => t.id === focusItemId);
    if (focused) return focused;
  }
  return recipePrimaryTarget(recipe);
}

type NpcForgePanelProps = {
  recipes: DatabaseRecipe[];
  npcName: string;
  focusItemId?: number;
  focusRecipeId?: number;
};

export function NpcForgePanel({
  recipes,
  npcName,
  focusItemId,
  focusRecipeId,
}: NpcForgePanelProps) {
  const tabs = useMemo(() => {
    const byKey = new Map<
      string,
      { key: string; label: string; full: string; recipes: DatabaseRecipe[] }
    >();
    for (const recipe of recipes) {
      const key = tabKey(recipe);
      const row = byKey.get(key);
      if (row) row.recipes.push(recipe);
      else {
        const full =
          recipe.sub_name_pt_br?.trim() ||
          recipe.major_name_pt_br?.trim() ||
          "Geral";
        byKey.set(key, {
          key,
          label: tabLabel(recipe),
          full,
          recipes: [recipe],
        });
      }
    }
    return [...byKey.values()].map((tab) => ({
      ...tab,
      recipes: tab.recipes.slice(0, GRID_SLOTS),
    }));
  }, [recipes]);

  const initialTab = useMemo(() => {
    if (!tabs.length) return null;
    if (focusRecipeId != null) {
      const hit = tabs.find((t) =>
        t.recipes.some((r) => r.id === focusRecipeId),
      );
      if (hit) return hit.key;
    }
    if (focusItemId != null) {
      const hit = tabs.find((t) =>
        t.recipes.some((r) => r.targets.some((x) => x.id === focusItemId)),
      );
      if (hit) return hit.key;
    }
    return tabs[0]!.key;
  }, [tabs, focusItemId, focusRecipeId]);

  const [tabPage, setTabPage] = useState(0);
  const [activeTab, setActiveTab] = useState<string | null>(initialTab);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  const tabPages = Math.max(1, Math.ceil(tabs.length / FORGE.tab.count));

  useEffect(() => {
    setActiveTab(initialTab);
    if (initialTab) {
      const idx = tabs.findIndex((t) => t.key === initialTab);
      if (idx >= 0) setTabPage(Math.floor(idx / FORGE.tab.count));
    }
  }, [initialTab, tabs]);

  const pageTabs = tabs.slice(
    tabPage * FORGE.tab.count,
    tabPage * FORGE.tab.count + FORGE.tab.count,
  );
  const currentTab =
    pageTabs.find((t) => t.key === activeTab) ??
    tabs.find((t) => t.key === activeTab) ??
    pageTabs[0] ??
    tabs[0];
  const gridRecipes = currentTab?.recipes ?? [];

  useEffect(() => {
    if (!gridRecipes.length) {
      setSelectedId(null);
      return;
    }
    if (
      focusRecipeId != null &&
      gridRecipes.some((r) => r.id === focusRecipeId)
    ) {
      setSelectedId(focusRecipeId);
      return;
    }
    if (focusItemId != null) {
      const craft = gridRecipes.find((r) =>
        r.targets.some((t) => t.id === focusItemId),
      );
      if (craft) {
        setSelectedId(craft.id);
        return;
      }
    }
    setSelectedId((prev) =>
      prev != null && gridRecipes.some((r) => r.id === prev)
        ? prev
        : gridRecipes[0]!.id,
    );
  }, [gridRecipes, focusItemId, focusRecipeId]);

  const selected =
    gridRecipes.find((r) => r.id === selectedId) ?? gridRecipes[0];
  const result = selected ? resolveResult(selected, focusItemId) : null;
  const materials = selected
    ? mergeMaterials(selected.materials).slice(0, MAT_SLOTS)
    : [];
  const slots = Array.from({ length: GRID_SLOTS }, (_, i) => gridRecipes[i]);
  const matSlots = Array.from({ length: MAT_SLOTS }, (_, i) => materials[i]);

  if (!tabs.length || !selected || !result) {
    return (
      <p className="db-panel-empty">Este NPC não tem receitas de fabricar.</p>
    );
  }

  const resultQty = (result.quantity ?? 1) * qty;
  const skillName =
    selected.sub_name_pt_br?.trim() ||
    selected.major_name_pt_br?.trim() ||
    "—";

  return (
    <div
      className="pw-forge"
      style={
        {
          width: FORGE.width,
          height: FORGE.height,
          "--pw-frame": `url(${TEX.frame})`,
          "--pw-title": `url(${TEX.title})`,
          "--pw-slot": `url(${TEX.slot})`,
          "--pw-slot-alt": `url(${TEX.slotAlt})`,
          "--pw-tab": `url(${TEX.tab})`,
          "--pw-tab-active": `url(${TEX.tabActive})`,
          "--pw-btn": `url(${TEX.btn})`,
          "--pw-btn-hover": `url(${TEX.btnHover})`,
          "--pw-coin": `url(${TEX.coin})`,
          "--pw-close": `url(${TEX.close})`,
          "--pw-close-hover": `url(${TEX.closeHover})`,
          "--pw-max": `url(${TEX.maxBtn})`,
          "--pw-gold-box": `url(${TEX.goldBox})`,
        } as CSSProperties
      }
      aria-label={`Fabricar — ${npcName}`}
    >
      <div className="pw-forge-chrome">
        <div
          className="pw-forge-titlebar"
          style={{
            left: FORGE.title.x,
            top: FORGE.title.y,
            width: FORGE.title.w,
            height: FORGE.title.h,
          }}
        >
          <h2 className="pw-forge-title">Fabricar</h2>
        </div>

        <Link
          className="pw-forge-close"
          to="/database"
          aria-label="Fechar"
          title="Fechar"
          style={{
            left: FORGE.close.x,
            top: FORGE.close.y,
            width: FORGE.close.w,
            height: FORGE.close.h,
          }}
        />

        <div
          className="pw-forge-skillrow"
          style={{
            left: FORGE.skill.x,
            top: FORGE.skill.y,
            width: FORGE.skill.w,
            height: FORGE.skill.h,
          }}
        >
          <span className="pw-forge-skill-label">Habilidade</span>
          <span className="pw-forge-skill-value" title={skillName}>
            {skillName}
          </span>
          <span className="pw-forge-skill-label">Nível</span>
          <span className="pw-forge-levelbar">
            <span
              className="pw-forge-levelbar-fill"
              style={{ width: `${Math.min(100, (selected.level ?? 0) * 8)}%` }}
            />
            <span className="pw-forge-levelbar-text">{selected.level ?? 0}</span>
          </span>
        </div>

        {tabPages > 1 ? (
          <div
            className="pw-forge-tab-nav"
            aria-label="Páginas de abas"
            style={{ left: 4, top: FORGE.tab.y }}
          >
            <button
              type="button"
              disabled={tabPage <= 0}
              onClick={() => setTabPage((p) => Math.max(0, p - 1))}
              title="Abas anteriores"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={tabPage >= tabPages - 1}
              onClick={() =>
                setTabPage((p) => Math.min(tabPages - 1, p + 1))
              }
              title="Próximas abas"
            >
              ›
            </button>
          </div>
        ) : null}

        <div className="pw-forge-tabs" role="tablist" aria-label="Abas de forja">
          {Array.from({ length: FORGE.tab.count }, (_, i) => {
            const tab = pageTabs[i];
            const left = FORGE.tab.x + i * FORGE.tab.step;
            if (!tab) {
              return (
                <span
                  key={`empty-tab-${i}`}
                  className="pw-forge-tab pw-forge-tab--empty"
                  style={{
                    left,
                    top: FORGE.tab.y,
                    width: FORGE.tab.w,
                    height: FORGE.tab.h,
                  }}
                  aria-hidden
                />
              );
            }
            const active = tab.key === currentTab?.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`pw-forge-tab${active ? " is-active" : ""}`}
                title={tab.full}
                style={{
                  left,
                  top: FORGE.tab.y,
                  width: FORGE.tab.w,
                  height: FORGE.tab.h,
                }}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedId(null);
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="pw-forge-grid" role="listbox" aria-label="Receitas">
          {slots.map((recipe, index) => {
            const col = index % FORGE.cols;
            const row = Math.floor(index / FORGE.cols);
            const left = FORGE.gridOrigin.x + col * FORGE.step;
            const top = FORGE.gridOrigin.y + row * FORGE.step;
            const slotStyle = {
              left,
              top,
              width: FORGE.icon,
              height: FORGE.icon,
            } as const;

            if (!recipe) {
              return (
                <span
                  key={`empty-${index}`}
                  className="pw-forge-slot pw-forge-slot--empty"
                  style={slotStyle}
                  aria-hidden
                />
              );
            }
            const target = recipePrimaryTarget(recipe);
            if (!target) {
              return (
                <span
                  key={recipe.id}
                  className="pw-forge-slot pw-forge-slot--empty"
                  style={slotStyle}
                  aria-hidden
                />
              );
            }
            const active = recipe.id === selected.id;
            return (
              <span
                key={recipe.id}
                className="pw-forge-slot-wrap"
                style={slotStyle}
              >
                <ItemHoverTip itemId={target.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`pw-forge-slot${active ? " is-active" : ""}`}
                    aria-label={itemName(target.id)}
                    onClick={() => setSelectedId(recipe.id)}
                  >
                    <ForgeIcon
                      id={target.id}
                      className="forge-icon forge-icon--slot"
                    />
                  </button>
                </ItemHoverTip>
              </span>
            );
          })}
        </div>

        <div className="pw-forge-qty-row" style={{ left: 16, top: 243 }}>
          <label className="pw-forge-qty">
            <span>Qtd:</span>
            <input
              type="number"
              min={1}
              max={99}
              value={qty}
              onChange={(e) => {
                const n = Number(e.target.value);
                setQty(Number.isFinite(n) ? Math.min(99, Math.max(1, n)) : 1);
              }}
            />
            <span className="pw-forge-qty-arrows" aria-hidden>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                ▼
              </button>
            </span>
          </label>
          <button
            type="button"
            className="pw-forge-max"
            onClick={() => setQty(99)}
            aria-label="Quantidade máxima"
          >
            Max.
          </button>
        </div>

        <span
          className="pw-forge-coin"
          title="Custo"
          style={{
            left: FORGE.goldBtn.x,
            top: FORGE.goldBtn.y,
            width: FORGE.goldBtn.w,
            height: FORGE.goldBtn.h,
          }}
        />
        <span
          className="pw-forge-coin-value"
          style={{
            left: FORGE.goldTxt.x,
            top: FORGE.goldTxt.y,
            width: FORGE.goldTxt.w,
            height: FORGE.goldTxt.h,
          }}
        >
          0
        </span>

        <div className="pw-forge-mats" aria-label="Materiais">
          {matSlots.map((mat, index) => {
            const col = index % FORGE.matsCols;
            const row = Math.floor(index / FORGE.matsCols);
            const left = FORGE.matsOrigin.x + col * FORGE.matsStepX;
            const top = FORGE.matsOrigin.y + row * FORGE.matsStepY;
            if (!mat) {
              return (
                <span
                  key={`mat-empty-${index}`}
                  className="pw-forge-mat-slot pw-forge-mat-slot--empty"
                  style={{ left, top }}
                  aria-hidden
                />
              );
            }
            const need = (mat.quantity ?? 1) * qty;
            return (
              <span
                key={mat.id}
                className="pw-forge-mat-wrap"
                style={{ left, top }}
              >
                <ItemHoverTip itemId={mat.id}>
                  <Link
                    className="pw-forge-mat-slot"
                    to={`/database/itens/${mat.id}`}
                    aria-label={itemName(mat.id)}
                  >
                    <ForgeIcon
                      id={mat.id}
                      className="forge-icon forge-icon--mat"
                    />
                  </Link>
                </ItemHoverTip>
                <span className="pw-forge-mat-qty">{need}</span>
              </span>
            );
          })}
        </div>

        <div className="pw-forge-footer-labels">
          <span className="pw-forge-req-label" style={{ left: 22, top: 355 }}>
            Requer:
          </span>
          <span className="pw-forge-req-label" style={{ left: 22, top: 370 }}>
            Item:
          </span>
          <span className="pw-forge-req-label" style={{ left: 88, top: 338 }}>
            Nível
          </span>
        </div>

        <div
          className="pw-forge-output"
          style={{
            left: FORGE.result.x,
            top: FORGE.result.y,
            width: FORGE.result.w,
            height: FORGE.result.h,
          }}
        >
          <ItemHoverTip itemId={result.id}>
            <Link
              className="pw-forge-output-slot"
              to={`/database/itens/${result.id}`}
              aria-label={itemName(result.id)}
            >
              <ForgeIcon
                id={result.id}
                className="forge-icon forge-icon--result"
              />
            </Link>
          </ItemHoverTip>
        </div>
        <span
          className="pw-forge-output-qty"
          style={{ left: FORGE.result.x + 36, top: FORGE.result.y + 6 }}
        >
          {resultQty}
        </span>

        <button
          type="button"
          className="pw-forge-btn pw-forge-btn--ok"
          disabled
          title="Somente consulta — não fabrica no jogo"
          style={{
            left: FORGE.start.x,
            top: FORGE.start.y,
            width: FORGE.start.w,
            height: FORGE.start.h,
          }}
        >
          Iniciar
        </button>
        <Link
          className="pw-forge-btn pw-forge-btn--cancel"
          to="/database"
          style={{
            left: FORGE.cancel.x,
            top: FORGE.cancel.y,
            width: FORGE.cancel.w,
            height: FORGE.cancel.h,
          }}
        >
          Cancelar
        </Link>
      </div>
    </div>
  );
}
