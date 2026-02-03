import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { GraduationCap, Mail, Phone, Users } from 'lucide-react'
import { useMemo } from 'react'
import { z } from 'zod'

import {
	OrganizationCardService,
	PersonsService,
	type OrganizationCardPublic,
	type PersonPublic,
	type PersonsPublic
} from '@/client'
import { Breadcrumbs, Navbar } from '@/components/Common'
import { cn } from '@/lib/utils'
import { unwrapResponse } from '@/utils'
import { getPersonImageFileUrl } from '@/utils/fileUrls'

const SECTIONS = [
	{ id: 'basic', name: 'Основные сведения' },
	{ id: 'vacancies', name: 'Вакансии' },
	{ id: 'education', name: 'Образовательный процесс' },
	{ id: 'staff', name: 'Кадры' }
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const STAFF_SUBSECTIONS = [
	{
		id: 'leadership',
		name: 'Руководство',
		icon: Users
	},
	{
		id: 'teachers',
		name: 'Педагогический состав',
		icon: GraduationCap
	}
] as const

type StaffSubsectionId = (typeof STAFF_SUBSECTIONS)[number]['id']

export const Route = createFileRoute('/about')({
	component: AboutPage,
	validateSearch: z.object({
		section: z.string().optional(),
		subsection: z.string().optional()
	}),
	head: () => ({
		meta: [
			{
				title: 'Сведения об образовательной организации'
			}
		]
	})
})

interface PersonCardProps {
	person: PersonPublic
}

function PersonCard({ person }: PersonCardProps) {
	const imageUrl = person.image ? getPersonImageFileUrl(person.id) : null
	const fullName = `${person.last_name} ${person.first_name} ${person.middle_name}`

	return (
		<div className="flex flex-col sm:flex-row gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
			<div className="shrink-0">
				{imageUrl ? (
					<div className="size-24 sm:size-28 rounded-lg overflow-hidden bg-muted">
						<img
							src={imageUrl}
							alt={fullName}
							className="size-full object-cover"
						/>
					</div>
				) : (
					<div className="size-24 sm:size-28 rounded-lg bg-muted flex items-center justify-center">
						<Users className="size-10 text-muted-foreground/50" />
					</div>
				)}
			</div>
			<div className="flex flex-col gap-2 min-w-0">
				<h3 className="font-semibold text-base">{fullName}</h3>
				<p className="text-sm text-muted-foreground">{person.position.name}</p>
				{person.description && (
					<p className="text-sm text-muted-foreground line-clamp-2">
						{person.description}
					</p>
				)}
				<div className="flex flex-col gap-1 mt-auto">
					<a
						href={`tel:${person.phone}`}
						className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<Phone className="size-3.5 shrink-0" />
						<span className="truncate">{person.phone}</span>
					</a>
					<a
						href={`mailto:${person.email}`}
						className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<Mail className="size-3.5 shrink-0" />
						<span className="truncate">{person.email}</span>
					</a>
				</div>
			</div>
		</div>
	)
}

function AboutPage() {
	const navigate = useNavigate({ from: '/about' })
	const search = Route.useSearch()

	const { data, isLoading } = useQuery({
		queryKey: ['organization-card-public'],
		queryFn: () =>
			unwrapResponse<OrganizationCardPublic>(
				OrganizationCardService.organizationCardReadPublicCard()
			),
		retry: false
	})

	const { data: personsData, isLoading: isLoadingPersons } = useQuery({
		queryKey: ['persons-public'],
		queryFn: () =>
			unwrapResponse<PersonsPublic>(
				PersonsService.personsReadPublicPersons()
			),
		retry: false
	})

	const { director, leadership, teachers } = useMemo(() => {
		if (!personsData?.data) return { director: null, leadership: [], teachers: [] }

		const directorPerson = personsData.data.find(p => p.position.is_director) ?? null
		const leadershipList = personsData.data.filter(p => p.position.is_management)
		const teachersList = personsData.data.filter(p => !p.position.is_management)

		// Sort leadership: director first, then by name
		leadershipList.sort((a, b) => {
			if (a.position.is_director && !b.position.is_director) return -1
			if (!a.position.is_director && b.position.is_director) return 1
			return a.last_name.localeCompare(b.last_name)
		})

		return { director: directorPerson, leadership: leadershipList, teachers: teachersList }
	}, [personsData])

	const currentSection = useMemo<SectionId>(() => {
		if (!search.section) return 'basic'
		const match = SECTIONS.find(
			s => s.id === search.section || s.name.toLowerCase() === search.section?.toLowerCase()
		)
		return match?.id ?? 'basic'
	}, [search.section])

	const currentSubsection = useMemo<StaffSubsectionId | null>(() => {
		if (currentSection !== 'staff' || !search.subsection) return null
		const match = STAFF_SUBSECTIONS.find(s => s.id === search.subsection)
		return match?.id ?? null
	}, [currentSection, search.subsection])

	const handleSectionSelect = (sectionId: SectionId) => {
		navigate({
			search: {
				section: sectionId === 'basic' ? undefined : sectionId
			}
		})
	}

	const renderSectionContent = () => {
		if (isLoading) {
			return (
				<div className="text-muted-foreground text-sm py-6">Загрузка...</div>
			)
		}

		switch (currentSection) {
			case 'basic': {
				const hasContent = data?.name || director
				if (!hasContent) {
					return (
						<div className="text-muted-foreground text-sm py-6">
							Информация не заполнена
						</div>
					)
				}
				return (
					<div className="space-y-4">
						{data?.name && (
							<div className="border rounded-xl p-4">
								<h3 className="text-sm font-medium text-muted-foreground mb-1">
									Название организации
								</h3>
								<p className="text-base">{data.name}</p>
							</div>
						)}
						{director && (
							<div>
								<h3 className="text-sm font-medium text-muted-foreground mb-3">
									Руководитель
								</h3>
								<PersonCard person={director} />
							</div>
						)}
					</div>
				)
			}
			case 'vacancies':
				return (
					<div className="text-muted-foreground text-sm py-6">
						Информация о вакансиях будет добавлена позже
					</div>
				)
			case 'education':
				return (
					<div className="text-muted-foreground text-sm py-6">
						Информация об образовательном процессе будет добавлена позже
					</div>
				)
			case 'staff':
				if (currentSubsection === 'leadership') {
					if (isLoadingPersons) {
						return (
							<div className="text-muted-foreground text-sm py-6">Загрузка...</div>
						)
					}
					if (leadership.length === 0) {
						return (
							<div className="text-muted-foreground text-sm py-6">
								Информация о руководстве отсутствует
							</div>
						)
					}
					return (
						<div className="grid gap-4 sm:grid-cols-2">
							{leadership.map(person => (
								<PersonCard key={person.id} person={person} />
							))}
						</div>
					)
				}
				if (currentSubsection === 'teachers') {
					if (isLoadingPersons) {
						return (
							<div className="text-muted-foreground text-sm py-6">Загрузка...</div>
						)
					}
					if (teachers.length === 0) {
						return (
							<div className="text-muted-foreground text-sm py-6">
								Информация о педагогическом составе отсутствует
							</div>
						)
					}
					return (
						<div className="grid gap-4 sm:grid-cols-2">
							{teachers.map(person => (
								<PersonCard key={person.id} person={person} />
							))}
						</div>
					)
				}
				return (
					<div className="grid gap-4 sm:grid-cols-2">
						{STAFF_SUBSECTIONS.map(subsection => {
							const Icon = subsection.icon
							return (
								<Link
									key={subsection.id}
									to="/about"
									search={{ section: 'staff', subsection: subsection.id }}
									className="flex items-center gap-4 rounded-xl bg-muted/50 p-5 transition-colors hover:bg-muted"
								>
									<Icon className="size-10 shrink-0 text-amber-500" strokeWidth={1.5} />
									<span className="text-base font-medium">{subsection.name}</span>
								</Link>
							)
						})}
					</div>
				)
			default:
				return null
		}
	}

	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			<Breadcrumbs />
			<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<div className="w-full space-y-6">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
							Сведения об образовательной организации
						</h1>
					</div>
					<div className="grid gap-6 lg:grid-cols-[240px_1fr]">
						<div className="space-y-2">
							{SECTIONS.map(section => {
								const isActive = section.id === currentSection
								return (
									<button
										key={section.id}
										type="button"
										aria-pressed={isActive}
										onClick={() => handleSectionSelect(section.id)}
										className={cn(
											'w-full text-left rounded-lg px-4 py-2 text-sm font-medium transition-colors border',
											isActive
												? 'bg-primary/10 text-primary border-primary/20'
												: 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
										)}
									>
										{section.name}
									</button>
								)
							})}
						</div>
						<div>{renderSectionContent()}</div>
					</div>
				</div>
			</main>
		</div>
	)
}
