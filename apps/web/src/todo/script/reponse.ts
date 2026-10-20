// Retire un bloc frontmatter de tête, sinon texte inchangé
export const sansFrontmatter = (texte: string): string =>
	texte.replace(/^---\n[\s\S]*?\n---\n/, "").trimStart()
