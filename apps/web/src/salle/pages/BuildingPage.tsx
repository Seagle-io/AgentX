import { useNavigate } from "react-router"
import BuildingCanvas from "@/salle/component/BuildingCanvas"
import FloorList from "@/salle/component/FloorList"

export default function BuildingPage() {
	const navigate = useNavigate()
	return (
		<div className="grid gap-4 md:grid-cols-[2fr_1fr]">
			<BuildingCanvas view="building" />
			<FloorList onSelect={(s) => navigate(`/floor/${s}`)} />
		</div>
	)
}
