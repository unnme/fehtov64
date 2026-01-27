import { useMemo } from 'react'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'

interface TimeRangePickerProps {
	value: string // Format: "09:00-18:00"
	onChange: (value: string) => void
	disabled?: boolean
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

export const TimeRangePicker = ({ value, onChange, disabled }: TimeRangePickerProps) => {
	const [startTime, endTime] = useMemo(() => {
		if (!value || !value.includes('-')) {
			return ['09:00', '18:00']
		}
		const parts = value.split('-')
		return [parts[0]?.trim() || '09:00', parts[1]?.trim() || '18:00']
	}, [value])

	const [startHour, startMinute] = startTime.split(':')
	const [endHour, endMinute] = endTime.split(':')

	const handleStartTimeChange = (hour: string, minute: string) => {
		const newStartTime = `${hour}:${minute}`
		const [startH, startM] = [Number(hour), Number(minute)]
		const [endH, endM] = endTime.split(':').map(Number)
		const startTotal = startH * 60 + startM
		const endTotal = endH * 60 + endM
		
		if (startTotal >= endTotal) {
			const newEndH = (endH + 1) % 24
			const newEndTime = `${newEndH.toString().padStart(2, '0')}:${minute}`
			onChange(`${newStartTime}-${newEndTime}`)
		} else {
			onChange(`${newStartTime}-${endTime}`)
		}
	}

	const handleEndTimeChange = (hour: string, minute: string) => {
		const newEndTime = `${hour}:${minute}`
		const [startH, startM] = startTime.split(':').map(Number)
		const [endH, endM] = [Number(hour), Number(minute)]
		const startTotal = startH * 60 + startM
		const endTotal = endH * 60 + endM
		
		if (endTotal <= startTotal) {
			const newEndH = (endH + 1) % 24
			const newEndTime = `${newEndH.toString().padStart(2, '0')}:${minute}`
			onChange(`${startTime}-${newEndTime}`)
		} else {
			onChange(`${startTime}-${newEndTime}`)
		}
	}

	return (
		<div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
			<div className="flex items-center gap-0.5 sm:gap-1">
				<Select
					value={startHour}
					onValueChange={(hour) => handleStartTimeChange(hour, startMinute)}
					disabled={disabled}
				>
					<SelectTrigger className="w-[60px]! sm:w-[70px]! h-8 sm:h-9 [&_*[data-slot=select-value]]:line-clamp-none! [&_*[data-slot=select-value]]:whitespace-nowrap text-xs sm:text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{HOURS.map((hour) => (
							<SelectItem key={hour} value={hour}>
								{hour}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<span className="text-muted-foreground text-xs sm:text-sm">:</span>
				<Select
					value={startMinute}
					onValueChange={(minute) => handleStartTimeChange(startHour, minute)}
					disabled={disabled}
				>
					<SelectTrigger className="w-[60px]! sm:w-[70px]! h-8 sm:h-9 [&_*[data-slot=select-value]]:line-clamp-none! [&_*[data-slot=select-value]]:whitespace-nowrap text-xs sm:text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{MINUTES.map((minute) => (
							<SelectItem key={minute} value={minute}>
								{minute}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<span className="text-muted-foreground mx-0.5 sm:mx-1 text-xs sm:text-sm">—</span>
			<div className="flex items-center gap-0.5 sm:gap-1">
				<Select
					value={endHour}
					onValueChange={(hour) => handleEndTimeChange(hour, endMinute)}
					disabled={disabled}
				>
					<SelectTrigger className="w-[60px]! sm:w-[70px]! h-8 sm:h-9 [&_*[data-slot=select-value]]:line-clamp-none! [&_*[data-slot=select-value]]:whitespace-nowrap text-xs sm:text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{HOURS.map((hour) => (
							<SelectItem key={hour} value={hour}>
								{hour}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<span className="text-muted-foreground text-xs sm:text-sm">:</span>
				<Select
					value={endMinute}
					onValueChange={(minute) => handleEndTimeChange(endHour, minute)}
					disabled={disabled}
				>
					<SelectTrigger className="w-[60px]! sm:w-[70px]! h-8 sm:h-9 [&_*[data-slot=select-value]]:line-clamp-none! [&_*[data-slot=select-value]]:whitespace-nowrap text-xs sm:text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{MINUTES.map((minute) => (
							<SelectItem key={minute} value={minute}>
								{minute}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}
