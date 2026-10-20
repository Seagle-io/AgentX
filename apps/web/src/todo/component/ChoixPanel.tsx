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
}: ReponseZoneProps) {
	const { t } = useTranslation("todo")
	const vide = texte.trim() === ""
	return (
		<div className="flex flex-col gap-3">
			<textarea
				data-testid="choix-reponse"
				rows={rows}
				// biome-ignore lint/a11y/noAutofocus: la fenêtre s'ouvre pour saisir
				autoFocus={autoFocus}
				data-autofocus={autoFocus ? "" : undefined}
				aria-label={t("choix.reponseLabel")}
				placeholder={t("choix.placeholder")}
				className="w-full resize-y rounded-control border border-border bg-bg px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-bg"
				value={texte}
				onChange={(e) => onTexte(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && e.ctrlKey) onEnvoyer()
				}}
			/>
			{message}
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
		<Panel variant="alert" data-testid="choix-panel">
			<Text variant="h3">
				{t("choix.title")}{" "}
				<Badge variant="error" size="sm">
					{items.length}
				</Badge>
			</Text>
			<Text variant="muted">{t("choix.hint")}</Text>
			<ol
				aria-label={t("choix.listLabel")}
				className="mt-2 flex flex-col gap-2"
			>
				{items.map((item) => {
					const cle = `${item.projet}:${item.titre}`
					return (
						<li
							key={cle}
							className="flex flex-col gap-2 break-words rounded-control border border-border-subtle bg-surface px-3 py-2"
						>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
								{item.titre}
								<div className="flex gap-2 self-end sm:self-auto">
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
								</div>
							</div>
							{derniere === cle && repondre.data?.ok && (
								<Text variant="caption">{t("choix.envoye")}</Text>
							)}
						</li>
					)
				})}
			</ol>
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
