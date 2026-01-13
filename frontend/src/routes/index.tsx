import { createFileRoute } from '@tanstack/react-router'

import { Navbar } from '@/components/Common/Navbar'
import { PublicNewsList } from '@/components/News/PublicNewsList'

export const Route = createFileRoute('/')({
	component: Landing,
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
