// Sortie du pty `claude auth login` : texte pur, sans React ni réseau
const ESC = "\x1b"
const BEL = "\x07"
const CSI = new RegExp(`${ESC}\\[[0-9;?]*[ -/]*[@-~]`, "g")
const OSC = new RegExp(`${ESC}\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)`, "g")
const URL_HTTPS = /https:\/\/[^\s"'<>]+/g

// base64 du flux → texte ; `dec` partagé garde les UTF-8 coupés entre messages
export function decoderB64(o: string, dec: TextDecoder): string {
	const bin = atob(o)
	const octets = new Uint8Array(bin.length)
	for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i)
	return dec.decode(octets, { stream: true })
}

// ôte les séquences ANSI et les \r isolés ; garde \n
export function nettoyer(texte: string): string {
	return texte
		.replace(OSC, "")
		.replace(CSI, "")
		.replace(/\r\n/g, "\n")
		.replace(/\r/g, "")
}

// dernière URL https de la sortie ; jamais http: ni un autre schéma
export function extraireUrl(texte: string): string | null {
	const trouvees = nettoyer(texte).match(URL_HTTPS)
	return trouvees ? trouvees[trouvees.length - 1] : null
}

export function dernieresLignes(texte: string, n = 40): string {
	return texte.split("\n").slice(-n).join("\n")
}
