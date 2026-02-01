import type { ColumnDef } from "@tanstack/react-table"

import type { PositionPublic } from "@/client"
import PositionActionsMenu from "./PositionActionsMenu"

function getBaseColumns(): ColumnDef<PositionPublic>[] {
  return [
    {
      accessorKey: "name",
      header: "Название",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
  ]
}

export function getColumns(isSuperuser: boolean): ColumnDef<PositionPublic>[] {
  const baseColumns = getBaseColumns()
  if (!isSuperuser) return baseColumns

  return [
    ...baseColumns,
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <PositionActionsMenu position={row.original} />
        </div>
      ),
    },
  ]
}
