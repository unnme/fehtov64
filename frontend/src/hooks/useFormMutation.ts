import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { FieldValues, UseFormProps, useForm, UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import useCustomToast from '@/hooks/useCustomToast'
import { handleError } from '@/utils'

interface UseFormMutationOptions<TFormData extends FieldValues, TMutationData, TMutationError> {
	/** Zod schema for form validation */
	schema: z.ZodSchema<TFormData>
	/** Form configuration options */
	formOptions?: Omit<UseFormProps<TFormData>, 'resolver' | 'defaultValues'>
	/** Default values for the form */
	defaultValues: TFormData
	/** Mutation function */
	mutationFn: (data: TFormData) => Promise<TMutationData>
	/** Success message to show (set to null to disable auto toast) */
	successMessage?: string | null
	/** Query keys to invalidate after successful mutation */
	invalidateKeys?: string[]
	/**
	 * Callback after mutation succeeds, before toast/reset/invalidate.
	 * Can be async - toast/reset/invalidate wait for it to complete.
	 * Return false to skip automatic toast.
	 */
	onSuccess?: (data: TMutationData, variables: TFormData) => void | false | Promise<void | false>
	/** Callback on error */
	onError?: (error: TMutationError, variables: TFormData) => void
	/** Additional mutation options */
	mutationOptions?: Omit<
		UseMutationOptions<TMutationData, TMutationError, TFormData>,
		'mutationFn' | 'onSuccess' | 'onError' | 'onSettled'
	>
	/** Whether to reset form on success (default: false) */
	resetOnSuccess?: boolean
}

interface UseFormMutationReturn<TFormData extends FieldValues, TMutationData, TMutationError> {
	form: UseFormReturn<TFormData>
	mutation: ReturnType<typeof useMutation<TMutationData, TMutationError, TFormData>>
	/** Submit handler for form.handleSubmit() */
	handleSubmit: (data: TFormData) => void
	/** Async submit - returns mutation result, useful for chaining operations */
	handleSubmitAsync: (data: TFormData) => Promise<TMutationData>
	isPending: boolean
}

/**
 * Hook that combines useForm and useMutation with common patterns:
 * - Form validation with Zod
 * - Error handling with toast notifications
 * - Query invalidation
 * - Form reset on success
 * - Support for async onSuccess (e.g., file uploads after create)
 */
export function useFormMutation<
	TFormData extends FieldValues,
	TMutationData = unknown,
	TMutationError = Error
>({
	schema,
	formOptions,
	defaultValues,
	mutationFn,
	successMessage = null,
	invalidateKeys = [],
	onSuccess,
	onError,
	mutationOptions,
	resetOnSuccess = false
}: UseFormMutationOptions<TFormData, TMutationData, TMutationError>): UseFormMutationReturn<TFormData, TMutationData, TMutationError> {
	const queryClient = useQueryClient()
	const { showSuccessToast, showErrorToast } = useCustomToast()

	/* eslint-disable @typescript-eslint/no-explicit-any */
	const form = useForm<TFormData>({
		resolver: zodResolver(schema as any) as any,
		...formOptions,
		defaultValues: defaultValues as any
	})
	/* eslint-enable @typescript-eslint/no-explicit-any */

	const mutation = useMutation({
		mutationFn,
		onSuccess: async (data, variables) => {
			// Call user's onSuccess first (can be async, e.g., file upload)
			const result = await onSuccess?.(data, variables)

			// Show toast unless disabled or onSuccess returned false
			if (successMessage && result !== false) {
				showSuccessToast(successMessage)
			}

			if (resetOnSuccess) {
				form.reset(defaultValues)
			}

			if (invalidateKeys.length > 0) {
				invalidateKeys.forEach(key => {
					queryClient.invalidateQueries({ queryKey: [key] })
				})
			}
		},
		onError: (error, variables) => {
			handleError.bind(showErrorToast)(error)
			onError?.(error, variables)
		},
		...mutationOptions
	})

	const handleSubmit = (data: TFormData) => {
		mutation.mutate(data)
	}

	const handleSubmitAsync = (data: TFormData) => {
		return mutation.mutateAsync(data)
	}

	return {
		form,
		mutation,
		handleSubmit,
		handleSubmitAsync,
		isPending: mutation.isPending
	}
}
