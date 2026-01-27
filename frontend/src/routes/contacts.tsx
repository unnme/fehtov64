import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
	Building2,
	Clock,
	Mail,
	MapPin,
	Phone
} from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Breadcrumbs, Navbar } from '@/components/Common'
import { ContactField } from '@/components/OrganizationCard/ContactField'
import { SocialLinks } from '@/components/OrganizationCard/SocialLinks'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { OrganizationCardService } from '@/services/organizationCardService'
import { formatPhoneDisplay, normalizePhone } from '@/utils/phone'
import { useYandexMap } from '@/hooks/useYandexMap'

export const Route = createFileRoute('/contacts')({
	component: Contacts,
	head: () => ({
		meta: [
			{
				title: 'Контакты - Фехтовальный клуб'
			}
		]
	})
})

function Contacts() {
	const rawKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY
	const apiKey =
		typeof rawKey === 'string' && rawKey.trim() ? rawKey.trim() : undefined
	const hasApiKey = Boolean(apiKey)

	const mapContainerRef = useRef<HTMLDivElement | null>(null)

	const { data, isLoading } = useQuery({
		queryKey: ['organization-card-public'],
		queryFn: () => OrganizationCardService.readPublic(),
		retry: false
	})

	const { updatePlacemark } = useYandexMap({
		apiKey,
		hasApiKey,
		containerRef: mapContainerRef,
		initialCenter: data?.latitude && data?.longitude
			? [data.latitude, data.longitude]
			: undefined,
		initialZoom: data?.latitude && data?.longitude ? 17 : 14
	})

	useEffect(() => {
		if (data?.latitude && data?.longitude) {
			updatePlacemark({
				latitude: data.latitude,
				longitude: data.longitude
			})
		}
	}, [data?.latitude, data?.longitude, updatePlacemark])

	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<Breadcrumbs />
			<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<div className="w-full space-y-6 sm:space-y-8">
					<div className="space-y-2 sm:space-y-4">
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
							Контакты
						</h1>
						<p className="text-base sm:text-lg text-muted-foreground">
							Свяжитесь с нами любым удобным способом
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr]">
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="text-xl">
										Контактная информация
									</CardTitle>
								</CardHeader>
								<CardContent className="p-0">
									{isLoading ? (
										<div className="flex items-center justify-center py-8 px-6">
											<p className="text-sm text-muted-foreground">
												Загрузка...
											</p>
										</div>
									) : data ? (
										<div className="space-y-6 px-6 py-6">
											{data.name && (
												<ContactField
													icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
													label="Организация"
												>
													<span className="block rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground">
														{data.name}
													</span>
												</ContactField>
											)}

											{data.address && (
												<ContactField
													icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
													label="Адрес"
												>
													{data.latitude && data.longitude ? (
														<a
															href={`https://yandex.ru/maps/?pt=${data.longitude},${data.latitude}&z=17`}
															target="_blank"
															rel="noopener noreferrer"
															className="block rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
														>
															{data.address}
														</a>
													) : (
														<span className="block rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground">
															{data.address}
														</span>
													)}
												</ContactField>
											)}

											{data.work_hours && (
												<ContactField
													icon={<Clock className="h-4 w-4 text-muted-foreground" />}
													label="Режим работы"
												>
													<span className="block rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground whitespace-pre-line">
														{data.work_hours}
													</span>
												</ContactField>
											)}

											{data?.phones?.length > 0 && (
												<ContactField
													icon={<Phone className="h-4 w-4 text-muted-foreground" />}
													label="Телефон"
												>
													<div className="space-y-2">
														{data.phones.map((phoneItem, index) => {
															const normalized = normalizePhone(phoneItem)
															if (!normalized || !normalized.phone) return null

															const cleanPhone = normalized.phone.replace(/\D/g, '')
															const telLink = `tel:+${cleanPhone}`

															return (
																<a
																	key={index}
																	href={telLink}
																	className="block rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
																>
																	<span className="flex items-center gap-2 flex-wrap">
																		<span>{formatPhoneDisplay(normalized.phone)}</span>
																		{normalized.description && (
																			<>
																				<span className="text-muted-foreground">—</span>
																				<span className="text-muted-foreground">
																					{normalized.description}
																				</span>
																			</>
																		)}
																	</span>
																</a>
															)
														})}
													</div>
												</ContactField>
											)}

											{data?.email && (
												<ContactField
													icon={<Mail className="h-4 w-4 text-muted-foreground" />}
													label="Email"
												>
													<a
														href={`mailto:${data.email}`}
														className="block rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
													>
														{data.email}
													</a>
												</ContactField>
											)}

											<SocialLinks
												vk_url={data.vk_url}
												telegram_url={data.telegram_url}
												whatsapp_url={data.whatsapp_url}
												max_url={data.max_url}
											/>
										</div>
									) : (
										<div className="flex items-center justify-center py-8 px-6">
											<p className="text-sm text-muted-foreground">
												Контактная информация не заполнена
											</p>
										</div>
									)}
								</CardContent>
							</Card>

							{data?.latitude && data?.longitude && (
								<Card>
									<CardHeader>
										<CardDescription className="flex items-center gap-2">
											<MapPin className="h-4 w-4 text-muted-foreground" />
											Наше местоположение на карте
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="h-52 w-full rounded-lg border-2 border-border overflow-hidden shadow-sm">
											{hasApiKey ? (
												<div
													ref={mapContainerRef}
													className="h-full w-full"
												/>
											) : (
												<div className="h-full w-full flex items-center justify-center bg-muted/30 text-sm text-muted-foreground">
													Укажите VITE_YANDEX_MAPS_API_KEY в файле .env
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							)}
						</div>

						<Card>
							<CardHeader>
								<CardTitle className="text-xl">Форма обратной связи</CardTitle>
								<CardDescription>
									Заполните форму, и мы свяжемся с вами в ближайшее время
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form className="space-y-5">
									<div className="space-y-2">
										<Label
											htmlFor="name"
											className="text-sm font-medium"
										>
											Имя
										</Label>
										<Input
											id="name"
											placeholder="Ваше имя"
											required
											className="h-10"
										/>
									</div>
									<div className="space-y-2">
										<Label
											htmlFor="email"
											className="text-sm font-medium"
										>
											Email
										</Label>
										<Input
											id="email"
											type="email"
											placeholder="your@email.com"
											required
											className="h-10"
										/>
									</div>
									<div className="space-y-2">
										<Label
											htmlFor="message"
											className="text-sm font-medium"
										>
											Сообщение
										</Label>
										<Textarea
											id="message"
											placeholder="Ваше сообщение"
											rows={6}
											required
											className="resize-none"
										/>
									</div>
									<Button
										type="submit"
										className="w-full"
										size="lg"
									>
										Отправить сообщение
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	)
}
