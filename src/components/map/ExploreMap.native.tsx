import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";
import { Camera, Map as MLMap, Marker, type CameraRef } from "@maplibre/maplibre-react-native";
import { MarkerPin } from "./MarkerPin";
import { OriginPin } from "./OriginPin";
import type { ExploreMapProps, MapHandle } from "./types";
import { MAP_STYLE_URL } from "@/theme/tokens";

export const ExploreMap = forwardRef<MapHandle, ExploreMapProps>(function ExploreMap(props, ref) {
  const { markers, selectedId, origin, initial, reducedMotion, bottomInset = 0, onMarkerPress, onMapPress, onReady } = props;
  const cam = useRef<CameraRef>(null);

  useImperativeHandle(ref, () => ({
    flyTo: ({ lng, lat, zoom }, opts) => {
      const padding = { top: 120, bottom: bottomInset, left: 0, right: 0 };
      if (reducedMotion) cam.current?.jumpTo({ center: [lng, lat], zoom: zoom ?? 15, padding });
      else cam.current?.easeTo({ center: [lng, lat], zoom: zoom ?? 15, padding, duration: opts?.duration ?? 900, easing: "ease" });
    },
    fitTo: (pts, pad = 80) => {
      if (!pts.length) return;
      const lngs = pts.map((p) => p.lng), lats = pts.map((p) => p.lat);
      cam.current?.fitBounds(
        [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
        { padding: { top: pad + 60, bottom: pad + bottomInset, left: pad, right: pad }, duration: reducedMotion ? 0 : 900 },
      );
    },
  }));

  return (
    <MLMap
      style={StyleSheet.absoluteFill}
      mapStyle={MAP_STYLE_URL}
      touchRotate={false}
      touchPitch={false}
      compass={false}
      logo={false}
      attribution
      attributionPosition={{ bottom: bottomInset + 8, left: 8 }}
      onPress={() => onMapPress()}
      onDidFinishLoadingMap={() => onReady?.()}
    >
      <Camera ref={cam} initialViewState={{ center: [initial.lng, initial.lat], zoom: initial.zoom ?? 14.5 }} minZoom={10} maxZoom={19} />
      {origin && (
        <Marker id="origin" lngLat={[origin.lng, origin.lat]} anchor="center">
          <OriginPin live={origin.live} />
        </Marker>
      )}
      {markers.map((m) => (
        <Marker key={m.place.id} id={m.place.id} lngLat={[m.place.lng, m.place.lat]} anchor="bottom" onPress={() => onMarkerPress(m.place.id)} selected={m.place.id === selectedId}>
          <MarkerPin data={m} selected={m.place.id === selectedId} reducedMotion={reducedMotion} />
        </Marker>
      ))}
    </MLMap>
  );
});
