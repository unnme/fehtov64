import { z } from 'zod'

const normalizeString = (value: string) => value.trim()

const optionalLinkSchema = z
	.string()
	.transform(value => {
		const trimmed = value.trim()
		return trimmed ? trimmed : undefined
	})
	.optional()

const digitsOnlySchema = (length: number, fieldName: string) =>
	z
		.string()
		.optional()
		.transform(value => value?.trim() || '')
		.refine(
			value => !value || /^\d+$/.test(value),
			{ message: `${fieldName} должен содержать только цифры` }
		)
		.refine(
			value => !value || value.length === length,
			{ message: `${fieldName} должен содержать ${length} цифр` }
		)

const digitsOnlyMaxSchema = (maxLength: number, fieldName: string) =>
	z
		.string()
		.optional()
		.transform(value => value?.trim() || '')
		.refine(
			value => !value || /^\d+$/.test(value),
			{ message: `${fieldName} должен содержать только цифры` }
		)
		.refine(
			value => !value || value.length <= maxLength,
			{ message: `${fieldName} должен содержать не более ${maxLength} цифр` }
		)

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
	name: z
		.string()
		.min(1, { message: 'Укажите название организации' })
		.transform(normalizeString),
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
			(value) => !value || z.email().safeParse(value).success,
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
	director_hours: workHoursSchema
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
	longitude: z.number().optional(),
	// Requisites
	legal_address: z.string().optional().transform(value => value?.trim() || ''),
	legal_latitude: z.number().optional(),
	legal_longitude: z.number().optional(),
	inn: digitsOnlySchema(10, 'ИНН'),
	kpp: digitsOnlySchema(9, 'КПП'),
	okpo: digitsOnlySchema(8, 'ОКПО'),
	ogrn: digitsOnlySchema(13, 'ОГРН'),
	okfs: digitsOnlySchema(2, 'ОКФС'),
	okogu: digitsOnlySchema(7, 'ОКОГУ'),
	okopf: digitsOnlySchema(5, 'ОКОПФ'),
	oktmo: digitsOnlyMaxSchema(11, 'ОКТМО'),
	okato: digitsOnlySchema(11, 'ОКАТО'),
	// Bank details
	bank_recipient: z.string().optional().transform(value => value?.trim() || ''),
	bank_account: digitsOnlySchema(20, 'Расчётный счёт'),
	bank_bik: digitsOnlySchema(9, 'БИК')
})

export type OrganizationCardFormData = z.infer<typeof organizationCardSchema>

export const organizationCardSubmitSchema = organizationCardSchema.extend({
	work_hours: z.string().default(''),
	director_hours: z.string().default('')
})

export type OrganizationCardSubmitData = z.infer<typeof organizationCardSubmitSchema>
