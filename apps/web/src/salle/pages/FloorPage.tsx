import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import AgentsPanel from "@/console/component/AgentsPanel"
import ConsolePanel from "@/console/component/ConsolePanel"
import PipelinePanel from "@/pipeline/component/PipelinePanel"
import { BarreVue } from "@/salle/component/BarreVue"
import EffectifPanel from "@/salle/component/EffectifPanel"
import EtageEstimation from "@/salle/component/EtageEstimation"
import FloorScene from "@/salle/component/FloorScene"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Button from "@/shared/ui/button"
import Modal from "@/shared/ui/modal"
import ChoixPanel from "@/todo/component/ChoixPanel"
import { selectChoix } from "@/todo/script/select"

export default function FloorPage() {
	const slug = useSalleUi(selectFloor)
	const { data: projet } = useSalleState(slug, (s) => s.projet)
	const { t } = useTranslation("salle")
	const [ouvert, setOuvert] = useState(false)
	const { data: effectif } = useSalleState(
		slug,
		(s) => s.immeuble?.etages.find((e) => e.selection)?.effectif,
	)
	const { data: aChoix = false } = useSalleState(
		slug,
		(s) => selectChoix(s, slug).length > 0,
	)

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5">
			<BarreVue>
				<EtageEstimation estimation={projet?.estimation} />
				{effectif && (
					<>
						<Button
							size="sm"
							variant="outline"
							data-testid="effectif-ouvrir"
							title={t("effectif.ouvrir")}
							onClick={() => setOuvert(true)}
						>
							{t("effectif.bouton", {
								n: effectif.total,
								max: effectif.plafond_etage,
							})}
						</Button>
						<Modal
							open={ouvert}
							onClose={() => setOuvert(false)}
							title={t("effectif.titre")}
						>
							<EffectifPanel />
						</Modal>
					</>
				)}
			</BarreVue>
			<div
				className={`grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] gap-2.5 ${aChoix ? "grid-rows-[auto_minmax(0,1fr)_auto]" : "grid-rows-[minmax(0,1fr)_auto]"}`}
			>
				<ChoixPanel />
				<FloorScene />
				<div className="grid h-[188px] min-w-0 grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,6fr)] gap-2.5">
					<PipelinePanel />
					<AgentsPanel />
					<ConsolePanel />
				</div>
			</div>
		</div>
	)
}
