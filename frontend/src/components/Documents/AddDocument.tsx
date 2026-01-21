import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Upload, X } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocumentsService, type DocumentCategoriesPublic, type DocumentPublic } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"
import { useDropzone } from "react-dropzone"

const formSchema = z.object({
  name: z.string().optional(),
  category_id: z.string().uuid().optional(),
})

type FormData = z.infer<typeof formSchema>

export function AddDocument() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: categories = { data: [], count: 0 } } = useQuery<DocumentCategoriesPublic>({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const response = await DocumentsService.documentsReadCategories()
      if ('error' in response && response.error) {
        throw response
      }
      return (response as any).data as DocumentCategoriesPublic
    },
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      category_id: undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!file) {
        throw new Error("File not selected")
      }

      const response = await DocumentsService.documentsCreateDocument({
        body: {
          file,
          name: data.name || null,
          category_id: data.category_id || null,
        },
      })
      if ('error' in response && response.error) {
        throw response
      }
      return (response as any).data as DocumentPublic
    },
    onSuccess: () => {
      showSuccessToast("Документ загружен успешно")
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      setIsOpen(false)
      form.reset()
      setFile(null)
    },
    onError: handleError.bind(showErrorToast),
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
        // Auto-fill name from filename if not set
        if (!form.getValues("name")) {
          const fileName = acceptedFiles[0].name
          const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf(".")) || fileName
          form.setValue("name", nameWithoutExt)
        }
      }
    },
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/plain": [".txt"],
      "application/rtf": [".rtf"],
      "application/vnd.oasis.opendocument.text": [".odt"],
      "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
      "application/vnd.oasis.opendocument.presentation": [".odp"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  })

  const handleClose = (open: boolean) => {
    if (!open && !mutation.isPending) {
      setIsOpen(false)
      form.reset()
      setFile(null)
    }
  }

  const onSubmit = (data: FormData) => {
    if (!file) {
      showErrorToast("Выберите файл для загрузки")
      return
    }

    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Загрузить документ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Загрузить документ</DialogTitle>
          <DialogDescription>
            Выберите файл и укажите категорию документа
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                "hover:border-primary",
                isDragActive && "border-primary bg-primary/5",
                file && "border-green-500 bg-green-50 dark:bg-green-950",
                mutation.isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <Upload className="size-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {file
                      ? file.name
                      : isDragActive
                        ? "Отпустите файл здесь"
                        : "Перетащите документ сюда или нажмите для выбора"}
                  </p>
                  {file && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-sm flex-1">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название документа</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Название (по умолчанию имя файла без расширения)"
                      {...field}
                    />
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
                onClick={() => handleClose(false)}
                disabled={mutation.isPending}
              >
                Отмена
              </Button>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Загрузить
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
