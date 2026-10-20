import { describe, expect, it } from "vitest"
import {
	decoderB64,
	dernieresLignes,
	extraireUrl,
	nettoyer,
} from "@/console/script/login"

const ESC = "\x1b"
const BEL = "\x07"
const b64 = (octets: number[]) => btoa(String.fromCharCode(...octets))

describe("nettoyer", () => {
	it("ôte les séquences CSI", () => {
		expect(nettoyer(`${ESC}[31mrouge${ESC}[0m ${ESC}[2K${ESC}[?25hok`)).toBe(
			"rouge ok",
		)
	})
	it("ôte les OSC terminés par BEL ou ST", () => {
		expect(nettoyer(`${ESC}]0;titre${BEL}a${ESC}]8;;x${ESC}\\b`)).toBe("ab")
	})
	it("supprime les \\r isolés, garde \\n et réduit \\r\\n", () => {
		expect(nettoyer("a\rb\r\nc\nd")).toBe("ab\nc\nd")
	})
	it("texte vide ⇒ vide", () => {
		expect(nettoyer("")).toBe("")
	})
})

describe("extraireUrl", () => {
	it("prend la dernière URL https", () => {
		expect(extraireUrl("a https://un.fr/x\nb https://deux.fr/y?z=1 fin")).toBe(
			"https://deux.fr/y?z=1",
		)
	})
	it("URL coupée par des séquences ANSI lue après nettoyage", () => {
		expect(extraireUrl(`${ESC}[1mhttps://a.fr/p${ESC}[0m`)).toBe(
			"https://a.fr/p",
		)
	})
	it("http: ⇒ null", () => {
		expect(extraireUrl("voir http://a.fr/x")).toBeNull()
	})
	it("javascript: ⇒ null", () => {
		expect(extraireUrl("javascript:alert(1)")).toBeNull()
	})
	it("aucune URL ⇒ null", () => {
		expect(extraireUrl("")).toBeNull()
	})
})

describe("decoderB64", () => {
	it("UTF-8 coupé entre 2 appels stream ⇒ aucun caractère perdu", () => {
		const dec = new TextDecoder()
		// « é » = C3 A9, coupé après C3
		const a = decoderB64(b64([0x61, 0xc3]), dec)
		const b = decoderB64(b64([0xa9, 0x62]), dec)
		expect(a).toBe("a")
		expect(b).toBe("éb")
		expect(a + b).not.toContain("�")
	})
	it("ASCII simple", () => {
		expect(decoderB64(btoa("hello"), new TextDecoder())).toBe("hello")
	})
})

describe("dernieresLignes", () => {
	const dix = Array.from({ length: 10 }, (_, i) => `l${i}`).join("\n")
	it("garde les n dernières lignes", () => {
		expect(dernieresLignes(dix, 3)).toBe("l7\nl8\nl9")
	})
	it("moins de n lignes ⇒ intact", () => {
		expect(dernieresLignes("a\nb", 5)).toBe("a\nb")
	})
	it("n par défaut = 40", () => {
		const cent = Array.from({ length: 100 }, (_, i) => `${i}`).join("\n")
		expect(dernieresLignes(cent).split("\n")).toHaveLength(40)
	})
})
