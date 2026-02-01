import { z } from 'zod'

import { isValidPersonName, normalizePersonName } from '@/utils/personName'
import { isValidPhone } from '@/utils/phone'
import { emailSchema, optionalStringSchema, uuidSchema } from './common'

/**
 * Person form schemas for creating and editing persons.
 */

/**
 * Base person name schema (last name with hyphen support).
 */
const lastNameSchema = z
	.string()
	.min(1, { message: 'Фамилия обязательна' })
	.refine((value) => isValidPersonName(value, true), {
		message: 'Фамилия: одно слово, без пробелов, допускается одно тире'
	})
	.transform((value) => normalizePersonName(value, true))

/**
 * Base person name schema (first/middle name without hyphen).
 */
const firstNameSchema = z
	.string()
	.min(1, { message: 'Имя обязательно' })
	.refine((value) => isValidPersonName(value, false), {
		message: 'Имя: одно слово, без пробелов'
	})
	.transform((value) => normalizePersonName(value, false))

/**
 * Phone validation schema.
 */
const phoneSchema = z
	.string()
	.min(1, { message: 'Телефон обязателен' })
	.refine(isValidPhone, { message: 'Неверный формат телефона' })

/**
 * Position ID schema.
 */
const positionIdSchema = uuidSchema.min(1, { message: 'Должность обязательна' })

/**
 * Schema for creating a new person.
 */
export const createPersonSchema = z.object({
	last_name: lastNameSchema,
	first_name: firstNameSchema,
	middle_name: firstNameSchema,
	phone: phoneSchema,
	email: emailSchema,
	description: z.string().default("").optional(),
	position_id: positionIdSchema
})

/**
 * Schema for editing an existing person (all fields optional except validation).
 */
export const editPersonSchema = z.object({
	last_name: lastNameSchema.optional(),
	first_name: firstNameSchema.optional(),
	middle_name: firstNameSchema.optional(),
	phone: phoneSchema.optional(),
	email: emailSchema.optional(),
	description: optionalStringSchema.optional(),
	position_id: positionIdSchema.optional()
})

/**
 * Type inference for create person form data.
 */
export type CreatePersonFormData = z.infer<typeof createPersonSchema>

/**
 * Type inference for edit person form data.
 */
export type EditPersonFormData = z.infer<typeof editPersonSchema>
