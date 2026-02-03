import type { ColumnDef } from "@tanstack/react-table"
import { Crown, Image as ImageIcon, Users } from "lucide-react"

import type { PersonPublic } from "@/client"

import { Badge } from "@/components/ui/badge"
import { getPersonImageFileUrl } from "@/utils/fileUrls"
import PersonActionsMenu from "./PersonActionsMenu"

function formatFullName(person: PersonPublic): string {
  return `${person.last_name} ${person.first_name} ${person.middle_name}`
}

const DEFAULT_POSITION_NAME = "Без должности"

function getBaseColumns(): ColumnDef<PersonPublic>[] {
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
      cell: ({ row }) => {
        const position = row.original.position
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {position?.name || DEFAULT_POSITION_NAME}
            </Badge>
            {position?.is_management && (
              <span title="Руководящая должность">
                <Users className="h-4 w-4 text-blue-500" />
              </span>
            )}
            {position?.is_director && (
              <span title="Руководитель организации">
                <Crown className="h-4 w-4 text-amber-500" />
              </span>
            )}
          </div>
        )
      },
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

export function getColumns(isSuperuser: boolean): ColumnDef<PersonPublic>[] {
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
