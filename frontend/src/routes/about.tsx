import { createFileRoute } from '@tanstack/react-router'

import { Breadcrumbs } from '@/components/Common/Breadcrumbs'
import { Navbar } from '@/components/Common/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/about')({
	component: About,
	head: () => ({
		meta: [
			{
				title: 'О нас - Фехтовальный клуб'
			}
		]
	})
})

function About() {
	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<Breadcrumbs />
			<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="max-w-4xl mx-auto space-y-8">
					<div className="space-y-4">
						<h1 className="text-4xl font-bold tracking-tight">О нас</h1>
						<p className="text-lg text-muted-foreground">
							Информация о нашем фехтовальном клубе
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>История клуба</CardTitle>
								<CardDescription>
									Наша история и достижения
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Здесь будет размещена информация об истории создания клуба,
									ключевых вехах развития и значимых достижениях.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Миссия и ценности</CardTitle>
								<CardDescription>
									Наши цели и принципы
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Описание миссии клуба, основных ценностей и принципов работы.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Достижения</CardTitle>
								<CardDescription>
									Награды и успехи
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Информация о наградах, медалях и достижениях наших спортсменов.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Тренерский состав</CardTitle>
								<CardDescription>
									Наши тренеры
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Информация о квалифицированных тренерах и их опыте работы.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	)
}
