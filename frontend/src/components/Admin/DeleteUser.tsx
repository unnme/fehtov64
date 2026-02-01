import { useState } from "react"
import { Trash2 } from "lucide-react"

import { UsersService } from "@/client"
import { DeleteConfirmationDialog } from "@/components/Common"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface DeleteUserProps {
  id: string
  onSuccess: () => void
}

const DeleteUser = ({ id, onSuccess }: DeleteUserProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <DropdownMenuItem
        variant="destructive"
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Trash2 />
        Удалить пользователя
      </DropdownMenuItem>
      <DeleteConfirmationDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={async () => {
          const response = await UsersService.usersDeleteUser({ path: { user_id: id } })
          if ('error' in response && response.error) {
            throw response
          }
        }}
        title="Удалить пользователя?"
        description={
          <>
            Все элементы, связанные с этим пользователем, также будут{" "}
            <strong>безвозвратно удалены.</strong> Вы уверены? Это действие нельзя отменить.
          </>
        }
        successMessage="Пользователь успешно удален"
        queryKeys={["users"]}
        onSuccess={onSuccess}
      />
    </>
  )
}

export default DeleteUser
