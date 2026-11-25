import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ImageOverlay,
  MapContainer,
  Marker,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { MapFixture, MapPointFixture } from "@hiperxp/contracts";
import { gameToImage } from "@hiperxp/contracts";
import { iconUrl } from "../lib/icons";
import "leaflet/dist/leaflet.css";

type Props = {
  map: MapFixture;
  points: MapPointFixture[];
  selectedId: string | null;
  completedIds: Set<string>;
  onSelect: (id: string) => void;
  popup?: ReactNode;
};

const iconCache = new Map<string, L.DivIcon>();

/** Separa ícones que compartilham a mesma coordenada, sem alterar o x,y copiável. */
function markerOffsets(
  points: MapPointFixture[],
): Map<string, { du: number; dv: number }> {
  const groups = new Map<string, MapPointFixture[]>();
  for (const point of points) {
    const key = `${point.x}|${point.y}`;
    const list = groups.get(key);
    if (list) list.push(point);
    else groups.set(key, [point]);
  }
  const offsets = new Map<string, { du: number; dv: number }>();
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const radius = 16;
    list.forEach((point, index) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * index) / list.length;
      offsets.set(point.id, {
        du: Math.cos(angle) * radius,
        dv: Math.sin(angle) * radius,
      });
    });
  }
  return offsets;
}

function markerIcon(point: MapPointFixture, selected: boolean, done: boolean) {
  const src = iconUrl(point.icon_key, point.icon);
  const key = `${src}:${selected ? 1 : 0}:${done ? 1 : 0}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const isDropBadge =
    Boolean(point.icon?.includes("/icons/drops/badges/")) ||
    (point.icon_key || "").startsWith("drop-");
  const isImageMarker =
    (point.icon_key || "") === "quest-imagem" ||
    Boolean(point.icon?.includes("/icons/quest/imagem"));
  const size = isDropBadge || isImageMarker
    ? selected
      ? 34
      : 28
    : selected
      ? 28
      : 22;
  const opacity = done ? 0.45 : 1;
  const ring = selected && !isDropBadge && !isImageMarker
    ? "outline:2px solid #fff;outline-offset:1px;"
    : "";
  const shadow =
    isDropBadge || isImageMarker
      ? "filter:none;"
      : "filter:drop-shadow(0 1px 2px rgba(0,0,0,.55));";
  const selectedGlow = selected && isDropBadge
    ? "box-shadow:0 0 0 2px #fff,0 2px 8px rgba(0,0,0,.45);border-radius:50%;"
    : selected && isImageMarker
      ? "box-shadow:0 0 0 2px #fff,0 2px 8px rgba(0,0,0,.45);border-radius:10px;"
      : "";
  const radius = isImageMarker ? "border-radius:10px;" : isDropBadge ? "border-radius:50%;" : "";

  const icon = L.divIcon({
    className: `hiperxp-marker${isDropBadge ? " hiperxp-marker--drop" : ""}${isImageMarker ? " hiperxp-marker--image" : ""}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<img src="${src}" width="${size}" height="${size}" alt="" draggable="false" style="opacity:${opacity};${ring}${shadow}${selectedGlow}${radius}display:block;" />`,
  });
  iconCache.set(key, icon);
  return icon;
}

function MapLifecycle({ width, height }: { width: number; height: number }) {
  const map = useMap();

  useEffect(() => {
    let settled = false;

    const fitInitial = () => {
      map.invalidateSize();
      const size = map.getSize();
      if (size.x <= 0 || size.y <= 0) return;

      const padding = 24;
      const zoomForWidth = Math.log2(size.x / (width + padding));
      const zoomForHeight = Math.log2(size.y / (height * 0.42 + padding));
      const zoom = Math.min(zoomForWidth, zoomForHeight, 3);
      const clamped = Math.max(-2.5, zoom);
      map.setView([height * 0.42, width / 2], clamped, { animate: false });
      settled = true;
    };

    const onResize = () => {
      map.invalidateSize();
      // Só recentra na carga inicial; depois o usuário controla o pan.
      if (!settled) fitInitial();
    };

    fitInitial();
    window.addEventListener("resize", onResize);
    const timer = window.setTimeout(fitInitial, 80);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, [map, width, height]);

  return null;
}

function FocusSelected({
  point,
  u,
  v,
}: {
  point: MapPointFixture | null;
  u: number;
  v: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    const target = L.latLng(v, u);
    const zoom = Math.max(map.getZoom(), 0.5);
    // Espaço extra em cima para a popup condensada.
    map.setView(target, zoom, { animate: true });
    const size = map.getSize();
    const pointPx = map.project(target, zoom);
    const shifted = L.point(pointPx.x, pointPx.y - Math.min(90, size.y * 0.12));
    map.setView(map.unproject(shifted, zoom), zoom, { animate: true });
  }, [map, point, u, v]);
  return null;
}

function AnchoredPopup({
  u,
  v,
  children,
}: {
  u: number;
  v: number;
  children: ReactNode;
}) {
  const map = useMap();
  const [pos, setPos] = useState({ left: 0, top: 0, ready: false });

  useEffect(() => {
    const update = () => {
      const container = map.latLngToContainerPoint(L.latLng(v, u));
      setPos({ left: container.x, top: container.y, ready: true });
    };

    update();
    map.on("move", update);
    map.on("zoom", update);
    map.on("moveend", update);
    map.on("zoomend", update);
    map.on("viewreset", update);
    return () => {
      map.off("move", update);
      map.off("zoom", update);
      map.off("moveend", update);
      map.off("zoomend", update);
      map.off("viewreset", update);
    };
  }, [map, u, v]);

  if (!pos.ready) return null;

  return (
    <div
      className="map-popup is-anchored"
      style={{ left: pos.left, top: pos.top }}
      role="dialog"
    >
      {children}
      <span className="map-popup-caret" aria-hidden />
    </div>
  );
}

export function MapView({
  map,
  points,
  selectedId,
  completedIds,
  onSelect,
  popup,
}: Props) {
  const bounds = useMemo(
    () =>
      L.latLngBounds([
        [0, 0],
        [map.height, map.width],
      ]),
    [map.height, map.width],
  );
  // Folga grande: permite trazer a borda do mapa até o centro da tela.
  const panBounds = useMemo(() => bounds.pad(0.85), [bounds]);
  const selected = points.find((p) => p.id === selectedId) ?? null;
  const offsets = useMemo(() => markerOffsets(points), [points]);
  const imageUrl = map.asset ?? `/maps/${map.slug}.svg`;
  const selectedShift = selected ? offsets.get(selected.id) : undefined;
  const selectedImage = selected
    ? gameToImage(map.transform, selected.x, selected.y)
    : null;
  const selectedU = selectedImage ? selectedImage.u + (selectedShift?.du ?? 0) : 0;
  const selectedV = selectedImage ? selectedImage.v + (selectedShift?.dv ?? 0) : 0;

  return (
    <MapContainer
      key={`${map.slug}:${imageUrl}`}
      crs={L.CRS.Simple}
      center={[map.height * 0.42, map.width / 2]}
      zoom={0}
      minZoom={-3}
      maxZoom={4}
      maxBounds={panBounds}
      maxBoundsViscosity={0.2}
      style={{ width: "100%", height: "100%", background: "#0a1624" }}
      attributionControl={false}
      zoomControl={false}
    >
      <ImageOverlay
        url={imageUrl}
        bounds={bounds}
        opacity={1}
        zIndex={1}
        className="map-image-overlay"
      />
      <ZoomControl position="bottomleft" />
      <MapLifecycle width={map.width} height={map.height} />
      <FocusSelected point={selected} u={selectedU} v={selectedV} />
      {points.map((point) => {
        const { u, v } = gameToImage(map.transform, point.x, point.y);
        const shift = offsets.get(point.id);
        return (
          <Marker
            key={point.id}
            position={[v + (shift?.dv ?? 0), u + (shift?.du ?? 0)]}
            zIndexOffset={point.id === selectedId ? 1000 : 10}
            icon={markerIcon(
              point,
              point.id === selectedId,
              completedIds.has(point.id),
            )}
            eventHandlers={{
              click: () => onSelect(point.id),
            }}
          />
        );
      })}
      {selected && popup ? (
        <AnchoredPopup u={selectedU} v={selectedV}>
          {popup}
        </AnchoredPopup>
      ) : null}
    </MapContainer>
  );
}
