import { Link2 } from 'lucide-react'
import { useState } from 'react'
import { Control, useWatch } from 'react-hook-form'

import {
	MaxIcon,
	TelegramIcon,
	VkIcon,
	WhatsAppIcon
} from '@/components/OrganizationCard'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type OrganizationCardFormData } from '@/schemas/organizationCard'

interface MessengersSectionProps {
	control: Control<OrganizationCardFormData>
	setValue: (
		name: keyof OrganizationCardFormData,
		value: string
	) => void
}

export const MessengersSection = ({
	control,
	setValue
}: MessengersSectionProps) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const vkUrl = useWatch({ control, name: 'vk_url' })
	const telegramUrl = useWatch({ control, name: 'telegram_url' })
	const whatsappUrl = useWatch({ control, name: 'whatsapp_url' })
	const maxUrl = useWatch({ control, name: 'max_url' })

	const [localVkUrl, setLocalVkUrl] = useState('')
	const [localTelegramUrl, setLocalTelegramUrl] = useState('')
	const [localWhatsappUrl, setLocalWhatsappUrl] = useState('')
	const [localMaxUrl, setLocalMaxUrl] = useState('')

	const handleOpen = () => {
		setLocalVkUrl(vkUrl || '')
		setLocalTelegramUrl(telegramUrl || '')
		setLocalWhatsappUrl(whatsappUrl || '')
		setLocalMaxUrl(maxUrl || '')
		setIsDialogOpen(true)
	}

	const handleClose = () => {
		setIsDialogOpen(false)
	}

	const handleSave = () => {
		setValue('vk_url', localVkUrl)
		setValue('telegram_url', localTelegramUrl)
		setValue('whatsapp_url', localWhatsappUrl)
		setValue('max_url', localMaxUrl)
		handleClose()
	}

	const hasAnyMessenger = vkUrl || telegramUrl || whatsappUrl || maxUrl
	const messengerCount = [vkUrl, telegramUrl, whatsappUrl, maxUrl].filter(Boolean).length

	const getPreviewText = () => {
		if (!hasAnyMessenger) return 'Не добавлены'
		const names: string[] = []
		if (vkUrl) names.push('ВК')
		if (telegramUrl) names.push('Telegram')
		if (whatsappUrl) names.push('WhatsApp')
		if (maxUrl) names.push('Max')
		return names.join(', ')
	}

	return (
		<div className="space-y-3">
			<FormLabel className="flex items-center gap-2">
				<Link2 className="h-4 w-4" />
				Мессенджеры и соц. сети
			</FormLabel>

			<Button
				type="button"
				variant="outline"
				className="w-full justify-start text-left h-auto py-3"
				onClick={handleOpen}
			>
				<div className="flex flex-col items-start gap-1 w-full">
					<div className="flex items-center gap-2">
						{hasAnyMessenger ? (
							<>
								<div className="flex items-center gap-1.5">
									{vkUrl && <VkIcon className="h-4 w-4" />}
									{telegramUrl && <TelegramIcon className="h-4 w-4" />}
									{whatsappUrl && <WhatsAppIcon className="h-4 w-4" />}
									{maxUrl && <MaxIcon className="h-4 w-4" />}
								</div>
								<span className="text-sm font-medium">
									{messengerCount} {messengerCount === 1 ? 'ссылка' : messengerCount < 5 ? 'ссылки' : 'ссылок'}
								</span>
							</>
						) : (
							<span className="text-sm font-medium">
								Добавить мессенджеры и соц. сети
							</span>
						)}
					</div>
					<span className="text-xs text-muted-foreground">
						{getPreviewText()}
					</span>
				</div>
			</Button>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Мессенджеры и соц. сети</DialogTitle>
						<DialogDescription>
							Укажите ссылки на мессенджеры и социальные сети организации.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								ВКонтакте
							</span>
							<div className="flex items-center gap-3">
								<VkIcon className="h-5 w-5 shrink-0" />
								<Input
									value={localVkUrl}
									onChange={(event) => setLocalVkUrl(event.target.value)}
									placeholder="https://vk.com/group_name"
									className="h-10"
								/>
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								Telegram
							</span>
							<div className="flex items-center gap-3">
								<TelegramIcon className="h-5 w-5 shrink-0" />
								<Input
									value={localTelegramUrl}
									onChange={(event) => setLocalTelegramUrl(event.target.value)}
									placeholder="https://t.me/username"
									className="h-10"
								/>
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								WhatsApp
							</span>
							<div className="flex items-center gap-3">
								<WhatsAppIcon className="h-5 w-5 shrink-0" />
								<Input
									value={localWhatsappUrl}
									onChange={(event) => setLocalWhatsappUrl(event.target.value)}
									placeholder="https://wa.me/79001234567"
									className="h-10"
								/>
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								Мессенджер Max
							</span>
							<div className="flex items-center gap-3">
								<MaxIcon className="h-5 w-5 shrink-0" />
								<Input
									value={localMaxUrl}
									onChange={(event) => setLocalMaxUrl(event.target.value)}
									placeholder="https://max.ru/username"
									className="h-10"
								/>
							</div>
						</div>
					</div>
					<DialogFooter className="mt-4">
						<Button variant="ghost" onClick={handleClose}>
							Отменить
						</Button>
						<Button onClick={handleSave}>Сохранить</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
