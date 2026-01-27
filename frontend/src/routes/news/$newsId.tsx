import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { NewsImagePublic, NewsPublic } from '../../client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getImageFileUrl } from '@/utils/fileUrls'

export const Route = createFileRoute('/news/$newsId')({
	component: NewsDetails,
	head: () => ({
		meta: [
			{
				title: 'Новость - Фехтовальный клуб'
			}
		]
	})
})

async function fetchPublicNewsItem(newsId: string): Promise<NewsPublic> {
	const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/news/public/${newsId}`)
	if (!response.ok) {
		throw new Error('Failed to fetch news item')
	}
	return response.json()
}

function NewsDetails() {
	const { newsId } = Route.useParams()
	const [currentIndex, setCurrentIndex] = useState(0)
	const { data, isLoading, error } = useQuery({
		queryKey: ['publicNewsItem', newsId],
		queryFn: () => fetchPublicNewsItem(newsId)
	})

	const images = useMemo<NewsImagePublic[]>(() => {
		if (!data?.images) return []
		return [...data.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
	}, [data?.images])

	const initialIndex = useMemo(() => {
		if (images.length === 0) return 0
		const mainIndex = images.findIndex(image => image.is_main)
		return mainIndex >= 0 ? mainIndex : 0
	}, [images])

	useEffect(() => {
		setCurrentIndex(initialIndex)
	}, [initialIndex])

	const handlePrev = () => {
		if (images.length === 0) return
		setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
	}

	const handleNext = () => {
		if (images.length === 0) return
		setCurrentIndex(prev => (prev + 1) % images.length)
	}

	const handleSelect = (index: number) => {
		setCurrentIndex(index)
	}

	return (
		<div className="w-full space-y-6 sm:space-y-8">
			{isLoading ? (
				<Card>
					<CardContent className="p-6 space-y-4">
						<Skeleton className="h-7 w-2/3" />
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-32 w-full" />
					</CardContent>
				</Card>
			) : error || !data ? (
				<Card>
					<CardContent className="p-6 text-destructive">
						Не удалось загрузить новость
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="p-6 space-y-4">
						<div className="space-y-2">
							<h2 className="text-xl sm:text-2xl font-semibold">
								{data.title}
							</h2>
							{data.published_at && (
								<p className="text-sm text-muted-foreground">
									{format(new Date(data.published_at), 'd MMMM yyyy, HH:mm', {
										locale: ru
									})}
								</p>
							)}
						</div>

						<p className="text-muted-foreground whitespace-pre-wrap">
							{data.content}
						</p>

						<div className="space-y-3">
							{images.length === 0 ? (
								<div className="h-64 sm:h-80 rounded-xl border border-dashed bg-muted flex items-center justify-center">
									<div className="flex flex-col items-center gap-2 text-muted-foreground">
										<ImageIcon className="h-10 w-10" />
										<span className="text-sm">Фотографий нет</span>
									</div>
								</div>
							) : (
								<div className="space-y-3">
									<div className="relative rounded-xl border bg-muted/40 overflow-hidden">
										<img
											src={getImageFileUrl(data.id, images[currentIndex].id)}
											alt={images[currentIndex].file_name}
											className="h-64 sm:h-96 w-full object-contain"
											loading="lazy"
										/>
										{images.length > 1 ? (
											<>
												<div className="absolute inset-y-0 left-0 flex items-center p-3">
													<Button
														type="button"
														variant="secondary"
														size="icon"
														className="h-9 w-9"
														onClick={handlePrev}
														aria-label="Предыдущее фото"
													>
														<ChevronLeft className="h-5 w-5" />
													</Button>
												</div>
												<div className="absolute inset-y-0 right-0 flex items-center p-3">
													<Button
														type="button"
														variant="secondary"
														size="icon"
														className="h-9 w-9"
														onClick={handleNext}
														aria-label="Следующее фото"
													>
														<ChevronRight className="h-5 w-5" />
													</Button>
												</div>
											</>
										) : null}
									</div>
									{images.length > 1 ? (
										<div className="flex items-center justify-center gap-2">
											{images.map((image, index) => (
												<button
													key={image.id}
													type="button"
													onClick={() => handleSelect(index)}
													aria-label={`Фото ${index + 1}`}
													className={cn(
														'h-2.5 w-2.5 rounded-full transition-colors',
														index === currentIndex
															? 'bg-primary'
															: 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
													)}
												/>
											))}
										</div>
									) : null}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
