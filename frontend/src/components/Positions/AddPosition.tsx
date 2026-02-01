import { useEffect } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PositionsService, type PositionPublic } from "@/client"
import { useDialogForm } from "@/hooks/useDialogForm"
import { useFormMutation } from "@/hooks/useFormMutation"
import { FORM_DEFAULT_OPTIONS } from "@/constants/form"
import { createPositionSchema, type CreatePositionFormData } from "@/schemas/position"
import { unwrapResponse } from "@/utils"
import { normalizePositionName } from "@/utils/positionName"
import { FormDialog } from "@/components/Common"

type FormData = CreatePositionFormData

function AddPosition() {
  const defaultValues = { name: "" }

  const { form, handleSubmit, isPending, mutation } = useFormMutation({
    schema: createPositionSchema,
    formOptions: FORM_DEFAULT_OPTIONS,
    defaultValues,
    mutationFn: (data: FormData) => unwrapResponse<PositionPublic>(PositionsService.positionsCreatePosition({ body: { name: data.name } })),
    successMessage: "Должность успешно создана",
    invalidateKeys: ["positions"],
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
    <FormDialog
      isOpen={dialog.isOpen}
      onOpenChange={dialog.setIsOpen}
      title="Добавить должность"
      description="Заполните форму, чтобы добавить должность."
      form={form}
      onSubmit={handleSubmit}
      isPending={isPending}
      maxWidth="md"
      trigger={
        <Button className="my-4">
          <Plus className="mr-2" />
          Добавить должность
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

export default AddPosition
