import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { Image as ImageIcon } from "lucide-react"

import type { NewsPublic } from "@/client"
import { ImagesService } from "@/services/imagesService"
import { cn } from "@/lib/utils"
import { NewsActionsMenu } from "./NewsActionsMenu"

// Cell component for displaying news preview image
function PreviewCell({ newsId }: { newsId: string }) {
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ["news", newsId, "images"],
    queryFn: () => ImagesService.getImages(newsId),
    staleTime: 60000, // Cache for 1 minute
    retry: 1,
  })
  
  // Find main image (is_main=true), otherwise use first by order
  const mainImage = images.find((img) => img.is_main)
  const sortedImages = [...images].sort((a, b) => a.order - b.order)
  const firstImage = mainImage || (sortedImages.length > 0 ? sortedImages[0] : null)
  
  if (isLoading) {
    return <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground animate-pulse">...</div>
  }
  
  if (error || !firstImage) {
    return (
      <div className="w-16 h-16 bg-muted rounded border border-dashed flex items-center justify-center">
        <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
      </div>
    )
  }
  
  const imageUrl = ImagesService.getImageUrl(newsId, firstImage.id)
  
  return (
    <div className="w-16 h-16 rounded overflow-hidden border bg-muted">
      <img
        src={imageUrl}
        alt={firstImage.file_name}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          // Show placeholder if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = "none"
          if (target.parentElement) {
            const placeholder = document.createElement("div")
            placeholder.className = "w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground"
            placeholder.textContent = "Error"
            target.parentElement.appendChild(placeholder)
          }
        }}
      />
    </div>
  )
}

export const columns: ColumnDef<NewsPublic>[] = [
  {
    id: "preview",
    header: "Превью",
    cell: ({ row }) => <PreviewCell newsId={row.original.id} />,
  },
  {
    accessorKey: "title",
    header: "Название",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
  },
  {
    accessorKey: "content",
    header: "Текст",
    cell: ({ row }) => {
      const content = row.original.content
      return (
        <span className={cn("max-w-xs truncate block text-muted-foreground")}>
          {content}
        </span>
      )
    },
  },
  {
    accessorKey: "is_published",
    header: "Опубликована",
    cell: ({ row }) => {
      const isPublished = row.original.is_published
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              isPublished ? "bg-green-500" : "bg-gray-400",
            )}
          />
          <span className={isPublished ? "" : "text-muted-foreground"}>
            {isPublished ? "Да" : "Нет"}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "published_at",
    header: "Дата публикации",
    cell: ({ row }) => {
      const publishedAt = row.original.published_at
      if (!publishedAt) return <span className="text-muted-foreground">—</span>
      return (
        <span className="text-sm">
          {format(new Date(publishedAt), "dd.MM.yyyy HH:mm")}
        </span>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Создана",
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
      <div className="flex justify-end">
        <NewsActionsMenu news={row.original} />
      </div>
    ),
  },
]

