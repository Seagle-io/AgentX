import { type SyntheticEvent, useEffect, useMemo, useRef } from "react"
import { useSalleState } from "@/api/state/hooks"
import { salleEtage } from "@/engine/svg/salle"
import { V1_CSS } from "@/engine/svg/style"
import { toSalleVue } from "@/salle/script/salleVue"
import {
	selectFloor,
	selectHoveredDesk,
	useSalleUi,
} from "@/shared/lib/store/salle"

// Clé du bureau sous le pointeur (`data-desk` posé par salleEtage), null hors bureau.
const deskSous = (e: SyntheticEvent) =>
	e.target instanceof Element
		? (e.target.closest("[data-desk]")?.getAttribute("data-desk") ?? null)
		: null

const FloorScene = () => {
	const slug = useSalleUi(selectFloor)
	const hovered = useSalleUi(selectHoveredDesk)
	const { data } = useSalleState(slug)
	// faits du rendu précédent : un fait de plus ⇒ éclair du vault
	const faitsPrecedent = useRef<number | null>(null)
	const vue = useMemo(
		() => (data ? toSalleVue(data, hovered, faitsPrecedent.current) : null),
		[data, hovered],
	)
	useEffect(() => {
		faitsPrecedent.current = vue?.pipeline.faits ?? null
	}, [vue])
	const html = useMemo(() => {
		if (!vue) return ""
		const anim = !matchMedia("(prefers-reduced-motion: reduce)").matches
		return `<style>${V1_CSS}</style>${salleEtage(vue, anim)}`
	}, [vue])
	// survol (souris et toucher) : même effet que le canvas (onHoverDesk), le Deck suit le store
	const viser = (e: SyntheticEvent) => {
		const cle = deskSous(e)
		if (cle !== hovered) useSalleUi.getState().hoverDesk(cle)
	}

	return (
		<div
			className="relative mb-1.5 w-full [&>svg]:block [&>svg]:h-auto [&>svg]:max-w-full"
			onPointerOver={viser}
			onPointerLeave={() => useSalleUi.getState().hoverDesk(null)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG généré, textes passés par esc
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	)
}

export default FloorScene
