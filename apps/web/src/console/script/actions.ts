import {
	type Action,
	type RunBody,
	RunBodySchema,
	type SalleState,
	type Tache,
} from "@/api/state/schema"

export type Run = { kind: "run"; body: RunBody } | { kind: "copy"; cmd: string }

// exe null ou motif manquant/invalide ⇒ la commande se copie, ne se lance pas
export function toRun(a: Action, motif?: string): Run {
	if (a.exe === null) return { kind: "copy", cmd: a.cmd }
	if (a.saisie === "motif" && !motif) return { kind: "copy", cmd: a.cmd }
	const corps = RunBodySchema.safeParse({
		...a.exe,
		...(a.saisie === "motif" ? { motif } : {}),
	})
	return corps.success
		? { kind: "run", body: corps.data }
		: { kind: "copy", cmd: a.cmd }
}

export type PilotKey =
	| "board"
	| "ready"
	| "doctor"
	| "index"
	| "personnel"
	| "integrer"

// figée : liste blanche serveur (api/run)
const PILOT_KEYS: PilotKey[] = [
	"board",
	"ready",
	"doctor",
	"index",
	"personnel",
	"integrer",
]

export function pilotActions(
	slug: string | null,
): { k: PilotKey; body: RunBody }[] {
	return PILOT_KEYS.map((k) => ({
		k,
		body: { action: k, projet: slug ?? undefined },
	}))
}

export type ConsoleSlice = {
	taches: Tache[]
	journal: string[]
	pilotable: boolean
	projet: string
}

export const selectConsole = (s: SalleState): ConsoleSlice => ({
	taches: s.taches,
	journal: s.journal,
	pilotable: s.pilotable,
	projet: s.projet.slug,
})
