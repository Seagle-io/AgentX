export type AgeVault = { cle: "instant" | "min" | "h" | "j"; n: number }

// 180 → { cle: "min", n: 3 } ; arrondi bas
export const ageVault = (age_s: number): AgeVault => {
	if (age_s < 60) return { cle: "instant", n: 0 }
	if (age_s < 3600) return { cle: "min", n: Math.floor(age_s / 60) }
	if (age_s < 86400) return { cle: "h", n: Math.floor(age_s / 3600) }
	return { cle: "j", n: Math.floor(age_s / 86400) }
}
