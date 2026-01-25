import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Briefcase } from "lucide-react"
import { Suspense } from "react"

import { DataTable } from "@/components/Common"
import { PendingUsers } from "@/components/Pending"
import { AddPosition, getColumns } from "@/components/Positions"
import useAuth from "@/hooks/useAuth"
import { PositionsService } from "@/services/positionsService"

function getPositionsQueryOptions() {
  return {
    queryFn: async () => PositionsService.list(),
    queryKey: ["positions"],
  }
}

export const Route = createFileRoute("/_layout/positions")({
  component: Positions,
  head: () => ({
    meta: [
      {
        title: "Должности - Панель управления",
      },
    ],
  }),
})

function PositionsTableContent() {
  const { user: currentUser } = useAuth()
  const { data: positions } = useSuspenseQuery(getPositionsQueryOptions())

  return (
    <DataTable
      columns={getColumns(Boolean(currentUser?.is_superuser))}
      data={positions?.data || []}
    />
  )
}

function PositionsTable() {
  return (
    <Suspense fallback={<PendingUsers />}>
      <PositionsTableContent />
    </Suspense>
  )
}

function Positions() {
  const { user: currentUser } = useAuth()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0 px-4 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Должности
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Справочник должностей
          </p>
        </div>
        {currentUser?.is_superuser && <AddPosition />}
      </div>
      <PositionsTable />
    </div>
  )
}
