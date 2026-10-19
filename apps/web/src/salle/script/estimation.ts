import type { Estimation } from "@/api/state/schema"

export type EtatReste = "rien" | "indisponible" | "duree"

// 98,7 → "1 h 39" ; 45 → "45 min"
export const formatDuree = (min: number): string => {
	const total = Math.round(min)
	if (total < 60) return `${total} min`
	const h = Math.floor(total / 60)
	return `${h} h ${String(total % 60).padStart(2, "0")}`
}

export const etatReste = (e: Estimation): EtatReste => {
	if (e.ouvertes === 0) return "rien"
	return e.reste_min === null || e.fiabilite === "∅" ? "indisponible" : "duree"
}

// "6 implementeur × 12,5 min · 3 verificateur × 7,8 min"
export const detailRoles = (e: Estimation): string =>
	Object.entries(e.par_role)
		.filter(([, r]) => r.moy_min !== null && r.ouvertes > 0)
		.map(
			([role, r]) =>
				`${r.ouvertes} ${role} × ${String(Math.round((r.moy_min ?? 0) * 10) / 10).replace(".", ",")} min`,
		)
		.join(" · ")
