import type { HTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"

type GaugeTone = "accent" | "success" | "warning" | "error" | "muted"
type GaugeOrientation = "horizontal" | "vertical"

type GaugeProps = HTMLAttributes<HTMLDivElement> & {
	/** 0..1 ; clampé, `NaN` ⇒ 0 */
	value: number
	tone?: GaugeTone
	orientation?: GaugeOrientation
	/** `aria-label` : la jauge n'a aucun texte visible */
	label: string
}

const tones: Record<GaugeTone, string> = {
	accent: "bg-accent",
	success: "bg-success",
	warning: "bg-warning",
	error: "bg-error",
	muted: "bg-text-muted",
}

// Vertical : la barre monte depuis le bas (`items-end`), comme un niveau.
const tracks: Record<GaugeOrientation, string> = {
	horizontal: "h-2 w-full",
	vertical: "flex h-full w-2 items-end",
}

const fills: Record<GaugeOrientation, string> = {
	horizontal: "h-full",
	vertical: "w-full",
}

// Contour : la piste `bg-surface` seule est quasi invisible sur le panel (≈1,1:1)
const base = "overflow-hidden rounded-control border border-border bg-surface"

// Transition sur la dimension seulement : aucune animation infinie dans le kit
// hors `Badge pulse` (budget § Performance), la jauge glisse vers sa valeur.
const fillBase = "rounded-control transition-[width,height] duration-300"

const clamp = (value: number): number =>
	Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value))

const Gauge = ({
	value,
	tone = "accent",
	orientation = "horizontal",
	label,
	className,
	...props
}: GaugeProps) => {
	const ratio = clamp(value)
	const axis: GaugeOrientation =
		orientation in tracks ? orientation : "horizontal"
	const size = `${Math.round(ratio * 100)}%`

	return (
		// `role="meter"` plutôt que `<meter>` : l'élément natif impose son rendu
		// (barre système non stylable par les tokens, pas de vertical).
		// biome-ignore lint/a11y/useSemanticElements: <meter> natif non stylable (tokens, vertical)
		<div
			role="meter"
			aria-valuemin={0}
			aria-valuemax={1}
			aria-valuenow={ratio}
			aria-label={label}
			className={cn(base, tracks[axis], className)}
			{...props}
		>
			<div
				className={cn(fillBase, fills[axis], tones[tone] ?? tones.accent)}
				style={axis === "horizontal" ? { width: size } : { height: size }}
			/>
		</div>
	)
}

export default Gauge
export type { GaugeOrientation, GaugeTone }
