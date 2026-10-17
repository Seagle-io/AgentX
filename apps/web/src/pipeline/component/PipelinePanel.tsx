import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { type Bar, selectPipeline } from "@/pipeline/script/select"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Gauge, { type GaugeTone } from "@/shared/ui/gauge"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"

// 3 statuts teintés ; autres ⇒ accent
const tones: Record<string, GaugeTone> = {
	bloque: "error",
	revue: "warning",
	fait: "success",
}

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

const PipelinePanel = () => {
	const { t } = useTranslation("pipeline")
	const slug = useSalleUi(selectFloor)
	const { data } = useSalleState(slug, selectPipeline)
	const bars = data?.bars ?? []
	return (
		<Panel className="min-w-0">
			<Text variant="h3">{t("title")}</Text>
			<ul className="flex min-w-0 items-end justify-between gap-2 overflow-x-auto">
				{bars.map((bar) => (
					<PipelineBar key={bar.k} bar={bar} />
				))}
			</ul>
		</Panel>
	)
}

export default PipelinePanel
