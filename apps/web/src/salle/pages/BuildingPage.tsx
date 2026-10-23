import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { BarreVue } from "@/salle/component/BarreVue"
import ImmeubleGrand from "@/salle/component/ImmeubleGrand"
import VoixPanel from "@/salle/component/VoixPanel"
import { toImmeublePlat } from "@/salle/script/plat"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"

// todo : vue étage seulement (decisions.md#2026-10-17)
export default function BuildingPage() {
	const { t } = useTranslation("salle")
	const { data: total } = useSalleState(null, (s) => {
		const v = toImmeublePlat(s, null, "")
		return { n: v.etages.length, a: v.agentsTotal }
	})
	const slug = useSalleUi(selectFloor)
	const { data: nVoix } = useSalleState(
		slug,
		(s) => s.voix?.journal.length ?? 0,
	)
	const [voixOuvert, setVoixOuvert] = useState(false)
	useEffect(() => {
		if (!voixOuvert) return
		const fermer = (e: KeyboardEvent) =>
			e.key === "Escape" && setVoixOuvert(false)
		window.addEventListener("keydown", fermer)
		return () => window.removeEventListener("keydown", fermer)
	}, [voixOuvert])
	return (
		<div className="relative grid min-h-0 min-w-0 content-start gap-3">
			<BarreVue>
				<span className="text-muted text-xs">
					{t("multiSous", { n: total?.n ?? 0, a: total?.a ?? 0 })}
				</span>
				<button
					type="button"
					aria-expanded={voixOuvert}
					aria-controls="voix-surimpression"
					className="ml-auto h-[22px] cursor-pointer rounded bg-surface-2 px-2 text-[11px] font-semibold text-text"
					onClick={() => setVoixOuvert((o) => !o)}
				>
					{t("voix.title")} · {nVoix ?? 0}
				</button>
			</BarreVue>
			<div className="h-[max(24rem,calc(100dvh-14rem))] min-h-0 grid">
				<ImmeubleGrand />
			</div>
			{voixOuvert && (
				<div
					id="voix-surimpression"
					className="absolute top-10 right-0 z-10 max-h-[70vh] w-80 overflow-y-auto shadow-lg"
				>
					<VoixPanel />
				</div>
			)}
		</div>
	)
}
