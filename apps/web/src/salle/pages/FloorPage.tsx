import ConsolePanel from "@/console/component/ConsolePanel"
import PipelinePanel from "@/pipeline/component/PipelinePanel"
import BuildingCanvas from "@/salle/component/BuildingCanvas"
import Deck from "@/salle/component/Deck"

export default function FloorPage() {
	return (
		<>
			<BuildingCanvas view="floor" />
			<Deck />
			<div className="grid gap-4 lg:grid-cols-2">
				<PipelinePanel />
				<ConsolePanel />
			</div>
		</>
	)
}
