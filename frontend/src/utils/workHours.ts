export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
	{ value: 'monday', label: 'Понедельник' },
	{ value: 'tuesday', label: 'Вторник' },
	{ value: 'wednesday', label: 'Среда' },
	{ value: 'thursday', label: 'Четверг' },
	{ value: 'friday', label: 'Пятница' },
	{ value: 'saturday', label: 'Суббота' },
	{ value: 'sunday', label: 'Воскресенье' }
]

export interface WorkHoursDay {
	day: DayOfWeek
	timeRange: string // Format: "09:00-18:00"
}

export interface WorkHours {
	days: WorkHoursDay[]
}

const DAY_NAMES_SHORT: Record<DayOfWeek, string> = {
	monday: 'Пн',
	tuesday: 'Вт',
	wednesday: 'Ср',
	thursday: 'Чт',
	friday: 'Пт',
	saturday: 'Сб',
	sunday: 'Вс'
}

const DAY_NAMES_FULL: Record<DayOfWeek, string> = {
	monday: 'Понедельник',
	tuesday: 'Вторник',
	wednesday: 'Среда',
	thursday: 'Четверг',
	friday: 'Пятница',
	saturday: 'Суббота',
	sunday: 'Воскресенье'
}

export const getDayLabel = (day: DayOfWeek, short = false): string => {
	return short ? DAY_NAMES_SHORT[day] : DAY_NAMES_FULL[day]
}

/**
 * Converts WorkHours object to string for server submission.
 * Format: "Пн-Пт: 09:00-18:00; Сб: 10:00-16:00; Вс: выходной"
 */
export const workHoursToString = (workHours: WorkHours): string => {
	if (!workHours.days || workHours.days.length === 0) {
		return ''
	}

	const sortedDays = [...workHours.days].sort((a, b) => {
		const order: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
		return order.indexOf(a.day) - order.indexOf(b.day)
	})

	const parts: string[] = []
	let currentRange: string | null = null
	let rangeStart: DayOfWeek | null = null
	let rangeEnd: DayOfWeek | null = null

	for (const dayData of sortedDays) {
		if (dayData.timeRange === currentRange) {
			rangeEnd = dayData.day
		} else {
			if (currentRange !== null && rangeStart !== null) {
				if (rangeEnd && rangeEnd !== rangeStart) {
					parts.push(`${getDayLabel(rangeStart, true)}-${getDayLabel(rangeEnd, true)}: ${currentRange}`)
				} else {
					parts.push(`${getDayLabel(rangeStart, true)}: ${currentRange}`)
				}
			}
			currentRange = dayData.timeRange
			rangeStart = dayData.day
			rangeEnd = dayData.day
		}
	}

	if (currentRange !== null && rangeStart !== null) {
		if (rangeEnd && rangeEnd !== rangeStart) {
			parts.push(`${getDayLabel(rangeStart, true)}-${getDayLabel(rangeEnd, true)}: ${currentRange}`)
		} else {
			parts.push(`${getDayLabel(rangeStart, true)}: ${currentRange}`)
		}
	}

	const workingDays = new Set(sortedDays.map(d => d.day))
	const allDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
	const weekends = allDays.filter(day => !workingDays.has(day))
	
	if (weekends.length > 0) {
		if (weekends.length === 1) {
			parts.push(`${getDayLabel(weekends[0], true)}: выходной`)
		} else if (weekends.length === 2 && weekends[0] === 'saturday' && weekends[1] === 'sunday') {
			parts.push('Сб-Вс: выходной')
		} else {
			parts.push(`${getDayLabel(weekends[0], true)}-${getDayLabel(weekends[weekends.length - 1], true)}: выходной`)
		}
	}

	return parts.join('; ')
}

/**
 * Parses work hours string into WorkHours object.
 * Format: "Пн-Пт: 09:00-18:00; Сб: 10:00-16:00; Вс: выходной"
 */
export const stringToWorkHours = (str: string): WorkHours => {
	if (!str || !str.trim()) {
		return { days: [] }
	}

	const trimmed = str.trim()
	
	if (trimmed.match(/^\d{2}:\d{2}-\d{2}:\d{2}$/) || trimmed.length < 10) {
		return { days: [] }
	}

	const parts = trimmed.split(';').map(p => p.trim())
	const days: WorkHoursDay[] = []
	const order: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
	
	for (const part of parts) {
		if (part.toLowerCase().includes('выходной')) {
			continue
		}
		
		const match = part.match(/^([А-Яа-я]+(?:-[А-Яа-я]+)?):\s*(\d{2}:\d{2}-\d{2}:\d{2})$/)
		if (match) {
			const dayPart = match[1]
			const timeRange = match[2]
			
			const dayLabels = dayPart.split('-')
			const startDayLabel = dayLabels[0].trim()
			const endDayLabel = dayLabels.length > 1 ? dayLabels[1].trim() : startDayLabel
			
			const startDay = DAYS_OF_WEEK.find(d => {
				const shortName = getDayLabel(d.value, true)
				const fullName = getDayLabel(d.value, false)
				return shortName === startDayLabel || fullName.startsWith(startDayLabel) || startDayLabel.startsWith(shortName)
			})?.value
			
			const endDay = dayLabels.length > 1 
				? DAYS_OF_WEEK.find(d => {
					const shortName = getDayLabel(d.value, true)
					const fullName = getDayLabel(d.value, false)
					return shortName === endDayLabel || fullName.startsWith(endDayLabel) || endDayLabel.startsWith(shortName)
				})?.value
				: startDay
			
			if (startDay) {
				const startIdx = order.indexOf(startDay)
				const endIdx = endDay ? order.indexOf(endDay) : startIdx
				
				for (let i = startIdx; i <= endIdx; i++) {
					days.push({ day: order[i], timeRange })
				}
			}
		}
	}

	return { days }
}

/**
 * Formats work hours for preview in a single line.
 * Format: "Пн-Пт 19:20-20:00, Сб-Вс Выходной" or "Пн-Пт 19:20-20:00, Сб 10:10-20:20, Вс Выходной"
 */
export const formatWorkHoursPreview = (workHours: WorkHours): string => {
	if (!workHours.days || workHours.days.length === 0) {
		return ''
	}

	const order: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
	const sortedDays = [...workHours.days].sort((a, b) => {
		return order.indexOf(a.day) - order.indexOf(b.day)
	})

	const workingDays = new Set(sortedDays.map(d => d.day))
	const allDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
	const weekends = allDays.filter(day => !workingDays.has(day))

	const parts: string[] = []
	
	const groups: Array<{ days: DayOfWeek[], timeRange: string }> = []
	
	for (const dayData of sortedDays) {
		let foundGroup = false
		for (const group of groups) {
			if (group.timeRange === dayData.timeRange) {
				const lastDayIndex = order.indexOf(group.days[group.days.length - 1])
				const currentDayIndex = order.indexOf(dayData.day)
				if (currentDayIndex === lastDayIndex + 1) {
					group.days.push(dayData.day)
					foundGroup = true
					break
				}
			}
		}
		if (!foundGroup) {
			groups.push({ days: [dayData.day], timeRange: dayData.timeRange })
		}
	}

	for (const group of groups) {
		if (group.days.length === 1) {
			parts.push(`${getDayLabel(group.days[0], true)} ${group.timeRange}`)
		} else {
			const startLabel = getDayLabel(group.days[0], true)
			const endLabel = getDayLabel(group.days[group.days.length - 1], true)
			parts.push(`${startLabel}-${endLabel} ${group.timeRange}`)
		}
	}

	if (weekends.length > 0) {
		const weekendGroups: DayOfWeek[][] = []
		let currentGroup: DayOfWeek[] = [weekends[0]]
		
		for (let i = 1; i < weekends.length; i++) {
			const prevIndex = order.indexOf(weekends[i - 1])
			const currentIndex = order.indexOf(weekends[i])
			if (currentIndex === prevIndex + 1) {
				currentGroup.push(weekends[i])
			} else {
				weekendGroups.push(currentGroup)
				currentGroup = [weekends[i]]
			}
		}
		weekendGroups.push(currentGroup)

		for (const group of weekendGroups) {
			if (group.length === 1) {
				parts.push(`${getDayLabel(group[0], true)} Выходной`)
			} else {
				const startLabel = getDayLabel(group[0], true)
				const endLabel = getDayLabel(group[group.length - 1], true)
				parts.push(`${startLabel}-${endLabel} Выходной`)
			}
		}
	}

	return parts.join(', ')
}
