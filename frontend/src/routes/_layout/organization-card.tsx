import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Clock, MapPin, MapPinned, Navigation } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { OrganizationCardService, type OrganizationCardPublic } from "@/client";
import { MessengersSection } from "@/components/OrganizationCard/MessengersSection";
import { PhonesSection } from "@/components/OrganizationCard/PhonesSection";
import { WorkHoursDialog } from "@/components/OrganizationCard/WorkHoursDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import useAuth from "@/hooks/useAuth";
import useCustomToast from "@/hooks/useCustomToast";
import { useOrganizationCardMap } from "@/hooks/useOrganizationCardMap";
import { useYandexMapsApiKey } from "@/hooks/useYandexMapsApiKey";
import {
  organizationCardSchema,
  type OrganizationCardFormData,
} from "@/schemas/organizationCard";
import { type ApiError, handleError, unwrapResponse } from "@/utils";
import { formatPhone, normalizePhone } from "@/utils/phone";
import {
  formatWorkHoursPreview,
  stringToWorkHours,
  workHoursToString,
} from "@/utils/workHours";

export const Route = createFileRoute("/_layout/organization-card")({
  component: OrganizationCardPage,
  head: () => ({
    meta: [{ title: "Карточка организации - Панель управления" }],
  }),
});

const QUERY_KEY = ["organization-card"];

function OrganizationCardPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { apiKey, hasApiKey, rawKey } = useYandexMapsApiKey();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isWorkHoursDialogOpen, setIsWorkHoursDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      unwrapResponse<OrganizationCardPublic>(
        OrganizationCardService.organizationCardReadCard(),
      ),
    retry: false,
  });

  const form = useForm<OrganizationCardFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(organizationCardSchema) as any,
    mode: "onBlur",
    defaultValues: {
      name: "",
      phones: [],
      email: "",
      address: "",
      work_hours: { days: [] },
      vk_url: "",
      telegram_url: "",
      whatsapp_url: "",
      max_url: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

  const initialCoords = useMemo(() => {
    if (!data?.latitude || !data?.longitude) return null;
    return { latitude: data.latitude, longitude: data.longitude };
  }, [data?.latitude, data?.longitude]);

  const { isGeocoding, isMapReady, handleGetCurrentLocation } =
    useOrganizationCardMap({
      apiKey,
      hasApiKey,
      initialCoords,
      mapContainerRef,
      setValue: form.setValue,
    });

  useEffect(() => {
    if (!data) return;

    const phones = data.phones?.length
      ? data.phones.map((phone) => {
          const normalized = normalizePhone(phone);
          if (!normalized) return { value: "+7", description: undefined };
          const phoneValue = normalized.phone.startsWith("+7")
            ? normalized.phone
            : formatPhone(normalized.phone || "+7");
          return {
            value: phoneValue,
            description: normalized.description || undefined,
          };
        })
      : [];

    form.reset({
      name: data.name || "",
      phones,
      email: data.email || "",
      address: data.address || "",
      work_hours: stringToWorkHours(data.work_hours ?? ""),
      vk_url: data.vk_url || "",
      telegram_url: data.telegram_url || "",
      whatsapp_url: data.whatsapp_url || "",
      max_url: data.max_url || "",
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
    });
  }, [data, form]);

  const handleSubmit = (values: OrganizationCardFormData) => {
    if (!values.name?.trim()) {
      showErrorToast("Укажите название организации");
      return;
    }
    mutation.mutate(values);
  };

  const mutation = useMutation({
    mutationFn: async (payload: OrganizationCardFormData) => {
      const body = {
        name: payload.name?.trim() || null,
        phones: (payload.phones || [])
          .filter((p) => p.value?.replace(/\D/g, "").length > 1)
          .map((phone) => ({
            phone: phone.value || "",
            description: phone.description?.trim() || null,
          })),
        email: payload.email?.trim() || null,
        address: payload.address?.trim() || null,
        work_hours: payload.work_hours?.days?.length
          ? workHoursToString(payload.work_hours)
          : null,
        vk_url: payload.vk_url?.trim() || null,
        telegram_url: payload.telegram_url?.trim() || null,
        whatsapp_url: payload.whatsapp_url?.trim() || null,
        max_url: payload.max_url?.trim() || null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
      };

      // Try update, create on 404
      try {
        return await unwrapResponse<OrganizationCardPublic>(
          OrganizationCardService.organizationCardUpdateCard({ body }),
        );
      } catch (error) {
        if ((error as ApiError)?.status === 404) {
          // For create, name is required (validated in handleSubmit)
          const createBody = { ...body, name: body.name! };
          return await unwrapResponse<OrganizationCardPublic>(
            OrganizationCardService.organizationCardCreateCard({ body: createBody }),
          );
        }
        throw error;
      }
    },
    onSuccess: (savedData) => {
      queryClient.setQueryData(QUERY_KEY, savedData);
      showSuccessToast("Карточка организации сохранена");
    },
    onError: handleError.bind(showErrorToast),
  });

  if (!currentUser?.is_superuser) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">
            Доступ только для суперпользователей
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between shrink-0 px-4 py-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Карточка организации
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Контактные данные и ссылки организации
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Основные данные</CardTitle>
            <CardDescription>
              Заполните карточку, чтобы информация отображалась на странице
              контактов
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-sm text-muted-foreground mb-4">
                Загрузка...
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 w-full"
              >
                {/* Название и Email */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Название организации
                          <span className="text-destructive ml-0.5">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Полное официальное название"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Телефоны */}
                <PhonesSection control={form.control} />

                {/* Мессенджеры и соц. сети */}
                <MessengersSection
                  control={form.control}
                  setValue={form.setValue}
                />

                {/* Режим работы */}
                <FormField
                  control={form.control}
                  name="work_hours"
                  render={({ field }) => {
                    const preview = field.value
                      ? formatWorkHoursPreview(field.value)
                      : "";
                    return (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Режим работы
                        </FormLabel>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left h-auto py-3"
                            onClick={() => setIsWorkHoursDialogOpen(true)}
                          >
                            <div className="flex flex-col items-start gap-1 w-full">
                              <span className="text-sm font-medium">
                                {preview || "Настроить рабочие дни и время"}
                              </span>
                              {preview && (
                                <span className="text-xs text-muted-foreground">
                                  Нажмите для редактирования
                                </span>
                              )}
                            </div>
                          </Button>
                        </FormControl>
                        <FormMessage />
                        <WorkHoursDialog
                          value={field.value ?? { days: [] }}
                          onChange={field.onChange}
                          isOpen={isWorkHoursDialogOpen}
                          onOpenChange={setIsWorkHoursDialogOpen}
                        />
                      </FormItem>
                    );
                  }}
                />

                {/* Адрес и карта */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Адрес организации
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              readOnly
                              value={field.value || ""}
                              className="absolute opacity-0 pointer-events-none h-0 p-0 border-0"
                              tabIndex={-1}
                            />
                            {field.value ? (
                              <div className="text-sm py-2 wrap-break-words">
                                {field.value}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground py-2">
                                Выберите точку на карте
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPinned className="h-4 w-4" />
                        <span>Укажите адрес на карте</span>
                        {isGeocoding && (
                          <span className="animate-pulse">· ищу адрес...</span>
                        )}
                      </div>
                      {hasApiKey && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGetCurrentLocation}
                          disabled={!isMapReady}
                          className="flex items-center gap-2"
                        >
                          <Navigation className="h-4 w-4" />
                          Моё местоположение
                        </Button>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-lg border h-72 w-full">
                      {hasApiKey ? (
                        <div ref={mapContainerRef} className="h-full w-full" />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-sm text-muted-foreground p-4">
                          <div>
                            Укажите VITE_YANDEX_MAPS_API_KEY в файле .env
                          </div>
                          <div className="text-xs mt-2 text-center opacity-50">
                            Значение:{" "}
                            {rawKey
                              ? `"${String(rawKey).slice(0, 20)}..."`
                              : "не задано"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <LoadingButton type="submit" loading={mutation.isPending}>
                    Сохранить
                  </LoadingButton>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
