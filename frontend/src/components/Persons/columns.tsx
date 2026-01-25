import type { ColumnDef } from "@tanstack/react-table"

import type { Person } from "@/services/personsService"
import { Image as ImageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getPersonImageFileUrl } from "@/utils/fileUrls"
import PersonActionsMenu from "./PersonActionsMenu"

function formatFullName(person: Person): string {
  return `${person.last_name} ${person.first_name} ${person.middle_name}`
}

const DEFAULT_POSITION_NAME = "Без должности"

function getBaseColumns(): ColumnDef<Person>[] {
  return [
    {
      accessorKey: "image",
      header: () => <span className="sr-only">Фото</span>,
      cell: ({ row }) => {
        const imageUrl = row.original.image
          ? getPersonImageFileUrl(row.original.id)
          : null
        return (
          <div className="flex items-center justify-center">
            {imageUrl ? (
              <div className="h-16 w-12 rounded-md overflow-hidden border bg-muted">
                <img
                  src={imageUrl}
                  alt={formatFullName(row.original)}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-12 rounded-md bg-muted border border-dashed flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "full_name",
      header: "ФИО",
      cell: ({ row }) => (
        <span className="font-medium">{formatFullName(row.original)}</span>
      ),
    },
    {
      accessorKey: "position",
      header: "Должность",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.position?.name || DEFAULT_POSITION_NAME}
        </Badge>
      ),
    },
    {
      accessorKey: "phone",
      header: "Телефон",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Почта",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
  ]
}

export function getColumns(isSuperuser: boolean): ColumnDef<Person>[] {
  const baseColumns = getBaseColumns()
  if (!isSuperuser) return baseColumns

  return [
    ...baseColumns,
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <PersonActionsMenu person={row.original} />
        </div>
      ),
    },
  ]
}
