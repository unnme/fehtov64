import { useMemo } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import {
	DAYS_OF_WEEK,
	formatWorkHoursPreview,
	getDayLabel,
	type DayOfWeek,
	type WorkHours
} from '@/utils/workHours'

import { TimeRangePicker } from './TimeRangePicker'

interface WorkHoursEditorProps {
	value: WorkHours
	onChange: (value: WorkHours) => void
}

const TIME_RANGE_PATTERN = /^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/

const validateTimeRange = (timeRange: string): boolean => {
	if (!TIME_RANGE_PATTERN.test(timeRange)) {
		return false
	}
	const [start, end] = timeRange.split('-')
	const [startHour, startMin] = start.split(':').map(Number)
	const [endHour, endMin] = end.split(':').map(Number)
	const startTotal = startHour * 60 + startMin
	const endTotal = endHour * 60 + endMin
	return endTotal > startTotal
}

const EMPTY_DAYS: WorkHours['days'] = []

export const WorkHoursEditor = ({ value, onChange }: WorkHoursEditorProps) => {
	const days = value?.days ?? EMPTY_DAYS
	const selectedDays = useMemo(() => new Set(days.map(d => d.day)), [days])

	const handleDayToggle = (day: DayOfWeek, e?: React.MouseEvent) => {
		if (e) {
			e.preventDefault()
			e.stopPropagation()
		}
		const isSelected = selectedDays.has(day)
		if (isSelected) {
			onChange({
				days: days.filter(d => d.day !== day)
			})
		} else {
			onChange({
				days: [...days, { day, timeRange: '09:00-18:00' }]
			})
		}
	}

	const handleTimeChange = (day: DayOfWeek, timeRange: string) => {
		onChange({
			days: days.map(d => d.day === day ? { ...d, timeRange } : d)
		})
	}

	const sortedSelectedDays = useMemo(() => {
		const order: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
		return days
			.filter(d => selectedDays.has(d.day))
			.sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day))
	}, [days, selectedDays])

	return (
		<div className="space-y-4 sm:space-y-6">
			<div>
				<Label className="text-sm sm:text-base font-medium mb-2 sm:mb-3 block">Выберите рабочие дни</Label>
				<div className="flex flex-wrap gap-2 sm:gap-2.5">
					{DAYS_OF_WEEK.map(({ value: dayValue }) => {
						const isSelected = selectedDays.has(dayValue)
						
						return (
							<div
								key={dayValue}
								className={cn(
									"flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-md border transition-colors",
									isSelected
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50 hover:bg-accent/50"
								)}
							>
								<Checkbox
									checked={isSelected}
									onCheckedChange={() => handleDayToggle(dayValue)}
									className="shrink-0"
								/>
								<Label 
									className="text-xs sm:text-sm font-medium cursor-pointer"
									onClick={(e) => handleDayToggle(dayValue, e)}
								>
									{getDayLabel(dayValue, true)}
								</Label>
							</div>
						)
					})}
				</div>
			</div>

			{sortedSelectedDays.length > 0 && (
				<>
					<div className="space-y-2 sm:space-y-3">
						<Label className="text-sm sm:text-base font-medium block">Укажите время работы</Label>
						<div className="space-y-2 sm:space-y-3">
							{sortedSelectedDays.map((dayData) => {
								const isValid = validateTimeRange(dayData.timeRange)
								return (
									<div key={dayData.day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
										<Label className="w-full sm:w-36 text-xs sm:text-sm font-medium shrink-0">
											{getDayLabel(dayData.day, false)}
										</Label>
										<div className="flex-1 w-full sm:w-auto">
											<TimeRangePicker
												value={dayData.timeRange}
												onChange={(timeRange) => {
													handleTimeChange(dayData.day, timeRange)
												}}
											/>
											{!isValid && (
												<p className="text-xs text-destructive mt-1.5">
													Время окончания должно быть больше времени начала
												</p>
											)}
										</div>
									</div>
								)
							})}
						</div>
					</div>
					<div className="pt-3 sm:pt-4 border-t">
						<Label className="text-sm sm:text-base font-medium block mb-2 sm:mb-3">Предпросмотр</Label>
						<div className="bg-muted/50 rounded-md p-3 sm:p-4">
							<div className="text-xs sm:text-sm text-foreground">
								{formatWorkHoursPreview(value) || 'Выберите дни и укажите время'}
							</div>
						</div>
					</div>
				</>
			)}

			{selectedDays.size === 0 && (
				<div className="text-center py-6 sm:py-8 border border-dashed rounded-lg">
					<p className="text-xs sm:text-sm text-muted-foreground">
						Выберите хотя бы один рабочий день, чтобы указать время работы
					</p>
				</div>
			)}
		</div>
	)
}
