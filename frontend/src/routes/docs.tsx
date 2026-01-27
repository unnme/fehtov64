import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { z } from 'zod'

import { Breadcrumbs, Navbar } from '@/components/Common'
import { FileTypeIcon } from '@/components/Documents/FileTypeIcon'
import { Button, buttonVariants } from '@/components/ui/button'
import {
	Pagination,
	PaginationContent,
	PaginationItem
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { getDocumentFileUrl } from '@/utils/fileUrls'
import type {
	DocumentCategoriesPublic,
	DocumentPublic,
	DocumentsPublic
} from '../client'

export const Route = createFileRoute('/docs')({
	component: DocsPage,
	validateSearch: z.object({
		category: z.string().optional(),
		page: z.preprocess(value => {
			if (value === undefined || value === null || value === '')
				return undefined
			const parsed = Number(value)
			return Number.isFinite(parsed) ? parsed : undefined
		}, z.number().int().positive().optional())
	})
})

type CategoryOption = {
	id: string
	name: string
}

const DOCS_PER_PAGE = 10

function formatFileSize(bytes: number) {
	if (!bytes) return '0 Б'
	const units = ['Б', 'КБ', 'МБ', 'ГБ']
	let size = bytes
	let unitIndex = 0
	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex += 1
	}
	return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[unitIndex]}`
}

async function fetchCategories(): Promise<DocumentCategoriesPublic> {
	const response = await fetch(
		`${import.meta.env.VITE_API_URL}/api/v1/documents/public/categories`
	)
	if (!response.ok) {
		throw new Error('Failed to fetch categories')
	}
	return response.json()
}

async function fetchDocuments(
	categoryId: string | null,
	skip: number,
	limit: number
): Promise<DocumentsPublic> {
	const queryParams = new URLSearchParams()
	if (categoryId) {
		queryParams.set('category_id', categoryId)
	}
	queryParams.set('skip', String(skip))
	queryParams.set('limit', String(limit))
	const query = queryParams.toString()
	const response = await fetch(
		`${import.meta.env.VITE_API_URL}/api/v1/documents/public?${query}`
	)
	if (!response.ok) {
		throw new Error('Failed to fetch documents')
	}
	return response.json()
}

function DocsPage() {
	const navigate = useNavigate({ from: '/docs' })
	const search = Route.useSearch()
	const { data: categoriesData } = useQuery({
		queryKey: ['public-document-categories'],
		queryFn: fetchCategories
	})
	const normalizedCategory = useMemo(() => {
		if (!search.category) return ''
		return search.category.trim()
	}, [search.category])
	const selectedCategoryId = useMemo(() => {
		if (!normalizedCategory) return null
		const match = categoriesData?.data.find(
			(category: DocumentCategoriesPublic['data'][number]) =>
				category.name.toLowerCase() === normalizedCategory.toLowerCase()
		)
		return match?.id ?? null
	}, [categoriesData, normalizedCategory])
	const currentPage = useMemo(() => search.page ?? 1, [search.page])
	const skip = (currentPage - 1) * DOCS_PER_PAGE
	const { data: documentsData, isLoading } = useQuery({
		queryKey: ['public-documents', selectedCategoryId, currentPage],
		queryFn: () => fetchDocuments(selectedCategoryId, skip, DOCS_PER_PAGE)
	})

	const categories = useMemo<CategoryOption[]>(() => {
		const base = categoriesData?.data ?? []
		return [
			{ id: 'all', name: 'Документы' },
			...base.map((category: DocumentCategoriesPublic['data'][number]) => ({
				id: category.id,
				name: category.name
			}))
		]
	}, [categoriesData])

	const documents = documentsData?.data ?? []
	const totalCount = documentsData?.count ?? documents.length
	const hasDocumentsData = Boolean(documentsData)
	const totalPages = hasDocumentsData
		? Math.max(1, Math.ceil(totalCount / DOCS_PER_PAGE))
		: 1
	const buildSearchForPage = (pageValue: number) => {
		const normalizedPage = Math.max(pageValue, 1)
		if (!hasDocumentsData) {
			return {
				...search,
				page: normalizedPage
			}
		}
		return {
			...search,
			page: Math.min(normalizedPage, totalPages)
		}
	}
	const handleCategorySelect = (category: CategoryOption) => {
		navigate({
			search: prev => ({
				...prev,
				category: category.id === 'all' ? undefined : category.name,
				page: 1
			})
		})
	}
	useEffect(() => {
		if (!hasDocumentsData) return
		if (currentPage <= totalPages) return
		navigate({
			search: prev => ({
				...prev,
				page: totalPages
			})
		})
	}, [currentPage, hasDocumentsData, navigate, totalPages])

	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<Breadcrumbs />
			<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<div className="w-full space-y-6">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
							Документы по категориям
						</h1>
					</div>
					<div className="grid gap-6 lg:grid-cols-[240px_1fr]">
						<div className="space-y-3">
							<div className="text-sm text-muted-foreground">
								Найдено: {documentsData?.count ?? 0}
							</div>
							<div className="space-y-2">
								{categories.map(category => {
									const isActive =
										category.id === 'all'
											? !normalizedCategory
											: normalizedCategory.toLowerCase() ===
												category.name.toLowerCase()
									return (
										<button
											key={category.id}
											type="button"
											aria-pressed={isActive}
											onClick={() => handleCategorySelect(category)}
											className={cn(
												'w-full text-left rounded-lg px-4 py-2 text-sm font-medium transition-colors border',
												isActive
													? 'bg-primary/10 text-primary border-primary/20'
													: 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
											)}
										>
											{category.name}
										</button>
									)
								})}
							</div>
						</div>
						<div className="space-y-2">
							{isLoading ? (
								<div className="text-muted-foreground text-sm py-6">
									Загрузка...
								</div>
							) : documents.length === 0 ? (
								<div className="text-muted-foreground text-sm py-6">
									Документы не найдены
								</div>
							) : (
								<div className="divide-y border rounded-xl">
									{documents.map((doc: DocumentPublic) => {
										const fileUrl = getDocumentFileUrl(doc.id)
										return (
											<div
												key={doc.id}
												className="flex items-center justify-between gap-4 px-4 py-3"
											>
												<div className="flex items-center gap-3 min-w-0">
													<div className="h-9 w-9 rounded-md border flex items-center justify-center">
														<FileTypeIcon
															mimeType={doc.mime_type}
															fileName={doc.file_name}
														/>
													</div>
													<div className="min-w-0">
														<p className="text-sm font-medium truncate">
															{doc.name}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-4">
													<span className="text-xs text-muted-foreground whitespace-nowrap">
														{formatFileSize(doc.file_size)}
													</span>
													<div className="flex items-center gap-2">
														<Button
															asChild
															variant="ghost"
															size="icon"
															className="h-8 w-8"
														>
															<a
																href={fileUrl}
																target="_blank"
																rel="noreferrer"
															>
																<Eye className="h-4 w-4" />
															</a>
														</Button>
														<Button
															asChild
															variant="ghost"
															size="icon"
															className="h-8 w-8"
														>
															<a
																href={fileUrl}
																download
															>
																<Download className="h-4 w-4" />
															</a>
														</Button>
													</div>
												</div>
											</div>
										)
									})}
								</div>
							)}
							{totalPages > 1 && (
								<Pagination className="pt-4">
									<PaginationContent>
										<PaginationItem>
											<Link
												to="/docs"
												search={buildSearchForPage(currentPage - 1)}
												aria-disabled={currentPage === 1}
												className={cn(
													buttonVariants({ variant: 'ghost', size: 'default' }),
													'gap-1 px-2.5 sm:pl-2.5',
													currentPage === 1 && 'pointer-events-none opacity-50'
												)}
											>
												<ChevronLeft className="h-4 w-4" />
												<span className="hidden sm:block">Назад</span>
											</Link>
										</PaginationItem>
										{Array.from(
											{ length: totalPages },
											(_, index) => index + 1
										).map(pageNum => (
											<PaginationItem key={pageNum}>
												<Link
													to="/docs"
													search={buildSearchForPage(pageNum)}
													aria-current={
														pageNum === currentPage ? 'page' : undefined
													}
													className={cn(
														buttonVariants({
															variant:
																pageNum === currentPage ? 'outline' : 'ghost',
															size: 'icon'
														})
													)}
												>
													{pageNum}
												</Link>
											</PaginationItem>
										))}
										<PaginationItem>
											<Link
												to="/docs"
												search={buildSearchForPage(currentPage + 1)}
												aria-disabled={currentPage === totalPages}
												className={cn(
													buttonVariants({ variant: 'ghost', size: 'default' }),
													'gap-1 px-2.5 sm:pr-2.5',
													currentPage === totalPages &&
														'pointer-events-none opacity-50'
												)}
											>
												<span className="hidden sm:block">Вперед</span>
												<ChevronRight className="h-4 w-4" />
											</Link>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
