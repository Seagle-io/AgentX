import type { HTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"

type PanelVariant = "default" | "subtle" | "alert"
type PanelPadding = "none" | "sm" | "default"

type PanelProps = HTMLAttributes<HTMLElement> & {
	variant?: PanelVariant
	padding?: PanelPadding
}

const variants: Record<PanelVariant, string> = {
	default: "border-border bg-bg-panel",
	// `subtle` se fond dans la page : même fond qu'elle (`surface`), bordure
	// à peine marquée, pour les blocs secondaires d'un aside.
	subtle: "border-border-subtle bg-surface",
	alert: "border-error bg-bg-panel",
}

// `none` laisse l'appelant poser un en-tête collé au bord (liste, tableau).
const paddings: Record<PanelPadding, string> = {
	none: "",
	sm: "p-3",
	default: "p-4",
}

const base = "rounded-control border"

const Panel = ({
	variant = "default",
	padding = "default",
	className,
	...props
}: PanelProps) => (
	<section
		className={cn(
			base,
			variants[variant] ?? variants.default,
			paddings[padding] ?? paddings.default,
			className,
		)}
		{...props}
	/>
)

export default Panel
export type { PanelPadding, PanelVariant }
