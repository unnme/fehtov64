import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	Apple,
	Award,
	Swords,
	BookMarked,
	BookOpen,
	Building2,
	ChevronLeft,
	ClipboardCheck,
	ClipboardList,
	Clock,
	FileText,
	IdCard,
	Globe,
	GraduationCap,
	Handshake,
	Heart,
	LifeBuoy,
	Landmark,
	ListChecks,
	Mail,
	Network,
	Phone,
	Scale,
	ShieldCheck,
	TrendingUp,
	UserPlus,
	Users,
	Wallet
} from 'lucide-react'
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
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { unwrapResponse } from '@/utils'
import { getPersonImageFileUrl } from '@/utils/fileUrls'

const SECTIONS = [
	{
		id: 'general',
		name: 'Общая информация',
		icon: Building2,
		subsections: [
			{ id: 'basic', name: 'Основные сведения', icon: FileText },
			{ id: 'structure', name: 'Структура и органы управления', icon: Network },
			{ id: 'biography', name: 'Биография Г.И. Шварца', icon: Swords }
		]
	},
	{
		id: 'staff',
		name: 'Кадры',
		icon: Users,
		subsections: [
			{ id: 'leadership', name: 'Руководство', icon: IdCard },
			{ id: 'teachers', name: 'Педагогический состав', icon: GraduationCap },
			{ id: 'vacancies', name: 'Вакансии', icon: ClipboardList }
		]
	},
	{
		id: 'education',
		name: 'Образовательный процесс',
		icon: BookOpen,
		subsections: [
			{ id: 'programs', name: 'Образование', icon: BookMarked },
			{ id: 'paid-services', name: 'Платные образовательные услуги', icon: ListChecks },
			{ id: 'admission', name: 'Вакантные места для приёма', icon: UserPlus }
		]
	},
	{
		id: 'student-support',
		name: 'Поддержка обучающихся',
		icon: LifeBuoy,
		subsections: [
			{ id: 'scholarships', name: 'Стипендии и меры поддержки обучающихся', icon: Award },
			{ id: 'catering', name: 'Организация питания', icon: Apple },
			{ id: 'accessibility', name: 'Доступная среда', icon: Heart }
		]
	},
	{
		id: 'finance',
		name: 'Финансы и отчётность',
		icon: Landmark,
		subsections: [
			{ id: 'documents', name: 'Документы', icon: FileText },
			{ id: 'state-task', name: 'Госзадание', icon: ClipboardCheck },
			{ id: 'financial-activity', name: 'Финансово-хозяйственная деятельность', icon: TrendingUp }
		]
	},
	{
		id: 'regulations',
		name: 'Нормативные требования',
		icon: Scale,
		subsections: [
			{ id: 'anti-corruption', name: 'Реализация антикоррупционной политики', icon: ShieldCheck },
			{ id: 'federal-standard', name: 'Федеральный стандарт СП', icon: Award }
		]
	},
	{
		id: 'partnership',
		name: 'Партнёрство',
		icon: Handshake,
		subsections: [
			{ id: 'international', name: 'Международное сотрудничество', icon: Globe }
		]
	}
] as const

type SectionId = (typeof SECTIONS)[number]['id']
type SubsectionId = (typeof SECTIONS)[number]['subsections'][number]['id']

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
		<div className="group flex gap-4 p-4 rounded-xl border bg-card transition-all hover:shadow-md hover:border-primary/20">
			<div className="w-24 h-32 sm:w-32 sm:h-40 shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={fullName}
						className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<Users className="size-12 text-muted-foreground/30" />
				)}
			</div>
			<div className="flex flex-col min-w-0 py-1">
				<h3 className="font-semibold leading-tight">{fullName}</h3>
				<p className="text-sm text-primary/80 mt-1">{person.position.name}</p>
				{person.description && (
					<p className="text-xs text-muted-foreground line-clamp-2 mt-2">
						{person.description}
					</p>
				)}
				<div className="flex flex-col gap-1 mt-auto pt-2">
					{person.phone && (
						<a
							href={`tel:${person.phone}`}
							className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							<Phone className="size-3.5 shrink-0" />
							<span className="truncate">{person.phone}</span>
						</a>
					)}
					{person.email && (
						<a
							href={`mailto:${person.email}`}
							className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							<Mail className="size-3.5 shrink-0" />
							<span className="truncate">{person.email}</span>
						</a>
					)}
				</div>
			</div>
		</div>
	)
}

function PlaceholderContent({ title }: { title: string }) {
	return (
		<div className="rounded-xl border bg-card p-6 text-center">
			<Clock className="size-12 mx-auto text-muted-foreground/30 mb-4" />
			<h3 className="font-medium text-lg mb-2">{title}</h3>
			<p className="text-sm text-muted-foreground">
				Информация будет добавлена позже
			</p>
		</div>
	)
}

function OrganizationStructure() {
	const ascii = [
		'                                          ┌────────────────┐',
		'                                          │    ДИРЕКТОР    │',
		'                                          └───────┬────────┘',
		'                                                  │',
		'                ┌─────────────────────────────────┼─────────────────────────────────┐',
		'                │                                 │                                 │',
		'                ▼                                 ▼                                 ▼',
		'┌───────────────────────┐       ┌───────────────────────────┐       ┌───────────────────────────┐',
		'│   ГЛАВНЫЙ БУХГАЛТЕР   │       │   ЗАМЕСТИТЕЛЬ ДИРЕКТОРА   │       │   ЗАМЕСТИТЕЛЬ ДИРЕКТОРА   │',
		'│                       │       │   ПО СПОРТИВНОЙ РАБОТЕ    │       │  ПО МЕТОДИЧЕСКОЙ РАБОТЕ   │',
		'└───────────┬───────────┘       └─────────────┬─────────────┘       └─────────────┬─────────────┘',
		'            │                                 │                                   │',
		'      ┌─────┴─────┐                     ┌─────┴─────┐                    ┌────────┼────────┐',
		'      │           │                     │           │                    │        │        │',
		'      ▼           ▼                     ▼           ▼                    ▼        ▼        ▼',
		'┌──────────┐ ┌──────────┐       ┌────────────┐ ┌──────────┐       ┌─────────┐ ┌──────┐ ┌─────────┐',
		'│Экономист │ │ Ведущий  │       │ Тренерско- │ │  Техник  │       │ Старший │ │Юрист │ │Системный│',
		'│          │ │бухгалтер │       │ преподават.│ │    по    │       │инструкт.│ │      │ │  админ. │',
		'└──────────┘ └──────────┘       │   состав   │ │эксплуат. │       │-методист│ └──────┘ └─────────┘',
		'                                └────────────┘ └──────────┘       └────┬────┘',
		'                                                                       │',
		'                                                                       ▼',
		'                                                                ┌─────────────┐',
		'                                                                │ Инструкторы-│',
		'                                                                │  методисты  │',
		'                                                                └─────────────┘'
	]

	return (
		<div className="rounded-xl border bg-card p-6 overflow-x-auto">
			<pre className="text-xs sm:text-sm font-mono text-foreground whitespace-pre leading-relaxed">
				{ascii.join('\n')}
			</pre>
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

		leadershipList.sort((a, b) => {
			if (a.position.is_director && !b.position.is_director) return -1
			if (!a.position.is_director && b.position.is_director) return 1
			return a.last_name.localeCompare(b.last_name)
		})

		return { director: directorPerson, leadership: leadershipList, teachers: teachersList }
	}, [personsData])

	const currentSection = useMemo<SectionId>(() => {
		if (!search.section) return 'general'
		const match = SECTIONS.find(s => s.id === search.section)
		return match?.id ?? 'general'
	}, [search.section])

	const currentSubsection = useMemo<SubsectionId | null>(() => {
		if (!search.subsection) return null
		for (const section of SECTIONS) {
			const match = section.subsections.find(s => s.id === search.subsection)
			if (match) return match.id
		}
		return null
	}, [search.subsection])

	const parentSection = useMemo(() => {
		if (!currentSubsection) return null
		return SECTIONS.find(s =>
			s.subsections.some(sub => sub.id === currentSubsection)
		) ?? null
	}, [currentSubsection])

	const currentSectionData = SECTIONS.find(s => s.id === currentSection)

	const handleSectionSelect = (sectionId: SectionId) => {
		navigate({
			search: {
				section: sectionId === 'general' ? undefined : sectionId,
				subsection: undefined
			}
		})
	}

	const handleSubsectionSelect = (sectionId: SectionId, subsectionId: SubsectionId) => {
		navigate({
			search: {
				section: sectionId === 'general' ? undefined : sectionId,
				subsection: subsectionId
			}
		})
	}

	const handleBack = () => {
		navigate({ search: {} })
	}

	const renderSubsectionContent = () => {
		if (isLoading) {
			return <div className="text-muted-foreground text-sm py-6">Загрузка...</div>
		}

		switch (currentSubsection) {
			case 'basic': {
				const requisites = [
					{ label: 'Юридический адрес', value: data?.legal_address, multiline: true },
					{ label: 'ИНН', value: data?.inn },
					{ label: 'КПП', value: data?.kpp },
					{ label: 'ОГРН', value: data?.ogrn },
					{ label: 'ОКПО', value: data?.okpo },
					{ label: 'ОКФС', value: data?.okfs },
					{ label: 'ОКОГУ', value: data?.okogu },
					{ label: 'ОКОПФ', value: data?.okopf },
					{ label: 'ОКТМО', value: data?.oktmo },
					{ label: 'ОКАТО', value: data?.okato }
				].filter(r => r.value)

				const bankDetails = [
					{ label: 'Получатель', value: data?.bank_recipient, multiline: true },
					{ label: 'Расчётный счёт', value: data?.bank_account },
					{ label: 'БИК', value: data?.bank_bik }
				].filter(r => r.value)

				const hasContent = data?.name || data?.description || director || requisites.length > 0 || bankDetails.length > 0

				if (!hasContent) {
					return <PlaceholderContent title="Основные сведения" />
				}

				const RequisiteRow = ({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) => (
					<div className={cn('flex gap-2', multiline ? 'items-start' : 'items-baseline')}>
						<span className="shrink-0 text-sm text-muted-foreground">{label}</span>
						<span className={cn(
							'flex-1 border-b border-dotted border-muted-foreground/20 min-w-4',
							multiline ? 'mt-[0.6em]' : 'translate-y-[-3px]'
						)} />
						<span className={cn(
							'text-sm font-medium',
							multiline && 'text-right flex-1 basis-1/3'
						)}>{value}</span>
					</div>
				)

				return (
					<div className="space-y-8">
						<div className="grid gap-6 lg:grid-cols-2">
							<div className="flex flex-col gap-6">
								{data?.name && (
									<div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/10 px-5 py-3.5">
										<div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
											<Building2 className="size-5 text-primary" />
										</div>
										<h2 className="text-lg sm:text-xl font-semibold leading-tight">{data.name}</h2>
									</div>
								)}
								{director && (
								<div className="rounded-2xl border bg-muted/50 p-6 sm:p-8 transition-all hover:shadow-md hover:border-primary/20">
									<div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
										<div className="shrink-0 mx-auto sm:mx-0">
											{director.image ? (
												<img
													src={getPersonImageFileUrl(director.id)}
													alt={`${director.last_name} ${director.first_name}`}
													className="w-48 sm:w-56 rounded-2xl"
												/>
											) : (
												<div className="w-48 sm:w-56 aspect-[3/4] rounded-2xl bg-muted flex items-center justify-center">
													<Users className="size-16 text-muted-foreground/30" />
												</div>
											)}
										</div>
										<div className="flex flex-col justify-between min-w-0 text-center sm:text-left">
											<div>
												<h3 className="text-lg sm:text-xl font-semibold text-primary leading-tight">
													{director.last_name} {director.first_name} {director.middle_name}
												</h3>
												<p className="text-sm text-muted-foreground mt-1">{director.position.name}</p>
											</div>

											<div className="flex flex-col gap-4 mt-4">
												{director.phone && (
													<div>
														<p className="font-semibold mb-0.5">Телефон</p>
														<a
															href={`tel:${director.phone}`}
															className="text-primary hover:underline"
														>
															{director.phone}
														</a>
													</div>
												)}
												{director.email && (
													<div>
														<p className="font-semibold mb-0.5">Электронная почта</p>
														<a
															href={`mailto:${director.email}`}
															className="text-primary hover:underline"
														>
															{director.email}
														</a>
													</div>
												)}
												{data?.director_hours && (
													<div>
														<p className="font-semibold mb-0.5">Часы приёма</p>
														<p>{data.director_hours}</p>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							)}
							</div>

							{(requisites.length > 0 || bankDetails.length > 0) && (
								<div className="rounded-2xl border bg-card p-5 sm:p-6 transition-all hover:shadow-md hover:border-primary/20">
									{requisites.length > 0 && (
										<>
											<div className="flex items-center gap-2 mb-4">
												<FileText className="size-4 text-primary" />
												<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Реквизиты</h3>
											</div>
											<div className="space-y-2">
												{requisites.map(r => (
													<RequisiteRow key={r.label} label={r.label} value={r.value!} multiline={r.multiline} />
												))}
											</div>
										</>
									)}
									{bankDetails.length > 0 && (
										<>
											<div className={cn("flex items-center gap-2 mb-4", requisites.length > 0 && "mt-6")}>
												<Wallet className="size-4 text-primary" />
												<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Банковские реквизиты</h3>
											</div>
											<div className="space-y-2">
												{bankDetails.map(r => (
													<RequisiteRow key={r.label} label={r.label} value={r.value!} multiline={r.multiline} />
												))}
											</div>
										</>
									)}
								</div>
							)}
						</div>

						{data?.description && (
							<div
								className="prose prose-sm max-w-none dark:prose-invert"
								dangerouslySetInnerHTML={{ __html: data.description }}
							/>
						)}

					</div>
				)
			}

			case 'leadership': {
				if (isLoadingPersons) {
					return <div className="text-muted-foreground text-sm py-6">Загрузка...</div>
				}
				if (leadership.length === 0) {
					return <PlaceholderContent title="Руководство" />
				}
				return (
					<div className="grid gap-4 lg:grid-cols-2">
						{leadership.map(person => (
							<PersonCard key={person.id} person={person} />
						))}
					</div>
				)
			}

			case 'teachers': {
				if (isLoadingPersons) {
					return <div className="text-muted-foreground text-sm py-6">Загрузка...</div>
				}
				if (teachers.length === 0) {
					return <PlaceholderContent title="Педагогический состав" />
				}
				return (
					<div className="grid gap-4 lg:grid-cols-2">
						{teachers.map(person => (
							<PersonCard key={person.id} person={person} />
						))}
					</div>
				)
			}

			case 'structure':
				return <OrganizationStructure />
			case 'biography':
				return (
					<div className="rounded-2xl border bg-card p-6 sm:p-8">
						<h3 className="text-lg font-semibold mb-6">Григорий Ильич Шварц (1924–2010)</h3>
						<div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
							<p>
								Григорий Ильич Шварц — советский и российский тренер по фехтованию, заслуженный тренер РСФСР (1960), заслуженный тренер СССР (1964). Организатор и первый директор Саратовской детско-юношеской спортивной школы олимпийского резерва по фехтованию.
							</p>
							<p>
								Родился 16 марта 1924 года в Саратове. Вырос в многодетной семье в Глебучевом овраге. С 1940 года серьёзно занялся фехтованием у тренера Н. Акимова, бывшего офицера царской армии. В 1942 году окончил Саратовский техникум физической культуры и был призван в армию.
							</p>
							<p>
								Участник Великой Отечественной войны — оборона Кавказа (1942–1944), Курская битва. Награждён орденом Отечественной войны и медалями. В 1958 году заочно окончил Московский институт физической культуры.
							</p>
							<p>
								Подготовил олимпийских чемпионов и заслуженных мастеров спорта — Юрия Сисикина, Валентину Прудскову, Юрия Шарова, Евгения Нефёдова, а также около 40 мастеров спорта по фехтованию.
							</p>
							<p>
								С 2002 года в Саратове ежегодно проводится турнир на кубок имени Г.И. Шварца. 16 марта 2011 года на доме, в котором жил тренер, была установлена мемориальная доска.
							</p>
						</div>
					</div>
				)
			case 'vacancies':
				return <PlaceholderContent title="Вакансии" />
			case 'programs':
				return <PlaceholderContent title="Образование" />
			case 'paid-services':
				return <PlaceholderContent title="Платные образовательные услуги" />
			case 'admission':
				return <PlaceholderContent title="Вакантные места для приёма" />
			case 'scholarships':
				return (
					<div className="rounded-xl border bg-card p-6 text-center">
						<h3 className="font-medium text-lg mb-2">Стипендии и меры поддержки обучающихся</h3>
						<p className="text-sm text-muted-foreground">Отсутствуют</p>
					</div>
				)
			case 'catering':
				return (
					<div className="rounded-xl border bg-card p-6 text-center">
						<h3 className="font-medium text-lg mb-2">Организация питания</h3>
						<p className="text-sm text-muted-foreground">Не предусмотрено</p>
					</div>
				)
			case 'accessibility': {
				const accessibilityData = [
					{ question: 'Наличие специально оборудованных учебных кабинетов', answer: 'Не имеется' },
					{ question: 'Наличие объектов для проведения практических занятий, приспособленных для использования инвалидами и лицами с ограниченными возможностями здоровья', answer: 'Не имеется' },
					{ question: 'Наличие библиотеки, приспособленной для использования инвалидами и лицами с ограниченными возможностями здоровья', answer: 'Не имеется' },
					{ question: 'Наличие объектов спорта, приспособленных для использования инвалидами и лицами с ограниченными возможностями здоровья', answer: 'Не имеется' },
					{ question: 'Наличие средств обучения и воспитания, приспособленных для использования инвалидами и лицами с ограниченными возможностями здоровья', answer: 'Не имеется' },
					{ question: 'Обеспечение беспрепятственного доступа в здание образовательной организации', answer: 'Не имеется' },
					{ question: 'Наличие специальных условий питания', answer: 'Не предусмотрено' },
					{ question: 'Обеспечение специальных условий охраны здоровья', answer: 'Не предусмотрено' },
					{ question: 'Наличие доступа к информационным системам и информационно-телекоммуникационным сетям, приспособленным для использования инвалидами и лицами с ограниченными возможностями здоровья', answer: 'Не предусмотрено' },
					{ question: 'Наличие электронных образовательных ресурсов, к которым обеспечивается доступ инвалидов и лиц с ограниченными возможностями здоровья', answer: 'Не имеется' },
					{ question: 'Наличие специальных технических средств обучения коллективного и индивидуального пользования', answer: 'Не имеется' },
					{ question: 'Наличие условий для беспрепятственного доступа в общежитие, интернат', answer: 'Не предусмотрено' },
					{ question: 'Количество жилых помещений в общежитии, интернате, приспособленных для использования инвалидами и лицами с ограниченными возможностями здоровья', answer: 'Не предусмотрено' }
				]

				return (
					<div className="rounded-xl border bg-card">
						<Accordion type="single" collapsible className="w-full">
							{accessibilityData.map((item, index) => (
								<AccordionItem key={index} value={`item-${index}`} className="px-6">
									<AccordionTrigger>{item.question}</AccordionTrigger>
									<AccordionContent className="text-muted-foreground">
										{item.answer}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				)
			}
			case 'documents':
				return <PlaceholderContent title="Документы" />
			case 'state-task':
				return <PlaceholderContent title="Госзадание" />
			case 'financial-activity':
				return <PlaceholderContent title="Финансово-хозяйственная деятельность" />
			case 'anti-corruption':
				return <PlaceholderContent title="Реализация антикоррупционной политики" />
			case 'federal-standard':
				return <PlaceholderContent title="Федеральный стандарт СП" />
			case 'international':
				return <PlaceholderContent title="Международное сотрудничество" />

			default:
				return null
		}
	}

	const renderDesktopSectionContent = () => {
		if (currentSubsection) {
			return renderSubsectionContent()
		}
		if (!currentSectionData) return null
		return (
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{currentSectionData.subsections.map(subsection => {
					const Icon = subsection.icon
					return (
						<button
							key={subsection.id}
							type="button"
							onClick={() => handleSubsectionSelect(currentSection, subsection.id as SubsectionId)}
							className="flex items-center gap-4 rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20 text-left"
						>
							<Icon className="size-10 shrink-0 text-primary" strokeWidth={1.5} />
							<span className="text-sm font-medium">{subsection.name}</span>
						</button>
					)
				})}
			</div>
		)
	}

	const mobileSubsectionTitle = currentSubsection
		? SECTIONS.flatMap(s => s.subsections).find(s => s.id === currentSubsection)?.name
		: null

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

					{/* Mobile: accordion or subsection content */}
					<div className="lg:hidden">
						{currentSubsection ? (
							<div className="space-y-4">
								<button
									type="button"
									onClick={handleBack}
									className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									<ChevronLeft className="size-4" />
									{parentSection?.name ?? 'Назад'}
								</button>
								{mobileSubsectionTitle && (
									<h2 className="text-xl font-semibold">{mobileSubsectionTitle}</h2>
								)}
								{renderSubsectionContent()}
							</div>
						) : (
							<Accordion type="multiple" className="border rounded-xl">
								{SECTIONS.map(section => {
									const SectionIcon = section.icon
									return (
										<AccordionItem key={section.id} value={section.id} className="border-b last:border-b-0">
											<AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
												<div className="flex items-center gap-3">
													<SectionIcon className="size-4 text-primary shrink-0" />
													<span>{section.name}</span>
												</div>
											</AccordionTrigger>
											<AccordionContent className="px-4 pb-3 pt-0">
												<div className="space-y-0.5">
													{section.subsections.map(subsection => {
														const SubIcon = subsection.icon
														return (
															<button
																key={subsection.id}
																type="button"
																onClick={() => handleSubsectionSelect(section.id, subsection.id as SubsectionId)}
																className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground text-left"
															>
																<SubIcon className="size-4 shrink-0" />
																<span>{subsection.name}</span>
															</button>
														)
													})}
												</div>
											</AccordionContent>
										</AccordionItem>
									)
								})}
							</Accordion>
						)}
					</div>

					{/* Desktop: sidebar + content */}
					<div className="hidden lg:grid gap-6 lg:grid-cols-[280px_1fr]">
						<div className="space-y-1">
							{SECTIONS.map(section => {
								const isActive = section.id === currentSection
								const Icon = section.icon
								return (
									<button
										key={section.id}
										type="button"
										aria-pressed={isActive}
										onClick={() => handleSectionSelect(section.id)}
										className={cn(
											'w-full text-left rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border flex items-center gap-3',
											isActive
												? 'bg-primary/10 text-primary border-primary/20'
												: 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
										)}
									>
										<Icon className="size-4 shrink-0" />
										{section.name}
									</button>
								)
							})}
						</div>
						<div>{renderDesktopSectionContent()}</div>
					</div>
				</div>
			</main>
		</div>
	)
}
