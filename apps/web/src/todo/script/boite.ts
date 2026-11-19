import type { SalleState, TodoItem } from "@/api/state/schema"
import { CHOIX, selectChoix, selectTodo } from "@/todo/script/select"

// Étiquette serveur des alertes remontées (sonde KO, erreur récurrente)
export const URGENT = "URGENT"

export type QuestionVue = {
	cle: string
	item: TodoItem
	etage: string
	etageNum: number | null
	etageTitre: string
	projet: string
}
export type GroupeVue = { projet: string; questions: QuestionVue[] } // ordre de 1re apparition (ordre serveur)
export type BoiteVue = {
	urgents: TodoItem[]
	groupes: GroupeVue[]
	autres: TodoItem[] // ni CHOIX ni URGENT
	total: number // choix de l'immeuble entier
	parEtage: { slug: string; num: number; titre: string; n: number }[] // n > 0, num décroissant
	filtre: string | null
}

export const cleQuestion = (i: TodoItem): string =>
	`${i.etage || i.projet}/${i.projet}/${i.titre}`

export function vueBoite(s: SalleState, etage: string | null): BoiteVue {
	const etages = s.immeuble?.etages ?? []
	const { items } = selectTodo(s, etage)
	const groupes: GroupeVue[] = []
	for (const item of items.filter((i) => i.etiquette === CHOIX)) {
		const slug = item.etage || item.projet
		const e = etages.find((x) => x.slug === slug)
		const q: QuestionVue = {
			cle: cleQuestion(item),
			item,
			etage: slug,
			etageNum: e?.num ?? null,
			etageTitre: e?.titre ?? slug,
			projet: item.projet,
		}
		const g = groupes.find((x) => x.projet === item.projet)
		if (g) g.questions.push(q)
		else groupes.push({ projet: item.projet, questions: [q] })
	}
	return {
		urgents: items.filter((i) => i.etiquette === URGENT),
		groupes,
		autres: items.filter(
			(i) => i.etiquette !== CHOIX && i.etiquette !== URGENT,
		),
		total: selectChoix(s, null).length,
		parEtage: etages
			.map((e) => ({
				slug: e.slug,
				num: e.num,
				titre: e.titre,
				n: selectChoix(s, e.slug).length,
			}))
			.filter((e) => e.n > 0)
			.sort((a, b) => b.num - a.num),
		filtre: etage,
	}
}

// Suivante cyclique ; [] ⇒ null ; courante absente ⇒ cles[0]
export function suivante(
	cles: string[],
	courante: string | null,
): string | null {
	if (cles.length === 0) return null
	const i = courante === null ? -1 : cles.indexOf(courante)
	return cles[(i + 1) % cles.length]
}
