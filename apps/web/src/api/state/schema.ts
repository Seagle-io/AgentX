import { z } from "zod"

// Zod 4 : z.object = strip (clés inconnues ignorées) ; énumérations fermées ⇒ .catch() ; listes et nombres non bornés
const S = z.string()
const N = z.number()
const B = z.boolean()

export const SlugSchema = S.regex(/^[a-z0-9][a-z0-9-]{0,47}$/)
const Exe = z.record(S, z.unknown()).nullable() // validé par RunBodySchema à l'envoi
const Alerte = z.object({ niveau: S, texte: S })

export const DemoSchema = B
export const JetonSchema = S
export const PilotableSchema = B
export const TickerSchema = S
export const TodoTotalSchema = N
export const RegistreErreurSchema = S

export const EvenementSchema = z.object({
	id: S,
	t: S,
	quoi: z.enum(["agent-fini", "agent-bloque"]).catch("agent-fini"),
	role: S,
	tid: S,
	statut: S,
	verdict: S,
	projet: S,
})
export const FluxSchema = z.object({
	de: S,
	vers: S,
	de_tid: S,
	vers_tid: S,
	quoi: S,
	objet: S,
	objet_nom: S,
	etat: z.enum(["attente", "livre", "actif", "bloque"]).catch("attente"),
})
export const HeureSchema = S // "HH:MM"
export const HorodateSchema = S // "HH:MM:SS"
export const EtageSchema = z.object({
	slug: S,
	titre: S,
	statut: S,
	rang: N,
	num: N,
	activite: S,
	age_j: N,
	dormant: B,
	compteurs: z.record(S, N),
	total: N,
	agents: z.array(z.object({ role: S, tid: S })),
	todo: N,
	alerte: Alerte,
	selection: B,
})
export const SousSolSchema = z.object({
	slug: S,
	titre: S,
	statut: S,
	source: S,
	maj: S,
	selectionnable: B,
})
export const ImmeubleSchema = z
	.object({
		selection: z.object({
			slug: S,
			source: z
				.enum(["requete", "epingle", "activite", "defaut"])
				.catch("defaut"),
			refus: S,
		}),
		epingle: S,
		toit: z.object({
			chef: z.object({ vivant: B.nullable() }),
			todo: N,
			urgent: N,
			etages: N,
			dormants: N,
			alerte: Alerte,
		}),
		etages: z.array(EtageSchema),
		sous_sol: z.array(SousSolSchema),
		mesure_ms: N,
	})
	.nullable() // null en démo
export const JournalSchema = z.array(S)
export const StatutsSchema = z.array(S) // statuts : 8, source unique côté front
const LigneRH = z.object({
	cle: S,
	taches: N,
	livrees: N,
	retenues: N,
	virees: N,
	en_revue: N,
	taux_renvoi: N.nullable(), // null en réel (rôle sans tâche)
})
export const PersonnelSchema = z
	.object({
		perimetre: S,
		projets: N,
		archives: N,
		taches: N,
		roles: z.array(LigneRH),
		modeles: z.array(LigneRH),
	})
	.partial() // {} si rh.py lève
export const PipelineSchema = z.array(z.object({ k: S, n: N })) // 7, ordre serveur, sans 'abandonne'
export const ProjetSchema = z.object({
	slug: S,
	titre: S,
	statut: S,
	objectif: S,
	depot: S,
})
export const RoleSchema = z.object({
	cle: S,
	nom: S,
	sous: S,
	label: S,
	couleur: S,
	modele: S,
	affectable: B,
	livre_en: S,
	juge: B,
	objet: S,
	valeur: S,
	jauge: N,
	etat: S,
	actif: B,
	actifs: N,
	en_cours: z.array(S),
	note: S,
})
export const SerieSchema = z.object({
	points: z.array(N),
	barres: z.array(N),
	titre: S,
	valeur: S,
	sous: S,
})
const LigneSeuil = z.object({ nom: S, seuil: S, valeur: S, ok: B, brut: S })
export const SeuilsSchema = z.object({
	vide: B,
	hard: z.array(LigneSeuil),
	soft: z.array(LigneSeuil),
})
export const SupervisionSchema = z.record(S, z.unknown()) // affiné en vague 4
export const ActionSchema = z.object({
	k: S,
	libelle: S,
	exe: Exe,
	cmd: S,
	saisie: z.enum(["", "motif"]).catch(""),
})
export const TacheSchema = z.object({
	id: S,
	titre: S,
	role: S,
	statut: S,
	lint: S,
	tokens: N,
	fichiers: N,
	bloquee: B,
	verdict: S,
	front: B,
	vierge: B,
	modele: S,
	livre_en: S,
	remplace: S,
	remplacee_par: S,
	motif: S,
	evalue: S,
	eval: S,
	eval_verdict: S,
	eval_motif: S,
	result: B,
	actions: z.array(ActionSchema),
})
export const TodoItemSchema = z.object({
	prio: N,
	etiquette: S,
	titre: S,
	detail: S,
	cmd: S,
	exe: Exe,
	projet: S,
})
export const VoixSchema = z
	.object({
		mode: B,
		parle: B,
		en_cours: B,
		dictee: B,
		ecoute: B,
		journal: z.array(z.object({ t: S, texte: S })),
	})
	.nullable()
export const SalleStateSchema = z.object({
	demo: DemoSchema,
	evenements: z.array(EvenementSchema),
	flux: z.array(FluxSchema),
	heure: HeureSchema,
	horodate: HorodateSchema,
	immeuble: ImmeubleSchema,
	jeton: JetonSchema,
	journal: JournalSchema,
	personnel: PersonnelSchema,
	pilotable: PilotableSchema,
	pipeline: PipelineSchema,
	projet: ProjetSchema,
	registre_erreur: RegistreErreurSchema,
	roles: z.array(RoleSchema),
	serie: SerieSchema,
	seuils: SeuilsSchema,
	statuts: StatutsSchema,
	supervision: SupervisionSchema,
	taches: z.array(TacheSchema),
	ticker: TickerSchema,
	todo: z.array(TodoItemSchema),
	todo_total: TodoTotalSchema,
	voix: VoixSchema,
})
export const StateErreurSchema = z.object({ erreur: S }) // 200 + {erreur} = échec construction

export type SalleState = z.infer<typeof SalleStateSchema>
export type Role = z.infer<typeof RoleSchema>
export type Tache = z.infer<typeof TacheSchema>
export type Etage = z.infer<typeof EtageSchema>
export type Flux = z.infer<typeof FluxSchema>
export type TodoItem = z.infer<typeof TodoItemSchema>
export type Action = z.infer<typeof ActionSchema>

// Structurel : le serveur seul juge (decisions.md#2026-10-16) ; 400 ⇒ ApiError("refus", 400, erreur) affiché tel quel
export const RunBodySchema = z.object({
	action: z.string().min(1),
	projet: z.string().optional(),
	tid: z.string().optional(),
	statut: z.string().optional(),
	motif: z.string().min(1).max(200).optional(),
	role: z.string().optional(),
	modele: z.string().optional(),
})
export const RunResultSchema = z.object({
	commande: S,
	code: N,
	out: S,
	err: S,
})
export const ApiErreurSchema = z.object({ erreur: S })
export type RunBody = z.infer<typeof RunBodySchema>
export type RunResult = z.infer<typeof RunResultSchema>
