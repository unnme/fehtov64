import { Trash2 } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { Control, FieldArrayWithId, UseFieldArrayRemove } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
	FormControl,
	FormField,
	FormItem,
	FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { formatPhone } from '@/utils/phone'
import type { OrganizationCardFormData } from '@/schemas/organizationCard'

interface PhoneInputFieldProps {
	control: Control<OrganizationCardFormData>
	index: number
	field: FieldArrayWithId<OrganizationCardFormData, 'phones', 'id'>
	remove: UseFieldArrayRemove
}

export const PhoneInputField = ({
	control,
	index,
	remove
}: PhoneInputFieldProps) => {
	return (
		<div className="space-y-1">
			<div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
				<FormField
					control={control}
					name={`phones.${index}.value`}
					render={({ field }) => {
						const inputRef = useRef<HTMLInputElement>(null)
						const measureRef = useRef<HTMLSpanElement>(null)
						const [placeholderLeft, setPlaceholderLeft] = useState(12)
						
						const currentValue = field.value || '+7'
						const fullPlaceholder = '+7 (999) 123-45-67'
						const isIncomplete = currentValue === '+7' || currentValue.length < 18
						
						useEffect(() => {
							if (measureRef.current && inputRef.current && currentValue !== '+7') {
								const inputStyle = window.getComputedStyle(inputRef.current)
								measureRef.current.style.font = inputStyle.font
								measureRef.current.style.fontSize = inputStyle.fontSize
								measureRef.current.style.fontWeight = inputStyle.fontWeight
								measureRef.current.style.letterSpacing = inputStyle.letterSpacing
								measureRef.current.textContent = currentValue
								const width = measureRef.current.offsetWidth
								setPlaceholderLeft(12 + width)
							} else {
								setPlaceholderLeft(12)
							}
						}, [currentValue])
						
						return (
							<FormItem
								className="w-fit m-0"
								style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
							>
								<FormControl>
									<div className="relative" style={{ width: '160px' }}>
										<Input
											ref={inputRef}
											value={currentValue}
											onChange={(e) => {
												const input = e.target.value
												if (input.length < 2 || !input.startsWith('+7')) {
													field.onChange('+7')
													return
												}
												const formatted = formatPhone(input)
												field.onChange(formatted)
											}}
											onKeyDown={(e) => {
												if (e.key.length === 1 && !/[0-9+\-() ]/.test(e.key)) {
													e.preventDefault()
												}
												if (e.key === 'Backspace' && field.value === '+7') {
													e.preventDefault()
												}
											}}
											maxLength={18}
											inputMode="tel"
											className="h-9"
											style={{ width: '160px' }}
										/>
										<span
											ref={measureRef}
											className="absolute invisible whitespace-pre"
											style={{ top: '-9999px', left: '-9999px' }}
										/>
										{isIncomplete && (
											<div
												className="absolute top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-sm select-none"
												style={{ 
													left: `${placeholderLeft}px`,
													color: 'hsl(var(--muted-foreground))',
													opacity: 0.5
												}}
											>
												{currentValue === '+7' 
													? fullPlaceholder
													: fullPlaceholder.slice(currentValue.length)
												}
											</div>
										)}
									</div>
								</FormControl>
								<FormMessage className="!mt-0.5 !text-xs" />
							</FormItem>
						)
					}}
				/>
				<FormField
					control={control}
					name={`phones.${index}.description`}
					render={({ field }) => (
						<FormItem
							className="w-fit m-0"
							style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
						>
							<FormControl>
														<Input
															placeholder="Должность"
															{...field}
															value={field.value || ''}
															className="h-9"
															style={{ width: '200px' }}
														/>
							</FormControl>
							<FormMessage className="!mt-0.5 !text-xs" />
						</FormItem>
					)}
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={() => remove(index)}
					aria-label="Удалить телефон"
					className="shrink-0 h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
					style={{ alignSelf: 'center', marginTop: 0 }}
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
		</div>
	)
}
