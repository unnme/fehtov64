import { z } from 'zod'

import { emailSchema, passwordSchema } from './common'

/**
 * Authentication form schemas.
 */

/**
 * Schema for user login.
 * Note: Uses 'username' field for compatibility with backend API (email as username).
 */
export const loginSchema = z.object({
	username: z.string().email({ message: 'Неверный email' }),
	password: z.string().min(1, { message: 'Пароль обязателен' }).min(8, {
		message: 'Пароль должен быть минимум 8 символов'
	})
})

/**
 * Schema for user registration.
 */
export const registerSchema = z
	.object({
		email: emailSchema,
		password: passwordSchema,
		confirm_password: z.string().min(1, { message: 'Подтвердите пароль' }),
		nickname: z
			.string()
			.min(1, { message: 'Псевдоним обязателен' })
			.max(255, { message: 'Максимум 255 символов' })
			.transform((value) => value.trim())
	})
	.refine((data) => data.password === data.confirm_password, {
		message: 'Пароли не совпадают',
		path: ['confirm_password']
	})

/**
 * Schema for password reset request.
 */
export const passwordResetRequestSchema = z.object({
	email: emailSchema
})

/**
 * Schema for password reset with token.
 */
export const passwordResetSchema = z.object({
	token: z.string().min(1, { message: 'Токен обязателен' }),
	new_password: passwordSchema
})

/**
 * Schema for changing password (requires current password).
 */
export const changePasswordSchema = z
	.object({
		current_password: z.string().min(1, { message: 'Текущий пароль обязателен' }),
		new_password: passwordSchema,
		confirm_password: z.string().min(1, { message: 'Подтвердите пароль' })
	})
	.refine((data) => data.new_password === data.confirm_password, {
		message: 'Пароли не совпадают',
		path: ['confirm_password']
	})

/**
 * Type inference for login form data.
 */
export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Type inference for register form data.
 */
export type RegisterFormData = z.infer<typeof registerSchema>

/**
 * Type inference for password reset request form data.
 */
export type PasswordResetRequestFormData = z.infer<
	typeof passwordResetRequestSchema
>

/**
 * Type inference for password reset form data.
 */
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>

/**
 * Type inference for change password form data.
 */
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
