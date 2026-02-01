import { useMemo } from 'react'

import { useYandexMap, type MapCoords } from '@/hooks/useYandexMap'

interface UseContactsMapProps {
	apiKey: string | undefined
	hasApiKey: boolean
	containerRef: React.RefObject<HTMLDivElement | null>
	coords: MapCoords | null
}

export const useContactsMap = ({
	apiKey,
	hasApiKey,
	containerRef,
	coords
}: UseContactsMapProps) => {
	const stableCoords = useMemo(() => coords, [coords?.latitude, coords?.longitude])

	useYandexMap({
		apiKey,
		hasApiKey,
		containerRef,
		initialCoords: stableCoords,
		interactive: false
	})
}
