import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { File } from "lucide-react"
import { Suspense } from "react"

import { DataTable } from "@/components/Common/DataTable"
import { AddDocument, columns } from "@/components/Documents"
import PendingDocuments from "@/components/Pending/PendingDocuments"
import useAuth from "@/hooks/useAuth"
import { DocumentsService } from "@/services/documentsService"

function getDocumentsQueryOptions(categoryId?: string) {
  return {
    queryFn: () => DocumentsService.getDocuments(categoryId),
    queryKey: ["documents", categoryId],
  }
}

export const Route = createFileRoute("/_layout/documents")({
  component: Documents,
  head: () => ({
    meta: [
      {
        title: "Документы - FastAPI Cloud",
      },
    ],
  }),
})

function DocumentsTableContent() {
  const { user: currentUser } = useAuth()
  const { data: documents } = useSuspenseQuery(getDocumentsQueryOptions())

  // Filter documents - only show user's documents unless superuser
  const filteredDocuments = currentUser?.is_superuser
    ? documents.data
    : documents.data.filter((doc) => doc.owner_id === currentUser?.id)

  return <DataTable columns={columns} data={filteredDocuments} />
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
      <div className="flex items-center justify-between shrink-0 px-4 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <File className="h-6 w-6" />
            Документы
          </h1>
          <p className="text-muted-foreground">
            Управление документами и файлами
          </p>
        </div>
        <AddDocument />
      </div>
      <DocumentsTable />
    </div>
  )
}
