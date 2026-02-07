import { MapPin, MapPinned, Navigation } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type Control, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { FormLabel } from '@/components/ui/form'
import useCustomToast from '@/hooks/useCustomToast'
import { useYandexMap, type MapCoords } from '@/hooks/useYandexMap'
import { useYandexMapsApiKey } from '@/hooks/useYandexMapsApiKey'
import { type OrganizationCardFormData } from '@/schemas/organizationCard'
import { handleError } from '@/utils'
import type { YMaps } from '@/utils/yandexMaps'

interface AddressSectionProps {
	control: Control<OrganizationCardFormData>
	setValue: (
		name: keyof OrganizationCardFormData,
		value: OrganizationCardFormData[keyof OrganizationCardFormData]
	) => void
}

interface LocalAddress {
	address: string
	latitude: number | undefined
	longitude: number | undefined
}

export const AddressSection = ({ control, setValue }: AddressSectionProps) => {
	const { showErrorToast } = useCustomToast()
	const { apiKey, hasApiKey, rawKey } = useYandexMapsApiKey()
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isGeocoding, setIsGeocoding] = useState(false)
	const mapContainerRef = useRef<HTMLDivElement | null>(null)

	const [localData, setLocalData] = useState<LocalAddress>({
		address: '',
		latitude: undefined,
		longitude: undefined
	})

	const address = useWatch({ control, name: 'address' }) ?? ''
	const latitude = useWatch({ control, name: 'latitude' })
	const longitude = useWatch({ control, name: 'longitude' })

	const initialCoords = useMemo(() => {
		if (!localData.latitude || !localData.longitude) return null
		return { latitude: localData.latitude, longitude: localData.longitude }
	}, [localData.latitude, localData.longitude])

	const reverseGeocode = useCallback(
		async (coords: MapCoords, ymaps: YMaps) => {
			setIsGeocoding(true)
			try {
				const response = await ymaps.geocode([coords.latitude, coords.longitude], {
					kind: 'house',
					results: 1
				})
				const geoObject = response.geoObjects.get(0)
				const newAddress = geoObject?.getAddressLine?.()?.trim()
				if (newAddress) {
					setLocalData(prev => ({ ...prev, address: newAddress }))
				}
			} catch (error) {
				handleError.call(showErrorToast, error)
			} finally {
				setIsGeocoding(false)
			}
		},
		[showErrorToast]
	)

	const { isReady, setMarker, ymapsRef } = useYandexMap({
		apiKey,
		hasApiKey,
		containerRef: mapContainerRef,
		initialCoords,
		onCoordsChange: (coords: MapCoords) => {
			setLocalData(prev => ({
				...prev,
				latitude: coords.latitude,
				longitude: coords.longitude
			}))

			if (ymapsRef.current) {
				reverseGeocode(coords, ymapsRef.current)
			}
		},
		interactive: true,
		enabled: isDialogOpen
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
				const mapCoords = {
					latitude: coords.latitude,
					longitude: coords.longitude
				}
				setLocalData(prev => ({
					...prev,
					latitude: coords.latitude,
					longitude: coords.longitude
				}))
				setMarker(mapCoords)

				if (ymapsRef.current) {
					reverseGeocode(mapCoords, ymapsRef.current)
				}
			},
			error => {
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

	const handleOpen = () => {
		setLocalData({
			address,
			latitude,
			longitude
		})
		setIsDialogOpen(true)
	}

	const handleClose = () => {
		setIsDialogOpen(false)
	}

	const handleSave = () => {
		setValue('address', localData.address)
		setValue('latitude', localData.latitude)
		setValue('longitude', localData.longitude)
		handleClose()
	}

	useEffect(() => {
		if (isDialogOpen && isReady && localData.latitude && localData.longitude) {
			setMarker({ latitude: localData.latitude, longitude: localData.longitude }, true)
		}
	}, [isDialogOpen, isReady, localData.latitude, localData.longitude, setMarker])

	const getPreviewText = () => {
		if (!address) return 'Не указан'
		return address
	}

	return (
		<div className="space-y-2">
			<FormLabel className="flex items-center gap-2">
				<MapPin className="h-4 w-4" />
				Адрес организации
			</FormLabel>

			<Button
				type="button"
				variant="outline"
				className="w-full justify-start text-left h-auto min-h-[58px] py-2.5"
				onClick={handleOpen}
			>
				<div className="flex flex-col items-start gap-0.5 w-full min-w-0">
					<span className="text-xs text-muted-foreground whitespace-normal text-left" style={{ wordBreak: 'break-word' }}>
						{address || 'Адрес не указан'}
					</span>
				</div>
			</Button>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Адрес организации</DialogTitle>
						<DialogDescription>Укажите местоположение организации на карте.</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{localData.address ? (
							<div className="text-sm py-2 break-words">{localData.address}</div>
						) : (
							<div className="text-sm text-muted-foreground py-2">
								Выберите точку на карте
							</div>
						)}

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<MapPinned className="h-4 w-4" />
									<span>Укажите адрес на карте</span>
									{isGeocoding && (
										<span className="animate-pulse">· ищу адрес...</span>
									)}
								</div>
								{hasApiKey && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleGetCurrentLocation}
										disabled={!isReady}
										className="flex items-center gap-2"
									>
										<Navigation className="h-4 w-4" />
										Моё местоположение
									</Button>
								)}
							</div>

							<div className="overflow-hidden rounded-lg border h-72 w-full">
								{hasApiKey ? (
									<div ref={mapContainerRef} className="h-full w-full" />
								) : (
									<div className="h-full w-full flex flex-col items-center justify-center text-sm text-muted-foreground p-4">
										<div>Укажите VITE_YANDEX_MAPS_API_KEY в файле .env</div>
										<div className="text-xs mt-2 text-center opacity-50">
											Значение:{' '}
											{rawKey
												? `"${String(rawKey).slice(0, 20)}..."`
												: 'не задано'}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					<DialogFooter className="mt-4">
						<Button variant="ghost" onClick={handleClose}>
							Отменить
						</Button>
						<Button onClick={handleSave}>ОК</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
