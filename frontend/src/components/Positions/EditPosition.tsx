import { useEffect } from "react"

import { PositionsService, type PositionPublic } from "@/client"
import { Button } from "@/components/ui/button"
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
import { FORM_DEFAULT_OPTIONS } from "@/constants/form"
import { editPositionSchema, type EditPositionFormData } from "@/schemas/position"
import { unwrapResponse } from "@/utils"
import { normalizePositionName } from "@/utils/positionName"
import { FormDialog } from "@/components/Common"

type FormData = EditPositionFormData

interface EditPositionProps {
  position: PositionPublic
  onSuccess?: () => void
}

function EditPosition({ position, onSuccess }: EditPositionProps) {
  const defaultValues: FormData = {
    name: position.name,
  }

  const { form, handleSubmit, isPending, mutation } = useFormMutation({
    schema: editPositionSchema,
    formOptions: FORM_DEFAULT_OPTIONS,
    defaultValues,
    mutationFn: (data: FormData) =>
      unwrapResponse<PositionPublic>(PositionsService.positionsUpdatePosition({ path: { position_id: position.id }, body: { name: data.name } })),
    successMessage: "Должность успешно обновлена",
    invalidateKeys: ["positions"],
    onSuccess: () => {
      onSuccess?.()
    },
  })

  const dialog = useDialogForm({
    form,
    defaultValues,
  })

  // Update form when position changes
  useEffect(() => {
    if (dialog.isOpen) {
      form.reset({
        name: position.name,
      })
    }
  }, [position, dialog.isOpen, form])

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
      title="Редактировать должность"
      description="Обновите название должности и сохраните изменения."
      form={form}
      onSubmit={handleSubmit}
      isPending={isPending}
      maxWidth="md"
      trigger={
        <Button variant="ghost" className="w-full justify-start" onClick={() => dialog.openDialog()}>
          Редактировать
        </Button>
      }
    >
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
    </FormDialog>
  )
}

export default EditPosition
