import telegramLogo from "/assets/images/telegram-icon.svg"

interface TelegramIconProps {
	className?: string
}

export const TelegramIcon = ({ className }: TelegramIconProps) => {
	return (
		<img
			src={telegramLogo}
			alt="Telegram"
			className={className}
		/>
	)
}
