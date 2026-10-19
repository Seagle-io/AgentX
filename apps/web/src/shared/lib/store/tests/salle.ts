import { beforeEach, describe, expect, it } from "vitest"
import {
	selectFloor,
	selectHoveredDesk,
	selectView,
	useSalleUi,
} from "@/shared/lib/store/salle"

const etat = () => useSalleUi.getState()

beforeEach(() =>
	useSalleUi.setState({
		view: "building",
		selectedFloor: null,
		hoveredDesk: null,
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
