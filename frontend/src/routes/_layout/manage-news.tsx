import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

import { NewsService, type NewsPublic } from "@/client";
import { DataTable } from "@/components/Common";
import { AddNews, columns, NewsFilters } from "@/components/News";
import { PendingNews } from "@/components/Pending";

function getNewsQueryOptions() {
  return {
    queryFn: async () => {
      const response = await NewsService.newsReadNews({ query: { skip: 0, limit: 100 } })
      if ('error' in response && response.error) {
        throw response
      }
      return (response as any).data
    },
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
  const [filteredNews, setFilteredNews] = useState<NewsPublic[]>(news.data || []);

  useEffect(() => {
    setFilteredNews(news.data || []);
  }, [news.data]);

  if (!news.data || news.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Newspaper className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">У вас пока нет новостей</h3>
        <p className="text-muted-foreground">
          Добавьте новую новость, чтобы начать
        </p>
      </div>
    );
  }

  return (
    <>
      <NewsFilters news={news.data} onFilterChange={setFilteredNews} />
      {filteredNews.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Newspaper className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Новости не найдены</h3>
          <p className="text-muted-foreground">
            Попробуйте изменить параметры поиска
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredNews} />
      )}
    </>
  );
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
      <div className="flex items-center justify-between shrink-0 px-4 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            Новости
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Управление новостями и публикациями
          </p>
        </div>
        <AddNews />
      </div>
      <NewsTable />
    </div>
  );
}
