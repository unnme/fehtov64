import useAuth from "@/hooks/useAuth"
import DeleteConfirmation from "./DeleteConfirmation"

const DeleteAccount = () => {
  const { user: currentUser } = useAuth()
  
  // Check if this is the first superuser
  const isFirstSuperuser = currentUser?.is_first_superuser || false
  
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
        <h3 className="font-semibold text-destructive mb-2">Удаление аккаунта</h3>
        {isFirstSuperuser ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Это первый автоматически созданный суперпользователь системы.
            </p>
            <div className="rounded-md bg-muted/50 border border-muted p-4">
              <p className="text-sm font-medium text-foreground mb-1">
                Удаление этого аккаунта невозможно
              </p>
              <p className="text-xs text-muted-foreground">
                Этот аккаунт необходим для первоначальной настройки системы и не может быть удален.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Это действие нельзя отменить. Все ваши данные будут безвозвратно удалены.
            </p>
            <DeleteConfirmation />
          </>
        )}
      </div>
    </div>
  )
}

export default DeleteAccount
