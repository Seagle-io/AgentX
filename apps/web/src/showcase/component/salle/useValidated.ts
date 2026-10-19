import { useCallback, useState } from "react"
import { SAMPLES } from "@/showcase/component/salle/samples"

const KEY = "agentx:showcase:valide"

// Stockage indisponible (navigation privée, quota) ⇒ liste vide, la case
// reste utilisable le temps de la session.
const read = (): string[] => {
	try {
		const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]")
		return Array.isArray(raw)
			? raw.filter((x): x is string => typeof x === "string")
			: []
	} catch {
		return []
	}
}

const write = (ids: string[]) => {
	try {
		localStorage.setItem(KEY, JSON.stringify(ids))
	} catch {
		// non persistant : rien à faire de plus
	}
}

export const useValidated = () => {
	const [ids, setIds] = useState<string[]>(() =>
		read().filter((id) => SAMPLES.some((s) => s.id === id)),
	)
	const toggle = useCallback((id: string) => {
		setIds((prev) => {
			const next = prev.includes(id)
				? prev.filter((x) => x !== id)
				: [...prev, id]
			write(next)
			return next
		})
	}, [])
	return { ids, toggle }
}
