import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { HAUTEUR_MIN, pasClavier } from "@/console/script/hauteur"

type Props = { hauteur: number; max: number; onChange: (h: number) => void }

// glisser vers le haut agrandit : le tiroir est collé en bas de page
export default function Poignee({ hauteur, max, onChange }: Props) {
	const { t } = useTranslation()
	const depart = useRef<{ y: number; h: number } | null>(null)
	return (
		// séparateur focalisable (window splitter) : <hr> ne porte ni focus ni enfant
		// biome-ignore lint/a11y/useSemanticElements: window splitter ARIA
		<div
			role="separator"
			aria-orientation="horizontal"
			tabIndex={0}
			aria-label={t("console:term.resize")}
			aria-valuemin={HAUTEUR_MIN}
			aria-valuemax={max}
			aria-valuenow={hauteur}
			className="group flex h-2 shrink-0 cursor-row-resize touch-none items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			onPointerDown={(e) => {
				e.currentTarget.setPointerCapture(e.pointerId)
				depart.current = { y: e.clientY, h: hauteur }
			}}
			onPointerMove={(e) => {
				if (depart.current)
					onChange(depart.current.h + (depart.current.y - e.clientY))
			}}
			onPointerUp={() => {
				depart.current = null
			}}
			onPointerCancel={() => {
				depart.current = null
			}}
			onKeyDown={(e) => {
				const pas = pasClavier(e.key)
				if (pas === 0) return
				e.preventDefault()
				onChange(hauteur + pas)
			}}
		>
			<div className="h-0.5 w-10 bg-text-muted group-hover:bg-accent group-focus-visible:bg-accent" />
		</div>
	)
}
