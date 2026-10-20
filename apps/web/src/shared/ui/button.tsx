import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"

type ButtonVariant =
	| "primary"
	| "secondary"
	| "destructive"
	| "warning"
	| "outline"
	| "ghost"
	| "link"
type ButtonSize = "sm" | "default" | "lg" | "icon"

type BaseProps = {
	variant?: ButtonVariant
	size?: ButtonSize
	className?: string
}

type AsButton = BaseProps &
	ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AsAnchor = BaseProps &
	AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

type ButtonProps = AsButton | AsAnchor

const variants: Record<ButtonVariant, string> = {
	// `accent-solid`/`accent-on` et non `accent`/white : en thème sombre l'accent
	// est une couleur claire, qui donne un aplat éblouissant et du blanc illisible
	// par-dessus. Les tokens dédiés basculent alors sur un fond sourd et un
	// libellé en accent (cf. index.css).
	primary:
		"bg-accent-solid text-accent-on not-disabled:hover:bg-accent-solid-hover",
	// `bg-panel` et non `bg-surface` : `--color-surface` est un alias de
	// `--color-bg` dans tous les thèmes sauf le contraste élevé, le bouton avait
	// donc exactement la couleur de la page et ne tenait que par sa bordure.
	secondary:
		"bg-bg-panel text-text border border-border shadow-sm not-disabled:hover:bg-bg",
	// Survol par opacité et non par une teinte brute (`red-600`) : le kit ne
	// connaît que les tokens, et `error` n'a pas de variante foncée.
	destructive: "bg-error text-text not-disabled:hover:opacity-90",
	// Action à confirmer, sans être destructive : poser deux consultations à la
	// même heure se défait, contrairement à une suppression. Même triplet que
	// `primary` — l'ambre vif ne supporte pas de libellé blanc.
	warning:
		"bg-warning-solid text-warning-on not-disabled:hover:bg-warning-solid-hover",
	outline: "border border-border text-text not-disabled:hover:bg-surface",
	ghost:
		"text-text-muted not-disabled:hover:text-text not-disabled:hover:bg-surface",
	link: "text-accent not-disabled:hover:underline underline-offset-4",
}

const sizes: Record<ButtonSize, string> = {
	sm: "h-10 px-3 text-xs",
	default: "h-10 px-4 text-sm",
	lg: "h-12 px-6 text-base",
	icon: "h-10 w-10",
}

// `gap-2` : dans un conteneur flex, l'espace écrit dans le JSX entre l'icône et
// le libellé est supprimé par la mise en page — sans gap, les deux se touchent.
//
// L'état désactivé se voit : sans lui, un bouton bloqué gardait l'aplat plein,
// le curseur main et le survol de sa variante — on ne le distinguait d'un
// bouton actif qu'en cliquant, et le clic ne répondait pas. D'où le trio
// opacité / curseur barré / survol neutralisé (`not-disabled:hover:` dans
// chaque variante). Pas de `pointer-events-none` : il ferait tomber le curseur
// barré et l'infobulle `title` qui dit *pourquoi* le bouton est bloqué.
const base =
	"inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-control cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:saturate-50"

const Button = ({
	variant = "primary",
	size = "default",
	children,
	className,
	...props
}: ButtonProps) => {
	const classes = cn(base, variants[variant], sizes[size], className)

	if ("href" in props && props.href !== undefined) {
		return (
			<a
				className={classes}
				{...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
			>
				{children}
			</a>
		)
	}

	return (
		<button
			className={classes}
			{...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
		>
			{children}
		</button>
	)
}

export default Button
