import { describe, expect, it } from "vitest"
import { doitRecharger } from "@/api/state/hooks"

describe("doitRecharger", () => {
	it("rien tant que le build est inconnu", () => {
		expect(doitRecharger(null, "2026-10-19T14:37:00", false)).toBe(false)
		expect(doitRecharger("2026-10-19T14:37:00", null, false)).toBe(false)
	})
	it("rien si le build est identique", () => {
		expect(doitRecharger("a", "a", false)).toBe(false)
	})
	it("recharge si le build change", () => {
		expect(doitRecharger("a", "b", false)).toBe(true)
	})
	it("diffère si saisie en cours", () => {
		expect(doitRecharger("a", "b", true)).toBe(false)
	})
})
