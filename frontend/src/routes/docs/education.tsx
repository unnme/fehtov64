import { createFileRoute } from '@tanstack/react-router'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'

export const Route = createFileRoute('/docs/education')({
	component: DocsEducation,
	head: () => ({
		meta: [
			{
				title: 'Образовательные документы - Документация'
			}
		]
	})
})

function DocsEducation() {
	return (
		<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			<div className="w-full space-y-6 sm:space-y-8">
				<div className="space-y-2 sm:space-y-4">
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
						Образовательные документы
					</h1>
					<p className="text-base sm:text-lg text-muted-foreground">
						Образовательные программы, учебные планы и федеральные стандарты
					</p>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Образовательные программы</CardTitle>
							<CardDescription>Программы обучения</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Образовательные программы по фехтованию для различных возрастных
								групп и уровней подготовки. Программы начальной подготовки,
								учебно-тренировочные группы и группы спортивного
								совершенствования. Содержание программ включает техническую,
								тактическую и физическую подготовку спортсменов.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Учебные планы</CardTitle>
							<CardDescription>Планы учебного процесса</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Учебные планы с распределением часов по видам подготовки на
								каждый год обучения. Планы включают теоретические занятия,
								практические тренировки и соревновательную деятельность.
								Учитывают индивидуальные особенности спортсменов и требования
								федеральных стандартов.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Федеральные стандарты</CardTitle>
							<CardDescription>Стандарты спортивной подготовки</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Федеральные стандарты спортивной подготовки по виду спорта
								"фехтование". Стандарты определяют минимальные требования к
								содержанию и условиям реализации программ подготовки. Включают
								нормативы по физической подготовке, техническим навыкам и
								соревновательной практике.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	)
}
