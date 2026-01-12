import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { Pencil } from "lucide-react"
import { z } from "zod"

import { type NewsPublic, NewsService } from "@/client"
import { ImagesService, type NewsImagePublic } from "@/services/imagesService"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

import { ImageUploader } from "./ImageUploader"

const formSchema = z.object({
  title: z.string().min(1, { message: "Название обязательно" }),
  content: z.string().min(1, { message: "Текст обязателен" }),
  is_published: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface EditNewsProps {
  news: NewsPublic
  onSuccess: () => void
}

// Temporary type for images pending upload
type PendingImage = {
  id: string // Temporary ID before server upload
  file: File
  preview: string
  order: number
}

// Component for editing existing news with image management
const EditNews = ({ news, onSuccess }: EditNewsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Local state for managing image uploads, deletions, and reordering
  const [newImages, setNewImages] = useState<PendingImage[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<Set<string>>(new Set())
  const [reorderMap, setReorderMap] = useState<Map<string, number>>(new Map())

  const { data: images = [], error: imagesError, refetch: refetchImages } = useQuery<NewsImagePublic[], Error>({
    queryKey: ["news", news.id, "images"],
    queryFn: () => ImagesService.getImages(news.id),
    enabled: isOpen,
    retry: 1,
  })

  // Handle image loading errors
  useEffect(() => {
    if (imagesError) {
      console.error("Error loading images:", imagesError)
    }
  }, [imagesError])

  // Compute virtual image array for display with applied reordering and deletions
  const displayImages = useMemo(() => {
    // Filter existing images and apply new order if changed
    const existingImages = images
      .filter((img) => !deletedImageIds.has(img.id))
      .map((img) => {
        const newOrder = reorderMap.get(img.id)
        return newOrder !== undefined ? { ...img, order: newOrder } : img
      })
      .sort((a, b) => a.order - b.order)

    // Add new images with preview URLs
    const pendingImages: NewsImagePublic[] = newImages.map((pending) => ({
      id: pending.id,
      news_id: news.id,
      file_name: pending.file.name,
      file_path: "",
      file_size: pending.file.size,
      mime_type: pending.file.type,
      order: pending.order,
      is_main: false,
      created_at: new Date().toISOString(),
      previewUrl: pending.preview,
    }))

    // Merge and sort all images by order
    const allImages = [...existingImages, ...pendingImages].sort((a, b) => a.order - b.order)
    
    // First image (order=0) becomes main image
    return allImages.map((img, index) => ({
      ...img,
      is_main: index === 0,
    }))
  }, [images, deletedImageIds, reorderMap, newImages, news.id])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: news.title || "",
      content: news.content || "",
      is_published: news.is_published ?? false,
    },
  })

  // Reset form and local state when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: news.title || "",
        content: news.content || "",
        is_published: news.is_published ?? false,
      })
      // Reset local image state
      setNewImages([])
      setDeletedImageIds(new Set())
      setReorderMap(new Map())
      // Reload images from database
      refetchImages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, news.id])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      NewsService.updateNews({ id: news.id, requestBody: data }),
    onError: handleError.bind(showErrorToast),
  })

  // Handlers for local image management
  const handleAddImage = (file: File) => {
    const preview = URL.createObjectURL(file)
    // Calculate max order from existing and new images
    const existingMaxOrder = images.length > 0 
      ? Math.max(...images.map((img) => img.order), -1)
      : -1
    const newMaxOrder = newImages.length > 0
      ? Math.max(...newImages.map((img) => img.order), -1)
      : -1
    const maxOrder = Math.max(existingMaxOrder, newMaxOrder)
    
    const newImage: PendingImage = {
      id: `pending-${Date.now()}-${Math.random()}`,
      file,
      preview,
      order: maxOrder + 1,
    }
    setNewImages((prev) => [...prev, newImage])
  }

  const handleDeleteImage = (imageId: string) => {
    // Remove new image from local state
    if (imageId.startsWith("pending-")) {
      setNewImages((prev) => {
        const image = prev.find((img) => img.id === imageId)
        if (image) {
          URL.revokeObjectURL(image.preview)
        }
        return prev.filter((img) => img.id !== imageId)
      })
    } else {
      // Mark existing image for deletion
      setDeletedImageIds((prev) => new Set(prev).add(imageId))
      // Remove from reorder map if present
      setReorderMap((prev) => {
        const next = new Map(prev)
        next.delete(imageId)
        return next
      })
    }
  }

  const handleReorderImage = (imageId: string, newOrder: number) => {
    setReorderMap((prev) => {
      const next = new Map(prev)
      
      // Build array of all images with current orders
      const existingImages = images
        .filter((img) => !deletedImageIds.has(img.id))
        .map((img) => ({
          id: img.id,
          order: prev.get(img.id) ?? img.order,
        }))
      
      const pendingImages = newImages.map((pending) => ({
        id: pending.id,
        order: pending.order,
      }))
      
      const allImages = [...existingImages, ...pendingImages]
        .sort((a, b) => a.order - b.order)
      
      const oldIndex = allImages.findIndex((img) => img.id === imageId)
      if (oldIndex === -1) return next
      
      // Recalculate orders for all images based on drag position
      allImages.forEach((img, index) => {
        if (img.id === imageId) {
          // Dragged image gets new order equal to new index
          next.set(img.id, newOrder)
        } else {
          let imgOrder = img.order
          
          // If dragging right, shift images left (decrease order)
          if (newOrder > oldIndex) {
            if (oldIndex < index && index <= newOrder) {
              imgOrder -= 1
            }
          }
          // If dragging left, shift images right (increase order)
          else if (newOrder < oldIndex) {
            if (newOrder <= index && index < oldIndex) {
              imgOrder += 1
            }
          }
          
          // Save new order only if changed or already in map
          if (imgOrder !== img.order || prev.has(img.id)) {
            next.set(img.id, imgOrder)
          }
        }
      })
      
      return next
    })
  }

  const onSubmit = async (data: FormData) => {
    try {
      // Save news data first
      await mutation.mutateAsync({
        title: data.title,
        content: data.content,
        is_published: data.is_published,
      })

      // Process images: upload new, delete marked, apply reordering
      // Upload new images and map pending IDs to uploaded IDs
      const pendingToUploadedMap = new Map<string, string>()
      for (const pendingImage of newImages) {
        try {
          const uploadedImage = await ImagesService.uploadImage(news.id, pendingImage.file)
          pendingToUploadedMap.set(pendingImage.id, uploadedImage.id)
          // Clean up preview URL
          URL.revokeObjectURL(pendingImage.preview)
        } catch (error) {
          console.error("Error uploading image:", error)
          showErrorToast(`Error uploading ${pendingImage.file.name}`)
        }
      }

      // Delete marked images
      for (const imageId of deletedImageIds) {
        try {
          await ImagesService.deleteImage(news.id, imageId)
        } catch (error) {
          console.error("Error deleting image:", error)
          showErrorToast("Error deleting image")
        }
      }

      // Apply order changes
      for (const [imageId, newOrder] of reorderMap.entries()) {
        if (!imageId.startsWith("pending-") && !deletedImageIds.has(imageId)) {
          try {
            await ImagesService.reorderImage(news.id, imageId, newOrder)
          } catch (error) {
            console.error("Error reordering image:", error)
            showErrorToast("Error reordering images")
          }
        }
      }

      // Clear local state
      setNewImages([])
      setDeletedImageIds(new Set())
      setReorderMap(new Map())

      // Invalidate cache
      await queryClient.invalidateQueries({ queryKey: ["news", news.id, "images"] })
      await queryClient.invalidateQueries({ queryKey: ["news"] })

      showSuccessToast("News and images updated successfully")
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      // Error already handled in mutation.onError or show generic error
      if (!(error instanceof Error && error.message.includes("mutation"))) {
        showErrorToast("Error saving changes")
      }
    }
  }

  const handleCancel = () => {
    // Clean up preview URLs for new images
    newImages.forEach((img) => URL.revokeObjectURL(img.preview))
    
    // Reset form to original values
    form.reset({
      title: news.title || "",
      content: news.content || "",
      is_published: news.is_published ?? false,
    })
    
    // Reset local image state
    setNewImages([])
    setDeletedImageIds(new Set())
    setReorderMap(new Map())
    
    setIsOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Clean up preview URLs for new images
      newImages.forEach((img) => URL.revokeObjectURL(img.preview))
      
      // Reset form to original values on dialog close
      form.reset({
        title: news.title || "",
        content: news.content || "",
        is_published: news.is_published ?? false,
      })
      
      // Reset local image state
      setNewImages([])
      setDeletedImageIds(new Set())
      setReorderMap(new Map())
    }
    setIsOpen(open)
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
    >
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil />
        Редактировать новость
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-2xl">
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <DialogHeader>
              <DialogTitle>Редактировать новость</DialogTitle>
              <DialogDescription>
                Обновите детали новости ниже.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Название <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Название новости" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Текст <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Текст новости"
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Опубликована</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

            </div>

            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleCancel}
                disabled={mutation.isPending}
              >
                Отмена
              </Button>
              <LoadingButton 
                type="submit" 
                loading={mutation.isPending}
              >
                Сохранить
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>

        <div className="space-y-2 px-6 pb-6">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Изображения
          </label>
          {imagesError ? (
            <div className="text-sm text-destructive p-4 border border-destructive rounded">
              Ошибка загрузки изображений. Попробуйте обновить страницу.
            </div>
          ) : (
            <ImageUploader
              newsId={news.id}
              images={displayImages}
              onUpload={handleAddImage}
              onDelete={handleDeleteImage}
              onReorder={handleReorderImage}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditNews

