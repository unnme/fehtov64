import { toast } from "sonner"

const useCustomToast = () => {
  const showSuccessToast = (description: string) => {
    toast.success("Успешно", {
      description,
    })
  }

  const showErrorToast = (description: string) => {
    toast.error("Ошибка", {
      description,
    })
  }

  return { showSuccessToast, showErrorToast }
}

export default useCustomToast
