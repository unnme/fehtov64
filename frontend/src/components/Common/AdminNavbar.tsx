import { Link, useRouterState } from '@tanstack/react-router'
import {
	BadgeCheck,
	ChevronDown,
	File,
	FileText,
	IdCard,
	LogOut,
	Menu,
	Monitor,
	Moon,
	Newspaper,
	Settings,
	Sun,
	UserCheck,
	Users
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { UserPublic } from '@/client'
import { Logo } from '@/components/Common/Logo'
import { EditProfile } from '@/components/UserSettings'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from '@/components/ui/sheet'
import useAuth from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { type Theme, useTheme } from '@/providers/ThemeProvider'
import { getInitials } from '@/utils'

interface NavItem {
	icon: LucideIcon
	title: string
	path: string
}

interface NavCategory {
	icon: LucideIcon
	title: string
	items: NavItem[]
}

const contentCategory: NavCategory = {
	icon: FileText,
	title: 'Контент',
	items: [
		{ icon: Newspaper, title: 'Новости', path: '/manage-news' },
		{ icon: File, title: 'Документы', path: '/documents' }
	]
}

const adminCategory: NavCategory = {
	icon: Settings,
	title: 'Управление',
	items: [
		{ icon: Users, title: 'Пользователи', path: '/users' },
		{ icon: UserCheck, title: 'Персонал', path: '/persons' },
		{ icon: IdCard, title: 'Карточка организации', path: '/organization-card' }
	]
}

interface UserMenuProps {
	user: UserPublic | null | undefined
}

function UserMenu({ user }: UserMenuProps) {
	const { logout } = useAuth()
	const { setTheme, theme } = useTheme()

	if (!user) return null

	const handleLogout = () => {
		logout()
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="flex items-center gap-2 h-9 px-2"
					data-testid="user-menu"
				>
					<Avatar className="size-7">
						<AvatarFallback className="bg-zinc-600 text-white text-xs">
							{getInitials(user.nickname || 'User')}
						</AvatarFallback>
					</Avatar>
					<span className="hidden sm:inline text-sm font-medium">
						{user.nickname}
					</span>
					{user.is_superuser && (
						<BadgeCheck className="size-3.5 text-blue-500 hidden sm:block" />
					)}
					<ChevronDown className="size-4 text-muted-foreground" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium">{user.nickname}</p>
						<p className="text-xs text-muted-foreground">{user.email}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="gap-2 [&_svg]:text-muted-foreground">
						<Sun className="size-4" />
						Тема
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuRadioGroup
							value={theme}
							onValueChange={value => setTheme(value as Theme)}
						>
							<DropdownMenuRadioItem value="light">
								<Sun className="size-4" />
								Светлая
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="dark">
								<Moon className="size-4" />
								Темная
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="system">
								<Monitor className="size-4" />
								Системная
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<EditProfile />
				<DropdownMenuItem onClick={handleLogout}>
					<LogOut />
					Выйти
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

interface NavCategoryDropdownProps {
	category: NavCategory
	currentPath: string
}

function NavCategoryDropdown({ category, currentPath }: NavCategoryDropdownProps) {
	const CategoryIcon = category.icon
	const isActiveCategory = category.items.some(item => currentPath === item.path)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className={cn(
						'inline-flex items-center gap-2 h-9 px-3 text-sm font-medium',
						isActiveCategory ? 'text-foreground' : 'text-muted-foreground'
					)}
				>
					<CategoryIcon className="size-4" />
					{category.title}
					<ChevronDown className="size-3.5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				{category.items.map(item => {
					const Icon = item.icon
					const isActive = currentPath === item.path

					return (
						<DropdownMenuItem key={item.path} asChild>
							<Link
								to={item.path}
								className={cn(
									'flex items-center gap-2 w-full',
									isActive && 'bg-accent'
								)}
							>
								<Icon className="size-4" />
								{item.title}
							</Link>
						</DropdownMenuItem>
					)
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

interface MobileCategoryProps {
	category: NavCategory
	currentPath: string
}

function MobileCategory({ category, currentPath }: MobileCategoryProps) {
	return (
		<div className="space-y-1">
			<p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
				{category.title}
			</p>
			{category.items.map(item => {
				const Icon = item.icon
				const isActive = currentPath === item.path

				return (
					<Link
						key={item.path}
						to={item.path}
						className={cn(
							'flex items-center gap-3 text-base font-medium transition-colors hover:text-primary rounded-md px-3 py-2',
							isActive ? 'text-foreground bg-accent' : 'text-muted-foreground'
						)}
						aria-current={isActive ? 'page' : undefined}
					>
						<Icon className="size-4" />
						{item.title}
					</Link>
				)
			})}
		</div>
	)
}

export function AdminNavbar() {
	const { user: currentUser } = useAuth()
	const router = useRouterState()
	const currentPath = router.location.pathname

	const categories = [
		contentCategory,
		...(currentUser?.is_superuser ? [adminCategory] : [])
	]

	return (
		<header
			className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
			role="banner"
		>
			<div className="flex h-14 items-center px-4 sm:px-6">
				{/* Mobile Menu */}
				<Sheet>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="lg:hidden mr-2"
							aria-label="Open navigation menu"
						>
							<Menu className="size-5" />
							<span className="sr-only">Открыть меню</span>
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-72">
						<SheetHeader>
							<SheetTitle>Навигация</SheetTitle>
						</SheetHeader>
						<nav className="mt-6 space-y-4" aria-label="Mobile navigation">
							{categories.map(category => (
								<MobileCategory
									key={category.title}
									category={category}
									currentPath={currentPath}
								/>
							))}
						</nav>
					</SheetContent>
				</Sheet>

				{/* Logo */}
				<div className="mr-6">
					<Logo variant="icon" />
				</div>

				{/* Desktop Navigation */}
				<nav
					className="hidden lg:flex items-center flex-1"
					aria-label="Main navigation"
				>
					<div className="flex items-center gap-1">
						{categories.map(category => (
							<NavCategoryDropdown
								key={category.title}
								category={category}
								currentPath={currentPath}
							/>
						))}
					</div>
				</nav>

				{/* User Menu */}
				<div className="ml-auto">
					<UserMenu user={currentUser} />
				</div>
			</div>
		</header>
	)
}
