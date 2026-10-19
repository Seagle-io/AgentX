import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import { SlugSchema } from "@/api/state/schema"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"

export function parseSlug(param: string | undefined): string | null {
	const r = SlugSchema.safeParse(param)
	return r.success ? r.data : null
}

export function neighbourFloor(
	etages: { slug: string }[],
	current: string,
	delta: -1 | 1,
): string | null {
	const i = etages.findIndex((e) => e.slug === current)
	if (i < 0) return null
	return etages[i + delta]?.slug ?? null
}

const SAISIE_TAGS = ["INPUT", "TEXTAREA", "SELECT"]

export function estSaisieTag(tag: string, editable: boolean): boolean {
	return editable || SAISIE_TAGS.includes(tag)
}

// Cible d'un raccourci clavier : un champ de saisie garde Échap et Alt+flèches
export function estSaisie(t: EventTarget | null): boolean {
	return (
		t instanceof HTMLElement && estSaisieTag(t.tagName, t.isContentEditable)
	)
}

// Route = source, store = miroir : seul appelant de showFloor/showBuilding.
// `refus` est mémorisé pour rester lisible sur `#/` après la redirection.
export function useFloorRoute(): string {
	const { slug: param } = useParams()
	const { pathname } = useLocation()
	const navigate = useNavigate()
	const showFloor = useSalleUi((s) => s.showFloor)
	const showBuilding = useSalleUi((s) => s.showBuilding)
	const onFloor = pathname !== "/"
	const slug = onFloor ? parseSlug(param) : null
	const { data: refus = "" } = useSalleState(
		slug,
		(s) => s.immeuble?.selection.refus ?? "",
	)
	const [refusMemo, setRefusMemo] = useState("")

	useEffect(() => {
		if (!onFloor) {
			showBuilding()
			return
		}
		setRefusMemo("") // nouvel étage demandé : l'ancien refus s'efface
		if (slug === null) {
			navigate("/", { replace: true })
			return
		}
		showFloor(slug)
	}, [onFloor, slug, navigate, showFloor, showBuilding])

	useEffect(() => {
		if (!onFloor || refus === "") return
		setRefusMemo(refus)
		navigate("/", { replace: true })
	}, [onFloor, refus, navigate])

	return refusMemo
}

export function useFloorKeys(): void {
	const navigate = useNavigate()
	const view = useSalleUi(selectView)
	const selectedFloor = useSalleUi(selectFloor)
	const { data: etages } = useSalleState(
		selectedFloor,
		(s) => s.immeuble?.etages ?? [],
	)

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (estSaisie(e.target)) return
			if (e.key === "Escape" && view === "floor") {
				// un dialog ouvert garde l'Échap : il se ferme, l'étage reste
				if (e.defaultPrevented || document.querySelector("dialog[open]")) return
				navigate("/")
				return
			}
			if (!e.altKey || selectedFloor === null || !etages) return
			const delta = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0
			if (delta === 0) return
			const slug = neighbourFloor(etages, selectedFloor, delta)
			if (slug !== null) navigate(`/floor/${slug}`)
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [view, selectedFloor, etages, navigate])
}
