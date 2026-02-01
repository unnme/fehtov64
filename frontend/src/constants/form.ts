import { UseFormProps } from 'react-hook-form'

/**
 * Default form options for consistent form behavior across the application
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FORM_DEFAULT_OPTIONS: Partial<UseFormProps<any>> = {
	mode: 'onBlur',
	criteriaMode: 'all',
}

/**
 * Default form options for forms that validate on change
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FORM_ON_CHANGE_OPTIONS: Partial<UseFormProps<any>> = {
	mode: 'onChange',
	criteriaMode: 'all',
}
