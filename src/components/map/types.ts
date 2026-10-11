import type { MarkerData } from "./MarkerPin";

export interface CameraTarget { lng: number; lat: number; zoom?: number }

export interface MapHandle {
  flyTo: (t: CameraTarget, opts?: { duration?: number }) => void;
  fitTo: (points: { lng: number; lat: number }[], padding?: number) => void;
}

export interface ExploreMapProps {
  markers: MarkerData[];
  selectedId: string | null;
  origin: { lng: number; lat: number; live: boolean } | null;
  initial: CameraTarget;
  reducedMotion: boolean;
  bottomInset?: number;
  onMarkerPress: (id: string) => void;
  onMapPress: () => void;
  onReady?: () => void;
}
