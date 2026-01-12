import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
	label: string
	href?: string
}

// Breadcrumb configuration for routes
const breadcrumbConfig: Record<string, { label: string; parent?: string }> = {
	'/': { label: 'Главная' },
	'/about': { label: 'О нас', parent: '/' },
	'/news': { label: 'Новости', parent: '/' },
	'/docs': { label: 'Документация', parent: '/' },
	'/docs/rules': { label: 'Правила и регламенты', parent: '/docs' },
	'/docs/education': { label: 'Образовательные документы', parent: '/docs' },
	'/docs/organizational': {
		label: 'Организационные документы',
		parent: '/docs'
	},
	'/docs/financial': { label: 'Финансовые документы', parent: '/docs' },
	'/docs/legal': { label: 'Правовые документы', parent: '/docs' },
	'/federation': { label: 'Федерация', parent: '/' },
	'/contacts': { label: 'Контакты', parent: '/' },
	'/dashboard': { label: 'Панель управления', parent: '/' },
	'/manage-news': { label: 'Управление новостями', parent: '/dashboard' },
	'/users': { label: 'Пользователи', parent: '/dashboard' }
}

// Build breadcrumb trail recursively
const buildBreadcrumbs = (path: string): BreadcrumbItem[] => {
	const items: BreadcrumbItem[] = []
	const config = breadcrumbConfig[path]

	if (!config) {
		return items
	}

	// Add current page
	items.push({ label: config.label, href: path })

	// Recursively add parent pages
	if (config.parent) {
		const parentItems = buildBreadcrumbs(config.parent)
		items.unshift(...parentItems)
	}

	return items
}

export function Breadcrumbs() {
	const router = useRouterState()
	const currentPath = router.location.pathname

	// Don't show breadcrumbs on home page
	if (currentPath === '/') {
		return null
	}

	const breadcrumbs = buildBreadcrumbs(currentPath)

	if (breadcrumbs.length === 0) {
		return null
	}

	return (
		<nav
			aria-label="Breadcrumb"
			className="container mx-auto px-4 sm:px-6 lg:px-8 py-4"
		>
			<ol
				className="flex items-center gap-2 text-sm text-muted-foreground"
				role="list"
			>
				{breadcrumbs.map((item, index) => {
					const isLast = index === breadcrumbs.length - 1
					return (
						<li
							key={`${item.href}-${index}`}
							className="flex items-center gap-2"
							role="listitem"
						>
							<ChevronRight className="h-4 w-4 text-muted-foreground/50" />
							{isLast ? (
								<span
									className="font-medium text-foreground"
									aria-current="page"
								>
									{item.label}
								</span>
							) : (
								<Link
									to={item.href || '/'}
									className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
								>
									{item.label}
								</Link>
							)}
						</li>
					)
				})}
			</ol>
		</nav>
	)
}
