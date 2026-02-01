import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { UsersService, type UserPublic, type UserUpdateMe } from '@/client'
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
import { handleError, unwrapResponse } from '@/utils'
import {
	updateUserMeSchema,
	emailVerificationRequestSchema,
	emailVerificationSchema,
	type UpdateUserMeFormData,
	type EmailVerificationRequestFormData,
	type EmailVerificationFormData
} from '@/schemas/user'

type FormData = UpdateUserMeFormData
type EmailRequestData = EmailVerificationRequestFormData
type EmailVerificationData = EmailVerificationFormData

const UserInformation = () => {
	const queryClient = useQueryClient()
	const { showSuccessToast, showErrorToast } = useCustomToast()
	const [editMode, setEditMode] = useState(false)
	const [emailEditMode, setEmailEditMode] = useState(false)
	const [codeSent, setCodeSent] = useState(false)
	const [resendCooldown, setResendCooldown] = useState<number | null>(null)
	const { user: currentUser } = useAuth()

	const form = useForm<FormData>({
		resolver: zodResolver(updateUserMeSchema),
		mode: 'onBlur',
		criteriaMode: 'all',
		defaultValues: {
			nickname: currentUser?.nickname || ""
		}
	})

	const emailRequestForm = useForm<EmailRequestData>({
		resolver: zodResolver(emailVerificationRequestSchema),
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
			unwrapResponse<UserPublic>(UsersService.usersUpdateUserMe({ body: data })),
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
			return unwrapResponse(
				UsersService.usersRequestEmailVerificationCode({
					body: { new_email: newEmail }
				})
			)
		},
		onSuccess: () => {
			showSuccessToast(
				'Код подтверждения отправлен на текущую почту'
			)
			setCodeSent(true)
			setResendCooldown(2 * 60) // 2 minutes
		},
		onError: handleError.bind(showErrorToast)
	})

	const verifyEmailMutation = useMutation({
		mutationFn: async (data: EmailVerificationData) => {
			return unwrapResponse(
				UsersService.usersVerifyAndUpdateEmail({
					body: { new_email: data.new_email, code: data.code }
				})
			)
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
		onError: handleError.bind(showErrorToast)
	})

	const onSubmit = (data: FormData) => {
		const updateData: UserUpdateMe = {}

		if (data.nickname && data.nickname !== currentUser?.nickname) {
			updateData.nickname = data.nickname
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
							name="nickname"
							render={({ field }) =>
								editMode ? (
									<FormItem>
										<FormLabel className="text-base">
											Псевдоним <span className="text-destructive">*</span>
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
										<FormLabel className="text-base">Псевдоним</FormLabel>
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
