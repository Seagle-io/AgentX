import { describe, expect, it } from "vitest"
import { TacheSchema } from "@/api/tache/schema"

const base = {
	tid: "T128",
	projet: "salle-v2",
	titre: "Titre",
	role: "designer",
	statut: "en-cours",
	pack: "# Pack T128 —",
}

describe("TacheSchema", () => {
	it("parse une tâche avec rendu", () => {
		expect(TacheSchema.parse({ ...base, result: "rendu" }).result).toBe("rendu")
	})

	it("accepte un rendu null et refuse un champ absent", () => {
		expect(TacheSchema.parse({ ...base, result: null }).result).toBeNull()
		expect(
			TacheSchema.safeParse({ ...base, result: null, pack: undefined }).success,
		).toBe(false)
	})
})
