import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { DatabaseNpcShopPage } from "@hiperxp/contracts";
import { databaseItemIconSrc, getDatabaseItem } from "../lib/database";
import { ItemHoverTip } from "./ItemHoverTip";

/** Mesmo chrome/layout do Fabricar (Win_Produce1 clássico). */
const SHOP = {
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
  goldBtn: { x: 156, y: 247, w: 24, h: 15 },
  goldTxt: { x: 182, y: 245, w: 108, h: 18 },
  preview: { x: 21, y: 280, w: 32, h: 32 },
  buy: { x: 91, y: 395, w: 65, h: 24 },
  cancel: { x: 161, y: 395, w: 65, h: 24 },
} as const;

const GRID_SLOTS = SHOP.cols * SHOP.rows;

const TEX = {
  frame: "/ui/forge/classic__未命名-1副本.png",
  title: "/ui/forge/classic__title.png",
  slot: "/ui/forge/Window__图标_物品栏t.png",
  tab: "/ui/forge/Button__按钮_文本1.png",
  tabActive: "/ui/forge/Button__按钮_文本2.png",
  coin: "/ui/forge/version02__按钮__图形按钮__钱_普通.png",
  close: "/ui/forge/classic__面板关闭按钮_1.png",
  closeHover: "/ui/forge/classic__面板关闭按钮_3.png",
} as const;

function ShopIcon({ id, className }: { id: number; className?: string }) {
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

function shortLabel(raw: string, max = 6): string {
  const t = raw
    .replace(/^[☆★✦✧]+/u, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return "Itens";
  const word = t.split(" ")[0] ?? t;
  return word.length > max ? `${word.slice(0, max - 1)}.` : word;
}

function pageLabel(itemIds: number[]): { label: string; full: string } {
  const first = itemIds[0];
  if (first == null) return { label: "Itens", full: "Itens" };
  const full = itemName(first);
  return { label: shortLabel(full), full };
}

function pagesFromProps(
  pages: DatabaseNpcShopPage[] | undefined,
  itemIds: number[],
): DatabaseNpcShopPage[] {
  if (pages?.length) {
    return pages.filter((p) => p.item_ids.length > 0);
  }
  if (!itemIds.length) return [];
  // Fallback: chunk flat list into pages of 32 (8×4).
  const out: DatabaseNpcShopPage[] = [];
  for (let i = 0; i < itemIds.length; i += GRID_SLOTS) {
    out.push({
      index: out.length,
      item_ids: itemIds.slice(i, i + GRID_SLOTS),
    });
  }
  return out;
}

function formatShopPrice(value: number): string {
  return value.toLocaleString("pt-BR");
}

type NpcShopPanelProps = {
  itemIds: number[];
  pages?: DatabaseNpcShopPage[];
  prices?: Record<string, number>;
  shopName?: string;
  npcName: string;
  focusItemId?: number;
};

export function NpcShopPanel({
  itemIds,
  pages: pagesProp,
  prices,
  shopName,
  npcName,
  focusItemId,
}: NpcShopPanelProps) {
  const pages = useMemo(
    () => pagesFromProps(pagesProp, itemIds),
    [pagesProp, itemIds],
  );

  const tabs = useMemo(
    () =>
      pages.map((page) => {
        const { label, full } = pageLabel(page.item_ids);
        return {
          key: String(page.index),
          label,
          full,
          itemIds: page.item_ids.slice(0, GRID_SLOTS),
        };
      }),
    [pages],
  );

  const initialTab = useMemo(() => {
    if (!tabs.length) return null;
    if (focusItemId != null) {
      const hit = tabs.find((t) => t.itemIds.includes(focusItemId));
      if (hit) return hit.key;
    }
    return tabs[0]!.key;
  }, [tabs, focusItemId]);

  const [tabPage, setTabPage] = useState(0);
  const [activeTab, setActiveTab] = useState<string | null>(initialTab);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  const tabPages = Math.max(1, Math.ceil(tabs.length / SHOP.tab.count));

  useEffect(() => {
    setActiveTab(initialTab);
    if (initialTab) {
      const idx = tabs.findIndex((t) => t.key === initialTab);
      if (idx >= 0) setTabPage(Math.floor(idx / SHOP.tab.count));
    }
  }, [initialTab, tabs]);

  const pageTabs = tabs.slice(
    tabPage * SHOP.tab.count,
    tabPage * SHOP.tab.count + SHOP.tab.count,
  );
  const currentTab =
    pageTabs.find((t) => t.key === activeTab) ??
    tabs.find((t) => t.key === activeTab) ??
    pageTabs[0] ??
    tabs[0];
  const gridItems = currentTab?.itemIds ?? [];

  useEffect(() => {
    if (!gridItems.length) {
      setSelectedId(null);
      return;
    }
    if (focusItemId != null && gridItems.includes(focusItemId)) {
      setSelectedId(focusItemId);
      return;
    }
    setSelectedId((prev) =>
      prev != null && gridItems.includes(prev) ? prev : gridItems[0]!,
    );
  }, [gridItems, focusItemId]);

  const selected =
    selectedId != null && gridItems.includes(selectedId)
      ? selectedId
      : gridItems[0];
  const slots = Array.from({ length: GRID_SLOTS }, (_, i) => gridItems[i]);
  const unitPrice =
    selected != null && prices
      ? prices[String(selected)]
      : undefined;
  const totalPrice =
    unitPrice != null && unitPrice > 0 ? unitPrice * qty : undefined;

  if (!tabs.length || selected == null) {
    return (
      <p className="db-panel-empty">Este NPC não tem itens de loja no cliente.</p>
    );
  }

  const title = shopName?.trim() || "Loja";

  return (
    <div
      className="pw-forge pw-shop"
      style={
        {
          width: SHOP.width,
          height: SHOP.height,
          "--pw-frame": `url(${TEX.frame})`,
          "--pw-title": `url(${TEX.title})`,
          "--pw-slot": `url(${TEX.slot})`,
          "--pw-tab": `url(${TEX.tab})`,
          "--pw-tab-active": `url(${TEX.tabActive})`,
          "--pw-coin": `url(${TEX.coin})`,
          "--pw-close": `url(${TEX.close})`,
          "--pw-close-hover": `url(${TEX.closeHover})`,
        } as CSSProperties
      }
      aria-label={`${title} — ${npcName}`}
    >
      <div className="pw-forge-chrome">
        <div
          className="pw-forge-titlebar"
          style={{
            left: SHOP.title.x,
            top: SHOP.title.y,
            width: SHOP.title.w,
            height: SHOP.title.h,
          }}
        >
          <h2 className="pw-forge-title">{title}</h2>
        </div>

        <Link
          className="pw-forge-close"
          to="/database"
          aria-label="Fechar"
          title="Fechar"
          style={{
            left: SHOP.close.x,
            top: SHOP.close.y,
            width: SHOP.close.w,
            height: SHOP.close.h,
          }}
        />

        {tabPages > 1 ? (
          <div
            className="pw-forge-tab-nav"
            aria-label="Páginas de abas"
            style={{ left: 4, top: SHOP.tab.y }}
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

        <div className="pw-forge-tabs" role="tablist" aria-label="Abas da loja">
          {Array.from({ length: SHOP.tab.count }, (_, i) => {
            const tab = pageTabs[i];
            const left = SHOP.tab.x + i * SHOP.tab.step;
            if (!tab) {
              return (
                <span
                  key={`empty-tab-${i}`}
                  className="pw-forge-tab pw-forge-tab--empty"
                  style={{
                    left,
                    top: SHOP.tab.y,
                    width: SHOP.tab.w,
                    height: SHOP.tab.h,
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
                  top: SHOP.tab.y,
                  width: SHOP.tab.w,
                  height: SHOP.tab.h,
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

        <div className="pw-forge-grid" role="listbox" aria-label="Itens à venda">
          {slots.map((id, index) => {
            const col = index % SHOP.cols;
            const row = Math.floor(index / SHOP.cols);
            const left = SHOP.gridOrigin.x + col * SHOP.step;
            const top = SHOP.gridOrigin.y + row * SHOP.step;
            const slotStyle = {
              left,
              top,
              width: SHOP.icon,
              height: SHOP.icon,
            } as const;

            if (id == null) {
              return (
                <span
                  key={`empty-${index}`}
                  className="pw-forge-slot pw-forge-slot--empty"
                  style={slotStyle}
                  aria-hidden
                />
              );
            }
            const active = id === selected;
            return (
              <span
                key={`${id}-${index}`}
                className="pw-forge-slot-wrap"
                style={slotStyle}
              >
                <ItemHoverTip itemId={id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`pw-forge-slot${active ? " is-active" : ""}`}
                    title={itemName(id)}
                    onClick={() => setSelectedId(id)}
                  >
                    <ShopIcon
                      id={id}
                      className="forge-icon forge-icon--slot"
                    />
                  </button>
                </ItemHoverTip>
              </span>
            );
          })}
        </div>

        <label className="pw-forge-qty" style={{ left: 18, top: 245 }}>
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
          style={{ left: 68, top: 243, width: 40, height: 22 }}
          onClick={() => setQty(99)}
        >
          Máximo
        </button>

        <span
          className="pw-forge-coin"
          title="Preço (não disponível no extract)"
          style={{
            left: SHOP.goldBtn.x,
            top: SHOP.goldBtn.y,
            width: SHOP.goldBtn.w,
            height: SHOP.goldBtn.h,
          }}
        />
        <span
          className="pw-forge-coin-value"
          title={
            totalPrice != null
              ? `${formatShopPrice(totalPrice)} (×${qty})`
              : "Preço não encontrado no essence"
          }
          style={{
            left: SHOP.goldTxt.x,
            top: SHOP.goldTxt.y,
            width: SHOP.goldTxt.w,
            height: SHOP.goldTxt.h,
          }}
        >
          {totalPrice != null ? formatShopPrice(totalPrice) : "—"}
        </span>

        <div
          className="pw-shop-preview"
          style={{
            left: SHOP.preview.x,
            top: SHOP.preview.y,
          }}
        >
          <ItemHoverTip itemId={selected}>
            <Link
              className="pw-forge-output-slot"
              to={`/database/itens/${selected}`}
              title={itemName(selected)}
            >
              <ShopIcon
                id={selected}
                className="forge-icon forge-icon--result"
              />
            </Link>
          </ItemHoverTip>
          <div className="pw-shop-preview-copy">
            <span className="pw-forge-req-label" style={{ position: "static" }}>
              Item:
            </span>
            <Link
              className="pw-shop-preview-name"
              to={`/database/itens/${selected}`}
            >
              {itemName(selected)}
            </Link>
            <span className="pw-forge-output-qty" style={{ position: "static" }}>
              ×{qty}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="pw-forge-btn pw-forge-btn--ok"
          disabled
          title="Somente consulta — não compra no jogo"
          style={{
            left: SHOP.buy.x,
            top: SHOP.buy.y,
            width: SHOP.buy.w,
            height: SHOP.buy.h,
          }}
        >
          Comprar
        </button>
        <Link
          className="pw-forge-btn pw-forge-btn--cancel"
          to="/database"
          style={{
            left: SHOP.cancel.x,
            top: SHOP.cancel.y,
            width: SHOP.cancel.w,
            height: SHOP.cancel.h,
          }}
        >
          Cancelar
        </Link>
      </div>
    </div>
  );
}
