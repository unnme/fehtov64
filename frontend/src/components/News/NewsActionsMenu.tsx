import { useState } from "react"
import { EllipsisVertical } from "lucide-react"

import type { NewsPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useAuth from "@/hooks/useAuth"

import DeleteNews from "./DeleteNews"
import EditNews from "./EditNews"

interface NewsActionsMenuProps {
  news: NewsPublic
}

// Dropdown menu with edit/delete actions for news items
export const NewsActionsMenu = ({ news }: NewsActionsMenuProps) => {
  const [open, setOpen] = useState(false)
  const { user: currentUser } = useAuth()
  
  // Check if user can edit/delete: superusers can edit all, regular users only their own
  const canEdit = currentUser?.is_superuser || news.owner_id === currentUser?.id

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
      <DropdownMenuContent align="end">
        <EditNews news={news} onSuccess={() => setOpen(false)} />
        <DeleteNews id={news.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

