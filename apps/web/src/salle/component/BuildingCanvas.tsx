import { type PointerEvent, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import {
	type BuildingHandle,
	type BuildingPalette,
	mountBuilding,
	type PaletteKey,
} from "@/engine/building"
import { toScene } from "@/salle/script/scene"
import {
	type SalleView,
	selectFloor,
	selectHoveredDesk,
	useSalleUi,
} from "@/shared/lib/store/salle"

type BuildingCanvasProps = { view: SalleView }
type Navigate = (to: string) => void

// Clé moteur → suffixe du token CSS `--color-*` (index.css)
const TOKEN: Record<PaletteKey, string> = {
	bg: "bg",
	panel: "bg-panel",
	surface: "surface",
	border: "border",
	text: "text",
	muted: "text-muted",
	accent: "accent",
	success: "success",
	warning: "warning",
	error: "error",
}

// Lue 1× au montage : les tokens ne changent pas en cours de route.
const readPalette = (): BuildingPalette => {
	const style = getComputedStyle(document.documentElement)
	const palette = {} as BuildingPalette
	for (const k of Object.keys(TOKEN) as PaletteKey[]) {
		palette[k] = style.getPropertyValue(`--color-${TOKEN[k]}`).trim()
	}
	return palette
}

// Monte le moteur ; `null` si le canvas 2d est indisponible (le moteur throw).
const mount = (
	box: HTMLDivElement,
	canvas: HTMLCanvasElement,
	navigate: { current: Navigate },
): { handle: BuildingHandle; cleanup(): void } | null => {
	let handle: BuildingHandle
	try {
		handle = mountBuilding(canvas, {
			palette: readPalette(),
			reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
			frame: {
				request: (cb) => requestAnimationFrame(cb),
				cancel: (id) => cancelAnimationFrame(id),
			},
			onSelectFloor: (slug) => navigate.current(`/floor/${slug}`),
			onHoverDesk: (cle) => useSalleUi.getState().hoverDesk(cle),
		})
	} catch (err) {
		console.error(err)
		return null
	}
	// observe() notifie 1× à l'inscription : c'est le resize initial
	const observer = new ResizeObserver(() => {
		const rect = box.getBoundingClientRect()
		handle.resize(rect.width, rect.height, devicePixelRatio)
	})
	observer.observe(box)
	return {
		handle,
		cleanup: () => {
			observer.disconnect()
			handle.destroy()
		},
	}
}

const BuildingCanvas = ({ view }: BuildingCanvasProps) => {
	const boxRef = useRef<HTMLDivElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const handleRef = useRef<BuildingHandle | null>(null)
	// `navigate` change avec la route : passé par ref pour ne jamais remonter le moteur
	const navigate = useNavigate()
	const navigateRef = useRef<Navigate>(navigate)
	const slug = useSalleUi(selectFloor)
	const hovered = useSalleUi(selectHoveredDesk)
	const { data } = useSalleState(slug)

	useEffect(() => {
		navigateRef.current = navigate
	}, [navigate])

	useEffect(() => {
		if (!boxRef.current || !canvasRef.current) return
		const mounted = mount(boxRef.current, canvasRef.current, navigateRef)
		if (!mounted) return
		handleRef.current = mounted.handle
		return () => {
			mounted.cleanup()
			handleRef.current = null
		}
	}, [])

	useEffect(() => {
		if (data && handleRef.current) {
			handleRef.current.update(toScene(data, view, hovered))
		}
	}, [data, view, hovered])

	const pointer =
		(type: "move" | "click" | "leave") =>
		(e: PointerEvent<HTMLCanvasElement>) => {
			const rect = e.currentTarget.getBoundingClientRect()
			handleRef.current?.pointer({
				type,
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			})
		}

	return (
		<div ref={boxRef} className="relative w-full aspect-[35/24]">
			<canvas
				ref={canvasRef}
				className="absolute inset-0 block h-full w-full"
				onPointerMove={pointer("move")}
				onClick={pointer("click")}
				onPointerLeave={pointer("leave")}
			/>
		</div>
	)
}

export default BuildingCanvas
