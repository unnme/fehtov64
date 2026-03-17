import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { RichTextEditor } from '@/components/ui/rich-text-editor-lazy'

interface DescriptionDialogProps {
	value: string
	onChange: (value: string) => void
	isOpen: boolean
	onOpenChange: (open: boolean) => void
}

export const DescriptionDialog = ({
	value,
	onChange,
	isOpen,
	onOpenChange,
}: DescriptionDialogProps) => {
	const [localValue, setLocalValue] = useState(value)

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
			<DialogContent className="max-h-[95vh] overflow-y-auto w-full max-w-[95vw] lg:max-w-[900px]">
				<DialogHeader>
					<DialogTitle className="text-lg sm:text-xl">
						Доп. описание
					</DialogTitle>
				</DialogHeader>
				<div className="py-4 sm:py-6">
					<RichTextEditor
						content={localValue}
						onChange={setLocalValue}
						placeholder="Дополнительное описание организации..."
					/>
				</div>
				<DialogFooter className="gap-2 border-t pt-3 sm:pt-4 mt-3 sm:mt-4 flex-col sm:flex-row">
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						className="w-full sm:w-auto sm:min-w-25"
					>
						Отмена
					</Button>
					<Button
						onClick={handleSave}
						className="w-full sm:w-auto sm:min-w-25"
					>
						ОК
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
