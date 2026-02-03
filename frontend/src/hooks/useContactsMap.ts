import { useMemo } from "react";

import { useYandexMap, type MapCoords } from "@/hooks/useYandexMap";

interface UseContactsMapProps {
  apiKey: string | undefined;
  hasApiKey: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  coords: MapCoords | null;
}

export const useContactsMap = ({
  apiKey,
  hasApiKey,
  containerRef,
  coords,
}: UseContactsMapProps) => {
  const stableCoords = useMemo(() => {
    if (!coords) return null;
    return { latitude: coords.latitude, longitude: coords.longitude };
  }, [coords]);

  useYandexMap({
    apiKey,
    hasApiKey,
    containerRef,
    initialCoords: stableCoords,
    interactive: false,
  });
};
