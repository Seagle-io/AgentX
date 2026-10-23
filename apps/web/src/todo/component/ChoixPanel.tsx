import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDoc } from "@/api/doc/hooks"
import { useSalleState } from "@/api/state/hooks"
import type { TodoItem } from "@/api/state/schema"
import { useRepondre } from "@/api/term/hooks"
import Markdown from "@/shared/lib/markdown/Markdown"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Badge from "@/shared/ui/badge"
import Button from "@/shared/ui/button"
import Modal from "@/shared/ui/modal"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"
import { sansFrontmatter } from "@/todo/script/reponse"
import { selectChoix } from "@/todo/script/select"

type ReponseZoneProps = {
	texte: string
	onTexte: (texte: string) => void
	onEnvoyer: () => void
	pending: boolean
	message: ReactNode
	autoFocus?: boolean
	rows?: number
	compact?: boolean
}

// Corps de la fenêtre de réponse ; pas de Textarea dans le kit : natif, classes d'`Input`
export function ReponseZone({
	texte,
	onTexte,
	onEnvoyer,
	pending,
	message,
	autoFocus = true,
	rows = 4,
	compact = false,
}: ReponseZoneProps) {
	const { t } = useTranslation("todo")
	const vide = texte.trim() === ""
	return (
		<div
			className={
				compact ? "flex flex-wrap items-start gap-2" : "flex flex-col gap-3"
			}
		>
			<textarea
				data-testid="choix-reponse"
				rows={compact ? 1 : rows}
				// biome-ignore lint/a11y/noAutofocus: la fenêtre s'ouvre pour saisir
				autoFocus={autoFocus}
				data-autofocus={autoFocus ? "" : undefined}
				aria-label={t("choix.reponseLabel")}
				placeholder={t("choix.placeholder")}
				className={`${compact ? "min-w-0 flex-1 px-2 py-1" : "w-full px-3 py-2"} resize-y rounded-control border border-border bg-bg text-sm text-text outline-none transition-colors placeholder:text-text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-bg`}
				value={texte}
				onChange={(e) => onTexte(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && e.ctrlKey) onEnvoyer()
				}}
			/>
			{!compact && message}
			<div className="flex justify-end gap-2">
				<Button
					size="sm"
					variant="primary"
					data-testid="choix-envoyer"
					disabled={vide || pending}
					onClick={onEnvoyer}
				>
					{t("choix.envoyer")}
				</Button>
			</div>
			{compact && message}
		</div>
	)
}

// Questions posées à l'humain sur l'étage ; « Voir » ouvre le document lié, rien à 0 question
export default function ChoixPanel() {
	const { t } = useTranslation("todo")
	const slug = useSalleUi(selectFloor)
	const { data: items = [] } = useSalleState(slug, (s) => selectChoix(s, slug))
	const [ouvert, setOuvert] = useState<string | null>(null)
	const { data, error, isPending } = useDoc(ouvert, ouvert !== null)
	const repondre = useRepondre(slug)
	const [reponse, setReponse] = useState<TodoItem | null>(null)
	const [texte, setTexte] = useState("")
	const [deplie, setDeplie] = useState(false)
	const [derniere, setDerniere] = useState<string | null>(null)
	if (items.length === 0) return null
	const titreOuvert = (ouvert?.split("/").pop() ?? "").replace(/\.md$/, "")
	const ouvrirReponse = (item: TodoItem) => {
		repondre.reset()
		setReponse(item)
	}
	const fermerReponse = () => {
		setReponse(null)
		setTexte("")
	}
	const envoyer = () => {
		if (reponse === null || texte.trim() === "" || repondre.isPending) return
		setDerniere(`${reponse.projet}:${reponse.titre}`)
		repondre.mutate(
			{ titre: reponse.titre, texte },
			{
				onSuccess: (r) => {
					if (r.ok) fermerReponse()
				},
			},
		)
	}
	return (
		<Panel
			variant="alert"
			padding="none"
			data-testid="choix-panel"
			className="relative flex flex-col gap-1 px-3 py-2"
			onKeyDown={(e) => {
				if (e.key === "Escape" && deplie) {
					e.preventDefault()
					setDeplie(false)
				}
			}}
		>
			<div className="flex min-w-0 items-center gap-3">
				<Badge variant="error" size="sm">
					{t("choix.title")}
				</Badge>
				<Text variant="caption">
					{t("choix.attente", { count: items.length })}
				</Text>
				<Text variant="body" className="min-w-0 flex-1 truncate">
					{items[0].titre}
				</Text>
				<Button
					size="sm"
					variant="outline"
					data-testid="choix-deplier"
					aria-expanded={deplie}
					aria-controls="choix-tiroir"
					onClick={() => setDeplie(!deplie)}
				>
					{t("choix.voirTout")} {deplie ? "▴" : "▾"}
				</Button>
			</div>
			{
				<ol
					id="choix-tiroir"
					aria-label={t("choix.listLabel")}
					className={`absolute inset-x-0 top-full z-20 max-h-[45dvh] flex-col gap-1 overflow-y-auto rounded-control border border-border bg-bg px-3 py-2 shadow-lg ${deplie ? "flex" : "hidden"}`}
				>
					{items.map((item) => {
						const cle = `${item.projet}:${item.titre}`
						return (
							<li key={cle} className="flex min-w-0 items-center gap-3">
								<Text variant="body" className="min-w-0 flex-1 truncate">
									{item.titre}
								</Text>
								{derniere === cle && repondre.data?.ok && (
									<Text variant="caption">{t("choix.envoye")}</Text>
								)}
								{item.doc && (
									<Button
										size="sm"
										variant="outline"
										data-testid="choix-voir"
										onClick={() => setOuvert(item.doc)}
									>
										{t("choix.voir")}
									</Button>
								)}
								<Button
									size="sm"
									variant="primary"
									data-testid="choix-repondre"
									onClick={() => ouvrirReponse(item)}
								>
									{t("choix.repondre")}
								</Button>
							</li>
						)
					})}
				</ol>
			}
			<Modal
				open={ouvert !== null}
				onClose={() => setOuvert(null)}
				title={titreOuvert}
				closeLabel={t("choix.fermer")}
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
			<Modal
				open={reponse !== null}
				onClose={fermerReponse}
				title={reponse?.titre ?? ""}
				closeLabel={t("choix.fermer")}
			>
				{reponse !== null && (
					<ReponseZone
						texte={texte}
						onTexte={setTexte}
						onEnvoyer={envoyer}
						pending={repondre.isPending}
						message={
							<>
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
				)}
			</Modal>
		</Panel>
	)
}
