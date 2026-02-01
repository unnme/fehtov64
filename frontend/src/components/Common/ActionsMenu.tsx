import { useState, ReactNode } from "react"
import { EllipsisVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ActionsMenuProps<T> {
  item: T
  onEdit?: (item: T) => ReactNode
  onDelete?: (item: T) => ReactNode
  canEdit?: boolean
  align?: "start" | "end" | "center"
}

export function ActionsMenu<T>({ 
  item, 
  onEdit, 
  onDelete, 
  canEdit = true,
  align = "end"
}: ActionsMenuProps<T>) {
  const [open, setOpen] = useState(false)

  if (!canEdit) {
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {onEdit?.(item)}
        {onDelete?.(item)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
