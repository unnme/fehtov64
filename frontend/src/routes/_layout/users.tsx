import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { type UserPublic, UsersService } from "@/client";
import AddUser from "@/components/Admin/AddUser";
import { columns, type UserTableData } from "@/components/Admin/columns";
import { Breadcrumbs } from "@/components/Common/Breadcrumbs";
import { DataTable } from "@/components/Common/DataTable";
import PendingUsers from "@/components/Pending/PendingUsers";
import useAuth from "@/hooks/useAuth";

function getUsersQueryOptions() {
  return {
    queryFn: () => UsersService.readUsers({ skip: 0, limit: 100 }),
    queryKey: ["users"],
  };
}

export const Route = createFileRoute("/_layout/users")({
  component: Users,
  head: () => ({
    meta: [
      {
        title: "Пользователи - FastAPI Cloud",
      },
    ],
  }),
});

function UsersTableContent() {
  const { user: currentUser } = useAuth();
  const { data: users } = useSuspenseQuery(getUsersQueryOptions());

  const tableData: UserTableData[] = users.data.map((user: UserPublic) => ({
    ...user,
    isCurrentUser: currentUser?.id === user.id,
  }));

  return <DataTable columns={columns} data={tableData} />;
}

function UsersTable() {
  return (
    <Suspense fallback={<PendingUsers />}>
      <UsersTableContent />
    </Suspense>
  );
}

function Users() {
  return (
    <div className="flex flex-col h-full">
      <Breadcrumbs />
      <div className="flex items-center justify-between shrink-0 px-4 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Пользователи</h1>
          <p className="text-muted-foreground">
            Управление учетными записями и правами доступа
          </p>
        </div>
        <AddUser />
      </div>
      <UsersTable />
    </div>
  );
}
