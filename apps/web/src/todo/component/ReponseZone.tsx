import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/button"
import Text from "@/shared/ui/text"

export type ReponseZoneProps = {
	texte: string
	onTexte: (texte: string) => void
	onEnvoyer: () => void
	onPasser?: () => void
	pending: boolean
	message: ReactNode
	autoFocus?: boolean
	rows?: number
}

// Zone de réponse ; pas de Textarea dans le kit : natif, classes d'`Input`
export function ReponseZone({
	texte,
	onTexte,
	onEnvoyer,
	onPasser,
	pending,
	message,
	autoFocus = false,
	rows = 4,
}: ReponseZoneProps) {
	const { t } = useTranslation("todo")
	const vide = texte.trim() === ""
	return (
		<div className="flex flex-col gap-3">
			<textarea
				data-testid="choix-reponse"
				rows={rows}
				// biome-ignore lint/a11y/noAutofocus: la carte s'ouvre pour saisir
				autoFocus={autoFocus}
				aria-label={t("choix.reponseLabel")}
				placeholder={t("choix.placeholder")}
				className="w-full resize-y rounded-none border border-border bg-bg px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-bg"
				value={texte}
				onChange={(e) => onTexte(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && e.ctrlKey) onEnvoyer()
				}}
			/>
			{message}
			<div className="flex items-center justify-end gap-2">
				<Text as="span" variant="muted" className="mr-auto text-[11px]">
					{t("boite.raccourci")}
				</Text>
				{onPasser && (
					<Button
						size="sm"
						variant="outline"
						data-testid="question-passer"
						onClick={onPasser}
					>
						{t("boite.passer")}
					</Button>
				)}
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

export default ReponseZone
