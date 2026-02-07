import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Award } from 'lucide-react'

import type { SignatureInfo } from '@/client'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover'

interface SignaturePopoverProps {
	documentId: string
	mimeType: string
}

async function fetchSignatureInfo(documentId: string): Promise<SignatureInfo> {
	const response = await fetch(
		`${import.meta.env.VITE_API_URL}/api/v1/documents/${documentId}/signature`
	)
	if (!response.ok) {
		throw new Error('Failed to fetch signature info')
	}
	return response.json()
}

export const SignaturePopover = ({
	documentId,
	mimeType
}: SignaturePopoverProps) => {
	const isPdf = mimeType === 'application/pdf'

	const { data: signatureInfo, isLoading } = useQuery({
		queryKey: ['document-signature', documentId],
		queryFn: () => fetchSignatureInfo(documentId),
		enabled: isPdf,
		staleTime: 5 * 60 * 1000
	})

	if (!isPdf || isLoading || !signatureInfo?.is_signed) {
		return null
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					title="Документ подписан ЭП"
				>
					<Award className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end">
				<div className="space-y-3">
					<h4 className="font-medium text-sm">Электронная подпись</h4>
					<div className="space-y-2 text-sm">
						{signatureInfo.signing_time && (
							<div>
								<span className="text-muted-foreground">
									Дата и время подписания
								</span>
								<p className="font-medium">
									{format(
										new Date(signatureInfo.signing_time),
										'd MMMM yyyy, HH:mm',
										{ locale: ru }
									)}
								</p>
							</div>
						)}
						{signatureInfo.signer_name && (
							<div>
								<span className="text-muted-foreground">
									Фамилия, имя и отчество подписавшего документ
								</span>
								<p className="font-medium">{signatureInfo.signer_name}</p>
							</div>
						)}
						{signatureInfo.signer_position && (
							<div>
								<span className="text-muted-foreground">
									Должность лица, подписавшего документ
								</span>
								<p className="font-medium">{signatureInfo.signer_position}</p>
							</div>
						)}
						{signatureInfo.signature_hash && (
							<div>
								<span className="text-muted-foreground">Электронная подпись</span>
								<p className="font-mono text-xs break-all">
									{signatureInfo.signature_hash}
								</p>
							</div>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
