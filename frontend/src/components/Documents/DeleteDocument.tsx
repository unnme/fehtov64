import { DocumentsService, type DocumentPublic } from "@/client"
import { DeleteConfirmationDialog } from "@/components/Common/DeleteConfirmationDialog"

interface DeleteDocumentProps {
  document: DocumentPublic
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteDocument({ document, isOpen, onOpenChange }: DeleteDocumentProps) {
  return (
    <DeleteConfirmationDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onConfirm={async () => {
        const response = await DocumentsService.documentsDeleteDocument({
          path: { document_id: document.id },
        })
        if ('error' in response && response.error) {
          throw response
        }
      }}
      title="Удалить документ?"
      description={
        <>
          Вы уверены, что хотите удалить документ &quot;{document.name}&quot;? Это действие нельзя отменить.
        </>
      }
      successMessage="Документ удален успешно"
      queryKeys={["documents"]}
    />
  )
}
