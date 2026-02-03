import vkLogo from "/assets/images/vk-icon.svg"

interface VkIconProps {
	className?: string
}

export const VkIcon = ({ className }: VkIconProps) => {
	return (
		<img
			src={vkLogo}
			alt="VK"
			className={className}
		/>
	)
}
