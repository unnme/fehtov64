import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Clock, Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { OrganizationCardService, type OrganizationCardPublic } from "@/client";
import { AddressSection, MessengersSection, PhonesSection, RequisitesSection } from "@/components/OrganizationCard/sections";
import { WorkHoursDialog } from "@/components/OrganizationCard/work-hours";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [isWorkHoursDialogOpen, setIsWorkHoursDialogOpen] = useState(false);
  const [isDirectorHoursDialogOpen, setIsDirectorHoursDialogOpen] = useState(false);

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
      director_hours: { days: [] },
      vk_url: "",
      telegram_url: "",
      whatsapp_url: "",
      max_url: "",
      latitude: undefined,
      longitude: undefined,
      // Requisites
      legal_address: "",
      legal_latitude: undefined,
      legal_longitude: undefined,
      inn: "",
      kpp: "",
      okpo: "",
      ogrn: "",
      okfs: "",
      okogu: "",
      okopf: "",
      oktmo: "",
      okato: "",
      // Bank details
      bank_recipient: "",
      bank_account: "",
      bank_bik: "",
    },
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
      director_hours: stringToWorkHours(data.director_hours ?? ""),
      vk_url: data.vk_url || "",
      telegram_url: data.telegram_url || "",
      whatsapp_url: data.whatsapp_url || "",
      max_url: data.max_url || "",
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
      // Requisites
      legal_address: data.legal_address || "",
      legal_latitude: data.legal_latitude ?? undefined,
      legal_longitude: data.legal_longitude ?? undefined,
      inn: data.inn || "",
      kpp: data.kpp || "",
      okpo: data.okpo || "",
      ogrn: data.ogrn || "",
      okfs: data.okfs || "",
      okogu: data.okogu || "",
      okopf: data.okopf || "",
      oktmo: data.oktmo || "",
      okato: data.okato || "",
      // Bank details
      bank_recipient: data.bank_recipient || "",
      bank_account: data.bank_account || "",
      bank_bik: data.bank_bik || "",
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
        director_hours: payload.director_hours?.days?.length
          ? workHoursToString(payload.director_hours, false)
          : null,
        vk_url: payload.vk_url?.trim() || null,
        telegram_url: payload.telegram_url?.trim() || null,
        whatsapp_url: payload.whatsapp_url?.trim() || null,
        max_url: payload.max_url?.trim() || null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        // Requisites
        legal_address: payload.legal_address?.trim() || null,
        legal_latitude: payload.legal_latitude ?? null,
        legal_longitude: payload.legal_longitude ?? null,
        inn: payload.inn?.trim() || null,
        kpp: payload.kpp?.trim() || null,
        okpo: payload.okpo?.trim() || null,
        ogrn: payload.ogrn?.trim() || null,
        okfs: payload.okfs?.trim() || null,
        okogu: payload.okogu?.trim() || null,
        okopf: payload.okopf?.trim() || null,
        oktmo: payload.oktmo?.trim() || null,
        okato: payload.okato?.trim() || null,
        // Bank details
        bank_recipient: payload.bank_recipient?.trim() || null,
        bank_account: payload.bank_account?.trim() || null,
        bank_bik: payload.bank_bik?.trim() || null,
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
          <CardContent className="pt-6">
            {isLoading && (
              <div className="text-sm text-muted-foreground mb-6">
                Загрузка...
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 w-full"
              >
                {/* Основная информация */}
                <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
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
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </FormLabel>
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

                <hr className="border-border" />

                {/* Контакты */}
                <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                  <PhonesSection
                    control={form.control}
                    setValue={form.setValue}
                  />
                  <MessengersSection
                    control={form.control}
                    setValue={form.setValue}
                  />
                </div>

                <hr className="border-border" />

                {/* Расписание */}
                <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
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
                              className="w-full justify-start text-left h-auto min-h-[58px] py-2.5"
                              onClick={() => setIsWorkHoursDialogOpen(true)}
                            >
                              <div className="flex flex-col items-start gap-0.5 w-full min-w-0">
                                <span className="text-xs text-muted-foreground whitespace-normal text-left" style={{ wordBreak: 'break-word' }}>
                                  {preview || 'Режим работы не указан'}
                                </span>
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

                  <FormField
                    control={form.control}
                    name="director_hours"
                    render={({ field }) => {
                      const preview = field.value
                        ? formatWorkHoursPreview(field.value, false)
                        : "";
                      return (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            Часы приёма директора
                          </FormLabel>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start text-left h-auto min-h-[58px] py-2.5"
                              onClick={() => setIsDirectorHoursDialogOpen(true)}
                            >
                              <div className="flex flex-col items-start gap-0.5 w-full min-w-0">
                                <span className="text-xs text-muted-foreground whitespace-normal text-left" style={{ wordBreak: 'break-word' }}>
                                  {preview || 'Часы приёма не указаны'}
                                </span>
                              </div>
                            </Button>
                          </FormControl>
                          <FormMessage />
                          <WorkHoursDialog
                            value={field.value ?? { days: [] }}
                            onChange={field.onChange}
                            isOpen={isDirectorHoursDialogOpen}
                            onOpenChange={setIsDirectorHoursDialogOpen}
                            title="Часы приёма директора"
                            includeWeekends={false}
                          />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <hr className="border-border" />

                {/* Адрес и Реквизиты */}
                <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                  <AddressSection
                    control={form.control}
                    setValue={form.setValue}
                  />
                  <RequisitesSection
                    control={form.control}
                    setValue={form.setValue}
                  />
                </div>

                <div className="flex justify-end pt-4">
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
