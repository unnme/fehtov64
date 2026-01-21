import { File, Home, Newspaper, Users } from 'lucide-react'

import { SidebarAppearance } from '@/components/Common/Appearance'
import { Logo } from '@/components/Common/Logo'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarTrigger
} from '@/components/ui/sidebar'
import useAuth from '@/hooks/useAuth'

import { type Item, Main } from './Main'
import { User } from './User'

const mainItems: Item[] = [
	{ icon: Home, title: 'Панель управления', path: '/dashboard' }
]

const contentItems: Item[] = [
	{ icon: Newspaper, title: 'Новости', path: '/manage-news' },
	{ icon: File, title: 'Документы', path: '/documents' }
]

const adminItems: Item[] = [
	{ icon: Users, title: 'Пользователи', path: '/users' }
]

export function AppSidebar() {
	const { user: currentUser } = useAuth()

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
				<div className="flex items-center justify-between w-full group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
					<Logo variant="responsive" />
					<SidebarTrigger className="text-muted-foreground" />
				</div>
			</SidebarHeader>
			<SidebarContent>
				<Main 
					mainItems={mainItems}
					contentItems={contentItems}
					adminItems={currentUser?.is_superuser ? adminItems : []}
				/>
			</SidebarContent>
			<SidebarFooter>
				<SidebarAppearance />
				<User user={currentUser} />
			</SidebarFooter>
		</Sidebar>
	)
}

export default AppSidebar
