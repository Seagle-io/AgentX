import { Navigate, type RouteObject, useParams } from "react-router"
import SalleLayout from "@/salle/component/SalleLayout"
import BasementPage from "@/salle/pages/BasementPage"
import DecisionsPage from "@/salle/pages/DecisionsPage"

// Ancienne salle : #/<slug> → #/floor/<slug>
function RedirectSlug() {
	const { slug } = useParams()
	return <Navigate to={`/floor/${slug}`} replace />
}

export const salleRoutes: RouteObject[] = [
	{
		element: <SalleLayout />,
		children: [
			{ index: true, element: <DecisionsPage /> },
			{ path: "floor/:slug", element: <DecisionsPage /> },
			{ path: "sous-sol", element: <BasementPage /> },
			{ path: ":slug", element: <RedirectSlug /> },
			{ path: "*", element: <Navigate to="/" replace /> },
		],
	},
]
