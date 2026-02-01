import { z } from 'zod'

import { uuidSchema } from './common'

/**
 * News form schemas for creating and editing news.
 */

/**
 * Title schema.
 */
const titleSchema = z
	.string()
	.min(1, { message: 'Название обязательно' })
	.max(255, { message: 'Максимум 255 символов' })
	.transform((value) => value.trim())

/**
 * Content schema.
 */
const contentSchema = z
	.string()
	.min(1, { message: 'Текст обязателен' })
	.transform((value) => value.trim())

/**
 * Schema for creating a new news item.
 */
export const createNewsSchema = z.object({
	title: titleSchema,
	content: contentSchema,
	is_published: z.boolean()
})

/**
 * Schema for editing an existing news item (includes optional owner_id).
 */
export const editNewsSchema = z.object({
	title: titleSchema.optional(),
	content: contentSchema.optional(),
	is_published: z.boolean().optional(),
	owner_id: uuidSchema.optional()
})

/**
 * Type inference for create news form data.
 */
export type CreateNewsFormData = z.infer<typeof createNewsSchema>

/**
 * Type inference for edit news form data.
 */
export type EditNewsFormData = z.infer<typeof editNewsSchema>
