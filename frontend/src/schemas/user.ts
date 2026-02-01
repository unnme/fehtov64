import { z } from 'zod'

import { emailSchema, passwordSchema } from './common'

/**
 * User form schemas for creating and editing users.
 */

/**
 * Nickname schema.
 */
const nicknameSchema = z
	.string()
	.min(1, { message: 'Псевдоним обязателен' })
	.max(255, { message: 'Максимум 255 символов' })
	.transform((value) => value.trim())

/**
 * Schema for creating a new user (with password confirmation).
 */
export const createUserSchema = z
	.object({
		email: emailSchema,
		nickname: nicknameSchema,
		password: passwordSchema,
		confirm_password: z.string().min(1, { message: 'Подтвердите пароль' }),
		is_active: z.boolean(),
		is_superuser: z.boolean()
	})
	.refine((data) => data.password === data.confirm_password, {
		message: 'Пароли не совпадают',
		path: ['confirm_password']
	})

/**
 * Schema for editing an existing user (password optional).
 */
export const editUserSchema = z.object({
	email: emailSchema,
	nickname: nicknameSchema,
	password: z
		.string()
		.min(8, { message: 'Пароль должен быть минимум 8 символов' })
		.optional()
		.or(z.literal('')),
	is_active: z.boolean().optional(),
	is_superuser: z.boolean().optional()
})

/**
 * Schema for updating own user profile.
 */
export const updateUserMeSchema = z.object({
	nickname: nicknameSchema
})

/**
 * Schema for email verification request.
 */
export const emailVerificationRequestSchema = z.object({
	new_email: emailSchema
})

/**
 * Schema for email verification with code.
 */
export const emailVerificationSchema = z
	.object({
		new_email: emailSchema,
		code: z.string().length(4, { message: 'Код должен быть 4 символа' })
	})
	.refine((data) => data.code.length === 4, {
		message: 'Код должен быть 4 символа',
		path: ['code']
	})

/**
 * Type inference for create user form data.
 */
export type CreateUserFormData = z.infer<typeof createUserSchema>

/**
 * Type inference for edit user form data.
 */
export type EditUserFormData = z.infer<typeof editUserSchema>

/**
 * Type inference for update user me form data.
 */
export type UpdateUserMeFormData = z.infer<typeof updateUserMeSchema>

/**
 * Type inference for email verification request form data.
 */
export type EmailVerificationRequestFormData = z.infer<
	typeof emailVerificationRequestSchema
>

/**
 * Type inference for email verification form data.
 */
export type EmailVerificationFormData = z.infer<typeof emailVerificationSchema>
