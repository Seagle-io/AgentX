import { Navigate, type RouteObject, useParams } from "react-router"
import SalleLayout from "@/salle/component/SalleLayout"
import BasementPage from "@/salle/pages/BasementPage"
import BuildingPage from "@/salle/pages/BuildingPage"
import FloorPage from "@/salle/pages/FloorPage"

// Ancienne salle : #/<slug> → #/floor/<slug>
function RedirectSlug() {
	const { slug } = useParams()
	return <Navigate to={`/floor/${slug}`} replace />
}

export const salleRoutes: RouteObject[] = [
	{
		element: <SalleLayout />,
		children: [
			{ index: true, element: <BuildingPage /> },
			{ path: "floor/:slug", element: <FloorPage /> },
			{ path: "sous-sol", element: <BasementPage /> },
			{ path: ":slug", element: <RedirectSlug /> },
			{ path: "*", element: <Navigate to="/" replace /> },
		],
	},
]
