import { FileText, MapPinned, Navigation } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import useCustomToast from '@/hooks/useCustomToast'
import { useYandexMap, type MapCoords } from '@/hooks/useYandexMap'
import { useYandexMapsApiKey } from '@/hooks/useYandexMapsApiKey'
import { type OrganizationCardFormData } from '@/schemas/organizationCard'
import { handleError } from '@/utils'
import type { YMaps } from '@/utils/yandexMaps'

interface RequisitesSectionProps {
	control: Control<OrganizationCardFormData>
	setValue: (
		name: keyof OrganizationCardFormData,
		value: OrganizationCardFormData[keyof OrganizationCardFormData]
	) => void
}

interface LocalRequisites {
	legal_address: string
	legal_latitude: number | undefined
	legal_longitude: number | undefined
	inn: string
	kpp: string
	ogrn: string
	okpo: string
	okfs: string
	okogu: string
	okopf: string
	oktmo: string
	okato: string
	bank_recipient: string
	bank_account: string
	bank_bik: string
}

const REQUISITE_FIELDS = [
	{ key: 'inn' as const, label: 'ИНН', placeholder: '10 цифр', minLength: 10, maxLength: 10 },
	{ key: 'kpp' as const, label: 'КПП', placeholder: '9 цифр', minLength: 9, maxLength: 9 },
	{ key: 'ogrn' as const, label: 'ОГРН', placeholder: '13 цифр', minLength: 13, maxLength: 13 },
	{ key: 'okpo' as const, label: 'ОКПО', placeholder: '8 цифр', minLength: 8, maxLength: 8 },
	{ key: 'okfs' as const, label: 'ОКФС', placeholder: '2 цифры', minLength: 2, maxLength: 2 },
	{ key: 'okogu' as const, label: 'ОКОГУ', placeholder: '7 цифр', minLength: 7, maxLength: 7 },
	{ key: 'okopf' as const, label: 'ОКОПФ', placeholder: '5 цифр', minLength: 5, maxLength: 5 },
	{ key: 'oktmo' as const, label: 'ОКТМО', placeholder: '8-11 цифр', minLength: 8, maxLength: 11 },
	{ key: 'okato' as const, label: 'ОКАТО', placeholder: '11 цифр', minLength: 11, maxLength: 11 }
] as const

const BANK_FIELDS = [
	{ key: 'bank_account' as const, label: 'Расчётный счёт', placeholder: '20 цифр', minLength: 20, maxLength: 20 },
	{ key: 'bank_bik' as const, label: 'БИК', placeholder: '9 цифр', minLength: 9, maxLength: 9 }
] as const

type FieldKey = typeof REQUISITE_FIELDS[number]['key'] | typeof BANK_FIELDS[number]['key']
type ValidationErrors = Partial<Record<FieldKey, string>>

export const RequisitesSection = ({ control, setValue }: RequisitesSectionProps) => {
	const { showErrorToast } = useCustomToast()
	const { apiKey, hasApiKey, rawKey } = useYandexMapsApiKey()
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isGeocoding, setIsGeocoding] = useState(false)
	const mapContainerRef = useRef<HTMLDivElement | null>(null)

	const [localData, setLocalData] = useState<LocalRequisites>({
		legal_address: '',
		legal_latitude: undefined,
		legal_longitude: undefined,
		inn: '',
		kpp: '',
		ogrn: '',
		okpo: '',
		okfs: '',
		okogu: '',
		okopf: '',
		oktmo: '',
		okato: '',
		bank_recipient: '',
		bank_account: '',
		bank_bik: ''
	})
	const [errors, setErrors] = useState<ValidationErrors>({})

	const legal_address = useWatch({ control, name: 'legal_address' }) ?? ''
	const legal_latitude = useWatch({ control, name: 'legal_latitude' })
	const legal_longitude = useWatch({ control, name: 'legal_longitude' })
	const inn = useWatch({ control, name: 'inn' }) ?? ''
	const kpp = useWatch({ control, name: 'kpp' }) ?? ''
	const ogrn = useWatch({ control, name: 'ogrn' }) ?? ''
	const okpo = useWatch({ control, name: 'okpo' }) ?? ''
	const okfs = useWatch({ control, name: 'okfs' }) ?? ''
	const okogu = useWatch({ control, name: 'okogu' }) ?? ''
	const okopf = useWatch({ control, name: 'okopf' }) ?? ''
	const oktmo = useWatch({ control, name: 'oktmo' }) ?? ''
	const okato = useWatch({ control, name: 'okato' }) ?? ''
	const bank_recipient = useWatch({ control, name: 'bank_recipient' }) ?? ''
	const bank_account = useWatch({ control, name: 'bank_account' }) ?? ''
	const bank_bik = useWatch({ control, name: 'bank_bik' }) ?? ''

	const initialCoords = useMemo(() => {
		if (!localData.legal_latitude || !localData.legal_longitude) return null
		return { latitude: localData.legal_latitude, longitude: localData.legal_longitude }
	}, [localData.legal_latitude, localData.legal_longitude])

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
					setLocalData(prev => ({ ...prev, legal_address: newAddress }))
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
				legal_latitude: coords.latitude,
				legal_longitude: coords.longitude
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
					legal_latitude: coords.latitude,
					legal_longitude: coords.longitude
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
			legal_address,
			legal_latitude,
			legal_longitude,
			inn,
			kpp,
			ogrn,
			okpo,
			okfs,
			okogu,
			okopf,
			oktmo,
			okato,
			bank_recipient,
			bank_account,
			bank_bik
		})
		setErrors({})
		setIsDialogOpen(true)
	}

	const handleClose = () => {
		setIsDialogOpen(false)
	}

	const handleSave = () => {
		if (!validateFields()) return

		setValue('legal_address', localData.legal_address.trim())
		setValue('legal_latitude', localData.legal_latitude)
		setValue('legal_longitude', localData.legal_longitude)
		setValue('inn', localData.inn.trim())
		setValue('kpp', localData.kpp.trim())
		setValue('ogrn', localData.ogrn.trim())
		setValue('okpo', localData.okpo.trim())
		setValue('okfs', localData.okfs.trim())
		setValue('okogu', localData.okogu.trim())
		setValue('okopf', localData.okopf.trim())
		setValue('oktmo', localData.oktmo.trim())
		setValue('okato', localData.okato.trim())
		setValue('bank_recipient', localData.bank_recipient.trim())
		setValue('bank_account', localData.bank_account.trim())
		setValue('bank_bik', localData.bank_bik.trim())
		handleClose()
	}

	const handleFieldChange = (key: keyof LocalRequisites, value: string) => {
		setLocalData(prev => ({ ...prev, [key]: value }))
		// Clear error when user starts typing
		if (errors[key as FieldKey]) {
			setErrors(prev => ({ ...prev, [key]: undefined }))
		}
	}

	const validateFields = (): boolean => {
		const newErrors: ValidationErrors = {}
		const allFields = [...REQUISITE_FIELDS, ...BANK_FIELDS]

		for (const field of allFields) {
			const value = localData[field.key].replace(/\D/g, '')
			if (value.length > 0 && value.length < field.minLength) {
				newErrors[field.key] = `Минимум ${field.minLength} цифр`
			}
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const hasLegalAddress = legal_address?.trim()

	const getPreviewText = () => {
		const parts: string[] = []
		if (hasLegalAddress) parts.push(legal_address)
		if (inn) parts.push(`ИНН: ${inn}`)
		if (kpp) parts.push(`КПП: ${kpp}`)
		if (ogrn) parts.push(`ОГРН: ${ogrn}`)
		if (bank_account) parts.push(`Р/с: ${bank_account}`)

		if (parts.length === 0) return 'Реквизиты не заполнены'
		return parts.join(' • ')
	}

	return (
		<div className="space-y-2">
			<FormLabel className="flex items-center gap-2">
				<FileText className="h-4 w-4" />
				Реквизиты учреждения
			</FormLabel>

			<Button
				type="button"
				variant="outline"
				className="w-full justify-start text-left h-auto min-h-[58px] py-2.5"
				onClick={handleOpen}
			>
				<div className="flex flex-col items-start gap-0.5 w-full min-w-0">
					<span className="text-xs text-muted-foreground whitespace-normal text-left" style={{ wordBreak: 'break-word' }}>
						{getPreviewText()}
					</span>
				</div>
			</Button>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Реквизиты учреждения</DialogTitle>
						<DialogDescription>
							Укажите юридические и банковские реквизиты организации.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6">
						{/* Legal Address with Map */}
						<div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
							<span className="text-sm font-medium">Юридический адрес</span>

							{localData.legal_address ? (
								<div className="text-sm py-2 break-words">{localData.legal_address}</div>
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

								<div className="overflow-hidden rounded-lg border h-56 w-full">
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

						{/* Organization codes */}
						<div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
							<span className="text-sm font-medium">Коды организации</span>
							<div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
								{REQUISITE_FIELDS.map(field => (
									<div key={field.key} className="flex flex-col gap-1">
										<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
											{field.label}
										</span>
										<Input
											value={localData[field.key]}
											onChange={e => handleFieldChange(field.key, e.target.value)}
											placeholder={field.placeholder}
											maxLength={field.maxLength}
											inputMode="numeric"
											className={`h-10 ${errors[field.key] ? 'border-destructive' : ''}`}
										/>
										{errors[field.key] && (
											<span className="text-xs text-destructive">{errors[field.key]}</span>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Bank details */}
						<div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
							<span className="text-sm font-medium">Банковские реквизиты</span>
							<div className="space-y-3">
								<div className="flex flex-col gap-1">
									<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
										Получатель
									</span>
									<Textarea
										value={localData.bank_recipient}
										onChange={e => handleFieldChange('bank_recipient', e.target.value)}
										placeholder="Полное наименование получателя"
										className="resize-none"
										rows={2}
									/>
								</div>
								<div className="grid gap-3 grid-cols-2">
									{BANK_FIELDS.map(field => (
										<div key={field.key} className="flex flex-col gap-1">
											<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
												{field.label}
											</span>
											<Input
												value={localData[field.key]}
												onChange={e => handleFieldChange(field.key, e.target.value)}
												placeholder={field.placeholder}
												maxLength={field.maxLength}
												inputMode="numeric"
												className={`h-10 ${errors[field.key] ? 'border-destructive' : ''}`}
											/>
											{errors[field.key] && (
												<span className="text-xs text-destructive">{errors[field.key]}</span>
											)}
										</div>
									))}
								</div>
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
