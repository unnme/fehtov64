import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Position } from "@/services/positionsService"
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
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { isValidPositionName, normalizePositionName } from "@/utils/positionName"

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Название обязательно" })
    .refine(isValidPositionName, {
      message: "Одно слово, без пробелов, допускается одно тире",
    })
    .transform(normalizePositionName),
})

interface FormData {
  name: string
}

interface EditPositionProps {
  position: Position
  onSuccess?: () => void
}

function EditPosition({ position, onSuccess }: EditPositionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      name: position.name,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      PositionsService.update(position.id, { name: data.name }),
    onSuccess: () => {
      showSuccessToast("Position updated successfully")
      setIsOpen(false)
      onSuccess?.()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] })
    },
  })

  function handleSubmit(data: FormData) {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          Редактировать
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать должность</DialogTitle>
          <DialogDescription>
            Обновите название должности и сохраните изменения.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Название <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                  <Input
                    placeholder="Название должности"
                    {...field}
                    onBlur={(event) => {
                      field.onBlur()
                      field.onChange(normalizePositionName(event.target.value))
                    }}
                    required
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

export default EditPosition
