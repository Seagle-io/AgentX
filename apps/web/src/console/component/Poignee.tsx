import { useRef } from "react"
import { useTranslation } from "react-i18next"
import {
	bornerLargeur,
	largeurDepuisGlisse,
	PAS_CLAVIER,
} from "@/console/script/largeur"
import { TERMINAL_LARGEUR } from "@/shared/lib/store/salle"

type Props = { largeur: number; onLargeur: (px: number) => void }

// glisser vers la gauche agrandit : le tiroir est collé à droite
export default function Poignee({ largeur, onLargeur }: Props) {
	const { t } = useTranslation()
	const depart = useRef<{ x: number; l: number } | null>(null)
	return (
		// séparateur focalisable (window splitter) : <hr> ne porte ni focus ni enfant
		// biome-ignore lint/a11y/useSemanticElements: window splitter ARIA
		<div
			role="separator"
			aria-orientation="vertical"
			tabIndex={0}
			aria-label={t("console:term.resize")}
			title={t("salle:redim")}
			aria-valuemin={TERMINAL_LARGEUR.min}
			aria-valuemax={TERMINAL_LARGEUR.max}
			aria-valuenow={largeur}
			className="group absolute inset-y-0 left-0 z-10 flex w-2 cursor-col-resize touch-none items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			onPointerDown={(e) => {
				e.currentTarget.setPointerCapture(e.pointerId)
				depart.current = { x: e.clientX, l: largeur }
			}}
			onPointerMove={(e) => {
				if (depart.current)
					onLargeur(
						largeurDepuisGlisse(depart.current.l, depart.current.x, e.clientX),
					)
			}}
			onPointerUp={() => {
				depart.current = null
			}}
			onPointerCancel={() => {
				depart.current = null
			}}
			onDoubleClick={() => onLargeur(TERMINAL_LARGEUR.defaut)}
			onKeyDown={(e) => {
				if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
				e.preventDefault()
				onLargeur(
					bornerLargeur(
						largeur + (e.key === "ArrowLeft" ? PAS_CLAVIER : -PAS_CLAVIER),
					),
				)
			}}
		>
			<div className="h-10 w-0.5 bg-text-muted group-hover:bg-accent group-focus-visible:bg-accent" />
		</div>
	)
}
