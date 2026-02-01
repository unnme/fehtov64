import { ReactNode } from "react"
import { FieldValues, UseFormReturn } from "react-hook-form"

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
import { Form } from "@/components/ui/form"
import { LoadingButton } from "@/components/ui/loading-button"

interface FormDialogProps<TFormData extends FieldValues> {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  form: UseFormReturn<TFormData>
  onSubmit: (data: TFormData) => void
  isPending?: boolean
  children: ReactNode
  trigger?: ReactNode
  submitLabel?: string
  cancelLabel?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
}

export function FormDialog<TFormData extends FieldValues>({
  isOpen,
  onOpenChange,
  title,
  description,
  form,
  onSubmit,
  isPending = false,
  children,
  trigger,
  submitLabel = "Сохранить",
  cancelLabel = "Отмена",
  maxWidth = "md",
}: FormDialogProps<TFormData>) {
  const maxWidthClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={maxWidthClasses[maxWidth]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">{children}</div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  {cancelLabel}
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={isPending}>
                {submitLabel}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
