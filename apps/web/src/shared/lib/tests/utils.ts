import { expect, test } from "vitest"
import { cn } from "@/shared/lib/utils"

test("cn fusionne les classes Tailwind en conflit", () => {
	expect(cn("p-2", "p-4")).toBe("p-4")
})
