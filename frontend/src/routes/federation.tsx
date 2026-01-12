import { createFileRoute } from '@tanstack/react-router'

import { Breadcrumbs } from '@/components/Common/Breadcrumbs'
import { Navbar } from '@/components/Common/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/federation')({
	component: Federation,
	head: () => ({
		meta: [
			{
				title: 'Федерация - Фехтовальный клуб'
			}
		]
	})
})

function Federation() {
	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<Breadcrumbs />
			<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="max-w-4xl mx-auto space-y-8">
					<div className="space-y-4">
						<h1 className="text-4xl font-bold tracking-tight">Федерация</h1>
						<p className="text-lg text-muted-foreground">
							Информация о федерации фехтования
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>О федерации</CardTitle>
								<CardDescription>
									Общая информация
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Информация о региональной федерации фехтования, её целях и задачах.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Руководство</CardTitle>
								<CardDescription>
									Руководящий состав
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Информация о руководстве федерации и их контактах.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Региональные отделения</CardTitle>
								<CardDescription>
									Структура федерации
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Информация о региональных отделениях и их расположении.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Контакты</CardTitle>
								<CardDescription>
									Как с нами связаться
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Контактная информация федерации для связи.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	)
}
