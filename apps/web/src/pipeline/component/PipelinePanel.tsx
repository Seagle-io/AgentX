import type { CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { selectPipeline } from "@/pipeline/script/select"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"

// 3 statuts teintés ; autres ⇒ accent
const tones: Record<string, string> = {
	bloque: "bg-error",
	revue: "bg-warning",
	fait: "bg-success",
}

const PipelinePanel = () => {
	const { t } = useTranslation("pipeline")
	const slug = useSalleUi(selectFloor)
	const { data } = useSalleState(slug, selectPipeline)
	const { data: total = 0 } = useSalleState(
		slug,
		(s) => s.immeuble.etages.find((e) => e.slug === slug)?.total ?? 0,
	)
	const bars = data?.bars ?? []
	const somme = bars.reduce((n, b) => n + b.n, 0)
	return (
		<Panel padding="sm" className="flex min-w-0 flex-col gap-2 overflow-hidden">
			<div className="flex justify-between">
				<Text variant="h3">{t("title")}</Text>
				<Text variant="mono" as="span">
					{total}
				</Text>
			</div>
			<div className="flex h-1.5 gap-px overflow-hidden rounded-full bg-surface-2">
				{bars.map((bar) => (
					<span
						key={bar.k}
						title={`${t(`k.${bar.k}`, { defaultValue: bar.k })} · ${bar.n}`}
						className={`h-full w-[var(--w)] ${tones[bar.k] ?? "bg-accent"}`}
						style={
							{
								"--w": `${somme === 0 ? 0 : (bar.n / somme) * 100}%`,
							} as CSSProperties
						}
					/>
				))}
			</div>
			<ul className="grid min-h-0 grid-cols-1 gap-x-2 gap-y-1 overflow-auto">
				{bars.map((bar) => (
					<li key={bar.k} className="flex min-w-0 items-center gap-1.5">
						<span
							aria-hidden
							className={`size-[7px] shrink-0 rounded-sm ${tones[bar.k] ?? "bg-accent"}`}
						/>
						<Text
							as="span"
							variant="caption"
							title={t(`k.${bar.k}`, { defaultValue: bar.k })}
							className="min-w-0 flex-1 truncate whitespace-nowrap"
						>
							{t(`k.${bar.k}`, { defaultValue: bar.k })}
						</Text>
						<Text as="span" variant="mono">
							{bar.n}
						</Text>
					</li>
				))}
			</ul>
		</Panel>
	)
}

export default PipelinePanel
