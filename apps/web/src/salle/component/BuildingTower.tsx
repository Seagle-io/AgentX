import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import { V1_CSS } from "@/engine/svg/style"
import { tourImmeuble } from "@/engine/svg/tour"
import { toTourVue } from "@/salle/script/tour"
import {
	selectFloor,
	selectLastFloor,
	useSalleUi,
} from "@/shared/lib/store/salle"

// Étage visé : plaque (`g.tour-etage`) ou coupe (`g.tour-niveau`), `[data-slug]`.
const cible = (t: EventTarget) =>
	t instanceof Element
		? t.closest("[data-slug]")?.getAttribute("data-slug")
		: undefined

const BuildingTower = () => {
	const { t } = useTranslation("salle")
	const navigate = useNavigate()
	const slug = useSalleUi(selectFloor)
	const lastFloor = useSalleUi(selectLastFloor)
	const { data: vue } = useSalleState(slug, (s) => toTourVue(s, lastFloor))
	// SVG reconstruit seulement si la vue change : animations non relancées
	const cle = vue ? JSON.stringify(vue) : ""
	const html = useMemo(() => (cle ? tourImmeuble(JSON.parse(cle)) : ""), [cle])

	// démo (`immeuble` null) : FloorList le dit déjà
	if (!vue) return null

	const aller = (s: string | null | undefined) => {
		if (s) navigate(`/floor/${s}`)
	}
	return (
		<section aria-label={t("building")} className="min-w-0">
			<style>{V1_CSS}</style>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: délégation ; les étages sont des role="button" focusables dans le SVG */}
			<div
				// largeur utile, hauteur = min(75vh, hauteur du viewBox) ; `meet` centre la tour
				className="[&>svg]:block [&>svg]:h-auto [&>svg]:max-h-[75vh] [&>svg]:w-full"
				onClick={(e) => aller(cible(e.target))}
				onKeyDown={(e) => {
					if (e.key === "Enter") aller(cible(e.target))
				}}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG de `tourImmeuble`, textes passés par `esc`
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</section>
	)
}

export default BuildingTower
