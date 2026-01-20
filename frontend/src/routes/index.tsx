import { createFileRoute, redirect } from '@tanstack/react-router'

import { UsersService } from '@/client'
import { Navbar } from '@/components/Common/Navbar'
import { PublicNewsList } from '@/components/News/PublicNewsList'
import { isLoggedIn } from '@/hooks/useAuth'

export const Route = createFileRoute('/')({
	component: Landing,
	beforeLoad: async () => {
		// Check domain only on client side
		if (typeof window !== 'undefined') {
			const hostname = window.location.hostname
			
			// If this is dashboard subdomain
			if (hostname.startsWith('dashboard.')) {
				// Check authentication
				if (isLoggedIn()) {
					try {
						await UsersService.readUserMe()
						// Authenticated - redirect to dashboard
						throw redirect({ to: '/dashboard' })
					} catch (error: any) {
						// If this is already a redirect - pass it through
						if (error?.redirect) {
							throw error
						}
						// If token is invalid - redirect to login
						if (error?.status === 401 || error?.status === 403) {
							localStorage.removeItem('access_token')
							localStorage.removeItem('token_expires_at')
							throw redirect({ to: '/auth/login' })
						}
					}
				} else {
					// Not authenticated - redirect to login
					throw redirect({ to: '/auth/login' })
				}
			}
		}
		// For main domain (site.ru) show public news
	},
	head: () => ({
		meta: [
			{
				title: 'Welcome - FastAPI Cloud'
			}
		]
	})
})

// Landing page with public news list
function Landing() {
	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
			<Navbar />
			<main className="flex flex-1 flex-col">
				{/* Public news section */}
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
