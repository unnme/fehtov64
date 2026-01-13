import { Link } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const ErrorComponent = () => {
	return (
		<div
			className="flex min-h-screen items-center justify-center flex-col p-4"
			data-testid="error-component"
		>
			<Alert
				variant="destructive"
				className="max-w-md"
			>
				<AlertCircle className="h-4 w-4" />
				<AlertTitle className="text-2xl font-bold">Oops!</AlertTitle>
				<AlertDescription className="text-lg">
					Something went wrong. Please try again.
				</AlertDescription>
			</Alert>
			<Link
				to="/"
				className="mt-4"
			>
				<Button>Go Home</Button>
			</Link>
		</div>
	)
}

export default ErrorComponent
