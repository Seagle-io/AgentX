import { describe, expect, it } from "vitest"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema, type TodoItem } from "@/api/state/schema"
import { cleQuestion, suivante, URGENT, vueBoite } from "@/todo/script/boite"

const base = SalleStateSchema.parse(stateFixture)

const item = (p: Partial<TodoItem>): TodoItem => ({
	prio: 0,
	etiquette: "VOTRE CHOIX",
	titre: "q",
	detail: "",
	cmd: "",
	exe: null,
	projet: "agentx",
	doc: "",
	...p,
})

const etat = (todo: TodoItem[]) => ({ ...base, todo })

describe("cleQuestion", () => {
	it("etage/projet/titre ; etage absent ⇒ projet", () => {
		expect(cleQuestion(item({ etage: "e", projet: "p", titre: "t" }))).toBe(
			"e/p/t",
		)
		expect(cleQuestion(item({ projet: "p", titre: "t" }))).toBe("p/p/t")
	})
})

describe("vueBoite", () => {
	const todo = [
		item({ etiquette: URGENT, titre: "u" }),
		item({ titre: "a", projet: "agentx" }),
		item({ titre: "b", projet: "salle-v2" }),
		item({ titre: "c", projet: "agentx" }),
		item({ etiquette: "À FAIRE", titre: "f" }),
	]

	it("urgents, groupes (1re apparition), autres", () => {
		const v = vueBoite(etat(todo), null)
		expect(v.urgents.map((i) => i.titre)).toEqual(["u"])
		expect(v.groupes.map((g) => g.projet)).toEqual(["agentx", "salle-v2"])
		expect(v.groupes[0].questions.map((q) => q.item.titre)).toEqual(["a", "c"])
		expect(v.autres.map((i) => i.titre)).toEqual(["f"])
		expect(v.total).toBe(3)
		expect(v.filtre).toBeNull()
	})

	it("question : étage, num, titre depuis l'immeuble", () => {
		const q = vueBoite(etat(todo), null).groupes[0].questions[0]
		expect(q.cle).toBe("agentx/agentx/a")
		expect(q.etageNum).toBe(4)
		expect(q.etageTitre).toBe("Outillage AgentX (rôles, salle)")
		expect(q.projet).toBe("agentx")
	})

	it("parEtage : n > 0, num décroissant", () => {
		const v = vueBoite(etat(todo), null)
		expect(v.parEtage.map((e) => [e.slug, e.n])).toEqual([
			["agentx", 2],
			["salle-v2", 1],
		])
	})

	it("filtre étage : items de l'étage, total = immeuble entier", () => {
		const v = vueBoite(etat(todo), "salle-v2")
		expect(v.groupes.map((g) => g.projet)).toEqual(["salle-v2"])
		expect(v.total).toBe(3)
		expect(v.filtre).toBe("salle-v2")
	})

	it("étage inconnu ⇒ num null, titre = slug", () => {
		const v = vueBoite(etat([item({ projet: "zz" })]), null)
		expect(v.groupes[0].questions[0].etageNum).toBeNull()
		expect(v.groupes[0].questions[0].etageTitre).toBe("zz")
	})

	it("0 choix ⇒ vue vide", () => {
		const v = vueBoite(etat([]), null)
		expect(v.groupes).toEqual([])
		expect(v.parEtage).toEqual([])
		expect(v.total).toBe(0)
	})
})

describe("suivante", () => {
	it("cyclique", () => {
		expect(suivante(["a", "b", "c"], "a")).toBe("b")
		expect(suivante(["a", "b", "c"], "c")).toBe("a")
	})
	it("[] ⇒ null", () => {
		expect(suivante([], "a")).toBeNull()
	})
	it("courante absente ou null ⇒ 1re", () => {
		expect(suivante(["a", "b"], "z")).toBe("a")
		expect(suivante(["a", "b"], null)).toBe("a")
	})
})
