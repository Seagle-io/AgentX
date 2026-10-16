import { describe, expect, it } from "vitest"
import { stateFixture } from "@/api/state/fixture"
import { type Action, SalleStateSchema } from "@/api/state/schema"
import { pilotActions, selectConsole, toRun } from "@/console/script/actions"

const integrer: Action = {
	k: "integrer",
	libelle: "intégrer",
	exe: { action: "integrer", tid: "T001", projet: "salle-v2" },
	cmd: "python3 bin/vx.py integrer T001 --projet salle-v2",
	saisie: "",
}
const virer: Action = {
	k: "virer",
	libelle: "✕ virer",
	exe: { action: "virer", tid: "T001", projet: "salle-v2", motif: "" },
	cmd: 'python3 bin/vx.py virer T001 --motif "<motif>" --projet salle-v2',
	saisie: "motif",
}

describe("toRun", () => {
	it("exe null ⇒ copy", () => {
		expect(toRun({ ...integrer, exe: null })).toEqual({
			kind: "copy",
			cmd: integrer.cmd,
		})
	})
	it("exe valide ⇒ run", () => {
		expect(toRun(integrer)).toEqual({ kind: "run", body: integrer.exe })
	})
	it("saisie motif sans motif ⇒ copy", () => {
		expect(toRun(virer)).toEqual({ kind: "copy", cmd: virer.cmd })
		expect(toRun(virer, "")).toEqual({ kind: "copy", cmd: virer.cmd })
	})
	it("avec motif ⇒ body.motif", () => {
		const r = toRun(virer, "doublon")
		expect(r.kind).toBe("run")
		if (r.kind === "run") expect(r.body.motif).toBe("doublon")
	})
	it("motif 201 car. ⇒ copy", () => {
		expect(toRun(virer, "x".repeat(201)).kind).toBe("copy")
		expect(toRun(virer, "x".repeat(200)).kind).toBe("run")
	})
	it("exe hors schéma ⇒ copy", () => {
		expect(toRun({ ...integrer, exe: { tid: "T001" } }).kind).toBe("copy")
	})
})

describe("pilotActions", () => {
	it('("agentx") → 6 entrées projet agentx', () => {
		const a = pilotActions("agentx")
		expect(a).toHaveLength(6)
		expect(a.map((x) => x.k)).toEqual([
			"board",
			"ready",
			"doctor",
			"index",
			"personnel",
			"integrer",
		])
		for (const x of a) expect(x.body).toEqual({ action: x.k, projet: "agentx" })
	})
	it("(null) → projet absent", () => {
		expect(pilotActions(null)[0].body).toEqual({
			action: "board",
			projet: undefined,
		})
	})
})

describe("selectConsole", () => {
	it("projette taches journal pilotable projet", () => {
		const s = SalleStateSchema.parse(stateFixture)
		expect(selectConsole(s)).toEqual({
			taches: s.taches,
			journal: s.journal,
			pilotable: true,
			projet: "salle-v2",
		})
	})
})
