import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import type { PointCategory } from "@hiperxp/contracts";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { MapView } from "../components/MapView";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "../lib/categories";
import { getMap, mapOrder, maps } from "../lib/data";
import { ICON_LABELS, iconUrl } from "../lib/icons";
import {
  ensureDefaultCharacter,
  getProgressForCharacter,
  periodIdForPoint,
  resetProgress,
  setPointCompleted,
} from "../lib/progress";

const CATEGORY_ICON_KEYS: Record<PointCategory, string> = {
  chest: "chest",
  challenge: "challenge",
  collectible: "glint",
  daily_resource: "resource",
  npc: "quest",
  teleport: "quest",
  quest_objective: "quest",
};

export function MapPage() {
  const { slug = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const map = getMap(slug);

  const [categories, setCategories] = useState<Set<PointCategory>>(
    () => new Set(ALL_CATEGORIES),
  );
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [pointsOpen, setPointsOpen] = useState(true);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const selectedId = searchParams.get("ponto");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const character = await ensureDefaultCharacter();
      const progress = await getProgressForCharacter(character.id);
      if (cancelled) return;
      setActiveId(character.id);
      setCompleted(
        new Set(progress.filter((p) => p.completed).map((p) => p.point_id)),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const filtered = useMemo(() => {
    if (!map) return [];
    return map.points.filter((point) => {
      if (!categories.has(point.category)) return false;
      if (onlyOpen && completed.has(point.id)) return false;
      return true;
    });
  }, [map, categories, onlyOpen, completed]);

  const categoryCounts = useMemo(() => {
    if (!map) return [];
    return ALL_CATEGORIES.map((category) => {
      const total = map.points.filter((p) => p.category === category).length;
      const done = map.points.filter(
        (p) => p.category === category && completed.has(p.id),
      ).length;
      return { category, total, done };
    }).filter((row) => row.total > 0);
  }, [map, completed]);

  if (!map) {
    return <Navigate to="/mapas/cidade-da-paz" replace />;
  }

  const selected =
    filtered.find((p) => p.id === selectedId) ??
    map.points.find((p) => p.id === selectedId) ??
    null;

  function selectPoint(id: string) {
    setSearchParams({ ponto: id });
    setStatus("");
  }

  function closePopup() {
    setSearchParams({});
    setStatus("");
  }

  async function toggleComplete() {
    if (!selected || !activeId) return;
    const periodId = periodIdForPoint(selected.reset_policy);
    const next = !completed.has(selected.id);
    await setPointCompleted({
      characterId: activeId,
      pointId: selected.id,
      periodId,
      completed: next,
    });
    setCompleted((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(selected.id);
      else copy.delete(selected.id);
      return copy;
    });
    setStatus(next ? "Marcado como concluído." : "Conclusão desfeita.");
  }

  async function copyCoords() {
    if (!selected) return;
    const text =
      selected.altitude == null
        ? `${selected.x}, ${selected.y}`
        : `${selected.x}, ${selected.y}, ${selected.altitude}`;
    await navigator.clipboard.writeText(text);
    setStatus(`Copiado: ${text}`);
  }

  async function shareLink() {
    if (!selected) return;
    const url = new URL(window.location.href);
    url.searchParams.set("ponto", selected.id);
    await navigator.clipboard.writeText(url.toString());
    setStatus("Link copiado.");
  }

  function toggleCategory(category: PointCategory) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  async function clearProgress() {
    if (!activeId || !map) return;
    setClearConfirmOpen(false);
    await resetProgress({
      characterId: activeId,
      mapPointIds: map.points.map((p) => p.id),
    });
    setCompleted(new Set());
    setOnlyOpen(false);
    setCategories(new Set(ALL_CATEGORIES));
    setStatus("Progresso limpo.");
  }

  const doneCount = map.points.filter((p) => completed.has(p.id)).length;

  return (
    <main className="page-wide map-page">
      <div className="map-toolbar">
        <div className="map-tabs" role="tablist" aria-label="Mapas">
          {mapOrder.map((mapSlug) => (
            <Link
              key={mapSlug}
              role="tab"
              aria-selected={slug === mapSlug}
              className={`map-tab${slug === mapSlug ? " is-active" : ""}`}
              to={`/mapas/${mapSlug}`}
            >
              {maps[mapSlug]?.name_pt_br ?? mapSlug}
            </Link>
          ))}
        </div>
        <div className="map-toolbar-end">
          <span className="map-progress" aria-live="polite">
            <strong>{doneCount}</strong>
            <span aria-hidden="true">/</span>
            {map.points.length}
            <span className="map-progress-label">concluídos</span>
          </span>
          <button
            type="button"
            className="btn map-clear-btn"
            onClick={() => setClearConfirmOpen(true)}
          >
            Limpar
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={clearConfirmOpen}
        title="Limpar progresso"
        description={`Zerar as marcações deste mapa (${map.name_pt_br})? Essa ação não pode ser desfeita.`}
        confirmLabel="Limpar"
        cancelLabel="Cancelar"
        danger
        onConfirm={() => void clearProgress()}
        onCancel={() => setClearConfirmOpen(false)}
      />

      <div className="map-shell">
        <div
          className={`map-stage map-stage--${slug}`}
          aria-label={`Mapa ${map.name_pt_br}`}
        >
          <MapView
            map={map}
            points={filtered}
            selectedId={selected?.id ?? null}
            completedIds={completed}
            onSelect={selectPoint}
            popup={
              selected ? (
                <>
                  <button
                    type="button"
                    className="map-popup-close"
                    aria-label="Fechar"
                    onClick={closePopup}
                  >
                    ×
                  </button>
                  <div className="map-popup-row">
                    <img
                      src={iconUrl(selected.icon_key, selected.icon)}
                      alt=""
                      width={24}
                      height={24}
                    />
                    <div className="map-popup-title">
                      <strong>{selected.name}</strong>
                      {selected.type_label &&
                      selected.type_label !== selected.name ? (
                        <span className="muted">{selected.type_label}</span>
                      ) : null}
                    </div>
                  </div>
                  <p className="map-popup-coords mono">
                    {selected.x}, {selected.y}
                    {selected.altitude != null ? ` · ${selected.altitude}` : ""}
                    {" · "}
                    {selected.reset_policy === "daily"
                      ? "Diário"
                      : selected.reset_policy === "permanent"
                        ? "Permanente"
                        : "Manual"}
                  </p>
                  {selected.tip ? (
                    <p className="map-popup-tip">{selected.tip}</p>
                  ) : null}
                  <div className="actions map-popup-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void copyCoords()}
                    >
                      Copiar
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => void shareLink()}
                    >
                      Link
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => void toggleComplete()}
                    >
                      {completed.has(selected.id) ? "Desfazer" : "Concluir"}
                    </button>
                  </div>
                  {status ? (
                    <p className="muted map-popup-status">{status}</p>
                  ) : null}
                </>
              ) : null
            }
          />

          <div className="map-legend" aria-label="Legenda">
            {Object.entries(ICON_LABELS).map(([key, label]) => (
              <span key={key} className="map-legend-item">
                <img src={iconUrl(key)} alt="" width={22} height={22} />
                <span>{label}</span>
              </span>
            ))}
          </div>
        </div>

        {filtersOpen ? (
          <aside
            className="map-float map-float--left"
            aria-label="Filtros de exibição"
          >
            <header className="map-float-head">
              <h2>Filtros</h2>
              <button
                type="button"
                className="map-float-icon"
                aria-label="Minimizar filtros"
                onClick={() => setFiltersOpen(false)}
              >
                −
              </button>
            </header>

            <div className="map-float-body">
              <div className="map-float-chips" role="group" aria-label="Status">
                <button
                  type="button"
                  className={!onlyOpen ? "is-active" : undefined}
                  onClick={() => setOnlyOpen(false)}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={onlyOpen ? "is-active" : undefined}
                  onClick={() => setOnlyOpen(true)}
                >
                  Pendentes
                </button>
              </div>

              <h3 className="side-heading">Tipos</h3>
              <div className="category-filters">
                {categoryCounts.map(({ category, total, done }) => (
                  <label key={category} className="filter-row">
                    <input
                      type="checkbox"
                      checked={categories.has(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    <img
                      className="filter-icon"
                      src={iconUrl(CATEGORY_ICON_KEYS[category])}
                      alt=""
                      width={18}
                      height={18}
                    />
                    <span className="filter-label">
                      {CATEGORY_LABELS[category]}
                    </span>
                    <span className="meta">
                      {done}/{total}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>
        ) : (
          <button
            type="button"
            className="map-float-launch map-float-launch--left"
            onClick={() => setFiltersOpen(true)}
          >
            Filtros
          </button>
        )}

        {pointsOpen ? (
          <aside
            className="map-float map-float--right"
            aria-label="Lista de pontos"
          >
            <header className="map-float-head">
              <h2>
                Pontos <span className="muted">({filtered.length})</span>
              </h2>
              <button
                type="button"
                className="map-float-icon"
                aria-label="Minimizar pontos"
                onClick={() => setPointsOpen(false)}
              >
                −
              </button>
            </header>
            <ul className="point-list map-float-body" aria-label="Lista de pontos">
              {filtered.map((point) => (
                <li key={point.id}>
                  <button
                    type="button"
                    aria-current={point.id === selected?.id}
                    onClick={() => selectPoint(point.id)}
                  >
                    <img
                      src={iconUrl(point.icon_key, point.icon)}
                      alt=""
                      width={20}
                      height={20}
                    />
                    <span className="point-text">
                      <span className="point-name">
                        {point.name}
                        {completed.has(point.id) ? (
                          <span className="done-tag">ok</span>
                        ) : null}
                      </span>
                      <span className="meta">
                        {point.x}, {point.y}
                        {point.altitude != null ? ` · ${point.altitude}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        ) : (
          <button
            type="button"
            className="map-float-launch map-float-launch--right"
            onClick={() => setPointsOpen(true)}
          >
            Pontos ({filtered.length})
          </button>
        )}
      </div>
    </main>
  );
}
