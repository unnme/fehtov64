/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { Image as ImageIcon } from "lucide-react"

import { ImagesService, type NewsImagePublic, type NewsPublic } from "@/client"
import { unwrapResponse } from "@/utils"
import { cn } from "@/lib/utils"
import { getImageFileUrl } from "@/utils/fileUrls"
import { NewsActionsMenu } from "./NewsActionsMenu"

// Cell component for displaying news preview image
function PreviewCell({ newsId }: { newsId: string }) {
  const { data: images = [], isLoading, error } = useQuery<NewsImagePublic[]>({
    queryKey: ["news", newsId, "images"],
    queryFn: async () => {
      const result = await unwrapResponse<{ data: NewsImagePublic[] }>(
        ImagesService.imagesGetImages({ path: { news_id: newsId } })
      )
      return result.data
    },
    staleTime: 60000, // Cache for 1 minute
    retry: 1,
  })
  
  // Find main image (is_main=true), otherwise use first by order
  const mainImage = images.find((img) => img.is_main)
  const sortedImages = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
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
  
  const imageUrl = getImageFileUrl(newsId, firstImage.id)
  
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
          <span className={cn(!isPublished && "text-muted-foreground")}>
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
    accessorKey: "owner",
    header: "Автор",
    cell: ({ row }) => {
      const owner = row.original.owner
      if (!owner) {
        return <span className="text-muted-foreground">—</span>
      }
      return (
        <span className="text-sm">
          {owner.nickname || owner.email}
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

