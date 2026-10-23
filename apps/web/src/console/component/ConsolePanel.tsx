import { useTranslation } from "react-i18next"
import { useRunCommand, useSalleState } from "@/api/state/hooks"
import RunOutput from "@/console/component/RunOutput"
import TaskActions from "@/console/component/TaskActions"
import { pilotActions, selectConsole } from "@/console/script/actions"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Button from "@/shared/ui/button"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"

const statutTone = (statut: string): string => {
	switch (statut) {
		case "bloque":
			return "bg-error"
		case "revue":
			return "bg-warning"
		case "fait":
			return "bg-success"
		case "en-cours":
			return "bg-accent"
		default:
			return "bg-border"
	}
}

const ConsolePanel = () => {
	const { t } = useTranslation("console")
	const slug = useSalleUi(selectFloor)
	const { data } = useSalleState(slug, selectConsole)
	const run = useRunCommand(slug)
	const pilotable = data?.pilotable ?? false
	return (
		<Panel padding="none" className="flex min-w-0 flex-col overflow-hidden">
			<div className="flex min-w-0 items-center gap-1 border-b border-border-subtle px-1.5 py-1.5">
				<Text variant="h3" className="sr-only">
					{t("title")}
				</Text>
				<div className="flex min-w-0 flex-1 gap-0.5">
					{pilotActions(data?.projet ?? slug).map(({ k, body }) => (
						<Button
							key={k}
							variant="secondary"
							size="sm"
							className="h-[22px] shrink-0 px-1 text-[11px]"
							disabled={!pilotable || run.isPending}
							onClick={() => run.mutate({ body, scope: "projet" })}
						>
							{t(`pilot.${k}`)}
						</Button>
					))}
				</div>
			</div>
			<section
				// biome-ignore lint/a11y/noNoninteractiveTabindex: zone défilante au clavier (WCAG 2.1.1)
				tabIndex={0}
				aria-label={t("listLabel")}
				className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 py-1"
			>
				<ul className="flex flex-col">
					{(data?.taches ?? []).map((tache) => (
						<li
							key={tache.id}
							title={`${tache.statut} · ${tache.role}`}
							className="flex h-7 min-w-0 items-center gap-1.5 rounded-control px-1 hover:bg-surface"
						>
							<span
								role="img"
								aria-label={tache.statut}
								title={tache.statut}
								className={`size-2 shrink-0 rounded-full ${statutTone(tache.statut)}`}
							/>
							<Text variant="mono" className="shrink-0">
								{tache.id}
							</Text>
							<Text
								variant="body"
								title={tache.titre}
								className="min-w-0 flex-1 truncate"
							>
								{tache.titre}
							</Text>
							<Text variant="caption" className="max-w-12 shrink truncate">
								{tache.role}
							</Text>
							<div className="shrink-0 [&>div]:flex-nowrap [&_button]:h-[22px] [&_button]:whitespace-nowrap [&_button]:px-1 [&_button]:text-[11px] [&_input]:h-[22px] [&_input]:w-28">
								<TaskActions tache={tache} />
							</div>
						</li>
					))}
				</ul>
				<div className="flex flex-col">
					{(data?.journal ?? []).slice(-9).map((ligne) => (
						<Text key={ligne} variant="caption">
							{ligne}
						</Text>
					))}
				</div>
				<RunOutput />
			</section>
		</Panel>
	)
}

export default ConsolePanel
