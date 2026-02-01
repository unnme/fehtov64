import { createFileRoute, redirect } from '@tanstack/react-router'

import { UsersService } from '@/client'
import { Navbar } from '@/components/Common'
import { PublicNewsList } from '@/components/News/PublicNewsList'
import { isLoggedIn } from '@/hooks/useAuth'

export const Route = createFileRoute('/')({
	component: Landing,
	beforeLoad: async () => {
		if (typeof window === 'undefined') return

		const hostname = window.location.hostname

		// Dashboard subdomain requires authentication
		if (hostname.startsWith('dashboard.')) {
			if (isLoggedIn()) {
				try {
					await UsersService.usersReadUserMe()
					throw redirect({ to: '/dashboard' })
				} catch (error: unknown) {
					const err = error as { redirect?: boolean; status?: number }
					if (err?.redirect) throw error
					if (err?.status === 401 || err?.status === 403) {
						localStorage.removeItem('access_token')
						localStorage.removeItem('token_expires_at')
						throw redirect({ to: '/auth/login' })
					}
				}
			} else {
				throw redirect({ to: '/auth/login' })
			}
		}
		// Main domain shows public news (no redirect)
	},
	head: () => ({
		meta: [{ title: 'Welcome - FastAPI Cloud' }]
	})
})

function Landing() {
	return (
		<div className="flex min-h-screen flex-col bg-linear-to-b from-background to-muted/20">
			<Navbar />
			<main className="flex flex-1 flex-col">
				<section
					id="news-section"
					className="border-t bg-muted/30 py-8 sm:py-12"
				>
					<PublicNewsList />
				</section>
			</main>
		</div>
	)
}
