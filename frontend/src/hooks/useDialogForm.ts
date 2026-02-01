import { useState, useCallback } from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'

interface UseDialogFormOptions<TFormData extends FieldValues> {
	/** Form instance */
	form: UseFormReturn<TFormData>
	/** Default values for form reset */
	defaultValues: TFormData
	/**
	 * Callback when dialog closes - use to reset additional state.
	 * Called after form reset.
	 */
	onClose?: () => void
}

interface UseDialogFormReturn {
	/** Whether dialog is open */
	isOpen: boolean
	/** Open dialog */
	openDialog: () => void
	/** Close dialog and reset form */
	closeDialog: () => void
	/** Set dialog open state (triggers closeDialog on false) */
	setIsOpen: (open: boolean) => void
}

/**
 * Hook for managing dialog state with form reset.
 * Resets form to default values when dialog closes.
 *
 * @example
 * // Simple usage
 * const dialog = useDialogForm({ form, defaultValues })
 *
 * @example
 * // With additional state cleanup
 * const [photoFile, setPhotoFile] = useState<File | null>(null)
 * const dialog = useDialogForm({
 *   form,
 *   defaultValues,
 *   onClose: () => setPhotoFile(null)
 * })
 */
export function useDialogForm<TFormData extends FieldValues>({
	form,
	defaultValues,
	onClose
}: UseDialogFormOptions<TFormData>): UseDialogFormReturn {
	const [isOpen, setIsOpen] = useState(false)

	const openDialog = useCallback(() => {
		setIsOpen(true)
	}, [])

	const closeDialog = useCallback(() => {
		form.reset(defaultValues)
		setIsOpen(false)
		onClose?.()
	}, [form, defaultValues, onClose])

	const handleSetIsOpen = useCallback(
		(open: boolean) => {
			if (open) {
				openDialog()
			} else {
				closeDialog()
			}
		},
		[openDialog, closeDialog]
	)

	return {
		isOpen,
		openDialog,
		closeDialog,
		setIsOpen: handleSetIsOpen
	}
}
