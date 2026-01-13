import { createFileRoute } from '@tanstack/react-router'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'

export const Route = createFileRoute('/docs/legal')({
	component: DocsLegal,
	head: () => ({
		meta: [
			{
				title: 'Правовые документы - Документация'
			}
		]
	})
})

function DocsLegal() {
	return (
		<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			<div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
				<div className="space-y-2 sm:space-y-4">
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
						Правовые документы
					</h1>
					<p className="text-base sm:text-lg text-muted-foreground">
						Антикоррупционная политика, доступная среда и международное
						сотрудничество
					</p>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Антикоррупционная политика</CardTitle>
							<CardDescription>Меры противодействия коррупции</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Положение об антикоррупционной политике организации и кодекс
								этики работников. Меры по предупреждению коррупции, порядок
								уведомления о конфликте интересов. Информация о комиссии по
								противодействию коррупции и порядке рассмотрения обращений.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Доступная среда</CardTitle>
							<CardDescription>Обеспечение доступности</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Паспорт доступности объекта социальной инфраструктуры с
								указанием доступных элементов. План мероприятий по обеспечению
								доступности для инвалидов и маломобильных групп населения.
								Информация об адаптированных программах и условиях обучения для
								лиц с ограниченными возможностями здоровья.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Международное сотрудничество</CardTitle>
							<CardDescription>Международные связи</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Договоры о сотрудничестве с зарубежными спортивными
								организациями и федерациями фехтования. Информация о совместных
								проектах, обменах спортсменами и тренерами, участии в
								международных соревнованиях. Программы международного
								сотрудничества в области развития фехтования и обмена опытом.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	)
}
