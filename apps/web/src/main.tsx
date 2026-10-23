import "@/index.css"
import "@/shared/lib/i18n/i18n"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createHashRouter, RouterProvider } from "react-router"
import { salleRoutes } from "@/salle/routes"
import { appliquerMode, CLE_THEME, lireMode } from "@/shared/lib/theme/mode"
import { showcaseRoutes } from "@/showcase/routes"

appliquerMode(lireMode(localStorage.getItem(CLE_THEME)))

const queryClient = new QueryClient()
const router = createHashRouter([...salleRoutes, ...showcaseRoutes])

const container = document.getElementById("root")
if (!container) throw new Error("#root introuvable")

createRoot(container).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</StrictMode>,
)
