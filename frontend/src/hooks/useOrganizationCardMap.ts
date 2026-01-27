import { useCallback, useEffect, useRef, useState } from 'react'
import { UseFormSetValue } from 'react-hook-form'

import useCustomToast from '@/hooks/useCustomToast'
import { handleError } from '@/utils'
import {
	loadYandexMaps,
	type YMapEvent,
	type YMapInstance,
	type YMaps,
	type YPlacemark
} from '@/utils/yandexMaps'

import type { OrganizationCardFormData } from '../schemas/organizationCard'
import type { OrganizationCard } from '../services/organizationCardService'

interface UseOrganizationCardMapProps {
	apiKey: string | undefined
	hasApiKey: boolean
	isLoading: boolean
	data: OrganizationCard | undefined
	mapContainerRef: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement>
	setValue: UseFormSetValue<OrganizationCardFormData>
	onGeocodeStart?: () => void
	onGeocodeEnd?: () => void
}

export const useOrganizationCardMap = ({
	apiKey,
	hasApiKey,
	isLoading,
	data,
	mapContainerRef,
	setValue,
	onGeocodeStart,
	onGeocodeEnd
}: UseOrganizationCardMapProps) => {
	const { showErrorToast } = useCustomToast()
	const [isGeocoding, setIsGeocoding] = useState(false)
	const mapRef = useRef<YMapInstance | null>(null)
	const placemarkRef = useRef<YPlacemark | null>(null)
	const ymapsRef = useRef<YMaps | null>(null)

	const handleReverseGeocode = useCallback(async (coords: {
		latitude: number
		longitude: number
	}) => {
		const ymapsInstance = ymapsRef.current
		if (!ymapsInstance) {
			showErrorToast('Карта еще не загрузилась')
			return
		}
		setIsGeocoding(true)
		onGeocodeStart?.()
		try {
			const response = await ymapsInstance.geocode(
				[coords.latitude, coords.longitude],
				{
					kind: 'house',
					results: 1
				}
			)
			const geoObject = response.geoObjects.get(0)
			const address = geoObject?.getAddressLine?.()?.trim()
			if (!address) {
				throw new Error('Адрес не найден')
			}
			setValue('address', address, { shouldValidate: true })
		} catch (error) {
			handleError.call(showErrorToast, error)
		} finally {
			setIsGeocoding(false)
			onGeocodeEnd?.()
		}
	}, [showErrorToast, setValue, onGeocodeStart, onGeocodeEnd])

	const updatePlacemark = useCallback((coords: { latitude: number; longitude: number }) => {
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
		mapInstance.setCenter(
			[coords.latitude, coords.longitude],
			17
		)
	}, [])

	const handleGetCurrentLocation = () => {
		if (!navigator.geolocation) {
			showErrorToast('Геолокация не поддерживается вашим браузером')
			return
		}

		const mapInstance = mapRef.current
		if (!mapInstance) {
			showErrorToast('Карта еще не загрузилась')
			return
		}

		navigator.geolocation.getCurrentPosition(
			position => {
				const { latitude, longitude } = position.coords
				setValue('latitude', latitude, {
					shouldValidate: true
				})
				setValue('longitude', longitude, {
					shouldValidate: true
				})
				updatePlacemark({ latitude, longitude })
				handleReverseGeocode({ latitude, longitude })
			},
			error => {
				console.error('Geolocation error:', error)
				showErrorToast('Не удалось получить ваше местоположение')
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0
			}
		)
	}

	useEffect(() => {
		if (isLoading) return
		if (!hasApiKey || !apiKey || mapRef.current) {
			return
		}

		const checkContainer = () => {
			const container = mapContainerRef.current
			if (!container) {
				requestAnimationFrame(checkContainer)
				return
			}

			let isMounted = true
			loadYandexMaps(apiKey)
				.then(ymapsInstance => {
					if (!isMounted || !mapContainerRef.current || mapRef.current) return
					ymapsRef.current = ymapsInstance
					const coordsFromData = data?.latitude && data?.longitude
						? { lat: data.latitude, lon: data.longitude }
						: null
					const initialCenter = coordsFromData
						? [coordsFromData.lat, coordsFromData.lon]
						: [55.751244, 37.618423]
					const initialZoom = coordsFromData ? 17 : 14
					const mapInstance = new ymapsInstance.Map(mapContainerRef.current, {
						center: initialCenter,
						zoom: initialZoom,
						controls: ['zoomControl']
					})
					mapRef.current = mapInstance
					mapInstance.events.add('click', (event: YMapEvent) => {
						const coords = event.get('coords')
						if (!Array.isArray(coords) || coords.length < 2) return
						const latitudeValue = Number(coords[0])
						const longitudeValue = Number(coords[1])
						if (
							!Number.isFinite(latitudeValue) ||
							!Number.isFinite(longitudeValue)
						) {
							return
						}
						setValue('latitude', latitudeValue, {
							shouldValidate: true
						})
						setValue('longitude', longitudeValue, {
							shouldValidate: true
						})
						updatePlacemark({
							latitude: latitudeValue,
							longitude: longitudeValue
						})
						handleReverseGeocode({
							latitude: latitudeValue,
							longitude: longitudeValue
						})
					})
					if (coordsFromData) {
						updatePlacemark({ 
							latitude: coordsFromData.lat, 
							longitude: coordsFromData.lon 
						})
					}
				})
				.catch(error => {
					console.error('Error loading Yandex Maps:', error)
					handleError.call(showErrorToast, error)
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
	}, [hasApiKey, apiKey, data, isLoading, mapContainerRef, setValue, updatePlacemark, handleReverseGeocode, showErrorToast])

	return {
		isGeocoding,
		handleGetCurrentLocation,
		updatePlacemark,
		handleReverseGeocode
	}
}
