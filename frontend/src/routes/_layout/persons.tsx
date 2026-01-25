import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { UserCheck } from "lucide-react"
import { Suspense } from "react"

import { DataTable } from "@/components/Common"
import { PendingUsers } from "@/components/Pending"
import { AddPerson, getColumns } from "@/components/Persons"
import { ManagePositionsDialog } from "@/components/Positions"
import useAuth from "@/hooks/useAuth"
import { PersonsService } from "@/services/personsService"

function getPersonsQueryOptions() {
  return {
    queryFn: async () => PersonsService.list(),
    queryKey: ["persons"],
  }
}

export const Route = createFileRoute("/_layout/persons")({
  component: Persons,
  head: () => ({
    meta: [
      {
        title: "Персонал - Панель управления",
      },
    ],
  }),
})

function PersonsTableContent() {
  const { user: currentUser } = useAuth()
  const { data: persons } = useSuspenseQuery(getPersonsQueryOptions())

  return (
    <DataTable
      columns={getColumns(Boolean(currentUser?.is_superuser))}
      data={persons?.data || []}
    />
  )
}

function PersonsTable() {
  return (
    <Suspense fallback={<PendingUsers />}>
      <PersonsTableContent />
    </Suspense>
  )
}

function Persons() {
  const { user: currentUser } = useAuth()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0 px-4 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            Персонал
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Сотрудники и контактная информация
          </p>
        </div>
        {currentUser?.is_superuser && (
          <div className="flex items-center gap-2">
            <ManagePositionsDialog />
            <AddPerson />
          </div>
        )}
      </div>
      <PersonsTable />
    </div>
  )
}
