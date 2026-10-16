import { describe, expect, it } from "vitest"
import { estSaisieTag, neighbourFloor, parseSlug } from "@/salle/script/route"

describe("parseSlug", () => {
	it("'agentx' ⇒ 'agentx'", () => {
		expect(parseSlug("agentx")).toBe("agentx")
	})

	it("'AgentX' ⇒ null (pas de toLowerCase)", () => {
		expect(parseSlug("AgentX")).toBeNull()
	})

	it("49 caractères ⇒ null, 48 ⇒ accepté", () => {
		expect(parseSlug("a".repeat(49))).toBeNull()
		expect(parseSlug("a".repeat(48))).toBe("a".repeat(48))
	})

	it("undefined ⇒ null", () => {
		expect(parseSlug(undefined)).toBeNull()
	})
})

describe("neighbourFloor", () => {
	const etages = [{ slug: "a" }, { slug: "b" }, { slug: "c" }]

	it("milieu ±1", () => {
		expect(neighbourFloor(etages, "b", -1)).toBe("a")
		expect(neighbourFloor(etages, "b", 1)).toBe("c")
	})

	it("1er + -1 ⇒ null", () => {
		expect(neighbourFloor(etages, "a", -1)).toBeNull()
	})

	it("dernier + +1 ⇒ null", () => {
		expect(neighbourFloor(etages, "c", 1)).toBeNull()
	})

	it("inconnu ⇒ null", () => {
		expect(neighbourFloor(etages, "z", 1)).toBeNull()
		expect(neighbourFloor([], "a", -1)).toBeNull()
	})
})

describe("estSaisieTag", () => {
	it("INPUT, TEXTAREA, SELECT ⇒ saisie", () => {
		expect(estSaisieTag("INPUT", false)).toBe(true)
		expect(estSaisieTag("TEXTAREA", false)).toBe(true)
		expect(estSaisieTag("SELECT", false)).toBe(true)
	})

	it("DIV ⇒ saisie seulement si contentEditable", () => {
		expect(estSaisieTag("DIV", false)).toBe(false)
		expect(estSaisieTag("DIV", true)).toBe(true)
		expect(estSaisieTag("BODY", false)).toBe(false)
	})
})
