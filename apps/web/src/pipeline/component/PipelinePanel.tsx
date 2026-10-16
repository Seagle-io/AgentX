import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import type { SalleState } from "@/api/state/schema"
import { type Bar, selectPipeline } from "@/pipeline/script/select"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Badge from "@/shared/ui/badge"
import Gauge, { type GaugeTone } from "@/shared/ui/gauge"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"

// 3 statuts teintés ; autres ⇒ accent
const tones: Record<string, GaugeTone> = {
	bloque: "error",
	revue: "warning",
	fait: "success",
}

type Ligne = SalleState["seuils"]["hard"][number]

const PipelineBar = ({ bar }: { bar: Bar }) => {
	const { t } = useTranslation("pipeline")
	const label = t(`k.${bar.k}`, { defaultValue: bar.k })
	return (
		<li className="flex flex-col items-center gap-1">
			<div className="h-24">
				<Gauge
					orientation="vertical"
					value={bar.ratio}
					tone={tones[bar.k] ?? "accent"}
					label={label}
				/>
			</div>
			<Text as="span" variant="caption">
				{label}
			</Text>
			<Text as="span" variant="mono">
				{bar.n}
			</Text>
		</li>
	)
}

const SeuilsGroupe = ({
	titre,
	lignes,
}: {
	titre: string
	lignes: Ligne[]
}) => (
	<div className="flex flex-col gap-1">
		<Text variant="caption">{titre}</Text>
		<ul className="flex flex-col gap-1">
			{lignes.map((l) => (
				<li key={l.nom} className="flex items-center gap-2">
					<Text as="span" className="flex-1">
						{l.nom}
					</Text>
					<Text as="span" variant="muted">
						{l.seuil}
					</Text>
					<Text as="span" variant="mono">
						{l.valeur}
					</Text>
					<Badge size="sm" variant={l.ok ? "success" : "error"}>
						{l.ok ? "✓" : "✗"}
					</Badge>
				</li>
			))}
		</ul>
	</div>
)

const PipelinePanel = () => {
	const { t } = useTranslation("pipeline")
	const slug = useSalleUi(selectFloor)
	const { data } = useSalleState(slug, selectPipeline)
	const bars = data?.bars ?? []
	const seuils = data?.seuils
	return (
		<Panel>
			<Text variant="h3">{t("title")}</Text>
			<ul className="flex items-end justify-between gap-2">
				{bars.map((bar) => (
					<PipelineBar key={bar.k} bar={bar} />
				))}
			</ul>
			{seuils &&
				(seuils.vide ? (
					<Text variant="muted">{t("empty")}</Text>
				) : (
					<div className="flex flex-col gap-2">
						<SeuilsGroupe titre={t("hard")} lignes={seuils.hard} />
						<SeuilsGroupe titre={t("soft")} lignes={seuils.soft} />
					</div>
				))}
		</Panel>
	)
}

export default PipelinePanel
