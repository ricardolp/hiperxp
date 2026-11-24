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

function markerIcon(point: MapPointFixture, selected: boolean, done: boolean) {
  const src = iconUrl(point.icon_key, point.icon);
  const key = `${src}:${selected ? 1 : 0}:${done ? 1 : 0}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const size = selected ? 28 : 22;
  const opacity = done ? 0.4 : 1;
  const ring = selected ? "outline:2px solid #fff;outline-offset:1px;" : "";

  const icon = L.divIcon({
    className: "hiperxp-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<img src="${src}" width="${size}" height="${size}" alt="" draggable="false" style="opacity:${opacity};${ring}display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55));" />`,
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
  mapData,
  point,
}: {
  mapData: MapFixture;
  point: MapPointFixture | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    const { u, v } = gameToImage(mapData.transform, point.x, point.y);
    const target = L.latLng(v, u);
    const zoom = Math.max(map.getZoom(), 0.5);
    // Espaço extra em cima para a popup condensada.
    map.setView(target, zoom, { animate: true });
    const size = map.getSize();
    const pointPx = map.project(target, zoom);
    const shifted = L.point(pointPx.x, pointPx.y - Math.min(90, size.y * 0.12));
    map.setView(map.unproject(shifted, zoom), zoom, { animate: true });
  }, [map, mapData, point]);
  return null;
}

function AnchoredPopup({
  mapData,
  point,
  children,
}: {
  mapData: MapFixture;
  point: MapPointFixture;
  children: ReactNode;
}) {
  const map = useMap();
  const [pos, setPos] = useState({ left: 0, top: 0, ready: false });

  useEffect(() => {
    const update = () => {
      const { u, v } = gameToImage(mapData.transform, point.x, point.y);
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
  }, [map, mapData, point]);

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
  const imageUrl = map.asset ?? `/maps/${map.slug}.svg`;

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
      <FocusSelected mapData={map} point={selected} />
      {points.map((point) => {
        const { u, v } = gameToImage(map.transform, point.x, point.y);
        return (
          <Marker
            key={point.id}
            position={[v, u]}
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
        <AnchoredPopup mapData={map} point={selected}>
          {popup}
        </AnchoredPopup>
      ) : null}
    </MapContainer>
  );
}
