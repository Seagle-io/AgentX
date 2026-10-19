import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { useRunCommand, useSalleState } from "@/api/state/hooks"
import type { RunBody, TodoItem } from "@/api/state/schema"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"
import Badge, { type BadgeVariant } from "@/shared/ui/badge"
import Button from "@/shared/ui/button"
import Icon from "@/shared/ui/icon"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"
import { canRun, type Floor, selectTodo } from "@/todo/script/select"

// 4 étiquettes serveur connues ; autre ⇒ neutral
const variants: Record<string, BadgeVariant> = {
	URGENT: "error",
	"À FAIRE": "accent",
	"À LANCER": "success",
	"À DÉCIDER": "warning",
}

type RowProps = {
	item: TodoItem
	floors: Floor[]
	pending: boolean
	onRun: (body: RunBody) => void
}

const TodoRow = ({ item, floors, pending, onRun }: RowProps) => {
	const { t } = useTranslation("todo")
	const navigate = useNavigate()
	const body = canRun(item)
	const floor = floors.find((f) => f.slug === item.projet)
	return (
		<li className="flex min-w-0 items-start gap-2">
			<Badge size="sm" variant={variants[item.etiquette] ?? "neutral"}>
				{item.etiquette}
			</Badge>
			<span className="flex min-w-0 flex-1 flex-col">
				<Text as="span" className="break-words">
					{item.titre}
				</Text>
				{item.detail !== "" && (
					<Text as="span" variant="muted">
						{item.detail}
					</Text>
				)}
				{item.cmd !== "" && (
					<Text as="span" variant="mono" className="truncate" title={item.cmd}>
						{item.cmd}
					</Text>
				)}
				{/* Sous le titre : en ligne il ne resterait que 65 px au texte (22 rem) */}
				{item.projet !== "" && (
					<Button
						variant="link"
						size="sm"
						className="max-w-full shrink-0 self-start"
						title={t("goFloor")}
						onClick={() => navigate(`/floor/${item.projet}`)}
					>
						{/* `truncate` sur le bouton (inline-flex centré) rogne des 2 côtés */}
						<span className="truncate">{floor?.titre ?? item.projet}</span>
					</Button>
				)}
			</span>
			{body && (
				<Button
					size="icon"
					variant="ghost"
					title={t("run")}
					disabled={pending}
					onClick={() => onRun(body)}
				>
					<Icon name="play" title={t("run")} />
				</Button>
			)}
			{item.cmd !== "" && (
				<Button
					size="icon"
					variant="ghost"
					title={t("copy")}
					onClick={() => navigator.clipboard.writeText(item.cmd)}
				>
					<Icon name="copy" title={t("copy")} />
				</Button>
			)}
		</li>
	)
}

const TodoPanel = () => {
	const { t } = useTranslation("todo")
	const slug = useSalleUi(selectFloor)
	const view = useSalleUi(selectView)
	const filter = view === "floor" ? slug : null
	const { data } = useSalleState(slug, (s) => selectTodo(s, filter))
	const run = useRunCommand(slug)
	const items = data?.items ?? []
	const floors = data?.floors ?? []
	const total = data?.total ?? 0
	return (
		<Panel>
			<Text variant="h3">
				{t("title")}{" "}
				<Text as="span" variant="muted">
					{t("count", { total })}
				</Text>
				{items.length < total && (
					<Badge size="sm" variant="neutral" className="ml-2">
						{t("more", { n: total - items.length })}
					</Badge>
				)}
			</Text>
			{/* Bornée comme en v1 : défilement interne, focus clavier */}
			<section
				// biome-ignore lint/a11y/noNoninteractiveTabindex: zone défilante au clavier (WCAG 2.1.1)
				tabIndex={0}
				aria-label={t("listLabel")}
				className="overflow-y-auto overscroll-contain max-h-[24rem]"
			>
				<ul className="flex flex-col gap-1">
					{items.map((item) => (
						<TodoRow
							key={`${item.projet}/${item.titre}`}
							item={item}
							floors={floors}
							pending={run.isPending}
							onRun={(body) => run.mutate({ body, scope: "agrege" })}
						/>
					))}
				</ul>
			</section>
		</Panel>
	)
}

export default TodoPanel
