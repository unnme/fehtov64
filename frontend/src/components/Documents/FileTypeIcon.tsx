import { cn } from "@/lib/utils"

type FileTypeConfig = {
  textColor: string
  extension: string
}

const getFileTypeConfig = (mimeType: string, fileName: string): FileTypeConfig => {
  // Extract extension from filename as fallback
  const fileExt = fileName.split(".").pop()?.toUpperCase() || "FILE"

  const configs: Record<string, FileTypeConfig> = {
    "application/pdf": {
      textColor: "text-red-600 dark:text-red-500",
      extension: "PDF",
    },
    "application/msword": {
      textColor: "text-blue-600 dark:text-blue-500",
      extension: "DOC",
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      textColor: "text-blue-600 dark:text-blue-500",
      extension: "DOCX",
    },
    "application/vnd.ms-excel": {
      textColor: "text-green-600 dark:text-green-500",
      extension: "XLS",
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      textColor: "text-green-600 dark:text-green-500",
      extension: "XLSX",
    },
    "application/vnd.ms-powerpoint": {
      textColor: "text-orange-600 dark:text-orange-500",
      extension: "PPT",
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
      textColor: "text-orange-600 dark:text-orange-500",
      extension: "PPTX",
    },
    "text/plain": {
      textColor: "text-gray-600 dark:text-gray-400",
      extension: "TXT",
    },
    "application/rtf": {
      textColor: "text-gray-600 dark:text-gray-400",
      extension: "RTF",
    },
    "application/vnd.oasis.opendocument.text": {
      textColor: "text-gray-600 dark:text-gray-400",
      extension: "ODT",
    },
    "application/vnd.oasis.opendocument.spreadsheet": {
      textColor: "text-gray-600 dark:text-gray-400",
      extension: "ODS",
    },
    "application/vnd.oasis.opendocument.presentation": {
      textColor: "text-gray-600 dark:text-gray-400",
      extension: "ODP",
    },
  }

  const defaultConfig: FileTypeConfig = {
    textColor: "text-gray-600 dark:text-gray-400",
    extension: fileExt,
  }

  return configs[mimeType] || defaultConfig
}

interface FileTypeIconProps {
  mimeType: string
  fileName: string
  className?: string
}

export function FileTypeIcon({ mimeType, fileName, className }: FileTypeIconProps) {
  const config = getFileTypeConfig(mimeType, fileName)

  return (
    <span className={cn("text-[9px] font-semibold", config.textColor, className)}>
      {config.extension}
    </span>
  )
}
