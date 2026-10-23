import { type SyntheticEvent, useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { salleEtage } from "@/engine/svg/salle"
import { V1_CSS } from "@/engine/svg/style"
import Deck from "@/salle/component/Deck"
import { toImmeublePlat } from "@/salle/script/plat"
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

const SERVEUR_TON = {
	ok: "bg-success",
	warn: "bg-warning",
	ko: "bg-error",
} as const

const FloorScene = () => {
	const { t } = useTranslation("salle")
	const slug = useSalleUi(selectFloor)
	const hovered = useSalleUi(selectHoveredDesk)
	const { data } = useSalleState(slug)
	const { data: etage } = useSalleState(slug, (s) =>
		toImmeublePlat(s, slug, "").etages.find((e) => e.slug === slug),
	)
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
		<section
			className="relative min-h-[26rem] overflow-hidden rounded-control border border-border-subtle bg-stage"
			onPointerOver={viser}
			onPointerLeave={() => useSalleUi.getState().hoverDesk(null)}
		>
			<div className="absolute inset-x-3 top-2 z-10 flex min-w-0 items-center gap-2">
				<span className="text-xs font-semibold uppercase tracking-wide text-stage-text">
					{t("salle")}
				</span>
				<span className="min-w-0 flex-1 truncate font-mono text-xs text-stage-dim">
					{etage &&
						t("salleResume", {
							a: etage.agentsN,
							c: etage.enCours,
							b: etage.bloque,
						})}
				</span>
				{etage && etage.serveurs.length > 0 && (
					<div className="flex shrink-0 items-center gap-1">
						{etage.serveurs.map((v) => (
							<span
								key={v.nom}
								title={v.latence_ms === null ? undefined : `${v.latence_ms} ms`}
								className="inline-flex h-[22px] items-center gap-1.5 rounded-full border border-border bg-bg-panel px-2 font-mono text-xs text-text"
							>
								<span
									aria-hidden
									className={`size-1.5 rounded-full ${SERVEUR_TON[v.etat]}`}
								/>
								{v.nom}
							</span>
						))}
					</div>
				)}
			</div>
			<div
				className="absolute inset-0 p-1 [&>svg]:block [&>svg]:size-full"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG généré, textes passés par esc
				dangerouslySetInnerHTML={{ __html: html }}
			/>
			{hovered !== null && <Deck />}
		</section>
	)
}

export default FloorScene
