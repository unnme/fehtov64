import { lazy, Suspense } from 'react'
import { Skeleton } from './skeleton'

const RichTextEditorImpl = lazy(() => import('./rich-text-editor').then(mod => ({ default: mod.RichTextEditor })))

interface RichTextEditorProps {
	content: string
	onChange: (content: string) => void
	placeholder?: string
	className?: string
}

export function RichTextEditor(props: RichTextEditorProps) {
	return (
		<Suspense fallback={<Skeleton className="h-64 w-full" />}>
			<RichTextEditorImpl {...props} />
		</Suspense>
	)
}
