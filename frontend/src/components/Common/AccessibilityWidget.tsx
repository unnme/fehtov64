import {
	Contrast,
	Eye,
	Link2,
	Minus,
	MousePointer2,
	Palette,
	Plus,
	RotateCcw,
	Zap
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface AccessibilityState {
	fontSize: number
	highContrast: boolean
	grayscale: boolean
	underlineLinks: boolean
	bigCursor: boolean
	disableAnimations: boolean
}

const DEFAULT_STATE: AccessibilityState = {
	fontSize: 100,
	highContrast: false,
	grayscale: false,
	underlineLinks: false,
	bigCursor: false,
	disableAnimations: false
}

const STORAGE_KEY = 'accessibility-settings'

function loadSettings(): AccessibilityState {
	try {
		const saved = localStorage.getItem(STORAGE_KEY)
		if (saved) {
			return { ...DEFAULT_STATE, ...JSON.parse(saved) }
		}
	} catch {
		// ignore
	}
	return DEFAULT_STATE
}

function saveSettings(state: AccessibilityState) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
	} catch {
		// ignore
	}
}

function applyStyles(state: AccessibilityState) {
	const html = document.documentElement
	const body = document.body

	html.style.fontSize = `${state.fontSize}%`

	body.classList.toggle('a11y-high-contrast', state.highContrast)
	body.classList.toggle('a11y-grayscale', state.grayscale)
	body.classList.toggle('a11y-underline-links', state.underlineLinks)
	body.classList.toggle('a11y-big-cursor', state.bigCursor)
	body.classList.toggle('a11y-no-animations', state.disableAnimations)
}

interface ToggleButtonProps {
	active: boolean
	onClick: () => void
	icon: React.ReactNode
	label: string
}

function ToggleButton({ active, onClick, icon, label }: ToggleButtonProps) {
	return (
		<button
			onClick={onClick}
			className={cn(
				'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors',
				'hover:bg-accent',
				active && 'bg-primary/10 text-primary'
			)}
		>
			{icon}
			<span>{label}</span>
		</button>
	)
}

export function AccessibilityWidget() {
	const [state, setState] = useState<AccessibilityState>(loadSettings)
	const [open, setOpen] = useState(false)

	useEffect(() => {
		applyStyles(state)
		saveSettings(state)
	}, [state])

	useEffect(() => {
		applyStyles(loadSettings())
	}, [])

	const toggle = useCallback((key: keyof Omit<AccessibilityState, 'fontSize'>) => {
		setState(prev => ({ ...prev, [key]: !prev[key] }))
	}, [])

	const increaseFontSize = useCallback(() => {
		setState(prev => ({ ...prev, fontSize: Math.min(prev.fontSize + 10, 150) }))
	}, [])

	const decreaseFontSize = useCallback(() => {
		setState(prev => ({ ...prev, fontSize: Math.max(prev.fontSize - 10, 75) }))
	}, [])

	const handleReset = useCallback(() => {
		setState(DEFAULT_STATE)
	}, [])

	const isModified =
		state.fontSize !== 100 ||
		state.highContrast ||
		state.grayscale ||
		state.underlineLinks ||
		state.bigCursor ||
		state.disableAnimations

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					aria-label="Настройки доступности"
					className={cn(isModified && 'border-primary text-primary')}
				>
					<Eye className="size-5" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-72 p-0">
				<div className="p-3 border-b">
					<div className="flex items-center justify-between">
						<h3 className="font-medium">Доступность</h3>
						{isModified && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleReset}
								className="h-7 px-2 text-xs"
							>
								<RotateCcw className="size-3 mr-1" />
								Сбросить
							</Button>
						)}
					</div>
				</div>

				<div className="p-3 border-b">
					<div className="flex items-center justify-between">
						<span className="text-sm">Размер текста</span>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								className="size-8"
								onClick={decreaseFontSize}
								disabled={state.fontSize <= 75}
							>
								<Minus className="size-4" />
							</Button>
							<span className="text-sm w-12 text-center">{state.fontSize}%</span>
							<Button
								variant="outline"
								size="icon"
								className="size-8"
								onClick={increaseFontSize}
								disabled={state.fontSize >= 150}
							>
								<Plus className="size-4" />
							</Button>
						</div>
					</div>
				</div>

				<div className="p-2 space-y-1">
					<ToggleButton
						active={state.highContrast}
						onClick={() => toggle('highContrast')}
						icon={<Contrast className="size-4" />}
						label="Высокий контраст"
					/>
					<ToggleButton
						active={state.grayscale}
						onClick={() => toggle('grayscale')}
						icon={<Palette className="size-4" />}
						label="Оттенки серого"
					/>
					<ToggleButton
						active={state.underlineLinks}
						onClick={() => toggle('underlineLinks')}
						icon={<Link2 className="size-4" />}
						label="Подчеркнуть ссылки"
					/>
					<ToggleButton
						active={state.bigCursor}
						onClick={() => toggle('bigCursor')}
						icon={<MousePointer2 className="size-4" />}
						label="Большой курсор"
					/>
					<ToggleButton
						active={state.disableAnimations}
						onClick={() => toggle('disableAnimations')}
						icon={<Zap className="size-4" />}
						label="Отключить анимации"
					/>
				</div>
			</PopoverContent>
		</Popover>
	)
}
