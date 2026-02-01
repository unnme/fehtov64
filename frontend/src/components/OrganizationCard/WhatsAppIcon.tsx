import whatsappLogo from "/assets/images/whatsapp-icon.svg"

interface WhatsAppIconProps {
	className?: string
}

export const WhatsAppIcon = ({ className }: WhatsAppIconProps) => {
	return (
		<img
			src={whatsappLogo}
			alt="WhatsApp"
			className={className}
		/>
	)
}
