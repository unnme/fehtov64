import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'

import { ImagesService, NewsService, type NewsImagePublic, type NewsPublic, type NewsPublicList } from '@/client'
import { unwrapResponse } from '@/utils'
import { extractTextFromHTML } from '@/utils/html'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { getImageFileUrl } from '@/utils/fileUrls'

const NEWS_PER_PAGE = 10

function NewsPreviewImage({ newsId }: { newsId: string }) {
	const { data: images = [], isLoading } = useQuery<NewsImagePublic[]>({
		queryKey: ['news', newsId, 'images'],
		queryFn: async () => {
			const result = await unwrapResponse<{ data: NewsImagePublic[] }>(
				ImagesService.imagesGetImages({ path: { news_id: newsId } })
			)
			return result.data
		},
		staleTime: 60000,
		retry: 1
	})

	const mainImage = images.find(img => img.is_main)
	const sortedImages = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
	const firstImage =
		mainImage || (sortedImages.length > 0 ? sortedImages[0] : null)

	if (isLoading) {
		return (
			<div className="w-32 h-32 sm:w-40 sm:h-40 bg-muted rounded-lg flex items-center justify-center animate-pulse shrink-0">
				<span className="text-xs text-muted-foreground">...</span>
			</div>
		)
	}

	if (!firstImage) {
		return (
			<div className="w-32 h-32 sm:w-40 sm:h-40 bg-muted rounded-lg border border-dashed flex items-center justify-center shrink-0">
				<ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/50" />
			</div>
		)
	}

	const imageUrl = getImageFileUrl(newsId, firstImage.id)

	return (
		<div className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden border bg-muted shrink-0">
			<img
				src={imageUrl}
				alt={firstImage.file_name}
				className="w-full h-full object-cover"
				loading="lazy"
				onError={e => {
					const target = e.target as HTMLImageElement
					target.style.display = 'none'
					if (target.parentElement) {
						target.parentElement.className =
							'w-32 h-32 sm:w-40 sm:h-40 bg-muted rounded-lg flex items-center justify-center flex-shrink-0'
						target.parentElement.innerHTML =
							'<span class="text-xs text-muted-foreground">Ошибка</span>'
					}
				}}
			/>
		</div>
	)
}

async function fetchPublicNews(
	skip: number,
	limit: number
): Promise<NewsPublicList> {
	return unwrapResponse(
		NewsService.newsReadPublicNews({ query: { skip, limit } })
	)
}

export function PublicNewsList() {
	const [page, setPage] = useState(1)
	const skip = (page - 1) * NEWS_PER_PAGE

	const { data, isLoading, error } = useQuery({
		queryKey: ['publicNews', page],
		queryFn: () => fetchPublicNews(skip, NEWS_PER_PAGE)
	})

	if (isLoading) {
		return (
			<div className="container py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
				<div className="text-center text-muted-foreground">
					Загрузка новостей...
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="container py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
				<div className="text-center text-destructive">
					Ошибка загрузки новостей
				</div>
			</div>
		)
	}

	if (!data || data.count === 0) {
		return (
			<div className="container py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
				<div className="text-center text-muted-foreground">
					Пока нет опубликованных новостей
				</div>
			</div>
		)
	}

	const totalPages = Math.ceil(data.count / NEWS_PER_PAGE)

	return (
		<div className="container py-6 sm:py-8 lg:py-12 mx-auto px-4 sm:px-6">
			<div className="space-y-4 sm:space-y-6 mb-8">
				{data.data.map((news: NewsPublic) => (
					<Card
						key={news.id}
						className="hover:shadow-lg transition-shadow"
					>
						<div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
							<NewsPreviewImage newsId={news.id} />
							<div className="flex-1 min-w-0">
								<CardHeader className="p-0 pb-3 sm:pb-4">
									<CardTitle className="text-xl sm:text-2xl mb-2">
										<Link
											to="/news/$newsId"
											params={{ newsId: news.id }}
											className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
										>
											{news.title}
										</Link>
									</CardTitle>
									<div className="space-y-1">
										{news.published_at && (
											<CardDescription>
												{format(
													new Date(news.published_at),
													'd MMMM yyyy, HH:mm',
													{
														locale: ru
													}
												)}
											</CardDescription>
										)}
									</div>
								</CardHeader>
								<CardContent className="p-0">
									{(() => {
										const textContent = extractTextFromHTML(news.content || '')
										return textContent ? (
											<p className="text-muted-foreground line-clamp-3">
												{textContent}
											</p>
										) : (
											<p className="text-muted-foreground line-clamp-3">...</p>
										)
									})()}
								</CardContent>
							</div>
						</div>
					</Card>
				))}
			</div>

			{totalPages > 1 && (
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href="#"
								onClick={e => {
									e.preventDefault()
									if (page > 1) setPage(page - 1)
								}}
								className={cn(page === 1 && 'pointer-events-none opacity-50')}
							/>
						</PaginationItem>
						{Array.from({ length: totalPages }, (_, i) => i + 1).map(
							pageNum => (
								<PaginationItem key={pageNum}>
									<PaginationLink
										href="#"
										onClick={e => {
											e.preventDefault()
											setPage(pageNum)
										}}
										isActive={pageNum === page}
									>
										{pageNum}
									</PaginationLink>
								</PaginationItem>
							)
						)}
						<PaginationItem>
							<PaginationNext
								href="#"
								onClick={e => {
									e.preventDefault()
									if (page < totalPages) setPage(page + 1)
								}}
								className={
									page === totalPages ? 'pointer-events-none opacity-50' : ''
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	)
}
