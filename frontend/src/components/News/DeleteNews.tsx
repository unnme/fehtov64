import { useState } from "react"
import { Trash2 } from "lucide-react"

import { NewsService } from "@/client"
import { DeleteConfirmationDialog } from "@/components/Common"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface DeleteNewsProps {
  id: string
  onSuccess: () => void
}

const DeleteNews = ({ id, onSuccess }: DeleteNewsProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <DropdownMenuItem
        variant="destructive"
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Trash2 />
        Удалить новость
      </DropdownMenuItem>
      <DeleteConfirmationDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={async () => {
          const response = await NewsService.newsDeleteNews({ path: { id } })
          if ('error' in response && response.error) {
            throw response
          }
        }}
        title="Удалить новость?"
        description="Эта новость будет удалена навсегда. Вы уверены? Это действие нельзя отменить."
        successMessage="Новость успешно удалена"
        queryKeys={["news"]}
        onSuccess={onSuccess}
      />
    </>
  )
}

export default DeleteNews

