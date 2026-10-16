import { createElement, type HTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"

type TextVariant = "h1" | "h2" | "h3" | "body" | "muted" | "mono" | "caption"
type TextTag = "h1" | "h2" | "h3" | "p" | "span" | "code"

type TextProps = HTMLAttributes<HTMLElement> & {
	variant?: TextVariant
	// `as` force la balise sans changer le style : un titre visuel dans une
	// carte reste un `span` pour ne pas casser la hiérarchie des `h*`.
	as?: "p" | "span" | "div" | "code"
}

const variants: Record<TextVariant, string> = {
	h1: "font-heading text-2xl font-semibold tracking-tight text-text",
	h2: "font-heading text-xl font-semibold text-text",
	h3: "font-heading text-base font-medium text-text",
	body: "text-sm text-text",
	muted: "text-sm text-text-muted",
	mono: "font-mono text-xs text-text",
	caption: "text-xs uppercase tracking-wide text-text-muted",
}

// Balise par défaut de chaque variante ; `mono` en `code` pour que le lecteur
// d'écran annonce du code, `caption` en `span` car souvent posé en ligne.
const tags: Record<TextVariant, TextTag> = {
	h1: "h1",
	h2: "h2",
	h3: "h3",
	body: "p",
	muted: "p",
	mono: "code",
	caption: "span",
}

const Text = ({ variant = "body", as, className, ...props }: TextProps) => {
	// Variante inconnue (valeur venue de l'API) ⇒ corps de texte, jamais de
	// classe `undefined` ni de balise invalide.
	const key: TextVariant = variant in variants ? variant : "body"
	return createElement(as ?? tags[key], {
		className: cn(variants[key], className),
		...props,
	})
}

export default Text
export type { TextVariant }
