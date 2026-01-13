import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'

import { Breadcrumbs } from '@/components/Common/Breadcrumbs'
import { Navbar } from '@/components/Common/Navbar'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { BookOpen, Building2, DollarSign, FileText, Scale } from 'lucide-react'

export const Route = createFileRoute('/docs')({
	component: DocsLayout
})

const docCategories = [
	{
		href: '/docs/rules',
		label: 'Правила и регламенты',
		description:
			'Правила фехтования, регламенты соревнований, судейские правила',
		icon: FileText
	},
	{
		href: '/docs/education',
		label: 'Образовательные документы',
		description:
			'Образовательные программы, учебные планы, федеральные стандарты',
		icon: BookOpen
	},
	{
		href: '/docs/organizational',
		label: 'Организационные документы',
		description: 'Устав организации, лицензии, основные сведения',
		icon: Building2
	},
	{
		href: '/docs/financial',
		label: 'Финансовые документы',
		description:
			'Финансово-хозяйственная деятельность, госзадание, платные услуги',
		icon: DollarSign
	},
	{
		href: '/docs/legal',
		label: 'Правовые документы',
		description:
			'Антикоррупционная политика, доступная среда, международное сотрудничество',
		icon: Scale
	}
]

function DocsLayout() {
	const router = useRouterState()
	const navigate = useNavigate()
	const currentPath = router.location.pathname
	const isIndexPage = currentPath === '/docs' || currentPath === '/docs/'

	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<Breadcrumbs />
			{isIndexPage ? (
				<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
					<div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
						<div className="space-y-2 sm:space-y-4">
							<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Документация</h1>
							<p className="text-base sm:text-lg text-muted-foreground">
								Все документы организации в одном месте
							</p>
						</div>

						<div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
							{docCategories.map(category => {
								const Icon = category.icon
								return (
									<Card
										key={category.href}
										className="h-full transition-all hover:shadow-md hover:border-primary cursor-pointer group"
										onClick={() => navigate({ to: category.href })}
										onKeyDown={e => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault()
												navigate({ to: category.href })
											}
										}}
										tabIndex={0}
										role="button"
										aria-label={`Перейти к ${category.label}`}
									>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<Icon className="h-5 w-5 text-primary" />
												{category.label}
											</CardTitle>
										</CardHeader>
										<CardContent>
											<CardDescription>{category.description}</CardDescription>
										</CardContent>
									</Card>
								)
							})}
						</div>
					</div>
				</main>
			) : (
				<Outlet />
			)}
		</div>
	)
}
