import { type KeyboardEvent, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useRunCommand } from "@/api/state/hooks"
import type { Action, RunBody, Tache } from "@/api/state/schema"
import { toRun } from "@/console/script/actions"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Button from "@/shared/ui/button"
import Input from "@/shared/ui/input"

type Props = { tache: Tache }
type Lancer = (body: RunBody) => void

// `libelle` serveur affiché tel quel : donnée, pas chaîne d'interface
const TaskActions = ({ tache }: Props) => {
	const slug = useSalleUi(selectFloor)
	const run = useRunCommand(slug)
	const lancer: Lancer = (body) => run.mutate({ body, scope: "projet" })
	return (
		<div className="flex flex-wrap items-center gap-1">
			{tache.actions.map((a) => (
				<ActionButton key={a.k} a={a} lancer={lancer} />
			))}
		</div>
	)
}

const ActionButton = ({ a, lancer }: { a: Action; lancer: Lancer }) => {
	const { t } = useTranslation("console")
	const [copied, setCopied] = useState(false)
	const [open, setOpen] = useState(false)
	useEffect(() => {
		if (!copied) return
		const id = setTimeout(() => setCopied(false), 1400)
		return () => clearTimeout(id)
	}, [copied])
	const executer = (motif?: string) => {
		const r = toRun(a, motif)
		if (r.kind === "run") lancer(r.body)
		else navigator.clipboard.writeText(r.cmd).then(() => setCopied(true))
	}
	const onClick = () => {
		if (a.saisie === "motif") setOpen((o) => !o)
		else executer()
	}
	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				title={copied ? t("copied") : undefined}
				onClick={onClick}
			>
				{a.libelle}
			</Button>
			{open && (
				<MotifInput
					onSubmit={(motif) => {
						setOpen(false)
						executer(motif)
					}}
					onCancel={() => setOpen(false)}
				/>
			)}
		</>
	)
}

type MotifProps = { onSubmit: (motif: string) => void; onCancel: () => void }

// Entrée ⇒ envoie, Échap ⇒ ferme ; vide à l'envoi ⇒ toRun rend copy
const MotifInput = ({ onSubmit, onCancel }: MotifProps) => {
	const { t } = useTranslation("console")
	const [motif, setMotif] = useState("")
	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") onSubmit(motif)
		else if (e.key === "Escape") onCancel()
	}
	return (
		<Input
			inputSize="sm"
			maxLength={200}
			placeholder={t("motif")}
			value={motif}
			onChange={(e) => setMotif(e.target.value)}
			onKeyDown={onKeyDown}
			className="w-48"
		/>
	)
}

export default TaskActions
