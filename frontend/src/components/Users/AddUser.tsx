import { useEffect } from "react"
import { Plus } from "lucide-react"

import { UsersService } from "@/client"
import type { UserCreate, UserPublic } from "@/client"
import { unwrapResponse } from "@/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useDialogForm } from "@/hooks/useDialogForm"
import { useFormMutation } from "@/hooks/useFormMutation"
import { createUserSchema, type CreateUserFormData } from "@/schemas/user"

type FormData = CreateUserFormData

const AddUser = () => {
  const defaultValues = {
    email: "",
    nickname: "",
    password: "",
    confirm_password: "",
    is_active: true,
    is_superuser: false,
  }

  const { form, handleSubmit, isPending, mutation } = useFormMutation({
    schema: createUserSchema,
    formOptions: {
      mode: "onBlur",
      criteriaMode: "all"
    },
    defaultValues,
    mutationFn: async (data: FormData) => {
      const requestBody: UserCreate = {
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        is_active: data.is_active,
        is_superuser: data.is_superuser,
      }
      return unwrapResponse<UserPublic>(
        UsersService.usersCreateUser({ body: requestBody })
      )
    },
    successMessage: "Пользователь создан",
    invalidateKeys: ["users"],
    resetOnSuccess: true
  })

  const dialog = useDialogForm({
    form,
    defaultValues
  })

  // Close dialog when mutation succeeds
  useEffect(() => {
    if (mutation.isSuccess && dialog.isOpen) {
      dialog.closeDialog()
    }
  }, [mutation.isSuccess, dialog.isOpen, dialog])


  return (
    <Dialog open={dialog.isOpen} onOpenChange={dialog.setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          Добавить пользователя
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить пользователя</DialogTitle>
          <DialogDescription>
            Заполните форму, чтобы добавить нового пользователя.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Почта <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Почта"
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
                    <FormLabel>
                      Пароль <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Пароль"
                        type="password"
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
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Подтверждение пароля{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Пароль"
                        type="password"
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
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Активен</FormLabel>
                  </FormItem>
                )}
              />

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
                    <FormLabel className="font-normal">Администратор</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isPending}>
                  Отмена
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={isPending}>
                Сохранить
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddUser
