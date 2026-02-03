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
	'/about': { label: 'Сведения об образовательной организации', parent: '/' },
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
	'/persons': { label: 'Персонал', parent: '/dashboard' }
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

const ABOUT_SECTIONS: Record<string, string> = {
	basic: 'Основные сведения',
	vacancies: 'Вакансии',
	education: 'Образовательный процесс',
	staff: 'Кадры'
}

const STAFF_SUBSECTIONS: Record<string, string> = {
	leadership: 'Руководство',
	teachers: 'Педагогический состав'
}

export function Breadcrumbs() {
	const router = useRouterState()
	const currentPath = router.location.pathname
	const currentSearch = router.location.search as {
		category?: string
		section?: string
		subsection?: string
	}
	const selectedDocsCategory =
		currentPath === '/docs' && typeof currentSearch.category === 'string'
			? currentSearch.category.trim()
			: ''
	const selectedAboutSection =
		currentPath === '/about' && typeof currentSearch.section === 'string'
			? currentSearch.section.trim()
			: ''
	const selectedAboutSubsection =
		currentPath === '/about' &&
		selectedAboutSection === 'staff' &&
		typeof currentSearch.subsection === 'string'
			? currentSearch.subsection.trim()
			: ''
	const isNewsDetails = currentPath.startsWith('/news/') && currentPath !== '/news'

	// Don't show breadcrumbs on home page
	if (currentPath === '/') {
		return null
	}

	const breadcrumbs = buildBreadcrumbs(currentPath)

	let resolvedBreadcrumbs = breadcrumbs
	if (currentPath === '/docs' && selectedDocsCategory) {
		resolvedBreadcrumbs = [...breadcrumbs, { label: selectedDocsCategory }]
	} else if (currentPath === '/about') {
		const sectionLabel = selectedAboutSection
			? ABOUT_SECTIONS[selectedAboutSection] || selectedAboutSection
			: 'Основные сведения'
		if (selectedAboutSubsection) {
			const subsectionLabel =
				STAFF_SUBSECTIONS[selectedAboutSubsection] || selectedAboutSubsection
			resolvedBreadcrumbs = [
				...breadcrumbs,
				{ label: sectionLabel, href: '/about?section=staff' },
				{ label: subsectionLabel }
			]
		} else {
			resolvedBreadcrumbs = [...breadcrumbs, { label: sectionLabel }]
		}
	}

	const newsBreadcrumbs = isNewsDetails
		? [...buildBreadcrumbs('/news'), { label: 'Новость' }]
		: resolvedBreadcrumbs

	if (newsBreadcrumbs.length === 0) {
		return null
	}

	return (
		<Breadcrumb className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
			<BreadcrumbList className="flex-wrap">
				{newsBreadcrumbs.map((item, index) => {
					const isLast = index === newsBreadcrumbs.length - 1
					return (
						<React.Fragment key={`${item.href}-${index}`}>
							{index > 0 && (
								<BreadcrumbSeparator>
									<span className="text-foreground font-semibold">•</span>
								</BreadcrumbSeparator>
							)}
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
