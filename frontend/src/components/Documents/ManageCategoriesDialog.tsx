import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { DocumentsService, type DocumentCategoryPublic } from "@/client"
import { DeleteConfirmationDialog } from "@/components/Common"
import { Button } from "@/components/ui/button"
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
import useCustomToast from "@/hooks/useCustomToast"
import { DocumentsService as LegacyDocumentsService } from "@/services/documentsService"
import { handleError } from "@/utils"

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Maximum 100 characters"),
})

type CategoryFormData = z.infer<typeof categoryFormSchema>

interface EditCategoryDialogProps {
  category: DocumentCategoryPublic
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function EditCategoryDialog({ category, isOpen, onOpenChange }: EditCategoryDialogProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category.name,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      // TODO: Replace with DocumentsService.documentsUpdateCategory when available in client
      return LegacyDocumentsService.updateCategory(category.id, data.name)
    },
    onSuccess: () => {
      showSuccessToast("Категория обновлена")
      queryClient.invalidateQueries({ queryKey: ["document-categories"] })
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      onOpenChange(false)
      form.reset()
    },
    onError: handleError.bind(showErrorToast),
  })

  const handleClose = (open: boolean) => {
    if (!open && !mutation.isPending) {
      onOpenChange(false)
      form.reset({ name: category.name })
    }
  }

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать категорию</DialogTitle>
          <DialogDescription>Измените название категории</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название категории</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название категории" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
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

interface AddCategoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function AddCategoryDialog({ isOpen, onOpenChange }: AddCategoryDialogProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await DocumentsService.documentsCreateCategory({
        body: { name: data.name },
      })
      if ('error' in response && response.error) {
        throw response
      }
      return (response as any).data as DocumentCategoryPublic
    },
    onSuccess: () => {
      showSuccessToast("Категория создана")
      queryClient.invalidateQueries({ queryKey: ["document-categories"] })
      onOpenChange(false)
      form.reset()
    },
    onError: handleError.bind(showErrorToast),
  })

  const handleClose = (open: boolean) => {
    if (!open && !mutation.isPending) {
      onOpenChange(false)
      form.reset()
    }
  }

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать категорию</DialogTitle>
          <DialogDescription>Добавьте новую категорию для документов</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название категории</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название категории" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={mutation.isPending}
              >
                Отмена
              </Button>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Создать
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteCategoryButtonProps {
  category: DocumentCategoryPublic
}

function DeleteCategoryButton({ category }: DeleteCategoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DeleteConfirmationDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={async () => {
          const response = await DocumentsService.documentsDeleteCategory({
            path: { category_id: category.id },
          })
          if ('error' in response && response.error) {
            throw response
          }
        }}
        title="Удалить категорию?"
        description={
          <div className="space-y-2">
            <p>Вы уверены, что хотите удалить категорию &quot;{category.name}&quot;?</p>
            <p className="text-sm text-muted-foreground">
              Все документы с этой категорией будут перемещены в &quot;Без категории&quot;.
            </p>
          </div>
        }
        successMessage="Категория удалена"
        queryKeys={["document-categories", "documents"]}
      />
    </>
  )
}

export function ManageCategoriesDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<DocumentCategoryPublic | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { data: categories = { data: [], count: 0 }, isLoading } = useQuery({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const response = await DocumentsService.documentsReadCategories()
      if ('error' in response && response.error) {
        throw response
      }
      return (response as any).data as { data: DocumentCategoryPublic[]; count: number }
    },
    enabled: isOpen,
  })
  const hasScroll = categories.data.length > 7

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Edit2 className="mr-2 h-4 w-4" />
            Редактировать категории
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Управление категориями</DialogTitle>
            <DialogDescription>
              Добавляйте, редактируйте и удаляйте категории документов
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить категорию
              </Button>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
            ) : categories.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Категории не найдены
              </div>
            ) : (
              <div
                className={`border rounded-lg ${hasScroll ? "max-h-96 overflow-y-auto" : ""}`}
              >
                <div className="divide-y">
                  {categories.data.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <DeleteCategoryButton category={category} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          isOpen={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
        />
      )}
      <AddCategoryDialog isOpen={isAddOpen} onOpenChange={setIsAddOpen} />
    </>
  )
}
