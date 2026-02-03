import { Input } from '@/components/ui/input'
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState
} from 'react'

interface PhoneNumberInputProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
	autoFocus?: boolean
}

export const PhoneNumberInput = forwardRef<
	HTMLInputElement,
	PhoneNumberInputProps
>(({ value, onChange, placeholder, className, autoFocus }, ref) => {
	const inputRef = useRef<HTMLInputElement>(null)

	const getDigits = (val: string) => {
		const digits = val.replace(/\D/g, '')
		// Strip leading 7 or 8 (Russian country code)
		if (digits.startsWith('7')) return digits.slice(1)
		if (digits.startsWith('8')) return digits.slice(1)
		return digits
	}

	const formatPhoneValue = (digs: string) => {
		const limited = digs.slice(0, 10)

		if (!limited || limited.length === 0) return ''

		const part1 = limited.slice(0, 3)
		const part2 = limited.slice(3, 6)
		const part3 = limited.slice(6, 8)
		const part4 = limited.slice(8, 10)

		if (limited.length < 3) return `+7 ${part1}`
		if (limited.length === 3) return `+7 ${part1}-`
		if (limited.length <= 6) return `+7 ${part1}-${part2}`
		if (limited.length <= 8) return `+7 ${part1}-${part2}-${part3}`
		return `+7 ${part1}-${part2}-${part3}-${part4}`
	}

	const initialDigits = getDigits(value)
	const [digits, setDigits] = useState(initialDigits)

	useEffect(() => {
		const newDigits = getDigits(value)
		setDigits(newDigits)
	}, [value])

	useEffect(() => {
		if (autoFocus && inputRef.current) {
			const timer = setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.focus()
					if (digits.length > 0) {
						const formattedValue = formatPhoneValue(digits)
						const cursorPos = formattedValue.length
						inputRef.current.setSelectionRange(cursorPos, cursorPos)
					}
				}
			}, 100)
			return () => clearTimeout(timer)
		}
	}, [autoFocus, digits])

	useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

	const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
		e.preventDefault()
		const input = e.currentTarget
		const inputValue = input.value
		const newDigits = getDigits(inputValue)
		const limited = newDigits.slice(0, 10)
		setDigits(limited)
		const newValue = formatPhoneValue(limited)
		onChange(newValue)

		setTimeout(() => {
			if (inputRef.current) {
				const cursorPos = newValue.length
				inputRef.current.setSelectionRange(cursorPos, cursorPos)
			}
		}, 0)
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' || e.key === 'Delete') {
			if (digits.length > 0) {
				const newDigits = digits.slice(0, -1)
				setDigits(newDigits)
				const newValue = formatPhoneValue(newDigits)
				onChange(newValue)

				setTimeout(() => {
					if (inputRef.current) {
						const cursorPos = newValue.length
						inputRef.current.setSelectionRange(cursorPos, cursorPos)
					}
				}, 0)
			}
			e.preventDefault()
		} else if (/\d/.test(e.key)) {
			if (digits.length < 10) {
				const newDigits = (digits + e.key).slice(0, 10)
				setDigits(newDigits)
				const newValue = formatPhoneValue(newDigits)
				onChange(newValue)

				setTimeout(() => {
					if (inputRef.current) {
						const cursorPos = newValue.length
						inputRef.current.setSelectionRange(cursorPos, cursorPos)
					}
				}, 0)
			}
			e.preventDefault()
		} else if (
			!['ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Enter'].includes(
				e.key
			)
		) {
			e.preventDefault()
		}
	}

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault()
		const pasted = e.clipboardData.getData('text')
		const pastedDigits = getDigits(pasted)
		const limited = pastedDigits.slice(0, 10)
		setDigits(limited)
		const newValue = formatPhoneValue(limited)
		onChange(newValue)

		setTimeout(() => {
			if (inputRef.current) {
				const cursorPos = newValue.length
				inputRef.current.setSelectionRange(cursorPos, cursorPos)
			}
		}, 0)
	}

	const formattedValue = formatPhoneValue(digits)

	return (
		<Input
			ref={inputRef}
			type="text"
			value={formattedValue}
			onInput={handleInput}
			onKeyDown={handleKeyDown}
			onPaste={handlePaste}
			placeholder={placeholder || '+7 ___-___-__-__'}
			className={className}
			tabIndex={0}
		/>
	)
})

PhoneNumberInput.displayName = 'PhoneNumberInput'
