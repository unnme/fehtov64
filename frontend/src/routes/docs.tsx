import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Download,
	Eye,
	Search,
	X
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

import { Breadcrumbs, Navbar } from '@/components/Common'
import { FileTypeIcon } from '@/components/Documents/FileTypeIcon'
import { SignaturePopover } from '@/components/Documents/SignaturePopover'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '@/components/ui/accordion'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Pagination,
	PaginationContent,
	PaginationItem
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import {
	canPreviewInBrowser,
	getDocumentFileUrl,
	getDocumentPreviewUrl
} from '@/utils/fileUrls'
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

async function fetchDocumentsByCategory(
	categoryId: string | null,
	limit: number
): Promise<DocumentsPublic> {
	const queryParams = new URLSearchParams()
	if (categoryId) {
		queryParams.set('category_id', categoryId)
	}
	queryParams.set('skip', '0')
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

interface DocumentItemProps {
	doc: DocumentPublic
	compact?: boolean
}

function DocumentItem({ doc, compact = false }: DocumentItemProps) {
	const previewUrl = getDocumentPreviewUrl(doc.id)
	const downloadUrl = getDocumentFileUrl(doc.id)

	if (compact) {
		return (
			<div className="flex items-center justify-between gap-3 py-3 px-2">
				<div className="flex items-center gap-3.5 min-w-0 flex-1">
					<div className="h-7 w-7 rounded-md border flex items-center justify-center shrink-0">
						<FileTypeIcon mimeType={doc.mime_type} fileName={doc.file_name} />
					</div>
					<span className="text-sm truncate">{doc.name}</span>
				</div>
				<div className="flex items-center shrink-0">
					<SignaturePopover documentId={doc.id} mimeType={doc.mime_type} />
					{canPreviewInBrowser(doc.mime_type) && (
						<Button asChild variant="ghost" size="icon" className="size-8">
							<a href={previewUrl} target="_blank" rel="noreferrer">
								<Eye className="size-4" />
							</a>
						</Button>
					)}
					<Button asChild variant="ghost" size="icon" className="size-8">
						<a href={downloadUrl} download>
							<Download className="size-4" />
						</a>
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="flex items-center justify-between gap-4 px-4 py-3">
			<div className="flex items-center gap-3 min-w-0">
				<div className="h-9 w-9 rounded-md border flex items-center justify-center shrink-0">
					<FileTypeIcon mimeType={doc.mime_type} fileName={doc.file_name} />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-medium truncate">{doc.name}</p>
				</div>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<SignaturePopover documentId={doc.id} mimeType={doc.mime_type} />
				{canPreviewInBrowser(doc.mime_type) && (
					<Button asChild variant="ghost" size="icon" className="h-8 w-8">
						<a href={previewUrl} target="_blank" rel="noreferrer">
							<Eye className="h-4 w-4" />
						</a>
					</Button>
				)}
				<Button asChild variant="ghost" size="icon" className="h-8 w-8">
					<a href={downloadUrl} download>
						<Download className="h-4 w-4" />
					</a>
				</Button>
				<span className="text-xs text-muted-foreground whitespace-nowrap min-w-[60px] text-right hidden sm:block">
					{formatFileSize(doc.file_size)}
				</span>
			</div>
		</div>
	)
}

const MOBILE_DOCS_PER_PAGE = 10

interface MobileCategoryAccordionProps {
	category: CategoryOption
	searchQuery: string
}

function MobileCategoryAccordion({
	category,
	searchQuery
}: MobileCategoryAccordionProps) {
	const categoryId = category.id === 'all' ? null : category.id
	const [limit, setLimit] = useState(MOBILE_DOCS_PER_PAGE)

	const { data: documentsData, isLoading } = useQuery({
		queryKey: ['public-documents-accordion', categoryId, limit],
		queryFn: () => fetchDocumentsByCategory(categoryId, limit)
	})

	const allDocuments = documentsData?.data ?? []
	const filteredDocuments = useMemo(() => {
		if (!searchQuery.trim()) return allDocuments
		const query = searchQuery.toLowerCase()
		return allDocuments.filter(
			doc =>
				doc.name.toLowerCase().includes(query) ||
				doc.file_name.toLowerCase().includes(query)
		)
	}, [allDocuments, searchQuery])

	const totalCount = documentsData?.count ?? 0
	const hasMore = allDocuments.length < totalCount

	const handleShowMore = () => {
		setLimit(prev => prev + MOBILE_DOCS_PER_PAGE)
	}

	return (
		<AccordionItem value={category.id} className="border-b">
			<AccordionTrigger className="px-3 py-3 text-sm font-medium hover:no-underline">
				<div className="flex items-center justify-between w-full pr-2">
					<span>{category.name}</span>
					{!isLoading && (
						<span className="text-xs text-muted-foreground">
							{searchQuery ? filteredDocuments.length : totalCount}
						</span>
					)}
				</div>
			</AccordionTrigger>
			<AccordionContent className="px-3 pb-3">
				{isLoading ? (
					<div className="text-muted-foreground text-sm py-2">Загрузка...</div>
				) : filteredDocuments.length === 0 ? (
					<div className="text-muted-foreground text-sm py-2">
						{searchQuery ? 'Ничего не найдено' : 'Документы не найдены'}
					</div>
				) : (
					<div className="space-y-3">
						<div className="divide-y">
							{filteredDocuments.map((doc: DocumentPublic) => (
								<DocumentItem key={doc.id} doc={doc} compact />
							))}
						</div>
						{hasMore && !searchQuery && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleShowMore}
								className="w-full"
							>
								<ChevronDown className="size-4 mr-1" />
								Показать ещё ({totalCount - allDocuments.length})
							</Button>
						)}
					</div>
				)}
			</AccordionContent>
		</AccordionItem>
	)
}

function DocsPage() {
	const navigate = useNavigate({ from: '/docs' })
	const search = Route.useSearch()
	const [searchQuery, setSearchQuery] = useState('')
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
			{ id: 'all', name: 'Все документы' },
			...base.map((category: DocumentCategoriesPublic['data'][number]) => ({
				id: category.id,
				name: category.name
			}))
		]
	}, [categoriesData])

	const allDocuments = documentsData?.data ?? []
	const filteredDocuments = useMemo(() => {
		if (!searchQuery.trim()) return allDocuments
		const query = searchQuery.toLowerCase()
		return allDocuments.filter(
			doc =>
				doc.name.toLowerCase().includes(query) ||
				doc.file_name.toLowerCase().includes(query)
		)
	}, [allDocuments, searchQuery])

	const totalCount = documentsData?.count ?? allDocuments.length
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
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
						Документы
					</h1>

					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Поиск по названию документа..."
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className="pl-9 pr-9"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery('')}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<X className="size-4" />
							</button>
						)}
					</div>

					{/* Mobile: Accordion view */}
					<div className="lg:hidden">
						<Accordion type="multiple" className="border rounded-xl">
							{categories.map(category => (
								<MobileCategoryAccordion
									key={category.id}
									category={category}
									searchQuery={searchQuery}
								/>
							))}
						</Accordion>
					</div>

					{/* Desktop: Sidebar + List view */}
					<div className="hidden lg:grid gap-6 lg:grid-cols-[240px_1fr]">
						<div className="space-y-3">
							<div className="text-sm text-muted-foreground">
								Найдено: {searchQuery ? filteredDocuments.length : (documentsData?.count ?? 0)}
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
							) : filteredDocuments.length === 0 ? (
								<div className="text-muted-foreground text-sm py-6">
									{searchQuery ? 'Ничего не найдено' : 'Документы не найдены'}
								</div>
							) : (
								<div className="divide-y border rounded-xl">
									{filteredDocuments.map((doc: DocumentPublic) => (
										<DocumentItem key={doc.id} doc={doc} />
									))}
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
