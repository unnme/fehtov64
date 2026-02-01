import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { DocumentsService, type DocumentCategoriesPublic, type DocumentPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError, unwrapResponse } from "@/utils"
import { editDocumentSchema, type EditDocumentFormData } from "@/schemas/document"

type FormData = EditDocumentFormData

interface EditDocumentProps {
  document: DocumentPublic
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDocument({ document, isOpen, onOpenChange }: EditDocumentProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: categories = { data: [], count: 0 } } = useQuery<DocumentCategoriesPublic>({
    queryKey: ["document-categories"],
    queryFn: () => unwrapResponse<DocumentCategoriesPublic>(
      DocumentsService.documentsReadCategories()
    ),
  })

  const form = useForm<FormData>({
    resolver: zodResolver(editDocumentSchema),
    defaultValues: {
      name: document.name,
      category_id: document.category_id || "__none__",
    },
  })

  // Update form values when document changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: document.name,
        category_id: document.category_id || "__none__",
      })
    }
  }, [document, isOpen, form])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      unwrapResponse<DocumentPublic>(
        DocumentsService.documentsUpdateDocument({
          path: { document_id: document.id },
          body: {
            name: data.name,
            category_id: data.category_id === "__none__" || !data.category_id ? null : data.category_id,
          },
        })
      ),
    onSuccess: () => {
      showSuccessToast("Документ обновлен успешно")
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      onOpenChange(false)
    },
    onError: handleError.bind(showErrorToast),
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать документ</DialogTitle>
          <DialogDescription>
            Измените название или категорию документа
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === "__none__" ? undefined : value)
                    }}
                    value={field.value || "__none__"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Без категории</SelectItem>
                      {categories.data.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
