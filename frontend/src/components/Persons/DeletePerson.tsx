import { useState } from "react"
import { Trash2 } from "lucide-react"

import { PersonsService } from "@/client"
import { Button } from "@/components/ui/button"
import { DeleteConfirmationDialog } from "@/components/Common"

interface DeletePersonProps {
  id: string
  onSuccess?: () => void
}

function DeletePerson({ id, onSuccess }: DeletePersonProps) {
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
          await PersonsService.personsDeletePerson({ path: { person_id: id } })
        }}
        title="Удалить сотрудника?"
        description="Это действие нельзя отменить. Сотрудник будет удален навсегда."
        successMessage="Сотрудник удален"
        queryKeys={["persons"]}
        onSuccess={onSuccess}
      />
    </>
  )
}

export default DeletePerson
