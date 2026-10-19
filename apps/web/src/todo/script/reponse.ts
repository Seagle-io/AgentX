// Message envoyé au chef : 1 ligne, sans retour chariot (Entrée envoyée à part)
export const messageReponse = (titre: string, texte: string): string =>
	`Réponse à « ${titre.trim()} » : ${texte.trim().replace(/\r?\n+/g, " / ")}`

// Retire un bloc frontmatter de tête, sinon texte inchangé
export const sansFrontmatter = (texte: string): string =>
	texte.replace(/^---\n[\s\S]*?\n---\n/, "")
