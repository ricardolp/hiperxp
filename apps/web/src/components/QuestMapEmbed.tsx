import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { MapFixture } from "@hiperxp/contracts";
import { hasPublicMapPage } from "../lib/data";
import { MapView } from "./MapView";

type Props = {
  map: MapFixture;
  caption?: string;
};

/** Mapa compacto embutido no post do guia (ex.: dentro da Etapa 1). */
export function QuestMapEmbed({ map, caption }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const completed = useMemo(() => new Set<string>(), []);
  const selected = map.points.find((p) => p.id === selectedId) ?? null;
  const publicMap = hasPublicMapPage(map.slug);

  return (
    <div className="qg-wiki-map-embed">
      <div className="qg-wiki-map-embed-stage">
        <MapView
          map={map}
          points={map.points}
          selectedId={selectedId}
          completedIds={completed}
          onSelect={setSelectedId}
          popup={
            selected ? (
              <>
                <button
                  type="button"
                  className="map-popup-close"
                  aria-label="Fechar"
                  onClick={() => setSelectedId(null)}
                >
                  ×
                </button>
                <div className="map-popup-row">
                  <img
                    src={selected.icon || "/icons/pw-map/monster-icon.webp"}
                    alt=""
                    width={32}
                    height={32}
                    style={{ borderRadius: "50%" }}
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
                </p>
                {selected.tip ? (
                  <p className="map-popup-tip">{selected.tip}</p>
                ) : null}
              </>
            ) : null
          }
        />
      </div>
      <div className="qg-wiki-map-embed-foot">
        <p>
          {caption ??
            `${map.points.length} marcadores · clique no ícone para ver o drop`}
        </p>
        {publicMap ? (
          <Link className="qg-wiki-map-embed-link" to={`/mapas/${map.slug}`}>
            Abrir mapa completo →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
