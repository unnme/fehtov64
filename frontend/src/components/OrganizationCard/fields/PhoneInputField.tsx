import { Pencil, Trash2 } from 'lucide-react'
import { Control, UseFieldArrayRemove, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import type { OrganizationCardFormData } from '@/schemas/organizationCard'
import { formatPhoneDisplay, normalizePhone } from '@/utils/phone'

interface PhoneInputFieldProps {
	control: Control<OrganizationCardFormData>
	index: number
	remove: UseFieldArrayRemove
	onEdit: (index: number) => void
}

export const PhoneInputField = ({
	control,
	index,
	remove,
	onEdit
}: PhoneInputFieldProps) => {
	const phoneValue = useWatch({ control, name: `phones.${index}.value` })
	const phoneDescription = useWatch({ control, name: `phones.${index}.description` })

	const normalized = normalizePhone({ phone: phoneValue, description: phoneDescription })
	const displayPhone = normalized ? formatPhoneDisplay(normalized.phone) : phoneValue || ''

	return (
		<div>
			<div className="grid gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))_auto] items-end">
				<div className="flex flex-col gap-1">
					<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Телефон</span>
					<div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground min-h-10 flex items-center">
						{displayPhone}
					</div>
				</div>
				<div className="flex flex-col gap-1">
					<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Этикетка</span>
					<div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground min-h-10 flex items-center">
						{phoneDescription || <span className="text-muted-foreground/50">—</span>}
					</div>
				</div>
				<div className="flex items-center justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => onEdit(index)}
						aria-label="Редактировать телефон"
						className="shrink-0 h-9 w-9 border-border"
					>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => remove(index)}
						aria-label="Удалить телефон"
						className="shrink-0 h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-border"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
