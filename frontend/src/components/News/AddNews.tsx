import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Upload, X } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { ImagesService, type Message, NewsService, type NewsCreate, type NewsImagePublic, type NewsPublic } from "@/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { RichTextEditor } from "@/components/ui/rich-text-editor-lazy"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError, unwrapResponse } from "@/utils"

import { ImageUploader } from "./ImageUploader"

interface PendingImageUploaderProps {
  pendingImages: File[]
  onAddImages: (files: File[]) => void
  onRemoveImage: (index: number) => void
}

function PendingImageUploader({
  pendingImages,
  onAddImages,
  onRemoveImage,
}: PendingImageUploaderProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    )
    onAddImages(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      onAddImages(files)
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary"
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="pending-image-upload"
        />
        <label
          htmlFor="pending-image-upload"
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <Upload className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Перетащите изображения сюда или нажмите для выбора
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingImages.length} изображений выбрано
            </p>
          </div>
        </label>
      </div>

      {pendingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pendingImages.map((file, index) => {
            const previewUrl = URL.createObjectURL(file)
            return (
              <div
                key={index}
                className="relative group rounded-lg border overflow-hidden bg-muted"
              >
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      URL.revokeObjectURL(previewUrl)
                      onRemoveImage(index)
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { createNewsSchema, type CreateNewsFormData } from "@/schemas/news"

type FormData = CreateNewsFormData

const AddNews = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(createNewsSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      content: "",
      is_published: false,
    },
  })

  const [createdNewsId, setCreatedNewsId] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<File[]>([])

  const { data: images = [] } = useQuery<NewsImagePublic[]>({
    queryKey: ["news", createdNewsId, "images"],
    queryFn: async () => {
      if (!createdNewsId) return []
      const result = await unwrapResponse<{ data: NewsImagePublic[] }>(
        ImagesService.imagesGetImages({ path: { news_id: createdNewsId } })
      )
      return result.data
    },
    enabled: !!createdNewsId && isOpen,
  })

  const mutation = useMutation({
    mutationFn: async (data: NewsCreate) => {
      const news = await unwrapResponse<NewsPublic>(
        NewsService.newsCreateNews({ body: data })
      )
      // Upload all selected images after news creation
      if (pendingImages.length > 0) {
        try {
          for (const file of pendingImages) {
            await unwrapResponse<NewsImagePublic>(
              ImagesService.imagesUploadImage({
                path: { news_id: news.id },
                body: { file },
              })
            )
          }
          showSuccessToast(
            `Новость создана успешно. Загружено ${pendingImages.length} изображений`,
          )
        } catch (error) {
          showErrorToast("Новость создана, но произошла ошибка при загрузке изображений")
          throw error
        }
      } else {
        showSuccessToast("Новость создана успешно")
      }
      return news
    },
    onSuccess: (news) => {
      setCreatedNewsId(news.id)
      setPendingImages([])
      queryClient.invalidateQueries({ queryKey: ["news", news.id, "images"] })
      queryClient.invalidateQueries({ queryKey: ["news"] })
      setIsOpen(false)
      form.reset()
      setCreatedNewsId(null)
    },
    onError: handleError.bind(showErrorToast),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!createdNewsId) throw new Error("News ID not available")
      return unwrapResponse<NewsImagePublic>(
        ImagesService.imagesUploadImage({
          path: { news_id: createdNewsId },
          body: { file },
        })
      )
    },
    onSuccess: () => {
      if (createdNewsId) {
        queryClient.invalidateQueries({ queryKey: ["news", createdNewsId, "images"] })
        showSuccessToast("Изображение загружено")
      }
    },
    onError: handleError.bind(showErrorToast),
  })

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      if (!createdNewsId) throw new Error("News ID not available")
      await unwrapResponse<Message>(
        ImagesService.imagesDeleteImage({
          path: { news_id: createdNewsId, image_id: imageId },
        })
      )
    },
    onSuccess: () => {
      if (createdNewsId) {
        queryClient.invalidateQueries({ queryKey: ["news", createdNewsId, "images"] })
        showSuccessToast("Изображение удалено")
      }
    },
    onError: handleError.bind(showErrorToast),
  })

  const reorderMutation = useMutation({
    mutationFn: async ({ imageId, newOrder }: { imageId: string; newOrder: number }) => {
      if (!createdNewsId) throw new Error("News ID not available")
      return unwrapResponse<NewsImagePublic>(
        ImagesService.imagesReorderImage({
          path: { news_id: createdNewsId, image_id: imageId },
          query: { new_order: newOrder },
        })
      )
    },
    onSuccess: () => {
      if (createdNewsId) {
        queryClient.invalidateQueries({ queryKey: ["news", createdNewsId, "images"] })
      }
    },
    onError: handleError.bind(showErrorToast),
  })


  const onSubmit = (data: FormData) => {
    const submitData: NewsCreate = {
      title: data.title,
      content: data.content,
      is_published: data.is_published,
    }
    mutation.mutate(submitData)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setIsOpen(false)
      form.reset()
      setCreatedNewsId(null)
      setPendingImages([])
      // Reset mutation states on dialog close
      mutation.reset()
      uploadMutation.reset()
      deleteMutation.reset()
      reorderMutation.reset()
    } else {
      setIsOpen(true)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          Добавить новость
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Добавить новость</DialogTitle>
          <DialogDescription>
            Заполните детали для создания новой новости.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      <Input
                        placeholder="Название новости"
                        type="text"
                        {...field}
                        required
                      />
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
                      <RichTextEditor
                        content={field.value}
                        onChange={field.onChange}
                        placeholder="Введите текст новости..."
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

              <div className="space-y-2">
                <FormLabel>Изображения</FormLabel>
                {createdNewsId ? (
                  <ImageUploader
                    newsId={createdNewsId}
                    images={images}
                    onUpload={async (file) => {
                      await uploadMutation.mutateAsync(file)
                    }}
                    onDelete={async (imageId) => {
                      await deleteMutation.mutateAsync(imageId)
                    }}
                    onReorder={async (imageId, newOrder) => {
                      await reorderMutation.mutateAsync({ imageId, newOrder })
                      // First image automatically becomes main after reorder
                      queryClient.invalidateQueries({ queryKey: ["news", createdNewsId, "images"] })
                      queryClient.invalidateQueries({ queryKey: ["news"] })
                    }}
                  />
                ) : (
                  <PendingImageUploader
                    pendingImages={pendingImages}
                    onAddImages={(files) => {
                      setPendingImages((prev) => [...prev, ...files])
                    }}
                    onRemoveImage={(index) => {
                      setPendingImages((prev) => prev.filter((_, i) => i !== index))
                    }}
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => handleClose(false)}
                disabled={mutation.isPending}
              >
                Отмена
              </Button>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Сохранить
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddNews

