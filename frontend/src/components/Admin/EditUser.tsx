import { useEffect } from "react"
import { Pencil } from "lucide-react"

import { type UserPublic, type UserUpdate, UsersService } from "@/client"
import { unwrapResponse } from "@/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useDialogForm } from "@/hooks/useDialogForm"
import { useFormMutation } from "@/hooks/useFormMutation"
import useAuth from "@/hooks/useAuth"
import { FORM_DEFAULT_OPTIONS } from "@/constants/form"
import { editUserSchema, type EditUserFormData } from "@/schemas/user"
import { FormDialog } from "@/components/Common"

type FormData = EditUserFormData

interface EditUserProps {
  user: UserPublic
  onSuccess: () => void
}

const EditUser = ({ user, onSuccess }: EditUserProps) => {
  const { user: currentUser } = useAuth()

  const defaultValues: FormData = {
    email: user.email,
    nickname: user.nickname || "",
    password: "",
    is_active: user.is_active,
    is_superuser: user.is_superuser,
  }

  const { form, handleSubmit, isPending, mutation } = useFormMutation({
    schema: editUserSchema,
    formOptions: FORM_DEFAULT_OPTIONS,
    defaultValues,
    mutationFn: async (data: FormData) => {
      const requestBody: UserUpdate = {}
      if (data.email) requestBody.email = data.email
      if (data.nickname) requestBody.nickname = data.nickname
      if (data.password && data.password !== "") {
        requestBody.password = data.password
      }
      if (data.is_active !== undefined) requestBody.is_active = data.is_active
      if (data.is_superuser !== undefined && currentUser?.is_superuser) {
        requestBody.is_superuser = data.is_superuser
      }
      return unwrapResponse<UserPublic>(
        UsersService.usersUpdateUser({
          path: { user_id: user.id },
          body: requestBody
        })
      )
    },
    successMessage: "Пользователь успешно обновлен",
    invalidateKeys: ["users"],
    onSuccess: () => {
      onSuccess()
    },
  })

  const dialog = useDialogForm({
    form,
    defaultValues,
  })

  // Update form when user changes
  useEffect(() => {
    if (dialog.isOpen) {
      form.reset({
        email: user.email,
        nickname: user.nickname || "",
        password: "",
        is_active: user.is_active,
        is_superuser: user.is_superuser,
      })
    }
  }, [user, dialog.isOpen, form])

  // Close dialog when mutation succeeds
  useEffect(() => {
    if (mutation.isSuccess && dialog.isOpen) {
      dialog.closeDialog()
    }
  }, [mutation.isSuccess, dialog.isOpen, dialog])

  return (
    <FormDialog
      isOpen={dialog.isOpen}
      onOpenChange={dialog.setIsOpen}
      title="Редактировать пользователя"
      description="Обновите данные пользователя ниже."
      form={form}
      onSubmit={handleSubmit}
      isPending={isPending}
      maxWidth="md"
      trigger={
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          onClick={() => dialog.openDialog()}
        >
          <Pencil />
          Редактировать пользователя
        </DropdownMenuItem>
      }
    >
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Email <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Email"
                type="email"
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
        name="nickname"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Псевдоним <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Псевдоним" type="text" {...field} required />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Установить пароль</FormLabel>
            <FormControl>
              <Input
                placeholder="Оставьте пустым, чтобы сохранить текущий пароль"
                type="password"
                {...field}
              />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              Оставьте пустым, чтобы сохранить текущий пароль. Минимум 8 символов, если указан.
            </p>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="is_active"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="font-normal">Is active</FormLabel>
          </FormItem>
        )}
      />

      {currentUser?.is_superuser && (
        <FormField
          control={form.control}
          name="is_superuser"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">Is superuser</FormLabel>
            </FormItem>
          )}
        />
      )}
    </FormDialog>
  )
}

export default EditUser
