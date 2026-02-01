import { z } from 'zod'

import { isValidPositionName, normalizePositionName } from '@/utils/positionName'

/**
 * Position form schemas for creating and editing positions.
 */

/**
 * Position name schema with validation and normalization.
 */
const positionNameSchema = z
	.string()
	.min(1, { message: 'Название обязательно' })
	.refine(isValidPositionName, {
		message: 'Допускаются только буквы и пробелы, без тире'
	})
	.transform(normalizePositionName)

/**
 * Schema for creating a new position.
 */
export const createPositionSchema = z.object({
	name: positionNameSchema
})

/**
 * Schema for editing an existing position.
 */
export const editPositionSchema = z.object({
	name: positionNameSchema
})

/**
 * Type inference for create position form data.
 */
export type CreatePositionFormData = z.infer<typeof createPositionSchema>

/**
 * Type inference for edit position form data.
 */
export type EditPositionFormData = z.infer<typeof editPositionSchema>
