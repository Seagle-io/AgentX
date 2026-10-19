import { useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/button"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"
import { type Sample, viewBox } from "@/showcase/component/salle/samples"

const THEMES = ["dark", "light"] as const

type Props = {
	sample: Sample
	validated: boolean
	onToggle: (id: string) => void
}

// SVG v1 inséré tel quel : chaîne construite par `@/engine/svg`, 0
// donnée utilisateur. `max-w-full` + `h-auto` : à ×3 la vignette se réduit
// dans sa colonne au lieu de déborder.
const Scene = ({ sample, scale }: { sample: Sample; scale: number }) => {
	const [x, y, w, h] = viewBox(sample.box)
	const html = sample.tower
		? `<g class="v1-tour">${sample.svg}</g>`
		: sample.svg
	return (
		<svg
			className="v1-scene h-auto max-w-full"
			viewBox={`${x} ${y} ${w} ${h}`}
			width={w * scale}
			height={h * scale}
			aria-hidden="true"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG v1 constant, 0 donnée utilisateur
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	)
}

const Vignette = ({ sample, validated, onToggle }: Props) => {
	const { t } = useTranslation("showcase")
	const [scale, setScale] = useState(3)
	const [, , w, h] = viewBox(sample.box)
	const inputId = `sv-${sample.id}`
	return (
		<Panel padding="sm" className="flex flex-col gap-3" aria-label={sample.id}>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<Text variant="mono">{sample.fn}</Text>
				<Text variant="caption">{sample.state}</Text>
				<Text variant="muted">
					{t("salle.size", { w: Math.round(w), h: Math.round(h) })}
				</Text>
				<div className="ml-auto flex flex-wrap items-center gap-2">
					{[1, 3].map((s) => (
						<Button
							key={s}
							// `outline` et non `ghost` : texte muted du ghost à 3.66:1 en clair
							variant={scale === s ? "primary" : "outline"}
							size="sm"
							aria-pressed={scale === s}
							onClick={() => setScale(s)}
						>
							×{s}
						</Button>
					))}
					<label
						htmlFor={inputId}
						className="flex min-h-8 cursor-pointer items-center gap-2"
					>
						<input
							id={inputId}
							type="checkbox"
							className="size-4 accent-accent"
							checked={validated}
							onChange={() => onToggle(sample.id)}
						/>
						<Text as="span">{t("salle.valid")}</Text>
					</label>
				</div>
			</div>
			<div className="grid gap-2 sm:grid-cols-2">
				{THEMES.map((theme) => (
					<div
						key={theme}
						data-color-theme="main"
						data-theme={theme}
						className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-control border border-border bg-bg p-3"
					>
						<Scene sample={sample} scale={scale} />
						<Text variant="caption">{t(`salle.${theme}`)}</Text>
					</div>
				))}
			</div>
		</Panel>
	)
}

export default Vignette
