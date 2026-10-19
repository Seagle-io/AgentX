import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Badge from "@/shared/ui/badge"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"
import { selectChoix } from "@/todo/script/select"

// Questions posées à l'humain sur l'étage ; lecture seule, rien à 0 question
export default function ChoixPanel() {
	const { t } = useTranslation("todo")
	const slug = useSalleUi(selectFloor)
	const { data: items = [] } = useSalleState(slug, (s) => selectChoix(s, slug))
	if (items.length === 0) return null
	return (
		<Panel variant="alert" data-testid="choix-panel">
			<Text variant="h3">
				{t("choix.title")}{" "}
				<Badge variant="error" size="sm">
					{items.length}
				</Badge>
			</Text>
			<Text variant="muted">{t("choix.hint")}</Text>
			<ol
				aria-label={t("choix.listLabel")}
				className="mt-2 flex flex-col gap-1"
			>
				{items.map((item) => (
					<li key={`${item.projet}:${item.titre}`} className="break-words">
						{item.titre}
					</li>
				))}
			</ol>
		</Panel>
	)
}
