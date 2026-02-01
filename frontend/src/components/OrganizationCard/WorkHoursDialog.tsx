import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { type WorkHours } from '@/utils/workHours'

import { WorkHoursEditor } from './WorkHoursEditor'

interface WorkHoursDialogProps {
	value: WorkHours
	onChange: (value: WorkHours) => void
	isOpen: boolean
	onOpenChange: (open: boolean) => void
}

export const WorkHoursDialog = ({
	value,
	onChange,
	isOpen,
	onOpenChange,
}: WorkHoursDialogProps) => {
	const [localValue, setLocalValue] = useState<WorkHours>(value)

	useEffect(() => {
		if (isOpen) {
			setLocalValue(value)
		}
	}, [isOpen, value])

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setLocalValue(value)
		}
		onOpenChange(open)
	}

	const handleSave = () => {
		onChange(localValue)
		onOpenChange(false)
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent 
				className="max-h-[95vh] overflow-y-auto w-auto max-w-[95vw]"
				style={{
					maxWidth: '1400px'
				}}
			>
				<DialogHeader>
					<DialogTitle className="text-lg sm:text-xl">Режим работы</DialogTitle>
				</DialogHeader>
				<div className="py-4 sm:py-6">
					<WorkHoursEditor value={localValue} onChange={setLocalValue} />
				</div>
				<DialogFooter className="gap-2 border-t pt-3 sm:pt-4 mt-3 sm:mt-4 flex-col sm:flex-row">
					<Button variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto sm:min-w-25">
						Отмена
					</Button>
					<Button onClick={handleSave} className="w-full sm:w-auto sm:min-w-25">
						Сохранить
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
