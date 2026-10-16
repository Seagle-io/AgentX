import type { InputHTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"

type InputVariant = "default" | "error"
type InputSize = "sm" | "default"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	variant?: InputVariant
	// `inputSize` et non `size` : `size` est un attribut natif de `<input>`
	// (largeur en caractères) qu'on laisse passer tel quel.
	inputSize?: InputSize
}

const variants: Record<InputVariant, string> = {
	default: "border-border focus-visible:border-accent",
	error: "border-error focus-visible:border-error",
}

const sizes: Record<InputSize, string> = {
	sm: "h-8 px-2 text-xs",
	default: "h-10 px-3 text-sm",
}

// Désactivé visible (opacité, curseur barré) sans `pointer-events-none`, qui
// ferait tomber le curseur et l'infobulle `title` expliquant le blocage.
const base =
	"w-full rounded-control border bg-bg text-text placeholder:text-text-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-bg disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50"

const Input = ({
	variant = "default",
	inputSize = "default",
	className,
	...props
}: InputProps) => (
	<input
		className={cn(
			base,
			variants[variant] ?? variants.default,
			sizes[inputSize] ?? sizes.default,
			className,
		)}
		{...props}
	/>
)

export default Input
export type { InputSize, InputVariant }
