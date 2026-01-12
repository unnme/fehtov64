import { createFileRoute } from '@tanstack/react-router'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

import { Breadcrumbs } from '@/components/Common/Breadcrumbs'
import { Navbar } from '@/components/Common/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

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
	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<Breadcrumbs />
			<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="max-w-6xl mx-auto space-y-8">
					<div className="space-y-4">
						<h1 className="text-4xl font-bold tracking-tight">Контакты</h1>
						<p className="text-lg text-muted-foreground">
							Свяжитесь с нами любым удобным способом
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<MapPin className="h-5 w-5" />
										Адрес
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										Укажите адрес вашего клуба
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Phone className="h-5 w-5" />
										Телефон
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										+7 (XXX) XXX-XX-XX
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Mail className="h-5 w-5" />
										Email
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										info@fencing-club.example.com
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Clock className="h-5 w-5" />
										Режим работы
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										Пн-Пт: 09:00 - 21:00<br />
										Сб-Вс: 10:00 - 18:00
									</p>
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader>
								<CardTitle>Форма обратной связи</CardTitle>
								<CardDescription>
									Отправьте нам сообщение
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="name">Имя</Label>
										<Input
											id="name"
											placeholder="Ваше имя"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											type="email"
											placeholder="your@email.com"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="message">Сообщение</Label>
										<Textarea
											id="message"
											placeholder="Ваше сообщение"
											rows={6}
											required
										/>
									</div>
									<Button type="submit" className="w-full">
										Отправить
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
