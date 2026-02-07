import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Download, Eye } from "lucide-react"

import { type DocumentPublic } from "@/client"
import { Button } from "@/components/ui/button"
import { canPreviewInBrowser, getDocumentFileUrl, getDocumentPreviewUrl } from "@/utils/fileUrls"
import { DocumentsActionsMenu } from "./DocumentsActionsMenu"
import { FileTypeIcon } from "./FileTypeIcon"
import { SignaturePopover } from "./SignaturePopover"

export const columns: ColumnDef<DocumentPublic>[] = [
  {
    accessorKey: "name",
    header: "Название",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "category",
    header: "Категория",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.category?.name || "Без категории"}</span>
    ),
  },
  {
    accessorKey: "file_size",
    header: "Размер",
    cell: ({ row }) => {
      const size = row.original.file_size
      const mb = (size / 1024 / 1024).toFixed(2)
      return <span className="text-sm text-muted-foreground">{mb} MB</span>
    },
  },
  {
    accessorKey: "mime_type",
    header: "Тип",
    cell: ({ row }) => (
      <FileTypeIcon
        mimeType={row.original.mime_type}
        fileName={row.original.file_name}
      />
    ),
  },
  {
    accessorKey: "created_at",
    header: "Создан",
    cell: ({ row }) => {
      const createdAt = row.original.created_at
      return (
        <span className="text-sm text-muted-foreground/70">
          {format(new Date(createdAt), "dd.MM.yyyy")}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Действия</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1 justify-end">
        <SignaturePopover
          documentId={row.original.id}
          mimeType={row.original.mime_type}
        />
        {canPreviewInBrowser(row.original.mime_type) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <a
              href={getDocumentPreviewUrl(row.original.id)}
              target="_blank"
              rel="noreferrer"
            >
              <Eye className="h-4 w-4" />
            </a>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          asChild
        >
          <a href={getDocumentFileUrl(row.original.id)} download>
            <Download className="h-4 w-4" />
          </a>
        </Button>
        <DocumentsActionsMenu document={row.original} />
      </div>
    ),
  },
]
