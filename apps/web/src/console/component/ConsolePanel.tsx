import { useTranslation } from "react-i18next"
import { useRunCommand, useSalleState } from "@/api/state/hooks"
import RunOutput from "@/console/component/RunOutput"
import TaskActions from "@/console/component/TaskActions"
import { pilotActions, selectConsole } from "@/console/script/actions"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Badge, { type BadgeVariant } from "@/shared/ui/badge"
import Button from "@/shared/ui/button"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"

const statutVariant = (statut: string): BadgeVariant => {
	switch (statut) {
		case "bloque":
			return "error"
		case "revue":
			return "warning"
		case "fait":
			return "success"
		case "en-cours":
			return "accent"
		default:
			return "neutral"
	}
}

const ConsolePanel = () => {
	const { t } = useTranslation("console")
	const slug = useSalleUi(selectFloor)
	const { data } = useSalleState(slug, selectConsole)
	const run = useRunCommand(slug)
	const pilotable = data?.pilotable ?? false
	return (
		<Panel className="flex min-w-0 flex-col gap-3">
			<Text variant="h3">{t("title")}</Text>
			<div className="flex flex-wrap gap-1">
				{pilotActions(data?.projet ?? slug).map(({ k, body }) => (
					<Button
						key={k}
						variant="secondary"
						size="sm"
						disabled={!pilotable || run.isPending}
						onClick={() => run.mutate({ body, scope: "projet" })}
					>
						{t(`pilot.${k}`)}
					</Button>
				))}
			</div>
			<ul className="flex flex-col gap-1">
				{(data?.taches ?? []).map((tache) => (
					<li
						key={tache.id}
						className="flex min-w-0 flex-wrap items-center gap-2"
					>
						<Badge variant={statutVariant(tache.statut)} size="sm">
							{tache.statut}
						</Badge>
						<Text variant="mono">{tache.id}</Text>
						<Text variant="body" className="min-w-0 flex-1 truncate">
							{tache.titre}
						</Text>
						<Text variant="caption">{tache.role}</Text>
						<TaskActions tache={tache} />
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
		</Panel>
	)
}

export default ConsolePanel
