import { zodResolver } from '@hookform/resolvers/zod'
import {
	createFileRoute,
	redirect,
	Link as RouterLink
} from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

import { AuthLayout } from '@/components/Common'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { PasswordInput } from '@/components/ui/password-input'
import useAuth from '@/hooks/useAuth'
import { registerSchema, type RegisterFormData } from '@/schemas/auth'

type FormData = RegisterFormData

export const Route = createFileRoute('/auth/signup')({
	component: SignUp,
	beforeLoad: async () => {
		// Public registration is disabled - redirect to login
		throw redirect({
			to: '/auth/login'
		})
	},
	head: () => ({
		meta: [
			{
				title: 'Sign Up - FastAPI Cloud'
			}
		]
	})
})

function SignUp() {
	const { signUpMutation } = useAuth()
	const form = useForm<FormData>({
		resolver: zodResolver(registerSchema),
		mode: 'onBlur',
		criteriaMode: 'all',
		defaultValues: {
			email: '',
			nickname: '',
			password: '',
			confirm_password: ''
		}
	})

	const onSubmit = (data: FormData) => {
		if (signUpMutation.isPending) return

		// Exclude confirm_password from submission data
		const { confirm_password: _confirm_password, ...submitData } = data
		signUpMutation.mutate(submitData)
	}

	return (
		<AuthLayout>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-6"
				>
					<div className="flex flex-col items-center gap-2 text-center">
						<h1 className="text-2xl font-bold">Create an account</h1>
					</div>

					<div className="grid gap-4">
						<FormField
							control={form.control}
							name="nickname"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Псевдоним</FormLabel>
									<FormControl>
										<Input
											data-testid="nickname-input"
											placeholder="Псевдоним"
											type="text"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											data-testid="email-input"
											placeholder="user@example.com"
											type="email"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<PasswordInput
											data-testid="password-input"
											placeholder="Password"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="confirm_password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirm Password</FormLabel>
									<FormControl>
										<PasswordInput
											data-testid="confirm-password-input"
											placeholder="Confirm Password"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<LoadingButton
							type="submit"
							className="w-full"
							loading={signUpMutation.isPending}
						>
							Sign Up
						</LoadingButton>
					</div>

					<div className="text-center text-sm">
						Already have an account?{' '}
						<RouterLink
							to="/auth/login"
							className="underline underline-offset-4"
						>
							Log in
						</RouterLink>
					</div>
				</form>
			</Form>
		</AuthLayout>
	)
}
