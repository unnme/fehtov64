import { useEffect, useRef, useState } from 'react'
import {
	loadYandexMaps,
	type YMapEvent,
	type YMapInstance,
	type YMaps,
	type YPlacemark
} from '@/utils/yandexMaps'

interface UseYandexMapProps {
	apiKey: string | undefined
	hasApiKey: boolean
	containerRef: React.RefObject<HTMLDivElement | null>
	initialCenter?: [number, number]
	initialZoom?: number
	onMapClick?: (coords: { latitude: number; longitude: number }) => void
	onPlacemarkUpdate?: (coords: { latitude: number; longitude: number }) => void
}

export const useYandexMap = ({
	apiKey,
	hasApiKey,
	containerRef,
	initialCenter = [55.751244, 37.618423],
	initialZoom = 14,
	onMapClick,
	onPlacemarkUpdate
}: UseYandexMapProps) => {
	const mapRef = useRef<YMapInstance | null>(null)
	const placemarkRef = useRef<YPlacemark | null>(null)
	const ymapsRef = useRef<YMaps | null>(null)

	const updatePlacemark = (coords: { latitude: number; longitude: number }) => {
		const mapInstance = mapRef.current
		const ymapsInstance = ymapsRef.current
		if (!mapInstance || !ymapsInstance) {
			console.warn('Map instance or YMaps instance not available')
			return
		}
		if (!placemarkRef.current) {
			const placemark = new ymapsInstance.Placemark(
				[coords.latitude, coords.longitude],
				{},
				{ preset: 'islands#redIcon' }
			)
			placemarkRef.current = placemark
			mapInstance.geoObjects.add(placemark)
		} else {
			placemarkRef.current.geometry.setCoordinates([
				coords.latitude,
				coords.longitude
			])
		}
		mapInstance.setCenter([coords.latitude, coords.longitude], 17)
		onPlacemarkUpdate?.(coords)
	}

	useEffect(() => {
		if (!hasApiKey || !apiKey || mapRef.current) return

		const checkContainer = () => {
			const container = containerRef.current
			if (!container) {
				requestAnimationFrame(checkContainer)
				return
			}

			let isMounted = true
			loadYandexMaps(apiKey)
				.then(ymapsInstance => {
					if (!isMounted || !containerRef.current || mapRef.current) return
					ymapsRef.current = ymapsInstance
					const mapInstance = new ymapsInstance.Map(containerRef.current, {
						center: initialCenter,
						zoom: initialZoom,
						controls: ['zoomControl']
					})
					mapRef.current = mapInstance
					
					if (onMapClick) {
						mapInstance.events.add('click', (event: YMapEvent) => {
							const coords = event.get('coords')
							if (!Array.isArray(coords) || coords.length < 2) return
							const latitude = Number(coords[0])
							const longitude = Number(coords[1])
							if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
								return
							}
							updatePlacemark({ latitude, longitude })
							onMapClick({ latitude, longitude })
						})
					}
				})
				.catch(error => {
					console.error('Error loading Yandex Maps:', error)
				})

			return () => {
				isMounted = false
			}
		}

		checkContainer()

		return () => {
			if (mapRef.current) {
				mapRef.current.destroy()
				mapRef.current = null
				placemarkRef.current = null
			}
		}
	}, [hasApiKey, apiKey, containerRef, initialCenter, initialZoom, onMapClick])

	return {
		mapRef,
		updatePlacemark
	}
}
