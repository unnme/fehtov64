import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Document } from "@/services/documentsService"
import { DocumentsService } from "@/services/documentsService"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

interface DeleteDocumentProps {
  document: Document
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteDocument({ document, isOpen, onOpenChange }: DeleteDocumentProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: async () => {
      return DocumentsService.deleteDocument(document.id)
    },
    onSuccess: () => {
      showSuccessToast("Документ удален успешно")
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      onOpenChange(false)
    },
    onError: handleError.bind(showErrorToast),
  })

  const handleDelete = () => {
    mutation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить документ?</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите удалить документ "{document.name}"? Это действие нельзя отменить.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Отмена
          </Button>
          <LoadingButton
            type="button"
            variant="destructive"
            onClick={handleDelete}
            loading={mutation.isPending}
          >
            Удалить
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
