import { useNavigate } from "react-router"
import BuildingTower from "@/salle/component/BuildingTower"
import FloorList from "@/salle/component/FloorList"
import TodoPanel from "@/todo/component/TodoPanel"

// Parité v1 : colonne gauche = étages puis tour ; todo à droite sur la hauteur
export default function BuildingPage() {
	const navigate = useNavigate()
	return (
		<div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
			<div className="grid min-w-0 content-start gap-4">
				<FloorList onSelect={(s) => navigate(`/floor/${s}`)} />
				<BuildingTower />
			</div>
			<aside className="min-w-0 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:self-start">
				<TodoPanel fill />
			</aside>
		</div>
	)
}
