import { createFileRoute } from '@tanstack/react-router'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'

export const Route = createFileRoute('/docs/rules')({
	component: DocsRules,
	head: () => ({
		meta: [
			{
				title: 'Правила и регламенты - Документы'
			}
		]
	})
})

function DocsRules() {
	return (
		<main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			<div className="w-full space-y-6 sm:space-y-8">
				<div className="space-y-2 sm:space-y-4">
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
						Правила и регламенты
					</h1>
					<p className="text-base sm:text-lg text-muted-foreground">
						Правила фехтования, регламенты соревнований и судейские правила
					</p>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Правила фехтования</CardTitle>
							<CardDescription>Официальные правила вида спорта</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Официальные правила фехтования, утвержденные Международной
								федерацией фехтования (FIE). Правила охватывают все три вида
								оружия: рапиру, шпагу и саблю. Включают технические требования к
								экипировке, правилам ведения боя и подсчета очков.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Регламенты соревнований</CardTitle>
							<CardDescription>Правила проведения соревнований</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Регламенты проведения соревнований от регионального до
								международного уровня. Положения о турнирах, чемпионатах и
								первенствах с указанием требований к участникам. Правила
								регистрации, жеребьевки и проведения соревновательных поединков.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Судейские правила</CardTitle>
							<CardDescription>Правила судейства</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Правила судейства и инструкции для главных судей и судей на
								дорожке. Критерии оценки технических действий, правила остановки
								боя и принятия решений. Требования к квалификации судей и
								порядок прохождения судейской аттестации.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	)
}
