import { Phone, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Control, useWatch } from 'react-hook-form'

import { PhoneNumberInput } from '@/components/OrganizationCard/fields/PhoneNumberInput'
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
import { type OrganizationCardFormData } from '@/schemas/organizationCard'
import { formatPhoneDisplay, isValidPhone, normalizePhone } from '@/utils/phone'

interface PhonesSectionProps {
	control: Control<OrganizationCardFormData>
	setValue: (
		name: keyof OrganizationCardFormData,
		value: OrganizationCardFormData['phones']
	) => void
}

interface LocalPhone {
	value: string
	description: string
}

export const PhonesSection = ({ control, setValue }: PhonesSectionProps) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [localPhones, setLocalPhones] = useState<LocalPhone[]>([])

	const phones = useWatch({ control, name: 'phones' }) ?? []

	const handleOpen = () => {
		setLocalPhones(
			phones.length > 0
				? phones.map((p) => ({
						value: p.value || '+7',
						description: p.description ?? ''
					}))
				: [{ value: '+7', description: '' }]
		)
		setIsDialogOpen(true)
	}

	const handleClose = () => {
		setIsDialogOpen(false)
	}

	const handleSave = () => {
		const validPhones = localPhones
			.filter((p) => isValidPhone(p.value))
			.map((p) => ({
				value: p.value,
				description: p.description.trim() || undefined
			}))
		setValue('phones', validPhones)
		handleClose()
	}

	const handleAddPhone = () => {
		setLocalPhones([...localPhones, { value: '+7', description: '' }])
	}

	const handleRemovePhone = (index: number) => {
		setLocalPhones(localPhones.filter((_, i) => i !== index))
	}

	const handlePhoneChange = (index: number, value: string) => {
		setLocalPhones(localPhones.map((p, i) => (i === index ? { ...p, value } : p)))
	}

	const handleDescriptionChange = (index: number, description: string) => {
		setLocalPhones(localPhones.map((p, i) => (i === index ? { ...p, description } : p)))
	}

	const validPhonesCount = phones.filter((p) => isValidPhone(p.value)).length

	const getPreviewText = () => {
		if (validPhonesCount === 0) return 'Телефоны не добавлены'

		return phones
			.filter((p) => isValidPhone(p.value))
			.map((p) => {
				const normalized = normalizePhone({ phone: p.value })
				const formatted = normalized ? formatPhoneDisplay(normalized.phone) : p.value
				return p.description ? `${formatted} (${p.description})` : formatted
			})
			.join(', ')
	}

	const hasValidLocalPhones = localPhones.some((p) => isValidPhone(p.value))

	return (
		<div className="space-y-2">
			<FormLabel className="flex items-center gap-2">
				<Phone className="h-4 w-4" />
				Телефоны
			</FormLabel>

			<Button
				type="button"
				variant="outline"
				className="w-full justify-start text-left h-auto min-h-[58px] py-2.5"
				onClick={handleOpen}
			>
				<div className="flex flex-col items-start gap-0.5 w-full min-w-0">
					<span className="text-xs text-muted-foreground whitespace-normal text-left" style={{ wordBreak: 'break-word' }}>
						{getPreviewText()}
					</span>
				</div>
			</Button>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Телефоны</DialogTitle>
						<DialogDescription>
							Укажите контактные телефоны организации.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 max-h-[60vh] overflow-y-auto">
						{localPhones.length === 0 ? (
							<div className="text-center py-8 border border-dashed rounded-lg">
								<p className="text-sm text-muted-foreground">
									Нет добавленных телефонов
								</p>
							</div>
						) : (
							localPhones.map((phone, index) => (
								<div
									key={index}
									className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
								>
									<div className="flex items-start justify-between gap-2">
										<span className="text-sm font-medium">Телефон {index + 1}</span>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => handleRemovePhone(index)}
											className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
											aria-label="Удалить телефон"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
									<div className="space-y-3">
										<div className="flex flex-col gap-1">
											<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
												Номер
											</span>
											<PhoneNumberInput
												value={phone.value}
												onChange={(value) => handlePhoneChange(index, value)}
												placeholder="+7 ___-___-__-__"
												className="h-10"
											/>
										</div>
										<div className="flex flex-col gap-1">
											<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
												Описание
											</span>
											<Input
												value={phone.description}
												onChange={(e) => handleDescriptionChange(index, e.target.value)}
												placeholder="Например: Приёмная"
												className="h-10"
											/>
										</div>
									</div>
								</div>
							))
						)}

						<Button
							type="button"
							variant="outline"
							onClick={handleAddPhone}
							className="w-full"
						>
							<Plus className="h-4 w-4 mr-2" />
							Добавить телефон
						</Button>
					</div>

					<DialogFooter className="mt-4">
						<Button variant="ghost" onClick={handleClose}>
							Отменить
						</Button>
						<Button onClick={handleSave} disabled={!hasValidLocalPhones && localPhones.length > 0}>
							ОК
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
