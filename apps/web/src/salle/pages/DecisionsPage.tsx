import { useTranslation } from "react-i18next"
import ConsolePanel from "@/console/component/ConsolePanel"
import { BarreEtage } from "@/salle/component/BarreEtage"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"
import BoiteDecisions from "@/todo/component/BoiteDecisions"

export default function DecisionsPage() {
	const { t } = useTranslation("salle")
	const view = useSalleUi(selectView)
	const slug = useSalleUi(selectFloor)
	const etage = view === "floor" ? slug : null
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5">
			{etage && <BarreEtage slug={etage} />}
			<BoiteDecisions etage={etage} />
			{etage && (
				<section
					aria-label={t("etage.taches")}
					className="grid h-[18rem] min-h-0 min-w-0"
				>
					<ConsolePanel />
				</section>
			)}
		</div>
	)
}
