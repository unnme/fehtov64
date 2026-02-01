import { z } from 'zod'

import { uuidSchema } from './common'

/**
 * Document form schemas for creating and editing documents.
 */

/**
 * Document name schema.
 */
const documentNameSchema = z
	.string()
	.max(255, { message: 'Максимум 255 символов' })
	.transform((value) => value.trim() || undefined)
	.optional()

/**
 * Schema for creating a new document.
 */
export const createDocumentSchema = z.object({
	name: documentNameSchema,
	category_id: uuidSchema.optional(),
	category_name: z
		.string()
		.max(100, { message: 'Максимум 100 символов' })
		.transform((value) => value.trim() || undefined)
		.optional()
})

/**
 * Schema for editing an existing document.
 */
export const editDocumentSchema = z.object({
	name: z
		.string()
		.min(1, { message: 'Название обязательно' })
		.max(255, { message: 'Максимум 255 символов' })
		.transform((value) => value.trim()),
	category_id: uuidSchema.optional()
})

/**
 * Schema for creating a document category.
 */
export const createDocumentCategorySchema = z.object({
	name: z
		.string()
		.min(1, { message: 'Название обязательно' })
		.max(100, { message: 'Максимум 100 символов' })
		.transform((value) => value.trim())
})

/**
 * Schema for editing a document category.
 */
export const editDocumentCategorySchema = z.object({
	name: z
		.string()
		.min(1, { message: 'Название обязательно' })
		.max(100, { message: 'Максимум 100 символов' })
		.transform((value) => value.trim())
})

/**
 * Type inference for create document form data.
 */
export type CreateDocumentFormData = z.infer<typeof createDocumentSchema>

/**
 * Type inference for edit document form data.
 */
export type EditDocumentFormData = z.infer<typeof editDocumentSchema>

/**
 * Type inference for create document category form data.
 */
export type CreateDocumentCategoryFormData = z.infer<
	typeof createDocumentCategorySchema
>

/**
 * Type inference for edit document category form data.
 */
export type EditDocumentCategoryFormData = z.infer<
	typeof editDocumentCategorySchema
>
