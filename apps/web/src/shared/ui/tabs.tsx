import { type KeyboardEvent, useRef } from "react"
import { cn } from "@/shared/lib/utils"

export type Teinte = "accent" | "success" | "warning" | "error"

export type TabItem = { cle: string; libelle: string; teinte: Teinte }

type TabsProps = {
	label: string
	items: TabItem[]
	actif: string
	onSelect: (cle: string) => void
	disabled?: boolean
	className?: string
}

// Classes statiques par teinte : Tailwind ne génère pas `text-${teinte}`.
const actifClasses: Record<Teinte, string> = {
	accent: "text-accent border-accent",
	success: "text-success border-success",
	warning: "text-warning border-warning",
	error: "text-error border-error",
}

const pastilles: Record<Teinte, string> = {
	accent: "bg-accent",
	success: "bg-success",
	warning: "bg-warning",
	error: "bg-error",
}

const base =
	"inline-flex min-h-6 items-center gap-2 border-b-2 px-3 py-1 text-xs transition-colors cursor-pointer aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

// Activation manuelle : les flèches déplacent le focus, Entrée/Espace (clic natif
// du bouton) sélectionnent. Désactivé = `aria-disabled`, pas `disabled` ni
// `pointer-events-none` : l'onglet reste focalisable et garde son curseur barré.
const Tabs = ({
	label,
	items,
	actif,
	onSelect,
	disabled,
	className,
}: TabsProps) => {
	const refs = useRef<(HTMLButtonElement | null)[]>([])

	const onKeyDown = (e: KeyboardEvent, i: number) => {
		if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
		e.preventDefault()
		const pas = e.key === "ArrowRight" ? 1 : -1
		refs.current[(i + pas + items.length) % items.length]?.focus()
	}

	return (
		<div
			role="tablist"
			aria-label={label}
			className={cn("flex min-w-0 flex-wrap items-center", className)}
		>
			{items.map((it, i) => {
				const selectionne = it.cle === actif
				return (
					<button
						key={it.cle}
						ref={(el) => {
							refs.current[i] = el
						}}
						type="button"
						role="tab"
						aria-selected={selectionne}
						aria-disabled={disabled || undefined}
						tabIndex={selectionne ? 0 : -1}
						className={cn(
							base,
							selectionne
								? cn("font-semibold", actifClasses[it.teinte])
								: "border-transparent text-text-muted hover:text-text",
						)}
						onClick={() => {
							if (!disabled && !selectionne) onSelect(it.cle)
						}}
						onKeyDown={(e) => onKeyDown(e, i)}
					>
						{!selectionne && (
							<span
								aria-hidden="true"
								className={cn("size-2 rounded-full", pastilles[it.teinte])}
							/>
						)}
						{it.libelle}
					</button>
				)
			})}
		</div>
	)
}

export default Tabs
