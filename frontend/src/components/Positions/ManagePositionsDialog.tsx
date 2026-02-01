import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { DeleteConfirmationDialog } from "@/components/Common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PositionsService, type PositionPublic, type PositionsPublic } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError, unwrapResponse } from "@/utils"
import { isValidPositionName, normalizePositionName } from "@/utils/positionName"

const DEFAULT_POSITION_NAME = "Без должности"

const positionFormSchema = z.object({
  name: z
    .string()
    .min(1, "Название обязательно")
    .max(255, "Максимум 255 символов")
    .refine(isValidPositionName, {
      message: "Одно слово, без пробелов, допускается одно тире",
    })
    .transform(normalizePositionName),
})

type PositionFormData = z.infer<typeof positionFormSchema>

interface EditPositionDialogProps {
  position: PositionPublic
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function EditPositionDialog({
  position,
  isOpen,
  onOpenChange,
}: EditPositionDialogProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<PositionFormData>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      name: position.name,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PositionFormData) =>
      unwrapResponse<PositionPublic>(PositionsService.positionsUpdatePosition({ path: { position_id: position.id }, body: { name: data.name } })),
    onSuccess: () => {
      showSuccessToast("Должность обновлена")
      queryClient.invalidateQueries({ queryKey: ["positions"] })
      onOpenChange(false)
      form.reset()
    },
    onError: handleError.bind(showErrorToast),
  })

  const handleClose = (open: boolean) => {
    if (!open && !mutation.isPending) {
      onOpenChange(false)
      form.reset({ name: position.name })
    }
  }

  const handleSubmit = (data: PositionFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать должность</DialogTitle>
          <DialogDescription>Измените название должности</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название должности</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите название должности"
                      {...field}
                      onBlur={(event) => {
                        field.onBlur()
                        field.onChange(normalizePositionName(event.target.value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={mutation.isPending}
              >
                Отмена
              </Button>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Сохранить
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface AddPositionDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function AddPositionDialog({ isOpen, onOpenChange }: AddPositionDialogProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<PositionFormData>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      name: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PositionFormData) =>
      unwrapResponse<PositionPublic>(PositionsService.positionsCreatePosition({ body: { name: data.name } })),
    onSuccess: () => {
      showSuccessToast("Должность создана")
      queryClient.invalidateQueries({ queryKey: ["positions"] })
      onOpenChange(false)
      form.reset()
    },
    onError: handleError.bind(showErrorToast),
  })

  const handleClose = (open: boolean) => {
    if (!open && !mutation.isPending) {
      onOpenChange(false)
      form.reset()
    }
  }

  const handleSubmit = (data: PositionFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать должность</DialogTitle>
          <DialogDescription>Добавьте новую должность в список</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название должности</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите название должности"
                      {...field}
                      onBlur={(event) => {
                        field.onBlur()
                        field.onChange(normalizePositionName(event.target.value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={mutation.isPending}
              >
                Отмена
              </Button>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Создать
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface DeletePositionButtonProps {
  position: PositionPublic
}

function DeletePositionButton({ position }: DeletePositionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        onClick={(event) => {
          event.stopPropagation()
          setIsOpen(true)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DeleteConfirmationDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={async () => { await PositionsService.positionsDeletePosition({ path: { position_id: position.id } }) }}
        title="Удалить должность?"
        description={`Вы уверены, что хотите удалить должность "${position.name}"?`}
        successMessage="Должность удалена"
        queryKeys={["positions", "persons"]}
      />
    </>
  )
}

export function ManagePositionsDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<PositionPublic | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { data: positions = { data: [], count: 0 }, isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: () => unwrapResponse<PositionsPublic>(PositionsService.positionsReadPositions()),
    enabled: isOpen,
  })

  const filteredPositions = positions.data.filter(
    (position) => position.name !== DEFAULT_POSITION_NAME
  )
  const hasScroll = filteredPositions.length > 7

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Edit2 className="mr-2 h-4 w-4" />
            Редактировать должности
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Управление должностями</DialogTitle>
            <DialogDescription>
              Добавляйте, редактируйте и удаляйте должности
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить должность
              </Button>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
            ) : filteredPositions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Должности не найдены
              </div>
            ) : (
              <div
                className={cn("border rounded-lg", hasScroll && "max-h-96 overflow-y-auto")}
              >
                <div className="divide-y">
                  {filteredPositions.map((position) => (
                    <div
                      key={position.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium">{position.name}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingPosition(position)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <DeletePositionButton position={position} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {editingPosition && (
        <EditPositionDialog
          position={editingPosition}
          isOpen={!!editingPosition}
          onOpenChange={(open) => !open && setEditingPosition(null)}
        />
      )}
      <AddPositionDialog isOpen={isAddOpen} onOpenChange={setIsAddOpen} />
    </>
  )
}
