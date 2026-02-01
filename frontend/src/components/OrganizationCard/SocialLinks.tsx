import { Link2 } from 'lucide-react'
import type React from 'react'
import { Label } from '@/components/ui/label'
import {
	MaxIcon,
	TelegramIcon,
	VkIcon,
	WhatsAppIcon
} from '@/components/OrganizationCard'

interface SocialLink {
	label: string
	url: string
	icon: React.ComponentType<{ className?: string }>
}

interface SocialLinksProps {
	vk_url?: string | null
	telegram_url?: string | null
	whatsapp_url?: string | null
	max_url?: string | null
}

export const SocialLinks = ({
	vk_url,
	telegram_url,
	whatsapp_url,
	max_url
}: SocialLinksProps) => {
	const links: (SocialLink | null)[] = [
		vk_url ? {
			label: 'ВКонтакте',
			url: vk_url,
			icon: VkIcon
		} : null,
		telegram_url ? {
			label: 'Telegram',
			url: telegram_url,
			icon: TelegramIcon
		} : null,
		whatsapp_url ? {
			label: 'WhatsApp',
			url: whatsapp_url,
			icon: WhatsAppIcon
		} : null,
		max_url ? {
			label: 'Max',
			url: max_url,
			icon: MaxIcon
		} : null
	]
	
	const validLinks = links.filter((link): link is SocialLink => link !== null)

	if (validLinks.length === 0) return null

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Link2 className="h-4 w-4 text-muted-foreground" />
				<Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Мы в соцсетях
				</Label>
			</div>
			<div className="flex flex-wrap gap-3">
				{validLinks.map(link => {
					const Icon = link.icon
					return (
						<a
							key={link.label}
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center size-7 rounded-md transition-all hover:scale-110 hover:opacity-80"
							aria-label={link.label}
							title={link.label}
						>
							<Icon className="size-7" />
						</a>
					)
				})}
			</div>
		</div>
	)
}
