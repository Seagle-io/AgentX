import type { HTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"

type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "error"
type BadgeSize = "sm" | "default"

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
	variant?: BadgeVariant
	size?: BadgeSize
	// Seule animation infinie du kit : l'appelant limite le nombre de badges
	// pulsés à l'écran (budget § Performance du contrat), pas le composant.
	pulse?: boolean
}

// Teinte en bordure + texte, fond neutre : `success`/`warning`/`error` sont des
// couleurs pleines sans token « on », un libellé posé dessus n'aurait pas de
// contraste garanti selon le thème.
const variants: Record<BadgeVariant, string> = {
	neutral: "border-border-subtle bg-surface text-text-muted",
	accent: "border-accent bg-accent-bg text-accent",
	success: "border-success text-success",
	warning: "border-warning text-warning",
	error: "border-error text-error",
}

const sizes: Record<BadgeSize, string> = {
	sm: "h-5 px-1.5 text-xs",
	default: "h-6 px-2.5 text-xs",
}

const base =
	"inline-flex items-center gap-1 whitespace-nowrap rounded-control border font-medium"

const Badge = ({
	variant = "neutral",
	size = "default",
	pulse = false,
	className,
	...props
}: BadgeProps) => (
	<span
		className={cn(
			base,
			variants[variant] ?? variants.neutral,
			sizes[size] ?? sizes.default,
			pulse && "animate-pulse",
			className,
		)}
		{...props}
	/>
)

export default Badge
export type { BadgeSize, BadgeVariant }
