import {
	type RunBody,
	RunBodySchema,
	type SalleState,
	type TodoItem,
} from "@/api/state/schema"

type Floor = { slug: string; titre: string }
type TodoView = { items: TodoItem[]; total: number; floors: Floor[] }

// Ordre serveur conservé : le tri (prio) est fait côté dash.py
export const selectTodo = (s: SalleState): TodoView => ({
	items: s.todo,
	total: s.todo_total,
	floors: (s.immeuble?.etages ?? []).map(({ slug, titre }) => ({
		slug,
		titre,
	})),
})

// `exe` validé seulement ici : null ou forme inconnue ⇒ pas de bouton ▶
export const canRun = (item: TodoItem): RunBody | null => {
	const parsed = RunBodySchema.safeParse(item.exe)
	return parsed.success ? parsed.data : null
}

export type { Floor, TodoView }
