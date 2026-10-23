import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { useDoc } from "@/api/doc/hooks"
import { useRunCommand, useSalleState } from "@/api/state/hooks"
import type { RunBody, TodoItem } from "@/api/state/schema"
import { useRepondre } from "@/api/term/hooks"
import Markdown from "@/shared/lib/markdown/Markdown"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"
import { cn } from "@/shared/lib/utils"
import Badge, { type BadgeVariant } from "@/shared/ui/badge"
import Button from "@/shared/ui/button"
import Icon from "@/shared/ui/icon"
import Modal from "@/shared/ui/modal"
import Text from "@/shared/ui/text"
import { ReponseZone } from "@/todo/component/ChoixPanel"
import DemandesPanel from "@/todo/component/DemandesPanel"
import { sansFrontmatter } from "@/todo/script/reponse"
import { CHOIX, canRun, selectTodo } from "@/todo/script/select"

// 4 étiquettes serveur connues ; autre ⇒ neutral
const variants: Record<string, BadgeVariant> = {
	URGENT: "error",
	"À FAIRE": "accent",
	"À LANCER": "success",
	"À DÉCIDER": "warning",
	[CHOIX]: "error",
}

type RowProps = {
	item: TodoItem
	num: number | undefined
	autre: boolean
	pending: boolean
	onRun: (body: RunBody) => void
}

const TodoRow = ({ item, num, autre, pending, onRun }: RowProps) => {
	const { t } = useTranslation("todo")
	const navigate = useNavigate()
	const body = canRun(item)
	return (
		<li className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 rounded-control border border-transparent px-2 py-1.5 hover:bg-surface">
			<Badge size="sm" variant={variants[item.etiquette] ?? "neutral"}>
				{item.etiquette}
			</Badge>
			<span className="flex min-w-0 flex-col gap-0.5">
				<Text as="span" className="break-words text-[12.5px] font-medium">
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
					{autre && item.projet !== "" && (
						<Button
							variant="link"
							size="sm"
							className="shrink-0 font-mono"
							title={t("goFloor")}
							onClick={() => navigate(`/floor/${item.projet}`)}
						>
							{num === undefined ? item.projet : t("allerEtage", { n: num })}
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

// Question à l'humain : carte distincte, réponse directe sous le titre
const ChoixRow = ({ item, slug }: { item: TodoItem; slug: string | null }) => {
	const { t } = useTranslation("todo")
	const repondre = useRepondre(slug)
	const [texte, setTexte] = useState("")
	const [ouvert, setOuvert] = useState(false)
	const [deplie, setDeplie] = useState(false)
	const { data, error, isPending } = useDoc(item.doc, ouvert && item.doc !== "")
	const envoyer = () => {
		if (texte.trim() === "" || repondre.isPending) return
		repondre.mutate(
			{ titre: item.titre, texte, etage: item.projet || undefined },
			{
				onSuccess: (r) => {
					if (r.ok) setTexte("")
				},
			},
		)
	}
	return (
		<li
			data-testid="todo-choix"
			className="flex min-w-0 flex-col gap-1 rounded-control border border-border-subtle bg-surface px-3 py-2"
		>
			<span className="flex items-center justify-between gap-2">
				<Badge size="sm" variant={variants[item.etiquette] ?? "neutral"}>
					{item.etiquette}
				</Badge>
				<Text
					as="span"
					className={
						deplie
							? "min-w-0 flex-1 break-words"
							: "min-w-0 flex-1 break-words line-clamp-1"
					}
					title={item.titre}
					onClick={item.doc ? undefined : () => setDeplie(!deplie)}
				>
					{item.titre}
				</Text>
				{item.doc && (
					<Button
						size="sm"
						variant="outline"
						data-testid="choix-voir"
						onClick={() => setOuvert(true)}
					>
						{t("choix.voir")}
					</Button>
				)}
			</span>
			<ReponseZone
				autoFocus={false}
				compact
				texte={texte}
				onTexte={(v) => {
					repondre.reset()
					setTexte(v)
				}}
				onEnvoyer={envoyer}
				pending={repondre.isPending}
				message={
					<>
						{repondre.data?.ok && (
							<Text variant="caption" className="text-success">
								{t("choix.envoye")}
							</Text>
						)}
						{repondre.data?.mort && (
							<Text variant="caption" className="text-error" role="alert">
								{t("choix.chefAbsent")}
							</Text>
						)}
						{repondre.error && (
							<Text variant="caption" className="text-error" role="alert">
								{t("choix.erreurEnvoi")} {repondre.error.message}
							</Text>
						)}
					</>
				}
			/>
			<Modal
				open={ouvert}
				onClose={() => setOuvert(false)}
				title={item.titre}
				size="lg"
			>
				{isPending ? (
					t("choix.chargement")
				) : error ? (
					<>
						{t("choix.erreur")} {error.message}
					</>
				) : (
					<>
						<Markdown texte={sansFrontmatter(data.texte)} />
						{data.tronque && <Text variant="muted">{t("choix.tronque")}</Text>}
					</>
				)}
			</Modal>
		</li>
	)
}

const Filtre = ({
	actif,
	disabled,
	onClick,
	children,
}: {
	actif: boolean
	disabled?: boolean
	onClick: () => void
	children: string
}) => (
	<button
		type="button"
		aria-pressed={actif}
		disabled={disabled}
		onClick={onClick}
		className={cn(
			"h-[22px] rounded-full border px-2 text-[11px] font-medium disabled:opacity-40",
			actif
				? "border-accent bg-accent-bg text-accent"
				: "border-border text-text-muted hover:bg-surface",
		)}
	>
		{children}
	</button>
)

// Colonne todo : filtre étage|immeuble (étage seulement sur une vue étage), demandes en bas
const TodoPanel = () => {
	const { t } = useTranslation("todo")
	const slug = useSalleUi(selectFloor)
	const view = useSalleUi(selectView)
	const [immeuble, setImmeuble] = useState(false)
	const surEtage = view === "floor"
	const filter = surEtage && !immeuble ? slug : null
	const { data } = useSalleState(slug, (s) => ({
		...selectTodo(s, filter),
		nums: Object.fromEntries(s.immeuble.etages.map((e) => [e.slug, e.num])),
	}))
	const run = useRunCommand(slug)
	const items = data?.items ?? []
	const total = data?.total ?? 0
	return (
		<aside className="grid min-h-0 min-w-0 grid-rows-[40px_minmax(0,1fr)] border-l border-border bg-bg-panel">
			<div className="flex items-center gap-2 border-b border-border-subtle px-3">
				<Text variant="h3" className="text-[11px] uppercase tracking-wide">
					{t("title")}
				</Text>
				<Text as="span" variant="mono">
					{items.length}
					<span className="text-text-dim"> / {total}</span>
				</Text>
				<span className="ml-auto flex gap-1">
					<Filtre
						actif={filter !== null}
						disabled={!surEtage}
						onClick={() => setImmeuble(false)}
					>
						{t("filtreEtage")}
					</Filtre>
					<Filtre actif={filter === null} onClick={() => setImmeuble(true)}>
						{t("filtreImmeuble")}
					</Filtre>
				</span>
			</div>
			{/* Bornée : défilement interne, focus clavier */}
			<section
				// biome-ignore lint/a11y/noNoninteractiveTabindex: zone défilante au clavier (WCAG 2.1.1)
				tabIndex={0}
				aria-label={t("listLabel")}
				className="min-h-0 overflow-y-auto overscroll-contain px-2 py-1.5"
			>
				<ul className="flex flex-col gap-0.5">
					{items.map((item) =>
						item.etiquette === CHOIX ? (
							<ChoixRow
								key={`${item.projet}/${item.titre}`}
								item={item}
								slug={slug}
							/>
						) : (
							<TodoRow
								key={`${item.projet}/${item.titre}`}
								item={item}
								num={data?.nums[item.projet]}
								autre={item.projet !== (surEtage ? slug : null)}
								pending={run.isPending}
								onRun={(body) => run.mutate({ body, scope: "agrege" })}
							/>
						),
					)}
				</ul>
				<DemandesPanel />
			</section>
		</aside>
	)
}

export default TodoPanel
