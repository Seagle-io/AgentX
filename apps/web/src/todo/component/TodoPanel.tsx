import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { useRunCommand, useSalleState } from "@/api/state/hooks"
import type { RunBody, TodoItem } from "@/api/state/schema"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
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
			{item.projet !== "" && (
				<Button
					variant="link"
					size="sm"
					className="max-w-[8rem] shrink-0 truncate"
					title={t("goFloor")}
					onClick={() => navigate(`/floor/${item.projet}`)}
				>
					{floor?.titre ?? item.projet}
				</Button>
			)}
		</li>
	)
}

const TodoPanel = () => {
	const { t } = useTranslation("todo")
	const slug = useSalleUi(selectFloor)
	const { data } = useSalleState(slug, selectTodo)
	const run = useRunCommand(slug)
	const items = data?.items ?? []
	const floors = data?.floors ?? []
	return (
		<Panel>
			<Text variant="h3">
				{t("title")}{" "}
				<Text as="span" variant="muted">
					{t("count", { n: items.length, total: data?.total ?? 0 })}
				</Text>
			</Text>
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
		</Panel>
	)
}

export default TodoPanel
