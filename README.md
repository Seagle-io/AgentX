# AgentX — travail multi-agent à contexte minimal

Un chef de projet qui **interroge**, **découpe**, et distribue à des agents
spécialisés un *context pack* : le contexte minimum suffisant pour mener la tâche
à bien. Le vault (markdown sur disque) est la mémoire ; le CLI en est la
comptabilité.

## L'idée

Le mode d'échec d'un système multi-agent n'est pas la bêtise des agents : c'est la
**dilution du contexte**. Un agent lâché sur un dépôt lit 40 fichiers, en retient
le mauvais tiers, et travaille sur une compréhension floue.

La parade : **un seul agent paie le coût d'exploration**. Le chef de projet lit
large, puis écrit pour chaque tâche un pack dense (~1 000 tokens) qui contient
déjà tout — mission, critères de fin, whitelist de fichiers, contrats recopiés,
décisions tranchées, interdits. L'exécutant ne lit que ça.

Un pack coûte quelques minutes à écrire et économise 10× son poids en tokens
d'exploration — plus les erreurs qu'on ne commet pas.

## Prise en main

```bash
agentx
```

Une commande, tout démarre, et tu récupères ton invite :

```
  préparation…
  · index du vault : ok
  · cohérence : vault coherent.
  · salle       : http://127.0.0.1:7777 (pid 701729)
  · journal     : ~/.local/state/agentx.log
```

Elle régénère l'index du vault, passe le contrôle de cohérence, lance la salle
**détachée** et ouvre le navigateur. Fermer le terminal ne tue plus rien.

| Commande | Effet |
|---|---|
| `agentx` | démarre tout (idempotent : relancer rouvre juste la page) |
| `agentx stop` | arrête la salle |
| `agentx statut` | en marche ? sur quel port ? répond-elle ? |
| `agentx --port 8080` · `--no-open` | variantes du démarrage |
| `agentx salle` | mode avant-plan, pour déboguer (Ctrl-C arrête) |

Tout le reste part vers le CLI du vault :

```bash
agentx board                       # tableau de bord texte
agentx set T007 --statut fait --projet recherche-floue
agentx help
```

La salle écrit son propre battement dans `run/salle.alive` à chaque
rafraîchissement : une sonde peut la surveiller comme n'importe quel service —
verte tant qu'elle sert, rouge dès qu'elle s'arrête.

Pour l'avoir partout :

```bash
ln -s "$PWD/bin/agentx" ~/.local/bin/agentx
```

Initialiser un vault vide :

```bash
./bin/agentx init
```

Puis, dans Claude Code depuis ce dossier :

```
/projet je veux ajouter un export CSV à mon app, avec filtres par date
```

Le chef de projet mène l'entretien (2 tours de questions cliquables maximum),
écrit le brief, découpe en tâches, rédige les packs, et **s'arrête** pour montrer
la vague 1. Ensuite :

```
/dispatch
```

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `/projet <besoin>` | entretien → brief → plan → packs |
| `/pack <TID>` | rédige ou répare un pack, puis le valide |
| `/dispatch [projet]` | lance la vague prête, intègre les résultats |
| `/board [projet]` | état, blocages, incohérences (en texte) |
| `/salle` | tableau de bord animé dans le navigateur |
| `/clore <projet>` | capitalise, améliore les gabarits, archive |

## La salle des agents

```bash
python3 bin/dash.py
```

Une page sur `http://127.0.0.1:7777` qui relit le vault **toutes les 2 secondes**.
Rien à rafraîchir, rien à régénérer : elle suit les agents pendant qu'ils
travaillent.

- **Bandeau** : une carte par rôle — jauge d'avancement, dernière activité, et un
  halo pulsant quand l'agent a une tâche `en-cours`.
- **La salle** : un poste par rôle. Le bureau s'allume quand son agent travaille,
  le radar passe au rouge dès qu'une tâche est `bloquée`, la fusée décolle quand
  une vague tourne, la baie `VAULT` s'allume au rythme des livraisons.
- **Plusieurs agents sur un même poste** : un rôle peut être tenu par N instances
  à la fois — deux implémenteurs sur des fichiers disjoints, c'est le cas normal
  d'une vague. La salle affiche **une silhouette par tâche `en-cours`** du rôle,
  le poste est étiqueté `IMPLÉMENTEUR ×3` et la carte du bandeau passe à
  `×3 AGENTS`. Au-delà de quatre, un `+N` prend le relais.
- **Jamais deux chefs.** Le chef est seul par construction, pas par convention :
  `chef` n'appartient pas aux rôles de tâche du CLI
  (`ROLES` dans [bin/vx.py](bin/vx.py)), donc `vx tache --role chef` est refusé,
  et un `role: chef` écrit à la main dans un `task.md` est signalé par
  `vx doctor` comme rôle inconnu. Sa carte reste `PILOTE`, au singulier.
- **Les relais** : des arcs animés entre les postes. Les agents ne se parlent
  jamais — ils se passent le vault. Une dépendance `T001 → T002` *est* un
  transfert `éclaireur → architecte` : le « Pour la suite » de l'un devient le
  pack de l'autre. Vert = en cours, cyan = livré, rouge = bloqué, pointillé
  terne = en attente. La bande sous la salle reprend chaque relais en clair.
- **Ce qui transite** : une icône voyage le long de chaque arc, et elle dit
  *quoi*. Un relais bloqué ne transporte rien — il porte une question à l'arrêt.

  | Icône | Objet | Qui le remet |
  |---|---|---|
  | document ligné | **pack** | le chef, à n'importe qui |
  | épingle | **coordonnées** | l'éclaireur |
  | accolades `{}` | **contrat** | l'architecte |
  | document `+/−` | **livrable** | l'implémenteur |
  | triangle `!` | **défauts** | le vérificateur |
  | carnet | **à capitaliser** | tout le monde, vers le scribe |
  | cercle `?` | **question en attente** | un relais bloqué |
- **Todo du chef** : déduite du vault, jamais saisie. Débloquer, écrire un pack,
  corriger un pack refusé, intégrer un compte rendu, dispatcher, faire vérifier,
  capitaliser — avec la commande à lancer. Les entrées écrites à la main dans
  `vault/projets/<slug>/todo.md` (`- [ ] …`) s'y ajoutent.
- **Avancement** : tâches livrées dans le temps, reconstruit depuis le journal.
- **`pack-lint.py`** : les seuils réels du linter confrontés au dernier pack
  mesuré. Une ligne rouge = un pack qui ne passera pas le dispatch.

Vault vide → la page bascule en **mode DÉMO** (données simulées, clairement
signalées) pour montrer à quoi elle ressemble en charge. Elle repasse en réel
dès qu'un projet existe.

`./bin/agentx salle --json` imprime le même état en JSON, sans navigateur.

Changer la couleur d'accent (cadre, chef, titres) :

```bash
./bin/agentx couleur '#3b82f6'
```

Sans argument elle affiche la couleur courante. La valeur est validée avant
écriture — une faute de frappe est refusée plutôt que de laisser une variable
CSS invalide et une page sans fond. Un simple rechargement suffit ensuite, le
serveur n'a pas besoin d'être relancé.

## Supervision — santé prod, erreurs, télémétrie, retours

Quatre panneaux sous la courbe d'avancement. **Aucun chiffre n'y est inventé** :
tout vient de sources que tu déclares dans `supervision.json` à la racine. Sans
ce fichier, les panneaux disent « aucune source » et rappellent quoi créer — un
tableau de bord qui simule des métriques de prod est pire qu'un tableau de bord
vide, parce qu'on lui fait confiance.

```json
{
  "service": "mon-app",
  "version": "1.4.2",
  "sondes": [
    {"nom": "api",    "url": "http://127.0.0.1:3000/health", "attendu": 200},
    {"nom": "worker", "fichier": "run/worker.alive", "frais_s": 120}
  ],
  "erreurs":    "logs/erreurs.jsonl",
  "telemetrie": "logs/telemetrie.json",
  "retours":    "logs/retours.jsonl"
}
```

| Panneau | Source | Ce qu'il montre |
|---|---|---|
| **Santé prod** | sondes `url` (code HTTP) ou `fichier` (fraîcheur du mtime) | verdict global, état et latence par sonde |
| **Erreurs** | `.jsonl`, une erreur par ligne | volume sur 24 h, par heure, par niveau, **top 5 regroupés** (nombres et identifiants écrasés pour que les occurrences d'une même erreur se rejoignent) |
| **Télémétrie** | `.json` : `metriques` + `series` | tuiles avec delta, courbes compactes |
| **Retours** | `.jsonl` : `note` 1-5 + `texte` | moyenne, distribution, derniers avis, nombre de mécontents |

Formats exacts dans l'en-tête de [bin/supervision.py](bin/supervision.py). Les
lignes illisibles d'un `.jsonl` sont ignorées **et comptées** — tu sais que tu
perds des données au lieu de l'ignorer.

### La prod parle au chef

C'est le point qui relie la supervision au reste : une sonde au rouge, une
erreur qui revient trois fois, des retours à une étoile **remontent dans la todo
du chef**, en tête. Une sonde morte passe devant les packs à écrire. Chaque
entrée propose la commande qui ouvre la tâche correspondante — à copier, pas à
lancer : décider qu'un incident devient une tâche engage un jugement.

### Voir ça fonctionner

```bash
python3 demo/supervision.py
```

Écrit de vraies sources d'exemple dans `demo/supervision/` et le
`supervision.json` qui pointe dessus — deux sondes fichier qui passent au vert,
une sonde HTTP sur un service absent qui vire au rouge. `--effacer` retire tout.
Les chemins sont affichés dans les panneaux : aucune ambiguïté sur l'origine
des chiffres.

> Ne jamais faire pointer une sonde sur la salle elle-même : la requête
> imbriquée retomberait dans le sondage. Un verrou non réentrant l'empêche de
> boucler, mais la sonde se verrait alors en panne.

## La console — ce que la page a le droit de faire

En bas de la salle, une console lance de vraies commandes `vx`. Chaque entrée de
la todo porte **▶ lancer** si elle est exécutable, **⧉ copier** sinon. Cette
distinction n'est pas cosmétique :

| La page peut | La page ne peut pas |
|---|---|
| `board`, `ready`, `doctor`, `index` | créer un projet ou une tâche |
| `pack-lint <TID>` | écrire ou corriger un pack |
| `set <TID> --statut <s>` | dispatcher une vague |
| | archiver ou supprimer quoi que ce soit |

Ce qui engage un jugement — rédiger un pack, lancer des agents — reste dans
Claude Code (`/pack`, `/dispatch`). La page bouge l'état, elle ne décide pas.

**Le cadre de sécurité**, parce qu'une page web qui lance du shell mérite mieux
qu'une bonne intention :

1. **Liste blanche d'actions** — le client envoie `{"action":"set","tid":"T007"}`,
   jamais une chaîne de commande. Le serveur construit l'`argv` lui-même.
2. **Chaque argument validé** — `^T\d{3}$` pour un ID, appartenance à l'ensemble
   des statuts connus, slug de projet confronté aux projets réels.
3. **Pas de shell** : `subprocess` reçoit une liste, jamais `shell=True`.
4. **Jeton par démarrage**, exigé dans un en-tête `X-AgentX-Jeton`. Un en-tête
   personnalisé force un préambule CORS qu'une page tierce ne peut pas passer.
5. **Hôte local obligatoire** — bloque le DNS rebinding.
6. **Rien de destructeur** dans la liste blanche, par construction.

Vérifié : injection shell dans l'ID, action hors liste, traversée de chemin,
statut inventé, jeton absent ou faux, hôte étranger — tout est refusé avec un
message explicite et aucun processus lancé.

## Les cinq rôles

| Rôle | Métier | Particularité |
|---|---|---|
| `eclaireur` | localise (chemin:ligne), lecture seule | seul autorisé à explorer large, restitue en ≤ 150 lignes |
| `architecte` | tranche, produit un contrat exécutable | n'écrit aucun code de production |
| `implementeur` | code dans un périmètre fermé | whitelist ≤ 12 fichiers, le plus petit diff |
| `verificateur` | tente de casser le livrable | **privé d'outil d'édition** — il constate, il ne répare pas |
| `scribe` | capitalise, compacte | agrège les retours et corrige les gabarits |

La privation d'édition du vérificateur n'est pas un oubli : un agent qui peut
réparer ce qu'il trouve est incité à trouver ce qu'il sait réparer.

## Le vault

```
vault/
├── INDEX.md                    généré — ne pas éditer
├── _templates/                 gabarits + exemple-pack.md (pack de référence)
├── projets/<slug>/
│   ├── brief.md                objectif, contraintes, hypothèses, carte du terrain
│   ├── plan.md                 tâches, dépendances, vagues parallèles
│   ├── decisions.md            append-only — on supersède, on ne réécrit pas
│   ├── journal.md              append-only, horodaté par le CLI
│   └── taches/T001-<slug>/
│       ├── task.md             pilotage (lu par le CLI, pas par l'agent)
│       ├── context.md          LE PACK — seule source de vérité de l'agent
│       └── result.md           compte rendu, format imposé
├── connaissances/              notes atomiques réutilisables (≤ 40 lignes)
├── artefacts/                  sorties volumineuses
└── archive/
```

## Le CLI

Toute la comptabilité est déterministe — aucun token dépensé à parcourir le vault.

```bash
python3 bin/vx.py board              # tableau de bord (statuts, packs vides, deps bloquantes)
python3 bin/vx.py ready --json       # ce qui est dispatchable maintenant
python3 bin/vx.py pack-lint T002     # refuse un pack bancal AVANT le dispatch
python3 bin/vx.py doctor             # deps fantômes, cycles, « fait » sans résultat
python3 bin/vx.py help
```

`pack-lint` est le garde-fou central. Il rejette : une section manquante, un
marqueur `<!-- A REMPLIR` oublié, une « Definition of Done » qui n'est pas une
checklist cochable, un pack > 220 lignes, une whitelist > 12 fichiers.

> Un pack trop long signale une tâche à découper, pas un pack à abréger.

## Les règles qui font tenir l'ensemble

1. **Un pack est la seule source de vérité de son exécutant.** S'il doit ouvrir
   autre chose que sa whitelist, le pack est raté — on corrige le pack, pas l'agent.
2. **Les contrats se recopient, ne se référencent pas.** Coller une signature de
   40 caractères économise trois lectures de fichier : le meilleur ratio du système.
3. **Whitelist ≤ 12 fichiers**, sinon on découpe. C'est le critère de découpe principal.
4. **Une vague = un seul message, N appels d'agents**, sinon c'est séquentiel.
5. **« non vérifié » vaut « non fait ».** Aucun agent ne déclare un test passant
   sans en avoir collé la sortie réelle.
6. **Jamais un agent bloqué relancé avec le même pack.** On répond à sa question,
   on corrige le pack, on crée une tâche neuve.
7. **Le chef ne lit que 3 sections d'un `result.md`** — `Pour la suite`, `Écarts`,
   `Vérifié comment`. Le reste reste sur disque : c'est ce qui garde son contexte
   utilisable sur un long projet.
8. **Chaque résultat note ce qui manquait dans son pack.** Le scribe agrège, les
   gabarits s'améliorent : seule boucle d'apprentissage du système.

## Une limite assumée

Un sous-agent ne peut pas lancer d'autres sous-agents de façon fiable. Le chef de
projet est donc une **compétence** chargée par la session principale — la seule
qui dispose de l'outil de dispatch — et non un agent dans `.claude/agents/`.
C'est aussi plus sain : vous voyez l'orchestration se dérouler et pouvez
l'interrompre à chaque vague.

## Licence

[MIT](LICENSE) © dracjulien
