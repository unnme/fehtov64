import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { File } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'

import {
	DocumentsService,
	type DocumentCategoriesPublic,
	type DocumentPublic,
	type DocumentsPublic
} from '@/client'
import { unwrapResponse } from '@/utils'
import { DataTable } from '@/components/Common'
import {
	AddDocument,
	columns,
	DocumentsFilters,
	ManageCategoriesDialog
} from '@/components/Documents'
import { PendingDocuments } from '@/components/Pending'

function getDocumentsQueryOptions(categoryId?: string) {
	return {
		queryFn: () =>
			unwrapResponse<DocumentsPublic>(
				DocumentsService.documentsReadDocuments({
					query: {
						category_id: categoryId || undefined,
						skip: 0,
						limit: 100
					}
				})
			),
		queryKey: ['documents', categoryId]
	}
}

export const Route = createFileRoute('/_layout/documents')({
	component: Documents,
	head: () => ({
		meta: [
			{
				title: 'Документы - FastAPI Cloud'
			}
		]
	})
})

function DocumentsTableContent() {
	const { data: documents } = useSuspenseQuery(getDocumentsQueryOptions())
	const { data: categories = { data: [], count: 0 } } =
		useQuery<DocumentCategoriesPublic>({
			queryKey: ['document-categories'],
			queryFn: () => unwrapResponse<DocumentCategoriesPublic>(
				DocumentsService.documentsReadCategories()
			)
		})

	const [filteredDocuments, setFilteredDocuments] = useState<DocumentPublic[]>(
		documents.data || []
	)

	// Update filtered documents when documents change
	useEffect(() => {
		setFilteredDocuments(documents.data || [])
	}, [documents.data])

	if (!documents.data || documents.data.length === 0) {
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground">
				<div className="text-center">
					<File className="h-12 w-12 mx-auto mb-4 opacity-50" />
					<p className="text-lg font-medium">Нет документов</p>
					<p className="text-sm">Загрузите документ, чтобы начать</p>
				</div>
			</div>
		)
	}

	return (
		<>
			<DocumentsFilters
				documents={documents.data}
				categories={categories.data}
				onFilterChange={setFilteredDocuments}
			/>
			{filteredDocuments.length === 0 ? (
				<div className="flex items-center justify-center h-64 text-muted-foreground">
					<div className="text-center">
						<File className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p className="text-lg font-medium">Документы не найдены</p>
						<p className="text-sm">Попробуйте изменить параметры поиска</p>
					</div>
				</div>
			) : (
				<DataTable
					columns={columns}
					data={filteredDocuments}
				/>
			)}
		</>
	)
}

function DocumentsTable() {
	return (
		<Suspense fallback={<PendingDocuments />}>
			<DocumentsTableContent />
		</Suspense>
	)
}

function Documents() {
	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between shrink-0 px-4 py-2 h-21">
				<div>
					<h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
						<File className="h-6 w-6" />
						Документы
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Управление документами и файлами
					</p>
				</div>
				<div className="flex items-center gap-2">
					<ManageCategoriesDialog />
					<AddDocument />
				</div>
			</div>
			<DocumentsTable />
		</div>
	)
}
