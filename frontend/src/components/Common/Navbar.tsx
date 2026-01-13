import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu } from 'lucide-react'

import { Appearance } from '@/components/Common/Appearance'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from '@/components/ui/sheet'
import useAuth, { isLoggedIn } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

// Navigation items configuration
const navigationItems = [
	{ href: '/', label: 'Главная', id: 'nav-home' },
	{ href: '/about', label: 'О нас', id: 'nav-about' },
	{
		href: '/docs',
		label: 'Документация',
		id: 'nav-docs',
		submenu: [
			{
				href: '/docs/rules',
				label: 'Правила и регламенты',
				id: 'nav-docs-rules'
			},
			{
				href: '/docs/education',
				label: 'Образовательные документы',
				id: 'nav-docs-education'
			},
			{
				href: '/docs/organizational',
				label: 'Организационные документы',
				id: 'nav-docs-organizational'
			},
			{
				href: '/docs/financial',
				label: 'Финансовые документы',
				id: 'nav-docs-financial'
			},
			{ href: '/docs/legal', label: 'Правовые документы', id: 'nav-docs-legal' }
		]
	},
	{ href: '/federation', label: 'Федерация', id: 'nav-federation' },
	{ href: '/contacts', label: 'Контакты', id: 'nav-contacts' }
]

// Get user initials for avatar fallback
const getUserInitials = (
	fullName?: string | null,
	email?: string | null
): string => {
	if (fullName) {
		const parts = fullName.trim().split(/\s+/)
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
		}
		return fullName.substring(0, 2).toUpperCase()
	}
	if (email) {
		return email.substring(0, 2).toUpperCase()
	}
	return 'U'
}

// Check if path is active
const isActivePath = (path: string, currentPath: string): boolean => {
	if (path === '/') {
		return currentPath === '/'
	}
	return currentPath === path || currentPath.startsWith(path + '/')
}

export function Navbar() {
	const loggedIn = isLoggedIn()
	const { user, logout } = useAuth()
	const router = useRouterState()
	const currentPath = router.location.pathname

	return (
		<header
			className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
			role="banner"
		>
			<div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Desktop Navigation */}
				<nav
					className="hidden md:flex items-center gap-6"
					aria-label="Main navigation"
				>
					<ul
						className="flex items-center gap-6"
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
													'text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1 flex items-center gap-1',
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
													className={cn(
														'cursor-pointer',
														currentPath === item.href && 'bg-accent'
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
														to={subItem.href}
														className={cn(
															'cursor-pointer',
															currentPath === subItem.href && 'bg-accent'
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
											'text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1',
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

				{/* Actions */}
				<div className="flex items-center gap-4">
					{/* Theme toggle */}
					<Appearance />
					{loggedIn ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="relative h-9 w-9 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									aria-label="User menu"
									aria-haspopup="true"
								>
									<Avatar className="h-9 w-9">
										<AvatarImage
											src={undefined}
											alt={user?.full_name || 'User'}
										/>
										<AvatarFallback className="bg-primary text-primary-foreground">
											{getUserInitials(user?.full_name, user?.email)}
										</AvatarFallback>
									</Avatar>
									<span className="sr-only">Открыть меню пользователя</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-56"
							>
								<DropdownMenuLabel className="font-normal">
									<div className="flex flex-col space-y-1">
										{user?.full_name && (
											<p className="text-sm font-medium leading-none">
												{user.full_name}
											</p>
										)}
										{user?.email && (
											<p className="text-xs leading-none text-muted-foreground">
												{user.email}
											</p>
										)}
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link
										to="/dashboard"
										className="cursor-pointer"
									>
										<LayoutDashboard className="mr-2 h-4 w-4" />
										<span>Панель управления</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={logout}
									className="text-destructive focus:text-destructive cursor-pointer"
								>
									<LogOut className="mr-2 h-4 w-4" />
									<span>Выйти</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<div className="flex items-center gap-2">
							<Link to="/auth/login">
								<Button
									variant="ghost"
									className="gap-2"
								>
									<LogIn className="h-4 w-4" />
									<span>Войти</span>
								</Button>
							</Link>
						</div>
					)}

					{/* Mobile Menu */}
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="md:hidden"
								aria-label="Open navigation menu"
							>
								<Menu className="h-5 w-5" />
								<span className="sr-only">Открыть меню</span>
							</Button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="w-[300px] sm:w-[400px]"
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
																	to={subItem.href}
																	className={cn(
																		'block text-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-3 py-1.5',
																		currentPath === subItem.href
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
									{loggedIn && (
										<>
											<Separator />
											{user?.full_name && (
												<li className="px-3 py-2">
													<p className="text-sm font-medium">
														{user.full_name}
													</p>
													{user?.email && (
														<p className="text-xs text-muted-foreground">
															{user.email}
														</p>
													)}
												</li>
											)}
											<li>
												<Link
													to="/dashboard"
													className="block"
												>
													<Button
														variant="ghost"
														className="w-full justify-start gap-2"
													>
														<LayoutDashboard className="h-4 w-4" />
														<span>Панель управления</span>
													</Button>
												</Link>
											</li>
											<li>
												<Button
													variant="ghost"
													className="w-full justify-start gap-2 text-destructive hover:text-destructive"
													onClick={logout}
												>
													<LogOut className="h-4 w-4" />
													<span>Выйти</span>
												</Button>
											</li>
										</>
									)}
									{!loggedIn && (
										<>
											<Separator />
											<li>
												<Link
													to="/auth/login"
													className="block"
												>
													<Button
														variant="ghost"
														className="w-full justify-start gap-2"
													>
														<LogIn className="h-4 w-4" />
														<span>Войти</span>
													</Button>
												</Link>
											</li>
										</>
									)}
								</ul>
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	)
}
