import { Link, useRouterState } from '@tanstack/react-router'
import { Menu } from 'lucide-react'

import { Appearance } from '@/components/Common/Appearance'
import { Button } from '@/components/ui/button'
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
	{ href: '/about', label: 'Сведения об образовательной организации', id: 'nav-about' },
	{ href: '/docs', label: 'Документы', id: 'nav-docs' },
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
							<Menu className="size-5" />
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
