import { type CSSProperties, useEffect } from "react"
import Poignee from "@/console/component/Poignee"
import Terminal from "@/console/component/Terminal"
import SelecteurChef from "@/salle/component/SelecteurChef"
import {
	selectTerminalLargeur,
	selectTerminalOuvert,
	useSalleUi,
} from "@/shared/lib/store/salle"
import { cn } from "@/shared/lib/utils"

// Tiroir du chef à droite : fermé = hors écran, terminaux gardés montés (xterm conservé)
export default function TiroirChef({
	chef,
	visites,
	slug,
	chefImmeuble,
	onChoisir,
}: {
	chef: string
	visites: string[]
	slug: string | null
	chefImmeuble: string
	onChoisir: (cle: string) => void
}) {
	const ouvert = useSalleUi(selectTerminalOuvert)
	const largeur = useSalleUi(selectTerminalLargeur)
	const setLargeur = useSalleUi((s) => s.setTerminalLargeur)
	const basculer = useSalleUi((s) => s.basculerTerminal)
	useEffect(() => {
		if (!ouvert) return
		const surEchap = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return
			// capture + preventDefault : l'Échap de la route (retour immeuble) s'abstient
			e.preventDefault()
			basculer()
		}
		window.addEventListener("keydown", surEchap, true)
		return () => window.removeEventListener("keydown", surEchap, true)
	}, [ouvert, basculer])
	return (
		<aside
			data-theme="dark"
			data-color-theme="main"
			aria-hidden={!ouvert}
			inert={!ouvert}
			style={{ "--tiroir-l": `${largeur}px` } as CSSProperties}
			className={cn(
				"absolute inset-y-0 right-0 z-40 flex w-[var(--tiroir-l)] max-w-full flex-col border-l border-border bg-stage text-text transition-transform",
				!ouvert && "translate-x-full",
			)}
		>
			<Poignee largeur={largeur} onLargeur={setLargeur} />
			<div className="min-w-0 px-3 pt-2">
				<SelecteurChef
					slug={slug}
					chefActif={chefImmeuble}
					onChoisir={onChoisir}
				/>
			</div>
			{visites.map((c) => (
				<Terminal key={c} chef={c} actif={c === chef} />
			))}
		</aside>
	)
}
