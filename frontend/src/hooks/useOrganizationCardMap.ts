import { useCallback, useRef, useState } from 'react'
import { UseFormSetValue } from 'react-hook-form'

import useCustomToast from '@/hooks/useCustomToast'
import { useYandexMap, type MapCoords } from '@/hooks/useYandexMap'
import { handleError } from '@/utils'
import type { YMaps } from '@/utils/yandexMaps'

import type { OrganizationCardFormData } from '@/schemas/organizationCard'

interface UseOrganizationCardMapProps {
	apiKey: string | undefined
	hasApiKey: boolean
	initialCoords: MapCoords | null
	mapContainerRef: React.RefObject<HTMLDivElement | null>
	setValue: UseFormSetValue<OrganizationCardFormData>
}

export const useOrganizationCardMap = ({
	apiKey,
	hasApiKey,
	initialCoords,
	mapContainerRef,
	setValue
}: UseOrganizationCardMapProps) => {
	const { showErrorToast } = useCustomToast()
	const [isGeocoding, setIsGeocoding] = useState(false)
	const setValueRef = useRef(setValue)
	setValueRef.current = setValue

	const reverseGeocode = useCallback(async (coords: MapCoords, ymaps: YMaps) => {
		setIsGeocoding(true)
		try {
			const response = await ymaps.geocode([coords.latitude, coords.longitude], {
				kind: 'house',
				results: 1
			})
			const geoObject = response.geoObjects.get(0)
			const address = geoObject?.getAddressLine?.()?.trim()
			if (address) {
				setValueRef.current('address', address, { shouldValidate: true })
			}
		} catch (error) {
			handleError.call(showErrorToast, error)
		} finally {
			setIsGeocoding(false)
		}
	}, [showErrorToast])

	const handleCoordsChange = useCallback((coords: MapCoords) => {
		setValueRef.current('latitude', coords.latitude, { shouldValidate: true })
		setValueRef.current('longitude', coords.longitude, { shouldValidate: true })

		if (ymapsRef.current) {
			reverseGeocode(coords, ymapsRef.current)
		}
	}, [reverseGeocode])

	const { isReady, setMarker, ymapsRef } = useYandexMap({
		apiKey,
		hasApiKey,
		containerRef: mapContainerRef,
		initialCoords,
		onCoordsChange: handleCoordsChange,
		interactive: true
	})

	const handleGetCurrentLocation = useCallback(() => {
		if (!navigator.geolocation) {
			showErrorToast('Геолокация не поддерживается вашим браузером')
			return
		}

		if (!isReady) {
			showErrorToast('Карта ещё загружается')
			return
		}

		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				const mapCoords = { latitude: coords.latitude, longitude: coords.longitude }
				setValueRef.current('latitude', coords.latitude, { shouldValidate: true })
				setValueRef.current('longitude', coords.longitude, { shouldValidate: true })
				setMarker(mapCoords)

				if (ymapsRef.current) {
					reverseGeocode(mapCoords, ymapsRef.current)
				}
			},
			(error) => {
				console.error('Geolocation error:', error)
				const messages: Record<number, string> = {
					1: 'Доступ к геолокации запрещён',
					2: 'Не удалось определить местоположение',
					3: 'Превышено время ожидания'
				}
				showErrorToast(messages[error.code] || 'Не удалось получить местоположение')
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
		)
	}, [isReady, setMarker, ymapsRef, reverseGeocode, showErrorToast])

	return {
		isGeocoding,
		isMapReady: isReady,
		handleGetCurrentLocation
	}
}
