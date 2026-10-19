import { useNavigate } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import AgentsPanel from "@/console/component/AgentsPanel"
import ConsolePanel from "@/console/component/ConsolePanel"
import PipelinePanel from "@/pipeline/component/PipelinePanel"
import Deck from "@/salle/component/Deck"
import EtageEstimation from "@/salle/component/EtageEstimation"
import FloorList from "@/salle/component/FloorList"
import FloorScene from "@/salle/component/FloorScene"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import ChoixPanel from "@/todo/component/ChoixPanel"

export default function FloorPage() {
	const navigate = useNavigate()
	const slug = useSalleUi(selectFloor)
	const { data: projet } = useSalleState(slug, (s) => s.projet)

	return (
		<>
			<FloorList compact onSelect={(s) => navigate(`/floor/${s}`)} />
			<EtageEstimation estimation={projet?.estimation} />
			<ChoixPanel />
			<FloorScene />
			<Deck />
			<div className="grid gap-4 lg:grid-cols-2 lg:items-start">
				<PipelinePanel />
				<AgentsPanel />
			</div>
			<ConsolePanel />
		</>
	)
}
