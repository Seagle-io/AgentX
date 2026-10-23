import { beforeEach, describe, expect, it } from "vitest"
import {
	selectFloor,
	selectHoveredDesk,
	selectTerminalLargeur,
	selectTerminalOuvert,
	selectView,
	TERMINAL_LARGEUR,
	useSalleUi,
} from "@/shared/lib/store/salle"

const etat = () => useSalleUi.getState()

beforeEach(() =>
	useSalleUi.setState({
		view: "building",
		selectedFloor: null,
		hoveredDesk: null,
		terminalOuvert: false,
		terminalLargeur: TERMINAL_LARGEUR.defaut,
	}),
)

describe("useSalleUi", () => {
	it("showFloor('agentx') ⇒ floor, agentx, hoveredDesk null", () => {
		etat().hoverDesk("scribe")
		etat().showFloor("agentx")
		expect(selectView(etat())).toBe("floor")
		expect(selectFloor(etat())).toBe("agentx")
		expect(selectHoveredDesk(etat())).toBeNull()
	})

	it("showBuilding() ⇒ building, selectedFloor null", () => {
		etat().showFloor("agentx")
		etat().showBuilding()
		expect(selectView(etat())).toBe("building")
		expect(selectFloor(etat())).toBeNull()
		expect(selectHoveredDesk(etat())).toBeNull()
	})

	it("hoverDesk('scribe') ⇒ hoveredDesk scribe, puis null", () => {
		etat().hoverDesk("scribe")
		expect(selectHoveredDesk(etat())).toBe("scribe")
		etat().hoverDesk(null)
		expect(selectHoveredDesk(etat())).toBeNull()
	})
})

describe("tiroir terminal", () => {
	it("basculerTerminal() ⇒ ouvert, puis fermé", () => {
		etat().basculerTerminal()
		expect(selectTerminalOuvert(etat())).toBe(true)
		etat().basculerTerminal()
		expect(selectTerminalOuvert(etat())).toBe(false)
	})

	it("setTerminalLargeur borne à min et max", () => {
		etat().setTerminalLargeur(100)
		expect(selectTerminalLargeur(etat())).toBe(TERMINAL_LARGEUR.min)
		etat().setTerminalLargeur(5000)
		expect(selectTerminalLargeur(etat())).toBe(TERMINAL_LARGEUR.max)
		etat().setTerminalLargeur(600)
		expect(selectTerminalLargeur(etat())).toBe(600)
	})
})
