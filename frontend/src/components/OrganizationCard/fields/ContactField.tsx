import { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface ContactFieldProps {
	icon: ReactNode
	label: string
	children: ReactNode
}

export const ContactField = ({ icon, label, children }: ContactFieldProps) => {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				{icon}
				<Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					{label}
				</Label>
			</div>
			{children}
		</div>
	)
}
