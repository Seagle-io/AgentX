import { useTranslation } from "react-i18next"
import Gauge from "@/shared/ui/gauge"
import Text from "@/shared/ui/text"

type Tone = "accent" | "success" | "warning" | "error" | "muted"

// Un ton par valeur : 5 tons × 5 valeurs lus d'un coup, horizontal et vertical.
const SAMPLES: { tone: Tone; value: number }[] = [
	{ tone: "accent", value: 0 },
	{ tone: "success", value: 0.25 },
	{ tone: "warning", value: 0.5 },
	{ tone: "error", value: 0.75 },
	{ tone: "muted", value: 1 },
]

// Ligne horizontale : légende à largeur fixe pour aligner les jauges.
const Row = ({
	caption,
	value,
	tone,
	label,
}: {
	caption: string
	value: number
	tone?: Tone
	label: string
}) => (
	<div className="flex items-center gap-3">
		<Text variant="mono" className="w-32">
			{caption}
		</Text>
		<Gauge value={value} tone={tone} label={label} />
	</div>
)

// Barre verticale : valeur affichée sous la jauge.
const Bar = ({
	value,
	tone,
	label,
}: {
	value: number
	tone: Tone
	label: string
}) => (
	<div className="flex h-full flex-col items-center gap-2">
		<Gauge value={value} tone={tone} orientation="vertical" label={label} />
		<Text variant="mono">{value}</Text>
	</div>
)

const GaugeSection = () => {
	const { t } = useTranslation("showcase")
	return (
		<section
			id="gauge"
			aria-labelledby="gauge-title"
			className="w-full max-w-4xl"
		>
			<Text id="gauge-title" className="mb-4" variant="h2">
				{t("sections.gauge")}
			</Text>
			<div className="grid gap-8 lg:grid-cols-2">
				<div className="flex flex-col gap-3">
					<Text variant="caption">horizontal</Text>
					{SAMPLES.map(({ tone, value }) => (
						<Row
							key={tone}
							caption={`${tone} ${value}`}
							value={value}
							tone={tone}
							label={t("gauge.label", { tone })}
						/>
					))}
				</div>
				<div className="flex flex-col gap-3">
					<Text variant="caption">vertical</Text>
					<div className="flex h-32 items-end gap-6">
						{SAMPLES.map(({ tone, value }) => (
							<Bar
								key={tone}
								value={value}
								tone={tone}
								label={t("gauge.label", { tone })}
							/>
						))}
					</div>
				</div>
				<div className="flex flex-col gap-3">
					<Text variant="caption">clamp</Text>
					<Row
						caption={t("gauge.nan")}
						value={Number.NaN}
						label={t("gauge.nan")}
					/>
					<Row
						caption={t("gauge.over")}
						value={2}
						tone="success"
						label={t("gauge.over")}
					/>
				</div>
			</div>
		</section>
	)
}

export default GaugeSection
