import { useCallback, useEffect, useRef } from "react"
import { Upload, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import useCustomToast from "@/hooks/useCustomToast"
import { cn } from "@/lib/utils"

interface PersonImageUploaderProps {
  imageUrl?: string | null
  pendingPreviewUrl?: string | null
  onSelectFile: (file: File | null, previewUrl: string | null) => void
  onDelete?: () => void
  isDeleting?: boolean
  isUploading?: boolean
}

const MAX_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

function PersonImageUploader({
  imageUrl,
  pendingPreviewUrl,
  onSelectFile,
  onDelete,
  isDeleting = false,
  isUploading = false,
}: PersonImageUploaderProps) {
  const { showErrorToast } = useCustomToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl)
      }
    }
  }, [pendingPreviewUrl])

  const validatePortrait = useCallback(
    (file: File) =>
      new Promise<boolean>((resolve) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
          URL.revokeObjectURL(url)
          resolve(img.height > img.width)
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          resolve(false)
        }
        img.src = url
      }),
    []
  )

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!ACCEPTED_TYPES.includes(file.type)) {
        showErrorToast("Недопустимый тип файла")
        event.target.value = ""
        return
      }

      if (file.size > MAX_SIZE) {
        showErrorToast("Файл слишком большой (максимум 10MB)")
        event.target.value = ""
        return
      }

      const isPortrait = await validatePortrait(file)
      if (!isPortrait) {
        showErrorToast("Разрешены только вертикальные фото")
        event.target.value = ""
        return
      }

      const previewUrl = URL.createObjectURL(file)
      onSelectFile(file, previewUrl)
    },
    [onSelectFile, showErrorToast, validatePortrait]
  )

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleClear = () => {
    onSelectFile(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const preview = pendingPreviewUrl || imageUrl

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Фото сотрудника</p>
      </div>

      <div className="space-y-2">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-4 flex items-center gap-4",
            isUploading && "opacity-60"
          )}
        >
          <div className="h-32 w-24 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Фото сотрудника" className="h-full w-full object-cover" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Допускается одно вертикальное фото (портретное). Форматы: JPG, PNG, WEBP, GIF.
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handlePickFile}>
                Загрузить фото
              </Button>
              {pendingPreviewUrl ? (
                <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                  Отменить
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        {preview && onDelete ? (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting || isUploading}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Удалить фото
            </Button>
          </div>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

export default PersonImageUploader
