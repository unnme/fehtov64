import { createFileRoute } from '@tanstack/react-router'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'

export const Route = createFileRoute('/docs/financial')({
	component: DocsFinancial,
	head: () => ({
		meta: [
			{
				title: 'Финансовые документы - Документы'
			}
		]
	})
})

function DocsFinancial() {
	return (
		<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			<div className="w-full space-y-6 sm:space-y-8">
				<div className="space-y-2 sm:space-y-4">
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
						Финансовые документы
					</h1>
					<p className="text-base sm:text-lg text-muted-foreground">
						Финансово-хозяйственная деятельность, госзадание и платные услуги
					</p>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Финансово-хозяйственная деятельность</CardTitle>
							<CardDescription>
								Отчеты о финансовой деятельности
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Годовые отчеты о финансово-хозяйственной деятельности с
								указанием доходов и расходов. Отчеты о целевом использовании
								бюджетных средств и внебюджетных поступлений. Информация о
								материально-техническом обеспечении и использовании имущества
								организации.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Госзадание</CardTitle>
							<CardDescription>Государственное задание</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Государственное задание на оказание государственных услуг в
								сфере физической культуры и спорта. Показатели объема и качества
								выполнения государственного задания. Отчеты о выполнении
								государственного задания с указанием достигнутых результатов.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Платные образовательные услуги</CardTitle>
							<CardDescription>Информация о платных услугах</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Перечень платных образовательных услуг, предоставляемых
								организацией сверх государственного задания. Тарифы на платные
								услуги, порядок их оказания и расчетов. Договоры на оказание
								платных образовательных услуг и правила их заключения.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	)
}
