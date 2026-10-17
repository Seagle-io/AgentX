import type { SVGProps } from "react"
import { cn } from "@/shared/lib/utils"
import { ICONS, type IconName } from "@/shared/ui/icon/registry"

type IconSize = "sm" | "md" | "lg"

type IconProps = SVGProps<SVGSVGElement> & {
	name: IconName | string
	size?: IconSize
	// `title` ⇒ icône porteuse de sens (annoncée) ; sans lui elle est
	// décorative et masquée aux lecteurs d'écran.
	title?: string
}

const sizes: Record<IconSize, string> = {
	sm: "h-4 w-4",
	md: "h-5 w-5",
	lg: "h-6 w-6",
}

// Repère centré et trait au lieu d'un remplissage : les glyphes du registre
// sont des dessins au trait (`GLYPHES` de la v1), le trait prend la couleur
// du texte via `currentColor`.
const svgBase = {
	viewBox: "-8 -8 16 16",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.4,
	strokeLinecap: "round",
	strokeLinejoin: "round",
} satisfies SVGProps<SVGSVGElement>

const Icon = ({ name, size = "md", title, className, ...props }: IconProps) => {
	// Nom inconnu (clé venue de l'API) ⇒ glyphe « résultat », jamais un SVG vide.
	const d = ICONS[name] ?? ICONS.resultat
	const classes = cn("shrink-0", sizes[size] ?? sizes.md, className)

	// Deux branches plutôt qu'un attribut conditionnel : le lint a11y veut voir
	// statiquement soit `aria-hidden`, soit un `<title>` non vide.
	if (title === undefined) {
		return (
			<svg {...svgBase} className={classes} aria-hidden="true" {...props}>
				<path d={d} />
			</svg>
		)
	}

	return (
		<svg
			{...svgBase}
			className={classes}
			role="img"
			aria-label={title}
			{...props}
		>
			<title>{title}</title>
			<path d={d} />
		</svg>
	)
}

export default Icon
export { ICONS, type IconName } from "@/shared/ui/icon/registry"
export type { IconSize }
