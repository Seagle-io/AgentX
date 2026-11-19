import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { useRunCommand, useSalleState } from "@/api/state/hooks"
import type { TodoItem } from "@/api/state/schema"
import { useRepondre } from "@/api/term/hooks"
import { cn } from "@/shared/lib/utils"
import Text from "@/shared/ui/text"
import DemandesPanel from "@/todo/component/DemandesPanel"
import QuestionCarte from "@/todo/component/QuestionCarte"
import TodoLigne from "@/todo/component/TodoLigne"
import {
	type BoiteVue,
	type QuestionVue,
	suivante,
	vueBoite,
} from "@/todo/script/boite"

type Props = { etage: string | null }

const chip = (actif: boolean) =>
	cn(
		"min-h-8 rounded-none border px-3 font-mono text-[11px] uppercase tracking-[0.1em]",
		actif
			? "border-warning bg-bg text-warning"
			: "border-border text-text-muted hover:bg-surface",
	)

// Chips : Tous ⇒ « / », étage ⇒ `/floor/<slug>` ; aria-pressed = filtre courant
function Filtres({ vue }: { vue: BoiteVue }) {
	const { t } = useTranslation("todo")
	const navigate = useNavigate()
	return (
		<fieldset
			aria-label={t("boite.filtres")}
			className="flex flex-wrap gap-2 border-0 p-0"
		>
			<button
				type="button"
				aria-pressed={vue.filtre === null}
				className={chip(vue.filtre === null)}
				onClick={() => navigate("/")}
			>
				{t("boite.tous", { n: vue.total })}
			</button>
			{vue.parEtage.map((e) => (
				<button
					key={e.slug}
					type="button"
					aria-pressed={vue.filtre === e.slug}
					className={chip(vue.filtre === e.slug)}
					onClick={() => navigate(`/floor/${e.slug}`)}
				>
					{e.titre} · {e.n}
				</button>
			))}
		</fieldset>
	)
}

type Repondre = ReturnType<typeof useRepondre>

const Message = ({ repondre }: { repondre: Repondre }) => {
	const { t } = useTranslation("todo")
	return (
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
	)
}

// État local de la boîte : carte ouverte, brouillons, envoyées ; envoi = séquence du contrat
function useReponses(etage: string | null, questions: QuestionVue[]) {
	const repondre = useRepondre(etage)
	const [choisie, setChoisie] = useState<string | null>(null)
	const [brouillons, setBrouillons] = useState<Record<string, string>>({})
	const [envoyees, setEnvoyees] = useState<string[]>([])
	const cles = questions.map((q) => q.cle)
	const ouverte =
		choisie !== null && cles.includes(choisie) ? choisie : (cles[0] ?? null)
	const aller = (cle: string | null) => {
		repondre.reset()
		setChoisie(cle)
	}
	const ecrire = (cle: string, texte: string) => {
		repondre.reset()
		setBrouillons({ ...brouillons, [cle]: texte })
	}
	const envoyer = () => {
		const q = questions.find((x) => x.cle === ouverte)
		const texte = q ? (brouillons[q.cle] ?? "") : ""
		if (!q || texte.trim() === "" || repondre.isPending) return
		repondre.mutate(
			{ titre: q.item.titre, texte, etage: q.etage },
			{
				onSuccess: (r) => {
					if (!r.ok) return
					setBrouillons({ ...brouillons, [q.cle]: "" })
					setEnvoyees([...envoyees, q.cle])
					aller(suivante(cles, q.cle))
				},
			},
		)
	}
	return {
		repondre,
		cles,
		ouverte,
		brouillons,
		envoyees,
		aller,
		ecrire,
		envoyer,
	}
}

// Boîte de décisions : urgents, questions par projet (1 seule réponse ouverte), à faire, demandes
export default function BoiteDecisions({ etage }: Props) {
	const { t } = useTranslation("todo")
	const { data } = useSalleState(etage, (s) => ({
		vue: vueBoite(s, etage),
		nums: Object.fromEntries(s.immeuble.etages.map((e) => [e.slug, e.num])),
	}))
	const run = useRunCommand(etage)
	const questions = data?.vue.groupes.flatMap((g) => g.questions) ?? []
	const r = useReponses(etage, questions)
	if (!data) return null
	const { vue, nums } = data
	const ligne = (item: TodoItem) => (
		<TodoLigne
			key={`${item.projet}/${item.titre}`}
			item={item}
			num={nums[item.etage || item.projet]}
			autre={(item.etage || item.projet) !== etage}
			pending={run.isPending}
			onRun={(body) => run.mutate({ body, scope: "agrege" })}
		/>
	)
	return (
		<section
			data-testid="boite-decisions"
			className="flex min-w-0 flex-col gap-4"
		>
			<header className="flex flex-wrap items-baseline gap-3">
				<Text variant="h2">{t("boite.titre")}</Text>
				<Text as="span" variant="muted">
					{t("boite.resume", { n: vue.total, u: vue.urgents.length })}
				</Text>
			</header>
			<Filtres vue={vue} />
			{questions.length === 0 && <Text variant="muted">{t("boite.vide")}</Text>}
			{vue.urgents.length > 0 && <ul>{vue.urgents.map(ligne)}</ul>}
			{vue.groupes.map((g) => (
				<div key={g.projet} className="flex flex-col gap-2">
					<Text variant="h3">
						{t("boite.groupe", { projet: g.projet, n: g.questions.length })}
					</Text>
					{g.questions.map((q) => (
						<QuestionCarte
							key={q.cle}
							q={q}
							ouverte={q.cle === r.ouverte}
							envoyee={r.envoyees.includes(q.cle)}
							texte={r.brouillons[q.cle] ?? ""}
							onTexte={(v) => r.ecrire(q.cle, v)}
							onOuvrir={() => r.aller(q.cle === r.ouverte ? null : q.cle)}
							onPasser={() => r.aller(suivante(r.cles, r.ouverte))}
							onEnvoyer={r.envoyer}
							pending={r.repondre.isPending}
							message={<Message repondre={r.repondre} />}
						/>
					))}
				</div>
			))}
			{vue.autres.length > 0 && (
				<div className="flex flex-col gap-2">
					<Text variant="h3">{t("title")}</Text>
					<ul className="flex flex-col divide-y divide-border-subtle">
						{vue.autres.map(ligne)}
					</ul>
				</div>
			)}
			<DemandesPanel />
		</section>
	)
}
