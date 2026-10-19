import type { Immeuble } from "@/api/state/schema"

export const CHEF_DEFAUT = "defaut"

// tenant de l'étage, sinon le chef par défaut
export function chefDe(immeuble: Immeuble, etage: string | null): string {
	if (etage === null) return CHEF_DEFAUT
	return (
		immeuble.chefs?.find((c) => c.etages.includes(etage))?.cle ?? CHEF_DEFAUT
	)
}
