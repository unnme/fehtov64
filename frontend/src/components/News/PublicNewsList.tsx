import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'

import { ImagesService, NewsService, type NewsImagePublic, type NewsPublic, type NewsPublicList } from '@/client'
import { unwrapResponse } from '@/utils'
import { extractTextFromHTML } from '@/utils/html'
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
			<div className="w-32 h-24 sm:w-40 sm:h-28 bg-muted rounded-xl flex items-center justify-center animate-pulse shrink-0">
				<span className="text-xs text-muted-foreground">...</span>
			</div>
		)
	}

	if (!firstImage) {
		return (
			<div className="w-32 h-24 sm:w-40 sm:h-28 bg-muted/50 rounded-xl flex items-center justify-center shrink-0">
				<ImageIcon className="size-10 text-muted-foreground/30" />
			</div>
		)
	}

	const imageUrl = getImageFileUrl(newsId, firstImage.id)

	return (
		<div className="w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden bg-muted shrink-0">
			<img
				src={imageUrl}
				alt={firstImage.file_name}
				className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
				loading="lazy"
				onError={e => {
					const target = e.target as HTMLImageElement
					target.style.display = 'none'
					if (target.parentElement) {
						target.parentElement.className =
							'w-32 h-24 sm:w-40 sm:h-28 bg-muted rounded-xl flex items-center justify-center shrink-0'
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
			<div className="space-y-4 mb-8">
				{data.data.map((news: NewsPublic) => (
					<Link
						key={news.id}
						to="/news/$newsId"
						params={{ newsId: news.id }}
						className="group block"
					>
						<article className="flex gap-4 sm:gap-6 p-4 sm:p-5 rounded-xl border bg-card transition-colors hover:bg-muted/50 hover:border-primary/20">
							<NewsPreviewImage newsId={news.id} />
							<div className="flex-1 min-w-0 flex flex-col gap-3">
								<div className="space-y-1.5">
									<h2 className="font-semibold text-lg sm:text-xl leading-tight transition-colors group-hover:text-primary line-clamp-2">
										{news.title}
									</h2>
									{news.published_at && (
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<Calendar className="size-3.5" />
											<time dateTime={news.published_at}>
												{format(
													new Date(news.published_at),
													'd MMMM yyyy',
													{ locale: ru }
												)}
											</time>
										</div>
									)}
								</div>
								{(() => {
									const textContent = extractTextFromHTML(news.content || '')
									return textContent ? (
										<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
											{textContent}
										</p>
									) : null
								})()}
							</div>
						</article>
					</Link>
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
