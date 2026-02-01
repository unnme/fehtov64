import { useCallback, useEffect, useRef, useState } from 'react'

import {
	loadYandexMaps,
	type YMapEvent,
	type YMapInstance,
	type YMaps,
	type YPlacemark
} from '@/utils/yandexMaps'

export interface MapCoords {
	latitude: number
	longitude: number
}

interface UseYandexMapProps {
	apiKey: string | undefined
	hasApiKey: boolean
	containerRef: React.RefObject<HTMLDivElement | null>
	initialCoords?: MapCoords | null
	onCoordsChange?: (coords: MapCoords) => void
	interactive?: boolean
}

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423]
const DEFAULT_ZOOM = 14
const MARKER_ZOOM = 17

export const useYandexMap = ({
	apiKey,
	hasApiKey,
	containerRef,
	initialCoords = null,
	onCoordsChange,
	interactive = true
}: UseYandexMapProps) => {
	const [isReady, setIsReady] = useState(false)

	const mapRef = useRef<YMapInstance | null>(null)
	const placemarkRef = useRef<YPlacemark | null>(null)
	const ymapsRef = useRef<YMaps | null>(null)

	// Store in ref so click handler always uses latest callback
	const onCoordsChangeRef = useRef(onCoordsChange)
	onCoordsChangeRef.current = onCoordsChange

	// Store initial coords in ref to avoid map recreation on change
	const initialCoordsRef = useRef(initialCoords)

	const setMarker = useCallback((coords: MapCoords, panTo = true) => {
		const map = mapRef.current
		const ymaps = ymapsRef.current
		if (!map || !ymaps) return false

		const position: [number, number] = [coords.latitude, coords.longitude]

		if (!placemarkRef.current) {
			const placemark = new ymaps.Placemark(position, {}, { preset: 'islands#redIcon' })
			placemarkRef.current = placemark
			map.geoObjects.add(placemark)
		} else {
			placemarkRef.current.geometry.setCoordinates(position)
		}

		if (panTo) {
			map.setCenter(position, MARKER_ZOOM)
		}

		return true
	}, [])

	useEffect(() => {
		if (!hasApiKey || !apiKey) return

		let isMounted = true
		let animationFrameId: number | null = null

		const initMap = async () => {
			const container = containerRef.current
			if (!container) {
				animationFrameId = requestAnimationFrame(initMap)
				return
			}

			if (mapRef.current) return

			try {
				const ymaps = await loadYandexMaps(apiKey)
				if (!isMounted) return

				ymapsRef.current = ymaps

				const coords = initialCoordsRef.current
				const center: [number, number] = coords
					? [coords.latitude, coords.longitude]
					: DEFAULT_CENTER
				const zoom = coords ? MARKER_ZOOM : DEFAULT_ZOOM

				const map = new ymaps.Map(container, {
					center,
					zoom,
					controls: ['zoomControl']
				})
				mapRef.current = map

				if (coords) {
					const placemark = new ymaps.Placemark(
						[coords.latitude, coords.longitude],
						{},
						{ preset: 'islands#redIcon' }
					)
					placemarkRef.current = placemark
					map.geoObjects.add(placemark)
				}

				if (interactive) {
					map.events.add('click', (event: YMapEvent) => {
						const eventCoords = event.get('coords')
						if (!Array.isArray(eventCoords) || eventCoords.length < 2) return

						const lat = Number(eventCoords[0])
						const lon = Number(eventCoords[1])
						if (!Number.isFinite(lat) || !Number.isFinite(lon)) return

						const newCoords = { latitude: lat, longitude: lon }
						const position: [number, number] = [lat, lon]
						if (!placemarkRef.current) {
							const placemark = new ymaps.Placemark(position, {}, { preset: 'islands#redIcon' })
							placemarkRef.current = placemark
							map.geoObjects.add(placemark)
						} else {
							placemarkRef.current.geometry.setCoordinates(position)
						}
						map.setCenter(position, MARKER_ZOOM)
						onCoordsChangeRef.current?.(newCoords)
					})
				}

				setIsReady(true)
			} catch (error) {
				console.error('Error loading Yandex Maps:', error)
			}
		}

		initMap()

		return () => {
			isMounted = false
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId)
			}
			if (mapRef.current) {
				mapRef.current.destroy()
				mapRef.current = null
				placemarkRef.current = null
				ymapsRef.current = null
				setIsReady(false)
			}
		}
	}, [hasApiKey, apiKey, containerRef, interactive])

	// Update marker when coords change externally (for read-only map)
	useEffect(() => {
		if (!initialCoords || !isReady) return
		setMarker(initialCoords)
	}, [initialCoords, isReady, setMarker])

	return {
		isReady,
		setMarker,
		mapRef,
		ymapsRef
	}
}
