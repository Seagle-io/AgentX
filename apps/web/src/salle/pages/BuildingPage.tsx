import { useNavigate } from "react-router"
import BuildingTower from "@/salle/component/BuildingTower"
import FloorList from "@/salle/component/FloorList"

// todo : vue étage seulement (decisions.md#2026-10-17)
export default function BuildingPage() {
	const navigate = useNavigate()
	return (
		<div className="grid min-w-0 content-start gap-4">
			<FloorList onSelect={(s) => navigate(`/floor/${s}`)} />
			<BuildingTower />
		</div>
	)
}
