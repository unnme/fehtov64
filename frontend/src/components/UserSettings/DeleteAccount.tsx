import DeleteConfirmation from "./DeleteConfirmation"

const DeleteAccount = () => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
        <h3 className="font-semibold text-destructive mb-2">Удаление аккаунта</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Это действие нельзя отменить. Все ваши данные будут безвозвратно удалены.
        </p>
        <DeleteConfirmation />
      </div>
    </div>
  )
}

export default DeleteAccount
