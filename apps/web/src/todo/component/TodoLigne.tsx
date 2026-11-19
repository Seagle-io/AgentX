import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import type { RunBody, TodoItem } from "@/api/state/schema"
import Badge, { type BadgeVariant } from "@/shared/ui/badge"
import Button from "@/shared/ui/button"
import Icon from "@/shared/ui/icon"
import Text from "@/shared/ui/text"
import { URGENT } from "@/todo/script/boite"
import { CHOIX, canRun } from "@/todo/script/select"

// 5 étiquettes serveur connues ; autre ⇒ neutral
const variants: Record<string, BadgeVariant> = {
	[URGENT]: "error",
	"À FAIRE": "accent",
	"À LANCER": "success",
	"À DÉCIDER": "warning",
	[CHOIX]: "warning",
}

type TodoLigneProps = {
	item: TodoItem
	num: number | undefined
	autre: boolean
	pending: boolean
	onRun: (body: RunBody) => void
}

// Ligne todo : étiquette, titre, commande, ▶ lancer, copier ; URGENT ⇒ bord error
export default function TodoLigne({
	item,
	num,
	autre,
	pending,
	onRun,
}: TodoLigneProps) {
	const { t } = useTranslation("todo")
	const navigate = useNavigate()
	const body = canRun(item)
	const cible = item.etage || item.projet
	return (
		<li
			className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 rounded-none px-2 py-1.5 hover:bg-surface ${item.etiquette === URGENT ? "border-l-[3px] border-error" : ""}`}
		>
			<Badge size="sm" variant={variants[item.etiquette] ?? "neutral"}>
				{item.etiquette}
			</Badge>
			<span className="flex min-w-0 flex-col gap-0.5">
				<Text as="span" className="break-words font-medium">
					{item.titre}
				</Text>
				{item.detail !== "" && (
					<Text as="span" variant="muted">
						{item.detail}
					</Text>
				)}
				<span className="flex min-w-0 items-center gap-2">
					{item.cmd !== "" && (
						<Text
							as="span"
							variant="mono"
							className="min-w-0 truncate text-text-dim"
							title={item.cmd}
						>
							{item.cmd}
						</Text>
					)}
					{autre && cible !== "" && (
						<Button
							variant="link"
							size="sm"
							className="shrink-0 font-mono"
							title={t("goFloor")}
							onClick={() => navigate(`/floor/${cible}`)}
						>
							{num === undefined ? cible : t("allerEtage", { n: num })}
						</Button>
					)}
				</span>
			</span>
			<span className="flex gap-0.5">
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
			</span>
		</li>
	)
}
