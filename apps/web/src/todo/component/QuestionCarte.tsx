import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDoc } from "@/api/doc/hooks"
import Markdown from "@/shared/lib/markdown/Markdown"
import Button from "@/shared/ui/button"
import Modal from "@/shared/ui/modal"
import Text from "@/shared/ui/text"
import { ReponseZone } from "@/todo/component/ReponseZone"
import type { QuestionVue } from "@/todo/script/boite"
import { sansFrontmatter } from "@/todo/script/reponse"

export type QuestionCarteProps = {
	q: QuestionVue
	ouverte: boolean
	envoyee: boolean
	texte: string
	onTexte: (texte: string) => void
	onOuvrir: () => void
	onPasser: () => void
	onEnvoyer: () => void
	pending: boolean
	message: ReactNode
}

// Question à l'humain : en-tête cliquable, réponse dans la carte ouverte
export default function QuestionCarte({
	q,
	ouverte,
	envoyee,
	texte,
	onTexte,
	onOuvrir,
	onPasser,
	onEnvoyer,
	pending,
	message,
}: QuestionCarteProps) {
	const { t } = useTranslation("todo")
	const [voir, setVoir] = useState(false)
	const { data, error, isPending } = useDoc(
		q.item.doc,
		voir && q.item.doc !== "",
	)
	return (
		<article
			data-testid="todo-choix"
			className="flex min-w-0 flex-col gap-2 rounded-none border-l-[3px] border-warning bg-bg-panel px-3 py-2"
		>
			<div className="flex min-w-0 items-start gap-2">
				<button
					type="button"
					aria-expanded={ouverte}
					onClick={onOuvrir}
					className="flex min-h-10 min-w-0 flex-1 flex-col gap-1 text-left"
				>
					<span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">
						{t("boite.meta", {
							n: q.etageNum ?? "–",
							etage: q.etageTitre,
							projet: q.projet,
						})}
					</span>
					<span
						className={`break-words font-medium text-text ${ouverte ? "text-base" : "line-clamp-2 text-sm"}`}
					>
						{q.item.titre}
					</span>
				</button>
				{q.item.doc && (
					<Button
						size="sm"
						variant="outline"
						data-testid="choix-voir"
						onClick={() => setVoir(true)}
					>
						{t("choix.voir")}
					</Button>
				)}
			</div>
			{envoyee && (
				<Text variant="caption" className="text-success">
					{t("boite.envoyeAttente")}
				</Text>
			)}
			{ouverte && (
				<ReponseZone
					autoFocus
					texte={texte}
					onTexte={onTexte}
					onEnvoyer={onEnvoyer}
					onPasser={onPasser}
					pending={pending}
					message={message}
				/>
			)}
			<Modal
				open={voir}
				onClose={() => setVoir(false)}
				title={q.item.titre}
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
		</article>
	)
}
