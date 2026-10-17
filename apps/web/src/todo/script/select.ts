import {
	type RunBody,
	RunBodySchema,
	type SalleState,
	type TodoItem,
} from "@/api/state/schema"

type Floor = { slug: string; titre: string }
type TodoView = { items: TodoItem[]; total: number; floors: Floor[] }

// Ordre serveur conservé : le tri (prio) est fait côté dash.py
// `slug` (vue étage) : items de l'étage, total = todo de l'étage ; null = agrégé
export const selectTodo = (
	s: SalleState,
	slug: string | null = null,
): TodoView => {
	const etages = s.immeuble?.etages ?? []
	const floors = etages.map(({ slug, titre }) => ({ slug, titre }))
	if (slug === null) return { items: s.todo, total: s.todo_total, floors }
	const items = s.todo.filter((i) => i.projet === slug)
	const total = etages.find((e) => e.slug === slug)?.todo ?? items.length
	return { items, total, floors }
}

// `exe` validé seulement ici : null ou forme inconnue ⇒ pas de bouton ▶
export const canRun = (item: TodoItem): RunBody | null => {
	const parsed = RunBodySchema.safeParse(item.exe)
	return parsed.success ? parsed.data : null
}

export type { Floor, TodoView }
