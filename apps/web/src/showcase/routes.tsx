import type { RouteObject } from "react-router"
import { ShowcasePage } from "@/showcase/pages/ShowcasePage"

export const showcaseRoutes: RouteObject[] = [
	{ path: "/showcase", element: <ShowcasePage /> },
]
