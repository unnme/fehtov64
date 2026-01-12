import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { NewsService } from "@/client";
import { Breadcrumbs } from "@/components/Common/Breadcrumbs";
import { DataTable } from "@/components/Common/DataTable";
import AddNews from "@/components/News/AddNews";
import { columns } from "@/components/News/columns";
import PendingNews from "@/components/Pending/PendingNews";

function getNewsQueryOptions() {
  return {
    queryFn: () => NewsService.readNews({ skip: 0, limit: 100 }),
    queryKey: ["news"],
  };
}

export const Route = createFileRoute("/_layout/manage-news")({
  component: News,
  head: () => ({
    meta: [
      {
        title: "Новости - FastAPI Cloud",
      },
    ],
  }),
});

function NewsTableContent() {
  const { data: news } = useSuspenseQuery(getNewsQueryOptions());

  if (news.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">У вас пока нет новостей</h3>
        <p className="text-muted-foreground">
          Добавьте новую новость, чтобы начать
        </p>
      </div>
    );
  }

  return <DataTable columns={columns} data={news.data} />;
}

function NewsTable() {
  return (
    <Suspense fallback={<PendingNews />}>
      <NewsTableContent />
    </Suspense>
  );
}

function News() {
  return (
    <div className="flex flex-col h-full">
      <Breadcrumbs />
      <div className="flex items-center justify-between shrink-0 px-4 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Новости</h1>
          <p className="text-muted-foreground">
            Создавайте и управляйте своими новостями
          </p>
        </div>
        <AddNews />
      </div>
      <NewsTable />
    </div>
  );
}
