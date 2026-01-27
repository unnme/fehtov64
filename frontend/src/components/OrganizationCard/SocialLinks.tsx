import { Link2, MessageCircle, Send } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface SocialLink {
	label: string
	url: string
	icon: typeof Send
	color: string
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
	const links: SocialLink[] = [
		{
			label: 'ВКонтакте',
			url: vk_url || '',
			icon: Link2,
			color: 'hover:text-blue-600'
		},
		{
			label: 'Telegram',
			url: telegram_url || '',
			icon: Send,
			color: 'hover:text-blue-500'
		},
		{
			label: 'WhatsApp',
			url: whatsapp_url || '',
			icon: MessageCircle,
			color: 'hover:text-green-600'
		},
		{
			label: 'Max',
			url: max_url || '',
			icon: MessageCircle,
			color: 'hover:text-purple-600'
		}
	].filter((link): link is SocialLink => Boolean(link.url))

	if (links.length === 0) return null

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Link2 className="h-4 w-4 text-muted-foreground" />
				<Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Мессенджеры
				</Label>
			</div>
			<div className="flex flex-wrap gap-3">
				{links.map(link => {
					const Icon = link.icon
					return (
						<a
							key={link.label}
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							className={`flex items-center justify-center w-11 h-11 rounded-lg border-2 border-border bg-background transition-all hover:scale-105 hover:border-primary/50 hover:bg-accent ${link.color} group`}
							aria-label={link.label}
							title={link.label}
						>
							<Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
						</a>
					)
				})}
			</div>
		</div>
	)
}
