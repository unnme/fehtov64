import { Phone } from 'lucide-react'
import { useState } from 'react'
import { Control, useFieldArray, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PhoneInputField } from '@/components/OrganizationCard/fields/PhoneInputField'
import { PhoneNumberInput } from '@/components/OrganizationCard/fields/PhoneNumberInput'
import { type OrganizationCardFormData } from '@/schemas/organizationCard'
import { isValidPhone } from '@/utils/phone'

interface PhonesSectionProps {
	control: Control<OrganizationCardFormData>
}

export const PhonesSection = ({ control }: PhonesSectionProps) => {
	const { fields, append, remove, update } = useFieldArray({
		control,
		name: 'phones'
	})

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [editIndex, setEditIndex] = useState<number | null>(null)

	const [newPhone, setNewPhone] = useState({ value: '+7', label: '' })
	const [editPhone, setEditPhone] = useState({ value: '', label: '' })

	const phones = useWatch({ control, name: 'phones' })

	const handleOpenAdd = () => {
		setNewPhone({ value: '+7', label: '' })
		setIsAddDialogOpen(true)
	}

	const handleCloseAdd = () => {
		setIsAddDialogOpen(false)
	}

	const handleAdd = () => {
		append({ value: newPhone.value, description: newPhone.label || undefined })
		handleCloseAdd()
	}

	const handleOpenEdit = (index: number) => {
		const phone = phones?.[index]
		if (phone) {
			setEditPhone({ value: phone.value, label: phone.description ?? '' })
			setEditIndex(index)
			setIsEditDialogOpen(true)
		}
	}

	const handleCloseEdit = () => {
		setIsEditDialogOpen(false)
		setEditIndex(null)
	}

	const handleSaveEdit = () => {
		if (editIndex !== null) {
			update(editIndex, {
				value: editPhone.value,
				description: editPhone.label || undefined
			})
		}
		handleCloseEdit()
	}

	const isNewPhoneValid = isValidPhone(newPhone.value)
	const isEditPhoneValid = isValidPhone(editPhone.value)

	return (
		<div className="space-y-3">
			<FormLabel className="flex items-center gap-2">
				<Phone className="h-4 w-4" />
				Телефоны
			</FormLabel>

			{fields.length > 0 && (
				<div className="rounded-2xl border border-border bg-muted/30 p-4 shadow-sm space-y-3">
					{fields.map((fieldItem, index) => (
						<PhoneInputField
							key={fieldItem.id}
							control={control}
							index={index}
							remove={remove}
							onEdit={handleOpenEdit}
						/>
					))}
				</div>
			)}

			<Button type="button" variant="secondary" onClick={handleOpenAdd}>
				Добавить телефон
			</Button>

			{/* Add Dialog */}
			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Добавить телефон</DialogTitle>
						<DialogDescription>
							Задайте новый номер и краткую этикетку.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								Телефон
							</span>
							<PhoneNumberInput
								value={newPhone.value}
								onChange={(value) => setNewPhone((p) => ({ ...p, value }))}
								placeholder="+7 ___-___-__-__"
								className="h-10"
								autoFocus
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								Этикетка
							</span>
							<Input
								value={newPhone.label}
								onChange={(e) => setNewPhone((p) => ({ ...p, label: e.target.value }))}
								placeholder="Этикетка"
								className="h-10"
							/>
						</div>
					</div>
					<DialogFooter className="mt-4">
						<Button variant="ghost" onClick={handleCloseAdd}>
							Отменить
						</Button>
						<Button onClick={handleAdd} disabled={!isNewPhoneValid}>
							Сохранить
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Редактировать телефон</DialogTitle>
						<DialogDescription>
							Измените номер и этикетку телефона.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								Телефон
							</span>
							<PhoneNumberInput
								value={editPhone.value}
								onChange={(value) => setEditPhone((p) => ({ ...p, value }))}
								placeholder="+7 ___-___-__-__"
								className="h-10"
								autoFocus
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								Этикетка
							</span>
							<Input
								value={editPhone.label}
								onChange={(e) => setEditPhone((p) => ({ ...p, label: e.target.value }))}
								placeholder="Этикетка"
								className="h-10"
							/>
						</div>
					</div>
					<DialogFooter className="mt-4">
						<Button variant="ghost" onClick={handleCloseEdit}>
							Отменить
						</Button>
						<Button onClick={handleSaveEdit} disabled={!isEditPhoneValid}>
							Сохранить
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
