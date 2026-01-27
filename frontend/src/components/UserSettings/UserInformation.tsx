import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { OpenAPI, UsersService, type UserUpdateMe } from '@/client'
import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import useAuth from '@/hooks/useAuth'
import useCustomToast from '@/hooks/useCustomToast'
import { cn } from '@/lib/utils'
import { handleError } from '@/utils'

const formSchema = z.object({
	full_name: z.string().min(1, { message: "Full name is required" }).max(255)
})

const emailRequestSchema = z.object({
	new_email: z.string().email({ message: 'Invalid email address' })
})

const emailVerificationSchema = z
	.object({
		new_email: z.string().email({ message: 'Invalid email address' }),
		code: z.string().length(4, { message: 'Code must be 4 characters' })
	})
	.refine(data => data.code.length === 4, {
		message: 'Code must be 4 characters',
		path: ['code']
	})

type FormData = z.infer<typeof formSchema>
type EmailRequestData = z.infer<typeof emailRequestSchema>
type EmailVerificationData = z.infer<typeof emailVerificationSchema>

const UserInformation = () => {
	const queryClient = useQueryClient()
	const { showSuccessToast, showErrorToast } = useCustomToast()
	const [editMode, setEditMode] = useState(false)
	const [emailEditMode, setEmailEditMode] = useState(false)
	const [codeSent, setCodeSent] = useState(false)
	const [resendCooldown, setResendCooldown] = useState<number | null>(null)
	const { user: currentUser } = useAuth()

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		mode: 'onBlur',
		criteriaMode: 'all',
		defaultValues: {
			full_name: currentUser?.full_name || ""
		}
	})

	const emailRequestForm = useForm<EmailRequestData>({
		resolver: zodResolver(emailRequestSchema),
		mode: 'onChange',
		defaultValues: {
			new_email: ''
		}
	})

	const emailVerificationForm = useForm<EmailVerificationData>({
		resolver: zodResolver(emailVerificationSchema),
		mode: 'onChange',
		defaultValues: {
			new_email: '',
			code: ''
		}
	})

	const toggleEditMode = () => {
		setEditMode(!editMode)
	}

	const toggleEmailEditMode = () => {
		setEmailEditMode(!emailEditMode)
		setCodeSent(false)
		setResendCooldown(null)
		emailRequestForm.reset()
		emailVerificationForm.reset()
	}

	const mutation = useMutation({
		mutationFn: (data: UserUpdateMe) =>
			async (data) => {
				const response = await UsersService.usersUpdateUserMe({ body: data })
				if ('error' in response && response.error) {
					throw response
				}
				return (response as any).data
			},
		onSuccess: () => {
			showSuccessToast('Данные пользователя обновлены')
			toggleEditMode()
		},
		onError: handleError.bind(showErrorToast),
		onSettled: () => {
			queryClient.invalidateQueries()
		}
	})

	const requestCodeMutation = useMutation({
		mutationFn: async (newEmail: string) => {
			// TODO: Replace with UsersService.requestEmailVerificationCode after client regeneration
			const token = localStorage.getItem('access_token') || ''
			const response = await fetch(
				`${OpenAPI.BASE}/api/v1/users/me/email/request-code`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({ new_email: newEmail })
				}
			)
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.detail || 'Не удалось отправить код подтверждения')
			}
			return response.json()
		},
		onSuccess: () => {
			showSuccessToast(
				'Код подтверждения отправлен на текущую почту'
			)
			setCodeSent(true)
			setResendCooldown(2 * 60) // 2 minutes
		},
		onError: (error: Error) => {
			showErrorToast(error.message || 'Не удалось отправить код подтверждения')
		}
	})

	const verifyEmailMutation = useMutation({
		mutationFn: async (data: EmailVerificationData) => {
			// TODO: Replace with UsersService.verifyEmail after client regeneration
			const token = localStorage.getItem('access_token') || ''
			const response = await fetch(
				`${OpenAPI.BASE}/api/v1/users/me/email/verify`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({
						new_email: data.new_email,
						code: data.code
					})
				}
			)
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.detail || 'Не удалось подтвердить почту')
			}
			return response.json()
		},
		onSuccess: () => {
			showSuccessToast('Почта успешно обновлена')
			toggleEmailEditMode()
			emailRequestForm.reset()
			emailVerificationForm.reset()
			setCodeSent(false)
			setResendCooldown(null)
			queryClient.invalidateQueries({ queryKey: ['currentUser'] })
		},
		onError: (error: Error) => {
			showErrorToast(error.message || 'Не удалось подтвердить почту')
		}
	})

	const onSubmit = (data: FormData) => {
		const updateData: UserUpdateMe = {}

		if (data.full_name && data.full_name !== currentUser?.full_name) {
			updateData.full_name = data.full_name
		}

		mutation.mutate(updateData)
	}

	const onRequestCode = (data: EmailRequestData) => {
		requestCodeMutation.mutate(data.new_email)
		emailVerificationForm.setValue('new_email', data.new_email)
	}

	const onVerifyEmail = (data: EmailVerificationData) => {
		verifyEmailMutation.mutate(data)
	}

	const onCancel = () => {
		form.reset()
		toggleEditMode()
	}

	const onCancelEmail = () => {
		emailRequestForm.reset()
		emailVerificationForm.reset()
		toggleEmailEditMode()
		setCodeSent(false)
		setResendCooldown(null)
	}

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	const handleResendCode = () => {
		const newEmail = emailRequestForm.getValues('new_email')
		if (newEmail) {
			emailRequestForm.reset()
			emailVerificationForm.reset()
			setCodeSent(false)
			requestCodeMutation.mutate(newEmail)
		}
	}

	useEffect(() => {
		if (resendCooldown === null || resendCooldown <= 0) return

		const timer = setInterval(() => {
			setResendCooldown(prev => {
				if (prev === null || prev <= 1) {
					return 0
				}
				return prev - 1
			})
		}, 1000)

		return () => clearInterval(timer)
	}, [resendCooldown])

	return (
		<div className="space-y-8">
			<div>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-4"
					>
						<FormField
							control={form.control}
							name="full_name"
							render={({ field }) =>
								editMode ? (
									<FormItem>
										<FormLabel className="text-base">
											Полное имя <span className="text-destructive">*</span>
										</FormLabel>
										<FormControl>
											<Input
												type="text"
												{...field}
												required
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								) : (
									<FormItem>
										<FormLabel className="text-base">Полное имя</FormLabel>
										<div className="h-9 px-3 py-1 bg-muted rounded-md border flex items-center">
											<p
												className={cn(
													'text-sm font-medium text-muted-foreground'
												)}
											>
												{field.value || 'Не указано'}
											</p>
										</div>
									</FormItem>
								)
							}
						/>

						<div className="flex gap-3">
							{editMode ? (
								<>
									<LoadingButton
										type="submit"
										loading={mutation.isPending}
										disabled={!form.formState.isDirty}
									>
										Сохранить
									</LoadingButton>
									<Button
										type="button"
										variant="outline"
										onClick={onCancel}
										disabled={mutation.isPending}
									>
										Отмена
									</Button>
								</>
							) : (
								<Button
									type="button"
									onClick={toggleEditMode}
								>
									Редактировать
								</Button>
							)}
						</div>
					</form>
				</Form>
			</div>

			<div>
				<div className="space-y-2">
					<Label className="text-base">Email</Label>
					<div className="h-9 px-3 py-1 bg-muted rounded-md border flex items-center">
						<p className="text-sm font-medium text-muted-foreground">
							{currentUser?.email}
						</p>
					</div>
				</div>

				{!emailEditMode ? (
					<div className="flex gap-3 mt-4">
						<Button
							type="button"
							onClick={toggleEmailEditMode}
						>
							Редактировать
						</Button>
					</div>
				) : (
					<div className="mt-4 space-y-4">
						{!codeSent ? (
							<Form {...emailRequestForm}>
								<form
									onSubmit={emailRequestForm.handleSubmit(onRequestCode)}
									className="flex flex-col gap-4"
								>
									<FormField
										control={emailRequestForm.control}
										name="new_email"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-base">Новый email</FormLabel>
												<FormControl>
													<Input
														type="email"
														placeholder="new@example.com"
														{...field}
														disabled={requestCodeMutation.isPending}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="flex gap-3">
										<LoadingButton
											type="submit"
											loading={requestCodeMutation.isPending}
											disabled={
												!emailRequestForm.formState.isValid ||
												(resendCooldown !== null && resendCooldown > 0)
											}
											className="gap-2"
										>
											<Mail className="h-4 w-4" />
											Отправить код подтверждения
										</LoadingButton>
										<Button
											type="button"
											variant="outline"
											onClick={onCancelEmail}
											disabled={requestCodeMutation.isPending}
										>
											Отмена
										</Button>
									</div>
									{resendCooldown !== null && resendCooldown > 0 && (
										<p className="text-xs text-muted-foreground">
											Повторная отправка доступна через{' '}
											{formatTime(resendCooldown)}
										</p>
									)}
								</form>
							</Form>
						) : (
							<Form {...emailVerificationForm}>
								<form
									onSubmit={emailVerificationForm.handleSubmit(onVerifyEmail)}
									className="flex flex-col gap-4"
								>
									<FormField
										control={emailVerificationForm.control}
										name="new_email"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-base">Новый email</FormLabel>
												<p className="py-2 text-sm text-muted-foreground">
													{field.value ||
														emailRequestForm.getValues('new_email')}
												</p>
												<input
													type="hidden"
													{...field}
													value={
														field.value ||
														emailRequestForm.getValues('new_email')
													}
												/>
											</FormItem>
										)}
									/>

									<div className="space-y-4">
										<FormField
											control={emailVerificationForm.control}
											name="code"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Код подтверждения</FormLabel>
													<FormControl>
														<Input
															type="text"
															placeholder="Введите 4-значный код"
															maxLength={4}
															className="text-center text-lg tracking-widest uppercase"
															{...field}
															onChange={e => {
																field.onChange(e.target.value.toUpperCase())
															}}
														/>
													</FormControl>
													<p className="text-xs text-muted-foreground mt-1">
														Введите код, отправленный на ваш текущий email (
														{currentUser?.email})
													</p>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="flex gap-3">
										<LoadingButton
											type="submit"
											loading={verifyEmailMutation.isPending}
											disabled={!emailVerificationForm.formState.isValid}
										>
											Подтвердить и обновить email
										</LoadingButton>
										<Button
											type="button"
											variant="outline"
											onClick={onCancelEmail}
											disabled={verifyEmailMutation.isPending}
										>
											Отмена
										</Button>
									</div>
									{resendCooldown !== null && resendCooldown > 0 ? (
										<p className="text-xs text-muted-foreground">
											Повторная отправка доступна через{' '}
											{formatTime(resendCooldown)}
										</p>
									) : (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={handleResendCode}
											disabled={
												verifyEmailMutation.isPending ||
												requestCodeMutation.isPending
											}
											className="text-xs"
										>
											Отправить код повторно
										</Button>
									)}
								</form>
							</Form>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default UserInformation
