import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { View } from "react-native";
import { createRoot, type Root } from "react-dom/client";
import * as maplibregl from "maplibre-gl";
// @ts-ignore — Expo web handles global CSS imports
import "maplibre-gl/dist/maplibre-gl.css";
import { MarkerPin } from "./MarkerPin";
import { OriginPin } from "./OriginPin";
import type { ExploreMapProps, MapHandle } from "./types";
import { MAP_STYLE_URL } from "@/theme/tokens";

// Metro bundles everything into one file, so maplibre's worker (normally
// resolved relative to import.meta.url) is never emitted. The `postinstall`
// script copies it into public/, which Expo serves at the web root.
maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

interface Entry { marker: maplibregl.Marker; root: Root; el: HTMLDivElement }

export const ExploreMap = forwardRef<MapHandle, ExploreMapProps>(function ExploreMap(props, ref) {
  const { markers, selectedId, origin, initial, reducedMotion, bottomInset = 0, onMarkerPress, onMapPress, onReady } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const entries = useRef<Map<string, Entry>>(new Map());
  const originRef = useRef<Entry | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useImperativeHandle(ref, () => ({
    flyTo: ({ lng, lat, zoom }, opts) => {
      const map = mapRef.current;
      if (!map) return;
      const padding = { top: 120, bottom: propsRef.current.bottomInset ?? 0, left: 0, right: 0 };
      if (propsRef.current.reducedMotion) map.jumpTo({ center: [lng, lat], zoom: zoom ?? map.getZoom(), padding });
      else map.easeTo({ center: [lng, lat], zoom: zoom ?? map.getZoom(), padding, duration: opts?.duration ?? 900, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
    },
    fitTo: (pts, pad = 80) => {
      const map = mapRef.current;
      if (!map || !pts.length) return;
      const b = new maplibregl.LngLatBounds();
      pts.forEach((p) => b.extend([p.lng, p.lat]));
      map.fitBounds(b, { padding: { top: pad + 60, bottom: pad + (propsRef.current.bottomInset ?? 0), left: pad, right: pad }, maxZoom: 16, duration: propsRef.current.reducedMotion ? 0 : 900 });
    },
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [initial.lng, initial.lat],
      zoom: initial.zoom ?? 14.5,
      attributionControl: { compact: true },
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.on("click", () => propsRef.current.onMapPress());
    map.on("load", () => propsRef.current.onReady?.());
    mapRef.current = map;
    return () => {
      entries.current.forEach((e) => { e.marker.remove(); setTimeout(() => e.root.unmount(), 0); });
      entries.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    for (const data of markers) {
      const id = data.place.id;
      seen.add(id);
      let entry = entries.current.get(id);
      if (!entry) {
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        el.addEventListener("click", (e) => { e.stopPropagation(); propsRef.current.onMarkerPress(id); });
        const root = createRoot(el);
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([data.place.lng, data.place.lat]).addTo(map);
        entry = { marker, root, el };
        entries.current.set(id, entry);
      } else {
        entry.marker.setLngLat([data.place.lng, data.place.lat]);
      }
      const selected = id === selectedId;
      entry.el.style.zIndex = selected ? "10" : "1";
      entry.root.render(<MarkerPin data={data} selected={selected} reducedMotion={reducedMotion} />);
    }
    for (const [id, entry] of entries.current) {
      if (!seen.has(id)) {
        entry.marker.remove();
        setTimeout(() => entry.root.unmount(), 0);
        entries.current.delete(id);
      }
    }
  }, [markers, selectedId, reducedMotion]);

  // Origin pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!origin) { originRef.current?.marker.remove(); originRef.current = null; return; }
    if (!originRef.current) {
      const el = document.createElement("div");
      const root = createRoot(el);
      const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([origin.lng, origin.lat]).addTo(map);
      originRef.current = { marker, root, el };
    }
    originRef.current.marker.setLngLat([origin.lng, origin.lat]);
    originRef.current.root.render(<OriginPin live={origin.live} />);
  }, [origin]);

  return (
    <View style={{ flex: 1 }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
    </View>
  );
});
