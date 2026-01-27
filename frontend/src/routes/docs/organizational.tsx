import { createFileRoute } from '@tanstack/react-router'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'

export const Route = createFileRoute('/docs/organizational')({
	component: DocsOrganizational,
	head: () => ({
		meta: [
			{
				title: 'Организационные документы - Документация'
			}
		]
	})
})

function DocsOrganizational() {
	return (
		<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			<div className="w-full space-y-6 sm:space-y-8">
				<div className="space-y-2 sm:space-y-4">
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
						Организационные документы
					</h1>
					<p className="text-base sm:text-lg text-muted-foreground">
						Устав организации, лицензии, аккредитации и основные сведения
					</p>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Устав организации</CardTitle>
							<CardDescription>Основной документ организации</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Устав спортивной школы определяет цели, задачи и основные
								направления деятельности организации. Устанавливает структуру
								управления, права и обязанности участников образовательного
								процесса. Регламентирует порядок приема обучающихся, организацию
								учебно-тренировочного процесса и аттестации.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Лицензии и аккредитации</CardTitle>
							<CardDescription>Разрешительные документы</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Лицензия на осуществление образовательной деятельности, выданная
								уполномоченным органом. Свидетельство о государственной
								аккредитации образовательных программ. Документы подтверждают
								право организации на реализацию программ спортивной подготовки.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Основные сведения</CardTitle>
							<CardDescription>Общая информация об организации</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Основные сведения включают полное и сокращенное наименование
								организации, дату создания и регистрации. Информация об
								учредителе, юридическом адресе, контактных данных и режиме
								работы. Структура организации: руководство, педагогический
								состав, административно-хозяйственный персонал.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	)
}
