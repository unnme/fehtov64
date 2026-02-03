import maxLogo from "/assets/images/max-messenger-sign-logo.svg"

interface MaxIconProps {
	className?: string
}

export const MaxIcon = ({ className }: MaxIconProps) => {
	return (
		<img
			src={maxLogo}
			alt="Max Messenger"
			className={className}
		/>
	)
}
