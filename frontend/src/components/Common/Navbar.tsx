import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDown, Menu } from 'lucide-react'

import { Appearance } from '@/components/Common/Appearance'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navigationItems = [
	{ href: '/', label: 'Главная', id: 'nav-home' },
	{ href: '/about', label: 'О нас', id: 'nav-about' },
	{
		href: '/docs',
		label: 'Документация',
		id: 'nav-docs',
		submenu: [
			{
				category: 'Правила и регламенты',
				label: 'Правила и регламенты',
				id: 'nav-docs-rules'
			},
			{
				category: 'Образовательные документы',
				label: 'Образовательные документы',
				id: 'nav-docs-education'
			},
			{
				category: 'Организационные документы',
				label: 'Организационные документы',
				id: 'nav-docs-organizational'
			},
			{
				category: 'Финансовые документы',
				label: 'Финансовые документы',
				id: 'nav-docs-financial'
			},
			{
				category: 'Правовые документы',
				label: 'Правовые документы',
				id: 'nav-docs-legal'
			}
		]
	},
	{ href: '/federation', label: 'Федерация', id: 'nav-federation' },
	{ href: '/contacts', label: 'Контакты', id: 'nav-contacts' }
]

const isActivePath = (path: string, currentPath: string): boolean => {
	if (path === '/') {
		return currentPath === '/'
	}
	return currentPath === path || currentPath.startsWith(path + '/')
}

export function Navbar() {
	const router = useRouterState()
	const currentPath = router.location.pathname
	const currentSearch = router.location.search as { category?: string }
	const activeDocsCategory =
		currentPath === '/docs' && typeof currentSearch.category === 'string'
			? currentSearch.category.trim()
			: ''
	const navItemBaseClass =
		'inline-flex items-center h-9 px-3 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md'

	return (
		<header
			className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
			role="banner"
		>
			<div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
				{/* Mobile Menu Button */}
				<Sheet>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden mr-2"
							aria-label="Open navigation menu"
						>
							<Menu className="h-6 w-6" strokeWidth={2.5} />
							<span className="sr-only">Открыть меню</span>
						</Button>
					</SheetTrigger>
					<SheetContent
						side="left"
						className="w-75 sm:w-100"
					>
						<SheetHeader>
							<SheetTitle>Навигация</SheetTitle>
						</SheetHeader>
						<nav
							className="mt-6"
							aria-label="Mobile navigation"
						>
							<ul
								className="flex flex-col gap-4"
								role="list"
							>
								{navigationItems.map(item => (
									<li
										key={item.id}
										role="listitem"
									>
										{item.submenu ? (
											<div className="space-y-2">
												<Link
													to={item.href}
													search={{}}
													className={cn(
														'block text-base font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-3 py-2',
														isActivePath(item.href, currentPath)
															? 'text-foreground'
															: 'text-muted-foreground'
													)}
												>
													{item.label}
												</Link>
												<ul className="ml-4 space-y-1">
													{item.submenu.map(subItem => (
														<li key={subItem.id}>
															<Link
																to={item.href}
																search={{ category: subItem.category }}
																className={cn(
																	'block text-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-3 py-1.5',
																	activeDocsCategory.toLowerCase() ===
																		subItem.category.toLowerCase()
																		? 'text-foreground font-medium'
																		: 'text-muted-foreground'
																)}
															>
																{subItem.label}
															</Link>
														</li>
													))}
												</ul>
											</div>
										) : (
											<Link
												to={item.href}
												className={cn(
													'block text-base font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-3 py-2',
													isActivePath(item.href, currentPath)
														? 'text-foreground'
														: 'text-muted-foreground'
												)}
												aria-current={
													isActivePath(item.href, currentPath)
														? 'page'
														: undefined
												}
											>
												{item.label}
											</Link>
										)}
									</li>
								))}
							</ul>
						</nav>
					</SheetContent>
				</Sheet>

				{/* Desktop Navigation */}
				<nav
					className="hidden md:flex items-center gap-6"
					aria-label="Main navigation"
				>
					<ul
						className="flex items-center gap-6 -ml-3"
						role="list"
					>
						{navigationItems.map(item => (
							<li
								key={item.id}
								role="listitem"
							>
								{item.submenu ? (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button
												className={cn(
													`${navItemBaseClass} gap-1`,
													isActivePath(item.href, currentPath)
														? 'text-foreground'
														: 'text-muted-foreground'
												)}
												aria-haspopup="true"
											>
												{item.label}
												<ChevronDown className="h-4 w-4" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="start">
											<DropdownMenuItem asChild>
												<Link
													to={item.href}
													search={{}}
													className={cn(
														'cursor-pointer',
														currentPath === item.href &&
															!activeDocsCategory &&
															'bg-accent'
													)}
												>
													Все документы
												</Link>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											{item.submenu.map(subItem => (
												<DropdownMenuItem
													key={subItem.id}
													asChild
												>
													<Link
														to={item.href}
														search={{ category: subItem.category }}
														className={cn(
															'cursor-pointer',
															activeDocsCategory.toLowerCase() ===
																subItem.category.toLowerCase() &&
																'bg-accent'
														)}
													>
														{subItem.label}
													</Link>
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								) : (
									<Link
										to={item.href}
										className={cn(
											navItemBaseClass,
											isActivePath(item.href, currentPath)
												? 'text-foreground'
												: 'text-muted-foreground'
										)}
										aria-current={
											isActivePath(item.href, currentPath) ? 'page' : undefined
										}
									>
										{item.label}
									</Link>
								)}
							</li>
						))}
					</ul>
				</nav>

				{/* Theme Toggle */}
				<div className="ml-auto">
					<Appearance />
				</div>
			</div>
		</header>
	)
}
