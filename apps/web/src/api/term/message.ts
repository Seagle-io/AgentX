export const messageReponse = (titre: string, texte: string): string =>
	`Réponse à « ${titre.trim()} » : ${texte.trim().replace(/\r?\n+/g, " / ")}`
