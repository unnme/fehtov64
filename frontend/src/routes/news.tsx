import { createFileRoute } from '@tanstack/react-router'

import { Breadcrumbs } from '@/components/Common/Breadcrumbs'
import { Navbar } from '@/components/Common/Navbar'
import { PublicNewsList } from '@/components/News/PublicNewsList'

export const Route = createFileRoute('/news')({
	component: News,
	head: () => ({
		meta: [
			{
				title: 'Новости - Фехтовальный клуб'
			}
		]
	})
})

function News() {
	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<Breadcrumbs />
			<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
					<div className="space-y-2 sm:space-y-4">
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Новости</h1>
						<p className="text-base sm:text-lg text-muted-foreground">
							Последние новости и события клуба
						</p>
					</div>
					<PublicNewsList />
				</div>
			</main>
		</div>
	)
}
