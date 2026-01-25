import { Link, useRouterState } from '@tanstack/react-router'
import * as React from 'react'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

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
	'/users': { label: 'Пользователи', parent: '/dashboard' },
	'/persons': { label: 'Персонал', parent: '/dashboard' },
	'/positions': { label: 'Должности', parent: '/dashboard' }
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
		<Breadcrumb className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
			<BreadcrumbList className="flex-wrap">
				{breadcrumbs.map((item, index) => {
					const isLast = index === breadcrumbs.length - 1
					return (
						<React.Fragment key={`${item.href}-${index}`}>
							{index > 0 && <BreadcrumbSeparator />}
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage>{item.label}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link to={item.href || '/'}>{item.label}</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
						</React.Fragment>
					)
				})}
			</BreadcrumbList>
		</Breadcrumb>
	)
}
