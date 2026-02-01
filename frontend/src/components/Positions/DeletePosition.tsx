import { useState } from "react"
import { Trash2 } from "lucide-react"

import { PositionsService } from "@/client"
import { Button } from "@/components/ui/button"
import { DeleteConfirmationDialog } from "@/components/Common"

interface DeletePositionProps {
  id: string
  onSuccess?: () => void
}

function DeletePosition({ id, onSuccess }: DeletePositionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button 
        variant="ghost" 
        className="w-full justify-start text-destructive"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Удалить
      </Button>
      <DeleteConfirmationDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={async () => {
          await PositionsService.positionsDeletePosition({ path: { position_id: id } })
        }}
        title="Удалить должность?"
        description="Это действие нельзя отменить. Должность будет удалена навсегда."
        successMessage="Должность успешно удалена"
        queryKeys={["positions"]}
        onSuccess={onSuccess}
      />
    </>
  )
}

export default DeletePosition
