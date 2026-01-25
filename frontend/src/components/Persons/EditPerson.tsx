import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Person } from "@/services/personsService"
import { PersonsService } from "@/services/personsService"
import { PositionsService } from "@/services/positionsService"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
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
import { Textarea } from "@/components/ui/textarea"
import PositionSelect from "@/components/Persons/PositionSelect"
import PersonImageUploader from "@/components/Persons/PersonImageUploader"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { isValidPersonName, normalizePersonName } from "@/utils/personName"
import { formatPhone, isValidPhone } from "@/utils/phone"
import { getPersonImageFileUrl } from "@/utils/fileUrls"

const DEFAULT_POSITION_NAME = "Без должности"

const formSchema = z.object({
  last_name: z
    .string()
    .min(1, { message: "Фамилия обязательна" })
    .refine((value) => isValidPersonName(value, true), {
      message: "Фамилия: одно слово, без пробелов, допускается одно тире",
    })
    .transform((value) => normalizePersonName(value, true)),
  first_name: z
    .string()
    .min(1, { message: "Имя обязательно" })
    .refine((value) => isValidPersonName(value, false), {
      message: "Имя: одно слово, без пробелов",
    })
    .transform((value) => normalizePersonName(value, false)),
  middle_name: z
    .string()
    .min(1, { message: "Отчество обязательно" })
    .refine((value) => isValidPersonName(value, false), {
      message: "Отчество: одно слово, без пробелов",
    })
    .transform((value) => normalizePersonName(value, false)),
  phone: z
    .string()
    .min(1, { message: "Телефон обязателен" })
    .refine(isValidPhone, { message: "Неверный формат телефона" }),
  email: z.string().email({ message: "Неверный email" }),
  description: z.string().optional(),
  position_id: z.string().min(1, { message: "Должность обязательна" }),
})

interface FormData {
  last_name: string
  first_name: string
  middle_name: string
  phone: string
  email: string
  description?: string
  position_id: string
}

interface EditPersonProps {
  person: Person
  onSuccess?: () => void
}

function EditPerson({ person, onSuccess }: EditPersonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: positionsData } = useQuery({
    queryKey: ["positions"],
    queryFn: () => PositionsService.list(),
  })

  const positions = useMemo(
    () => positionsData?.data || [],
    [positionsData]
  )

  const defaultPosition = useMemo(
    () => positions.find((position) => position.name === DEFAULT_POSITION_NAME),
    [positions]
  )


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      last_name: person.last_name,
      first_name: person.first_name,
      middle_name: person.middle_name,
      phone: formatPhone(person.phone),
      email: person.email,
      description: person.description || "",
      position_id: person.position?.id || "",
    },
  })

  useEffect(() => {
    if (!defaultPosition) return
    if (!form.getValues("position_id")) {
      form.setValue("position_id", defaultPosition.id, {
        shouldDirty: false,
        shouldValidate: true,
      })
    }
  }, [defaultPosition, form])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      PersonsService.update(person.id, {
        last_name: data.last_name,
        first_name: data.first_name,
        middle_name: data.middle_name,
        phone: data.phone,
        email: data.email,
        description: data.description || "",
        position_id: data.position_id,
      }),
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] })
    },
  })

  const imageUrl = person.image ? getPersonImageFileUrl(person.id) : null

  async function handleSubmit(data: FormData) {
    try {
      await mutation.mutateAsync(data)
      if (photoFile) {
        setIsUploadingPhoto(true)
        try {
          await PersonsService.uploadImage(person.id, photoFile)
          await queryClient.invalidateQueries({ queryKey: ["persons"] })
        } catch (error) {
          showErrorToast(
            error instanceof Error ? error.message : "Ошибка загрузки фото"
          )
        }
      }
      showSuccessToast("Сотрудник обновлен")
      setPhotoFile(null)
      setPhotoPreviewUrl(null)
      setIsOpen(false)
      onSuccess?.()
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleDeleteImage = async () => {
    if (photoPreviewUrl) {
      setPhotoFile(null)
      setPhotoPreviewUrl(null)
      return
    }
    if (!person.image) return
    setIsDeletingPhoto(true)
    try {
      await PersonsService.deleteImage(person.id)
      await queryClient.invalidateQueries({ queryKey: ["persons"] })
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Ошибка удаления фото"
      )
    } finally {
      setIsDeletingPhoto(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPhotoFile(null)
      setPhotoPreviewUrl(null)
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          Редактировать
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактировать сотрудника</DialogTitle>
          <DialogDescription>
            Обновите данные сотрудника и сохраните изменения.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Фамилия <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Фамилия"
                          {...field}
                          onBlur={(event) => {
                            field.onBlur()
                            field.onChange(normalizePersonName(event.target.value, true))
                          }}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Имя <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Имя"
                          {...field}
                          onBlur={(event) => {
                            field.onBlur()
                            field.onChange(normalizePersonName(event.target.value, false))
                          }}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middle_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Отчество <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Отчество"
                          {...field}
                          onBlur={(event) => {
                            field.onBlur()
                            field.onChange(normalizePersonName(event.target.value, false))
                          }}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Телефон <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+7 (999) 999-99-99"
                          inputMode="tel"
                          maxLength={18}
                          {...field}
                          onChange={(event) =>
                            field.onChange(formatPhone(event.target.value))
                          }
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Email" type="email" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <PositionSelect
                control={form.control}
                name="position_id"
                positions={positions}
                isRequired
              />

              <PersonImageUploader
                imageUrl={imageUrl}
                pendingPreviewUrl={photoPreviewUrl}
                onSelectFile={(file, previewUrl) => {
                  setPhotoFile(file)
                  setPhotoPreviewUrl(previewUrl)
                }}
                onDelete={handleDeleteImage}
                isDeleting={isDeletingPhoto}
                isUploading={isUploadingPhoto}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Описание"
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Отмена
                </Button>
              </DialogClose>
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

export default EditPerson
