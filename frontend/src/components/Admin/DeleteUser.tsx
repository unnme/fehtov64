import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { Trash2 } from "lucide-react"

import { UsersService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

interface DeleteUserProps {
  id: string
  onSuccess: () => void
}

const DeleteUser = ({ id, onSuccess }: DeleteUserProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { handleSubmit } = useForm()

  const deleteUser = async (userId: string) => {
    const response = await UsersService.usersDeleteUser({ path: { user_id: userId } })
    if ('error' in response && response.error) {
      throw response
    }
  }

  const mutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      showSuccessToast("Пользователь успешно удален")
      setIsOpen(false)
      onSuccess()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit = async () => {
    mutation.mutate(id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        variant="destructive"
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
              <Trash2 />
              Удалить пользователя
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>Удалить пользователя</DialogTitle>
                  <DialogDescription>
                    Все элементы, связанные с этим пользователем, также будут{" "}
                    <strong>безвозвратно удалены.</strong> Вы уверены? Это действие нельзя отменить.
                  </DialogDescription>
                </DialogHeader>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
                    <Button variant="outline" disabled={mutation.isPending}>
                      Отмена
                    </Button>
                  </DialogClose>
                  <LoadingButton
                    variant="destructive"
                    type="submit"
                    loading={mutation.isPending}
                  >
                    Удалить
                  </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteUser
