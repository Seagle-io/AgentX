import { describe, expect, it } from "vitest"
import { ageVault } from "@/salle/script/ageVault"

describe("ageVault", () => {
	it.each([
		[0, "instant", 0],
		[59, "instant", 0],
		[60, "min", 1],
		[3599, "min", 59],
		[3600, "h", 1],
		[86399, "h", 23],
		[86400, "j", 1],
	])("%i s → %s %i", (age, cle, n) => {
		expect(ageVault(age)).toEqual({ cle, n })
	})
})
