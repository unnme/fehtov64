import { Pencil } from 'lucide-react'
import { Control } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type OrganizationCardFormData } from '@/schemas/organizationCard'

interface OrganizationNameFieldProps {
	control: Control<OrganizationCardFormData>
	isEditDialogOpen: boolean
	onOpenEditDialog: () => void
	onCloseEditDialog: () => void
	editValue: string
	onEditValueChange: (value: string) => void
	onSave: () => void
}

export const OrganizationNameField = ({
	control,
	isEditDialogOpen,
	onOpenEditDialog,
	onCloseEditDialog,
	editValue,
	onEditValueChange,
	onSave
}: OrganizationNameFieldProps) => {
	return (
		<>
			<FormField
				control={control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Название организации</FormLabel>
						<FormControl>
							<div className="flex items-center gap-2">
								<div className="flex-1 rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground min-h-10 flex items-center">
									{field.value || (
										<span className="text-muted-foreground/50">
											Не указано
										</span>
									)}
								</div>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={onOpenEditDialog}
									aria-label="Редактировать название организации"
									className="shrink-0 h-9 w-9 border-border"
								>
									<Pencil className="h-4 w-4" />
								</Button>
							</div>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<Dialog open={isEditDialogOpen} onOpenChange={onOpenEditDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Редактировать название организации</DialogTitle>
						<DialogDescription>
							Измените название организации.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								Название организации
							</span>
							<Input
								value={editValue}
								onChange={event => onEditValueChange(event.target.value)}
								placeholder="Полное официальное название"
								className="h-10"
								autoFocus={isEditDialogOpen}
							/>
						</div>
					</div>
					<DialogFooter className="mt-4">
						<Button variant="ghost" onClick={onCloseEditDialog}>
							Отменить
						</Button>
						<Button onClick={onSave}>Сохранить</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
