import { describe, expect, it } from "vitest"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema, type TodoItem } from "@/api/state/schema"
import { CHOIX, canRun, selectChoix, selectTodo } from "@/todo/script/select"

const state = SalleStateSchema.parse(stateFixture)

describe("selectTodo", () => {
	it("total = todo_total", () => {
		expect(selectTodo(state).total).toBe(state.todo_total)
	})

	it("ordre serveur conservé", () => {
		expect(selectTodo(state).items.map((i) => i.titre)).toEqual(
			state.todo.map((i) => i.titre),
		)
	})

	it("floors depuis immeuble.etages, [] si null", () => {
		const view = selectTodo(state)
		expect(view.floors).toEqual(
			(state.immeuble?.etages ?? []).map(({ slug, titre }) => ({
				slug,
				titre,
			})),
		)
		expect(
			selectTodo({ ...state, immeuble: { ...state.immeuble, etages: [] } })
				.floors,
		).toEqual([])
	})

	it("slug ⇒ items de l'étage, total = todo de l'étage", () => {
		const view = selectTodo(state, "agentx")
		expect(view.items.length).toBeGreaterThan(0)
		expect(view.items.every((i) => i.projet === "agentx")).toBe(true)
		expect(view.total).toBe(
			state.immeuble?.etages.find((e) => e.slug === "agentx")?.todo,
		)
		expect(selectTodo(state, "inconnu").total).toBe(0)
	})

	it("slug null ⇒ agrégé", () => {
		expect(selectTodo(state, null)).toEqual(selectTodo(state))
	})
})

describe("selectChoix", () => {
	const mk = (etiquette: string, projet: string, titre: string): TodoItem => ({
		prio: 0,
		etiquette,
		titre,
		detail: "",
		cmd: "",
		exe: null,
		projet,
	})
	const s = {
		...state,
		todo: [mk(CHOIX, "a", "qa"), mk("URGENT", "a", "u"), mk(CHOIX, "b", "qb")],
	}

	it("slug null ⇒ toutes les questions, ordre serveur", () => {
		expect(selectChoix(s).map((i) => i.titre)).toEqual(["qa", "qb"])
	})

	it("slug a ⇒ 1 question", () => {
		expect(selectChoix(s, "a").map((i) => i.titre)).toEqual(["qa"])
	})

	it("slug inconnu ⇒ 0", () => {
		expect(selectChoix(s, "c")).toEqual([])
	})
})

describe("canRun", () => {
	const base: TodoItem = {
		prio: 0,
		etiquette: "À LANCER",
		titre: "t",
		detail: "",
		cmd: "",
		exe: null,
		projet: "p",
	}

	it("exe null ⇒ null", () => {
		expect(canRun(base)).toBeNull()
		expect(state.todo.filter((i) => i.exe === null).map(canRun)).toEqual(
			state.todo.filter((i) => i.exe === null).map(() => null),
		)
	})

	it("exe valide ⇒ body", () => {
		const exe = { action: "retenir", projet: "p", tid: "T001" }
		expect(canRun({ ...base, exe })).toEqual(exe)
	})

	it("exe sans action ⇒ null", () => {
		expect(canRun({ ...base, exe: { projet: "p" } })).toBeNull()
	})
})
