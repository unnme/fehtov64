import { useState } from "react"
import { EllipsisVertical } from "lucide-react"

import type { Position } from "@/services/positionsService"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import DeletePosition from "./DeletePosition"
import EditPosition from "./EditPosition"

interface PositionActionsMenuProps {
  position: Position
}

function PositionActionsMenu({ position }: PositionActionsMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditPosition position={position} onSuccess={() => setOpen(false)} />
        <DeletePosition id={position.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default PositionActionsMenu
