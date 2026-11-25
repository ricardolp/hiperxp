import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { DatabaseRecipe, DatabaseRecipeItemRef } from "@hiperxp/contracts";
import {
  getDatabaseItem,
  recipePrimaryTarget,
} from "../lib/database";
import { compareLocaleNames, localeDisplayRank } from "../lib/search";
import { ItemIcon } from "./ItemIcon";

function CraftIcon({ id, className }: { id: number; className?: string }) {
  return (
    <ItemIcon
      id={id}
      className={className ?? "craft-icon"}
      fallbackClassName="craft-icon-fallback"
    />
  );
}

function itemName(id: number): string {
  return getDatabaseItem(id)?.name_pt_br ?? `Item #${id}`;
}

function friendlyLabel(text: string | undefined, fallback: string): string {
  const raw = (text ?? "").trim();
  if (!raw || localeDisplayRank(raw) >= 3) return fallback;
  return raw;
}

function pathLabel(
  recipe: DatabaseRecipe,
  index: number,
  focusItemId?: number,
): string {
  if (focusItemId != null) {
    const mat = recipe.materials[0];
    if (mat) {
      const name = itemName(mat.id);
      return name.length > 24 ? `${name.slice(0, 22)}…` : name;
    }
  }
  return friendlyLabel(recipe.name_pt_br, `Receita ${index + 1}`);
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

function sortRecipes(recipes: DatabaseRecipe[]): DatabaseRecipe[] {
  return [...recipes].sort((a, b) => {
    const aNpc = a.npcs?.length ? 0 : 1;
    const bNpc = b.npcs?.length ? 0 : 1;
    if (aNpc !== bNpc) return aNpc - bNpc;
    return compareLocaleNames(a.name_pt_br, b.name_pt_br);
  });
}

const NPC_PREVIEW = 4;

function npcSortKey(name: string): number {
  const n = name.trim().toLowerCase();
  // Nomes genéricos / fornalhas no fim da lista.
  if (n === "ferreiro" || n === "fornalha" || n.startsWith("fornalha ")) return 2;
  if (n === "artesão" || n === "alfaiate") return 1;
  return 0;
}

function CraftNpcList({
  npcs,
  recipeId,
  focusItemId,
}: {
  npcs: NonNullable<DatabaseRecipe["npcs"]>;
  recipeId: number;
  focusItemId?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(
    () =>
      [...npcs].sort((a, b) => {
        const rank =
          npcSortKey(a.name_pt_br) - npcSortKey(b.name_pt_br);
        if (rank !== 0) return rank;
        return compareLocaleNames(a.name_pt_br, b.name_pt_br);
      }),
    [npcs],
  );

  useEffect(() => {
    setExpanded(false);
  }, [recipeId]);

  if (!sorted.length) {
    return (
      <p className="db-panel-empty">
        NPC não encontrado nesta receita do cliente.
      </p>
    );
  }

  const hidden = Math.max(0, sorted.length - NPC_PREVIEW);
  const visible = expanded ? sorted : sorted.slice(0, NPC_PREVIEW);

  return (
    <div className="craft-npc-list">
      <ul className="craft-npcs">
        {visible.map((npc) => {
          const params = new URLSearchParams();
          if (focusItemId) params.set("item", String(focusItemId));
          params.set("recipe", String(recipeId));
          const href = `/database/npcs/${npc.id}?${params.toString()}`;
          const service =
            npc.service_name_pt_br &&
            localeDisplayRank(npc.service_name_pt_br) < 3
              ? npc.service_name_pt_br
              : null;
          return (
            <li key={npc.id}>
              <Link className="craft-npc" to={href}>
                <span className="craft-npc-name">{npc.name_pt_br}</span>
                {service ? (
                  <span className="craft-npc-service">{service}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      {hidden > 0 ? (
        <button
          type="button"
          className="craft-npc-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? "Exibir menos"
            : `Exibir mais ${hidden} NPC${hidden === 1 ? "" : "s"}`}
        </button>
      ) : null}
    </div>
  );
}

type ForgeCardProps = {
  recipes: DatabaseRecipe[];
  focusItemId?: number;
};

export function ForgeCard({ recipes, focusItemId }: ForgeCardProps) {
  const itemRecipes = useMemo(() => {
    const base =
      focusItemId == null
        ? recipes
        : recipes.filter((recipe) =>
            recipe.targets.some((t) => t.id === focusItemId),
          );
    return sortRecipes(base.length ? base : recipes);
  }, [recipes, focusItemId]);

  const [selectedId, setSelectedId] = useState<number | null>(
    itemRecipes[0]?.id ?? null,
  );
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setSelectedId(itemRecipes[0]?.id ?? null);
    setQty(1);
  }, [itemRecipes]);

  const selected =
    itemRecipes.find((recipe) => recipe.id === selectedId) ?? itemRecipes[0];
  const result = selected ? resolveResult(selected, focusItemId) : null;

  if (!selected || !result) return null;

  const materials = mergeMaterials(selected.materials);
  const npcs = selected.npcs ?? [];
  const recipeTitle = friendlyLabel(selected.name_pt_br, itemName(result.id));
  const category = [
    friendlyLabel(selected.major_name_pt_br, ""),
    friendlyLabel(selected.sub_name_pt_br, ""),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="craft-panel">
      {itemRecipes.length > 1 ? (
        <div className="craft-paths" role="listbox" aria-label="Caminhos de craft">
          {itemRecipes.map((recipe, index) => {
            const active = recipe.id === selected.id;
            const pathResult = resolveResult(recipe, focusItemId);
            return (
              <button
                key={recipe.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`craft-path${active ? " is-active" : ""}`}
                title={recipe.name_pt_br}
                onClick={() => setSelectedId(recipe.id)}
              >
                {pathResult ? (
                  <CraftIcon
                    id={pathResult.id}
                    className="craft-icon craft-icon--sm"
                  />
                ) : null}
                <span>{pathLabel(recipe, index, focusItemId)}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="craft-layout">
        <div className="craft-result">
          <Link
            className="craft-result-icon"
            to={`/database/itens/${result.id}`}
            title={itemName(result.id)}
          >
            <CraftIcon id={result.id} className="craft-icon craft-icon--lg" />
          </Link>
          <div className="craft-result-copy">
            <p className="craft-result-name">{itemName(result.id)}</p>
            <p className="craft-result-sub muted">
              {recipeTitle}
              {category ? ` · ${category}` : ""}
              {selected.level ? ` · Nv. ${selected.level}` : ""}
              {result.probability != null &&
              result.probability > 0 &&
              result.probability < 0.999
                ? ` · ${(result.probability * 100).toFixed(0)}%`
                : ""}
            </p>
            <label className="craft-qty">
              <span>Qtd</span>
              <input
                type="number"
                min={1}
                max={99}
                value={qty}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setQty(
                    Number.isFinite(n) ? Math.min(99, Math.max(1, n)) : 1,
                  );
                }}
              />
            </label>
          </div>
        </div>

        <div className="craft-side">
          <div className="craft-block">
            <p className="craft-label">Materiais</p>
            {materials.length ? (
              <ul className="craft-mats">
                {materials.map((mat) => {
                  const need = (mat.quantity ?? 1) * qty;
                  return (
                    <li key={mat.id}>
                      <Link
                        className="craft-mat"
                        to={`/database/itens/${mat.id}`}
                        title={itemName(mat.id)}
                      >
                        <CraftIcon
                          id={mat.id}
                          className="craft-icon craft-icon--sm"
                        />
                        <span className="craft-mat-name">
                          {itemName(mat.id)}
                        </span>
                        <span className="craft-mat-qty">×{need}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="db-panel-empty">Sem materiais listados.</p>
            )}
          </div>

          <div className="craft-block">
            <p className="craft-label">
              NPC de forja
              {npcs.length ? (
                <span className="craft-label-count">{npcs.length}</span>
              ) : null}
            </p>
            <CraftNpcList
              npcs={npcs}
              recipeId={selected.id}
              focusItemId={focusItemId}
            />
          </div>
        </div>
      </div>

      {selected.targets.length > 1 ? (
        <div className="craft-block craft-block--alt">
          <p className="craft-label">Resultados possíveis</p>
          <ul className="craft-mats craft-mats--inline">
            {selected.targets.map((target) => (
              <li key={target.id}>
                <Link
                  className="craft-mat"
                  to={`/database/itens/${target.id}`}
                >
                  <CraftIcon
                    id={target.id}
                    className="craft-icon craft-icon--sm"
                  />
                  <span className="craft-mat-name">{itemName(target.id)}</span>
                  <span className="craft-mat-qty">
                    {target.probability != null
                      ? `${(target.probability * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
