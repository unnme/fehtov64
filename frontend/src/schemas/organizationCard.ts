import { z } from 'zod'

const normalizeString = (value: string) => value.trim()

const optionalLinkSchema = z
	.string()
	.transform(value => {
		const trimmed = value.trim()
		return trimmed ? trimmed : undefined
	})
	.optional()

const workHoursDaySchema = z.object({
	day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
	timeRange: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
		message: 'Неверный формат времени. Используйте формат ЧЧ:ММ-ЧЧ:ММ (например, 09:00-18:00)'
	})
})

const workHoursSchema = z.object({
	days: z.array(workHoursDaySchema).optional().default([])
})

export const organizationCardSchema = z.object({
	name: z.string().transform(normalizeString).default(''),
	phones: z
		.array(
			z.object({
				value: z.string().transform(normalizeString).default(''),
				description: z
					.string()
					.optional()
					.transform((value) => {
						if (!value) return undefined
						const trimmed = String(value).trim()
						return trimmed || undefined
					})
			})
		)
		.default([]),
	email: z
		.string()
		.default('')
		.refine(
			(value) => !value || z.string().email().safeParse(value).success,
			{ message: 'Неверный формат email' }
		)
		.transform((value) => value ? normalizeString(value) : ''),
	address: z.string().transform(normalizeString).default(''),
	work_hours: workHoursSchema
		.optional()
		.refine(
			(workHours) => {
				if (!workHours || !workHours.days) return true
				return workHours.days.every(day => {
					const [start, end] = day.timeRange.split('-')
					const [startHour, startMin] = start.split(':').map(Number)
					const [endHour, endMin] = end.split(':').map(Number)
					const startTotal = startHour * 60 + startMin
					const endTotal = endHour * 60 + endMin
					return endTotal > startTotal
				})
			},
			{ message: 'Время окончания должно быть больше времени начала' }
		),
	vk_url: optionalLinkSchema,
	telegram_url: optionalLinkSchema,
	whatsapp_url: optionalLinkSchema,
	max_url: optionalLinkSchema,
	latitude: z.number().optional(),
	longitude: z.number().optional()
})

export type OrganizationCardFormData = z.infer<typeof organizationCardSchema>

export const organizationCardSubmitSchema = organizationCardSchema.extend({
	work_hours: z.string().default('')
})

export type OrganizationCardSubmitData = z.infer<typeof organizationCardSubmitSchema>
