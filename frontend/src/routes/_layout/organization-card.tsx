import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Building2, Clock, Link2, MapPin, MapPinned, Navigation, Phone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { PhoneInputField } from '@/components/OrganizationCard/PhoneInputField'
import { WorkHoursDialog } from '@/components/OrganizationCard/WorkHoursDialog'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import useAuth from '@/hooks/useAuth'
import useCustomToast from '@/hooks/useCustomToast'
import { useOrganizationCardMap } from '@/hooks/useOrganizationCardMap'
import { useYandexMapsApiKey } from '@/hooks/useYandexMapsApiKey'
import { OrganizationCardService } from '@/services/organizationCardService'
import { handleError } from '@/utils'
import {
	organizationCardSchema,
	type OrganizationCardFormData
} from '@/schemas/organizationCard'
import { formatPhone, normalizePhone } from '@/utils/phone'
import { formatWorkHoursPreview, stringToWorkHours, workHoursToString } from '@/utils/workHours'

export const Route = createFileRoute('/_layout/organization-card')({
	component: OrganizationCardPage,
	head: () => ({
		meta: [
			{
				title: 'Карточка организации - Панель управления'
			}
		]
	})
})

function OrganizationCardPage() {
	const { user: currentUser } = useAuth()
	const { showSuccessToast, showErrorToast } = useCustomToast()
	const { apiKey, hasApiKey, rawKey } = useYandexMapsApiKey()
	const mapContainerRef = useRef<HTMLDivElement | null>(null)
	const [isWorkHoursDialogOpen, setIsWorkHoursDialogOpen] = useState(false)

	const { data, isLoading, isError } = useQuery({
		queryKey: ['organization-card'],
		queryFn: () => OrganizationCardService.read(),
		retry: false
	})

	const form = useForm<OrganizationCardFormData>({
		resolver: zodResolver(organizationCardSchema),
		mode: 'onBlur',
		defaultValues: {
			name: '',
			phones: [{ value: '+7', description: undefined }],
			email: '',
			address: '',
			work_hours: { days: [] },
			vk_url: '',
			telegram_url: '',
			whatsapp_url: '',
			max_url: '',
			latitude: undefined,
			longitude: undefined
		}
	})

	const { fields, append, remove } = useFieldArray<OrganizationCardFormData>({
		control: form.control,
		name: 'phones'
	})

	const { isGeocoding, handleGetCurrentLocation, updatePlacemark } =
		useOrganizationCardMap({
			apiKey,
			hasApiKey,
			isLoading,
			data,
			mapContainerRef,
			setValue: form.setValue
		})

	const hasCard = Boolean(data)
	const latitude = form.watch('latitude')
	const longitude = form.watch('longitude')

	useEffect(() => {
		if (!data) return
		form.reset({
			name: data.name,
			phones:
				data.phones && data.phones.length > 0
					? data.phones.map(phone => {
						const normalized = normalizePhone(phone)
						if (!normalized) return { value: '+7', description: undefined }
						const phoneValue = normalized.phone.startsWith('+7') 
							? normalized.phone 
							: formatPhone(normalized.phone || '+7')
						return { value: phoneValue, description: normalized.description || undefined }
					})
					: [],
			email: data.email,
			address: data.address,
			work_hours: stringToWorkHours(data.work_hours),
			vk_url: data.vk_url || '',
			telegram_url: data.telegram_url || '',
			whatsapp_url: data.whatsapp_url || '',
			max_url: data.max_url || '',
			latitude: data.latitude ?? undefined,
			longitude: data.longitude ?? undefined
		})
	}, [data, form])

	useEffect(() => {
		if (!latitude || !longitude) return
		updatePlacemark({ latitude, longitude })
	}, [latitude, longitude, updatePlacemark])

	const mutation = useMutation({
		mutationFn: (payload: OrganizationCardFormData) => {
			const mappedPayload = {
				name: payload.name || '',
				phones: (payload.phones || []).map(phone => ({
					phone: phone.value || '',
					description: phone.description || null
				})),
				email: payload.email || '',
				address: payload.address || '',
				work_hours: payload.work_hours && payload.work_hours.days && payload.work_hours.days.length > 0 ? workHoursToString(payload.work_hours) : '',
				vk_url: payload.vk_url || null,
				telegram_url: payload.telegram_url || null,
				whatsapp_url: payload.whatsapp_url || null,
				max_url: payload.max_url || null,
				latitude: payload.latitude ?? null,
				longitude: payload.longitude ?? null
			}
			return hasCard
				? OrganizationCardService.update(mappedPayload)
				: OrganizationCardService.create(mappedPayload)
		},
		onSuccess: () => {
			showSuccessToast('Карточка организации сохранена')
		},
		onError: handleError.bind(showErrorToast)
	})

	const handleSubmit = (values: OrganizationCardFormData) => {
		mutation.mutate(values)
	}

	if (!currentUser?.is_superuser) {
		return (
			<div className="flex flex-col h-full">
				<div className="flex-1 flex items-center justify-center px-4">
					<p className="text-sm text-muted-foreground">
						Доступ только для суперпользователей
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between shrink-0 px-4 py-2">
				<div>
					<h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
						<Building2 className="h-6 w-6" />
						Карточка организации
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Контактные данные и ссылки организации
					</p>
				</div>
			</div>
			<div className="flex-1 overflow-auto px-4 pb-6">
				<Card>
					<CardHeader>
						<CardTitle>Основные данные</CardTitle>
						<CardDescription>
							Заполните карточку, чтобы информация отображалась на странице
							контактов
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="text-sm text-muted-foreground">Загрузка...</div>
						) : isError && !hasCard ? (
							<div className="text-sm text-muted-foreground">
								Карточка еще не создана
							</div>
						) : null}
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(handleSubmit)}
								className="space-y-6 w-full"
							>
								<div className="space-y-6">
									<div className="grid gap-4 md:grid-cols-2">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Название организации</FormLabel>
													<FormControl>
														<Input
															placeholder="Полное официальное название"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Email</FormLabel>
													<FormControl>
														<Input
															type="email"
															placeholder="email@example.com"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="space-y-3">
										<FormLabel className="flex items-center gap-2">
											<Phone className="h-4 w-4" />
											Телефоны
										</FormLabel>
										<div className="space-y-3">
											{fields.map((fieldItem, index) => (
												<PhoneInputField
													key={fieldItem.id}
													control={form.control}
													index={index}
													field={fieldItem}
													remove={remove}
												/>
											))}
										</div>
										<Button
											type="button"
											variant="secondary"
											onClick={() => append({ value: '+7', description: undefined })}
										>
											Добавить телефон
										</Button>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<FormField
											control={form.control}
											name="vk_url"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="flex items-center gap-2">
														<Link2 className="h-4 w-4" />
														ВКонтакте
													</FormLabel>
													<FormControl>
														<Input
															placeholder="https://vk.com/group_name"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="telegram_url"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="flex items-center gap-2">
														<Link2 className="h-4 w-4" />
														Telegram
													</FormLabel>
													<FormControl>
														<Input
															placeholder="https://t.me/username"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="whatsapp_url"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="flex items-center gap-2">
														<Link2 className="h-4 w-4" />
														WhatsApp
													</FormLabel>
													<FormControl>
														<Input
															placeholder="https://wa.me/79001234567"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="max_url"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="flex items-center gap-2">
														<Link2 className="h-4 w-4" />
														Мессенджер Max
													</FormLabel>
													<FormControl>
														<Input
															placeholder="https://max.ru/username"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>

								<FormField
									control={form.control}
									name="work_hours"
									render={({ field }) => {
										const preview = field.value ? formatWorkHoursPreview(field.value) : ''
										return (
											<FormItem>
												<FormLabel className="flex items-center gap-2">
													<Clock className="h-4 w-4" />
													Режим работы
												</FormLabel>
												<FormControl>
													<Button
														type="button"
														variant="outline"
														className="w-full justify-start text-left h-auto py-3"
														onClick={() => setIsWorkHoursDialogOpen(true)}
													>
														<div className="flex flex-col items-start gap-1 w-full">
															<span className="text-sm font-medium">
																{preview || 'Настроить рабочие дни и время'}
															</span>
															{preview && (
																<span className="text-xs text-muted-foreground">
																	Нажмите для редактирования
																</span>
															)}
														</div>
													</Button>
												</FormControl>
												<FormMessage />
												<WorkHoursDialog
													value={field.value}
													onChange={field.onChange}
													isOpen={isWorkHoursDialogOpen}
													onOpenChange={setIsWorkHoursDialogOpen}
												/>
											</FormItem>
										)
									}}
								/>

								<div className="space-y-4">
									<FormField
										control={form.control}
										name="address"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="flex items-center gap-2">
													<MapPin className="h-4 w-4" />
													Адрес организации
												</FormLabel>
												<FormControl>
													<div className="relative">
														<Input
															{...field}
															readOnly
															value={field.value || ''}
															className="absolute opacity-0 pointer-events-none h-0 p-0 border-0"
														/>
														{field.value ? (
															<div className="text-sm py-2 whitespace-normal" style={{ wordBreak: 'break-word' }}>
																{field.value}
															</div>
														) : (
															<div className="text-sm text-muted-foreground py-2">
																Выберите точку на карте
															</div>
														)}
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<MapPinned className="h-4 w-4" />
												<span>Укажите адрес на карте</span>
												{isGeocoding && <span>· ищу адрес...</span>}
											</div>
											{hasApiKey && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={handleGetCurrentLocation}
													className="flex items-center gap-2"
												>
													<Navigation className="h-4 w-4" />
													Мое местоположение
												</Button>
											)}
										</div>
										<div className="overflow-hidden rounded-lg border h-72 w-full">
											{hasApiKey ? (
												<div
													ref={mapContainerRef}
													className="h-full w-full"
												/>
											) : (
												<div className="h-full w-full flex flex-col items-center justify-center text-sm text-muted-foreground p-4">
													<div>Укажите VITE_YANDEX_MAPS_API_KEY в файле .env</div>
													<div className="text-xs mt-2 text-center">
														<div>Значение: {rawKey ? `"${String(rawKey).substring(0, 20)}..."` : 'undefined'}</div>
														<div>Тип: {typeof rawKey}</div>
													</div>
												</div>
											)}
										</div>
									</div>
								</div>

								<div className="flex justify-end">
									<LoadingButton
										type="submit"
										loading={mutation.isPending}
									>
										Сохранить
									</LoadingButton>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
