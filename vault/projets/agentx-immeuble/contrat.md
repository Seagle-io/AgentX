---
projet: agentx-immeuble
source: T002
cree: 2026-10-15
tags: [contrat]
---

# Contrat — immeuble : état multi-projets, coupe, chef au toit

Contrainte qui décide : poll 2 s × N=8 étages ; recalcul complet = 0.07 s × 8 ≈ 0.56 s/poll (T001) > budget 300 ms (brief) → **1 seul calcul détaillé par poll**, les autres étages = résumé léger mis en cache par signature mtime.
Décision : [[decisions#2026-10-15 — immeuble : 1 state.json, résumé par étage en cache, étage détaillé par ?projet=]].

## C0 — options

| option | coût now | coût 1 an | rend impossible |
|---|---|---|---|
| A bête : `construire_etat` complet ×8 par poll, `state.json` = liste de 8 états | 1 boucle | 0.56 s/poll à 8, 1.4 s à 20 ; JSON ×8 (flux 43 + taches 28 par projet) | poll 2 s au-delà de ~25 projets ; page fluide |
| **B** 1 `state.json` : global + `immeuble` (résumé léger par étage, cache par signature mtime) + détail de l'étage `?projet=` | `_bloc_projet` + cache + 1 param GET | coût ≈ 0.07 s + N × stat (~0.2 ms/tâche) ; 1 seule source front | ∅ (vue détaillée de 2 étages à la fois : hors périmètre) |
| C route `/immeuble.json` séparée (poll 5 s) + `/state.json?projet=` | 1 route + 2e boucle JS | 2 sources désynchronisées (coupe ≠ étage) ; 2 jetons/erreurs à gérer | coupe et étage cohérents au même tic |

Choix : B. A tient aujourd'hui (8 projets) mais dépasse le budget dès le 5e projet actif ; C double la boucle pour un gain nul (le résumé B coûte < 10 ms).

## C1 — `state.json` : clé `immeuble` (L1)

Clés existantes (`projet, taches, pipeline, serie, seuils, flux, journal, ticker, roles`) inchangées de forme = **étage détaillé** (`sel`). Ajouts/changements :
```
"immeuble": {                                   # null en mode démo
  "selection": {
    "slug":   str,                              # == projet.slug (invariant)
    "source": "requete"|"epingle"|"activite"|"defaut",
    "refus":  str                               # "" | "slug inconnu : <x>" (x tronqué à 48 car.)
  },
  "epingle": str,                               # contenu run/projet si slug ∈ lister_projets, sinon ""
  "toit": {
    "chef":     {"vivant": bool|null},          # TERM.vivant() ; exception → null
    "todo":     int,                            # todo_total (avant plafond)
    "urgent":   int,                            # items prio 1 (avant plafond)
    "etages":   int,                            # len(etages)
    "dormants": int,
    "alerte":   {"niveau": ""|"sonde", "texte": str}   # 1re suggestion supervision prio 1 → titre
  },
  "etages": [                                   # projets statut ∉ {clos, archive} ; ordre = rang
    {
      "slug":      str,
      "titre":     str,                         # brief titre, défaut slug
      "statut":    str,                         # brief statut, défaut "?"
      "rang":      int,                         # 0 = étage le plus haut (sous le toit)
      "num":       int,                         # len(etages) - rang  (affiché « É<num> »)
      "activite":  str,                         # "YYYY-MM-DD HH:MM" local = mtime max de la signature
      "age_j":     float,                       # (now - activite) en jours, 1 décimale, ≥ 0
      "dormant":   bool,                        # C2
      "compteurs": {"a-faire":int,"pret":int,"en-cours":int,"bloque":int,
                    "revue":int,"fait":int,"abandonne":int,"rejete":int},   # toutes clés STATUTS, 0 inclus
      "total":     int,
      "agents":    [{"role": str, "tid": str}], # tâches en-cours, tri tid ; ≤ 12 (au-delà tronqué, total dans compteurs)
      "todo":      int,                         # items de cet étage présents dans `todo` agrégée (après filtre dormance, avant plafond)
      "alerte":    {"niveau": ""|"bloque"|"urgent", "texte": str},
      "selection": bool                         # slug == selection.slug
    }
  ],
  "sous_sol": [                                 # repliés côté page
    {"slug": str, "titre": str, "statut": str,  # clos|archive|…
     "source": "projets"|"archive",             # vault/projets/* clos/archive | vault/archive/*
     "maj": "YYYY-MM-DD",                       # mtime brief.md (dossier si absent)
     "selectionnable": bool}                    # source == "projets"
  ],
  "mesure_ms": int                              # durée construire_etat, perf_counter, arrondi
}
"todo": [ {…item existant…, "projet": str} ]    # C4 ; "" = toit (RH, supervision)
"todo_total": int
"evenements": [ {…existant…, "projet": str} ]   # C5 ; absent dans le fichier → ""
```
Règles :
- `etages[].alerte` : `compteurs.bloque > 0` → `{"bloque", "<n> bloquée(s)"}` ; sinon ∃ item todo prio 1 de l'étage → `{"urgent", titre du 1er}` ; sinon `{"", ""}`
- sonde rouge = **toit** seulement : `supervision.json` global, ∅ lien sonde→projet (`suggestions(sup, slug)` n'utilise slug que dans `cmd`, supervision.py:314-348)
- `etat_demo()` : ajoute `"immeuble": None, "todo_total": len(todo)` ; items todo démo sans `projet` → page traite `""`

## C2 — ordre, dormance, sous-sol (L1)

```
activite(p)   = max(st_mtime) des fichiers de _signature(p)   # brief, journal, todo, taches/*/{task,context,result}.md
DORMANCE_J    = 7
ouvert(p)     = statut(brief) ∉ {"clos", "archive"}          # "" ou absent → ouvert, statut affiché "?"
dormant(p)    = age_j > DORMANCE_J  et  compteurs[pret]+[en-cours]+[revue]+[bloque] == 0  et  p ≠ sel
ordre etages  = non dormants : activite desc, slug asc ; puis dormants : activite desc, slug asc
rang          = index dans cet ordre (0..N-1)
sous_sol      = [p ∈ lister_projets() | non ouvert(p)] (source "projets") + [d ∈ VAULT/"archive"/* dossier] (source "archive")
                tri maj desc ; titre/statut du brief.md si présent, sinon slug / "archive"
```
- dormant = replié dans la coupe (ligne fine), jamais retiré ; l'étage sélectionné n'est jamais dormant
- aujourd'hui : 8 étages `cadrage`, 0 en-cours → dormants = ceux d'activité > 7 j

## C3 — sélection de l'étage (L1 + L2)

Serveur, `do_GET` :
```python
if self.path.startswith("/state.json"):
    q = parse_qs(urlsplit(self.path).query)
    demande = q.get("projet", [""])[0]          # autres params (t=…) ignorés
    etat = construire_etat(demande or None)
```
```
choix sel, dans l'ordre :
  1. demande non vide, RE_SLUG.match, ∈ {p.name | p ∈ lister_projets()}   → source "requete"   (clos accepté, lecture)
     demande non vide sinon                                              → refus = "slug inconnu : <demande[:48]>", on continue
  2. run/projet lisible, slug ∈ lister_projets                            → source "epingle"
  3. etages[0] (rang 0)                                                   → source "activite"
  4. projets[0]                                                           → source "defaut"
```
- slug inconnu ≠ erreur HTTP : 200 + `selection.refus` ; la page efface son hash (C8)
- `vault/archive/*` jamais sélectionnable (∉ lister_projets)
- `taches[].actions[].exe.projet`, `todo[].exe.projet` : construits avec le slug de leur étage (inchangé, `_actions_tache(ligne, slug)`) ; `#pilote-barre` et palette globales : `ETAT.projet.slug` = sel
- page : persistance = **hash d'URL** `#/<slug>` (≠ localStorage — par onglet, partageable, bouton retour) ; hash absent → défaut serveur (épingle puis activité)
- `agentx --projet X` : inchangé, écrit run/projet → étage par défaut des pages sans hash

## C4 — todo agrégée (L1)

```
items étage  = _bloc_projet(p)["todo"]               # _todo(p, taches, lignes) ; chaque item + "projet": p.name
items toit   = _todo_rh(personnel) + supervision.suggestions(sup, sel.name)   # "projet": ""
filtre       = étage dormant → garder prio 1 seulement
tri          = clé (prio, rang_etage, ordre d'origine)   # toit : rang_etage = -1 (passe devant à prio égale)
PLAFOND_CHEF = 40 ; todo = tri[:40] ; todo_total = len(tri)
etages[].todo = nb d'items de l'étage dans tri (avant plafond)
```
- `_todo` perd le paramètre `personnel` : entrées « Revoir le pack type » → `_todo_rh(personnel)` émises 1 fois (globales)
- `cmd` des suggestions supervision : slug = sel (comportement actuel)
- item = forme existante `{"prio","etiquette","titre","detail","cmd","exe"}` + `"projet"` ; aucun autre champ

## C5 — événements (L3 écrit, L1 lit)

`run/evenements.jsonl`, 1 ligne :
```json
{"id":"9f2c…","t":"14:03:12","quoi":"agent-fini","role":"architecte","tid":"T002","statut":"fait","verdict":"","projet":"agentx-immeuble"}
```
`bin/sonnerie.py` :
```python
RE_PROJET = re.compile(r"^projet:\s*([a-z0-9][a-z0-9-]{0,47})\s*$", re.M)
RE_CHEMIN = re.compile(r"vault/projets/([a-z0-9][a-z0-9-]{0,47})/taches/")
RE_ROLE_T = re.compile(r"^role:\s*(\S+)", re.M)
RE_STAT_T = re.compile(r"^statut:\s*([a-z-]+)", re.M)

def projet_de(tete: str, tid: str, role: str) -> str:
    """Slug du projet de l'agent qui rend ; "" si non déterminable. Ne lève jamais."""
    # 1. frontmatter `projet:` dans tete, et ROOT/vault/projets/<slug> est un dossier → slug
    # 2. 1er RE_CHEMIN dans tete dont le dossier existe → slug
    # 3. tid non vide : candidats = ROOT/vault/projets/*/taches/{tid} et {tid}-*/task.md
    #    garder RE_ROLE_T == role ; si > 1, garder RE_STAT_T == "en-cours" ; exactement 1 → son slug
    # 4. sinon ""
```
- `main()` : `ev["projet"] = projet_de(tete, tid_str, role)` ; ordre des clés = exemple ci-dessus
- toute exception dans `projet_de` → `""` (un agent n'est jamais arrêté par la sonnerie)
- ancien événement sans `projet` : `_evenements()` (dash.py) fait `ev.setdefault("projet", "")` ; page : `e.projet || ""` → toast sans étiquette d'étage, aucun étage ne clignote
- `id` reste la seule clé de dédoublonnage (TID non unique entre projets)

## C6 — chef au toit (L3)

`bin/terminal.py:24-48`, remplacement intégral :
```python
CONSIGNE_CHEF = (
    "Tu es le CHEF DE PROJET AgentX, seul chef de l'immeuble : la salle montre un étage par projet "
    "ouvert et tu es au toit, tu les pilotes tous. "
    "Avant toute autre chose, charge la compétence `chef-de-projet` avec l'outil Skill "
    "et lis `vault/INDEX.md` puis l'état de tous les étages (`./bin/agentx board`, sans --projet : tous les projets). "
    "Présente-toi en deux lignes comme chef de projet, résume les étages actifs (bloqués et revues d'abord), "
    "et demande à l'utilisateur sur quel étage il veut travailler. Tu n'écris jamais de code toi-même : "
    "tu cadres, tu découpes, tu rédiges des packs et tu dispatches les agents. "
    "Plusieurs étages vivent en même temps : chaque commande `./bin/agentx` qui vise un projet porte "
    "`--projet <slug>` explicite, et chaque prompt de dispatch nomme le projet. "
    "`./bin/agentx --projet <slug>` n'épingle que l'étage ouvert par défaut dans la salle. "
    "Chaque agent reçoit un pack = le contexte MINIMUM SUFFISANT pour sa tâche, au périmètre "
    "délimité strictement : whitelist ≤ 12 fichiers avec droits E/L, contrats recopiés, hors-périmètre "
    "explicite, DoD vérifiable. Jamais « va lire le brief ». Si un agent devrait ouvrir autre chose, "
    "le pack est raté : tu le corriges. Un pack trop large se découpe en plusieurs tâches. "
    "La salle des agents n'affiche QUE ce qui est dans le vault : avant tout appel Agent, la tâche "
    "existe (`./bin/agentx tache ...`), son pack context.md est écrit et validé (pack-lint), "
    "son statut est `en-cours` (`./bin/agentx set`), et à la fin `fait`/`bloque` avec result.md. "
    "Un agent lancé sans tâche dans le vault est invisible et interdit. "
    "Les producteurs (implementeur, testeur, designer, devops) livrent en `revue` : tu crées une tâche "
    "evaluateur (`--dep`), puis `./bin/agentx retenir <TID>` ou `./bin/agentx virer <TID> --motif \"...\"` "
    "(la remplaçante naît ; corrige son pack, motif recopié, avant de redispatcher). "
    "Second renvoi sur la même tâche : `--modele opus`. `./bin/agentx personnel` : taux de renvoi ≥ 50 % "
    "d'un rôle ⇒ revois son pack type. "
    "Avec l'humain tu parles français courant ; avec les agents (packs, prompts de dispatch) "
    "tu parles le langage dense de vault/_templates/LANGAGE.md. Réponds en français."
)
PROGRAMME = ["claude", "--append-system-prompt", CONSIGNE_CHEF,
             "Bonjour, je suis dans la salle des agents. Présente-toi et fais le point sur les étages de l'immeuble."]
```
- commentaire :22-23 conservé ; 0 occurrence « projet courant » dans terminal.py
- session vivante = ancienne consigne jusqu'à ■ arrêter / ▶ lancer (humain)
- `bin/agentx` : ∅ changement

## C7 — serveur : signatures et séquence (L1)

```python
DORMANCE_J = 7
PLAFOND_CHEF = 40                              # plafond de `todo` agrégée
ARCHIVE = VAULT / "archive"
_CACHE: dict[str, tuple[tuple, dict]] = {}     # slug -> (signature, bloc)
_CACHE_VERROU = threading.Lock()               # ThreadingHTTPServer

def _signature(proj: Path) -> tuple
    # tuple trié de (chemin relatif à proj, st_mtime_ns, st_size) pour brief.md, journal.md, todo.md,
    # et chaque taches/*/{task.md, context.md, result.md} existant ; os.stat seulement, 0 lecture de contenu

def _bloc_projet(proj: Path) -> dict
    # signature égale à _CACHE[slug] → bloc en cache (même objet) ; sinon recalcul puis stockage
    # -> {"slug": str, "activite": float (epoch s), "bmeta": dict, "taches": list[tuple[Path, dict]],
    #     "statuts": dict[str, str], "packs": list[dict], "lignes": list[dict],   # lignes = construire_etat:334-365 actuel
    #     "todo": list[dict],          # _todo(...) items + "projet": slug
    #     "compteurs": dict[str, int], "agents": list[dict]}
    # INVARIANT : un bloc n'est jamais muté après stockage (copier avant d'ajouter une clé)

def _todo(proj: Path, taches, lignes) -> list[dict]          # ex-_todo(proj, taches, lignes, personnel), sans le bloc RH :641-645
def _todo_rh(personnel: dict) -> list[dict]                 # bloc RH :641-645 déplacé, items + "projet": ""
def _etage(bloc: dict, rang: int, n: int, sel: str, todo_n: int, maintenant: float) -> dict   # 1 entrée etages[] (C1)
def _sous_sol(fermes: list[Path]) -> list[dict]             # C2
def _choisir(projets: list[Path], etages: list[str], demande: str | None) -> tuple[Path, str, str]   # (sel, source, refus) — C3
def construire_etat(projet: str | None = None) -> dict
```
Séquence `construire_etat(projet)` :
```
t0 = perf_counter()
projets = lister_projets() ; ∅ → etat_demo() annoté (immeuble None)
statut(p) = lire_frontmatter(p/"brief.md")["statut"] pour chaque p     # 1 lecture/projet
ouverts, fermes = partition(ouvert)
blocs = {p.name: _bloc_projet(p) for p in ouverts}
ordre provisoire (C2, sel inconnu) → sel, source, refus = _choisir(...)
sel ∉ blocs (clos) → blocs[sel.name] = _bloc_projet(sel)
ordre définitif (C2 avec sel : sel jamais dormant)
détail de sel = construire_etat:367-392 + :402-421 actuels, alimentés par blocs[sel.name] (bmeta, taches, packs, lignes)
sup = supervision.etat() ; personnel = _personnel()
todo = C4
immeuble = C1 ; mesure_ms = round((perf_counter() - t0) * 1000) en dernier
retour = dict actuel :403-423 + "todo_total" + "immeuble"
```
- `_doctor_rapide(projets)` : signature inchangée ; MAY lire `taches` depuis les blocs en cache (ouverts) si mesure > budget
- `main()` : ajout `p.add_argument("--projet", default="")` ; `--json` → `construire_etat(args.projet or None)`
- `_evenements()` : `ev.setdefault("projet", "")` avant `out.append`

### Performance
```
budget          : chaud (cache plein, 8 étages, 0 changement) médiane ≤ 120 ms / appel ; froid (cache vide) ≤ 600 ms une fois
seuil d'arrêt   : chaud > 300 ms → hypothèse brief invalidée → L1 en `bloque`, mesures collées
interdit        : relire context.md/result.md d'un étage dont la signature n'a pas changé
mesure à coller : python3 -c "import sys,time,statistics as st; sys.path.insert(0,'bin'); import dash; t=time.perf_counter(); dash.construire_etat(); f=time.perf_counter()-t; ts=[]
for _ in range(10): a=time.perf_counter(); dash.construire_etat(); ts.append(time.perf_counter()-a)
print('froid', round(f*1000), 'ms · chaud médiane', round(st.median(ts)*1000), 'ms')"
```

## C8 — front (L2)

`dash/index.html`, insertion entre :13 et :14 (avant le commentaire « projet actif ») :
```html
  <!-- ─── immeuble : un étage par projet ouvert, chef au toit ────────── -->
  <nav class="immeuble" id="immeuble" aria-label="immeuble des projets" hidden>
    <button class="im-toit" id="im-toit" type="button"></button>
    <ol class="im-etages" id="im-etages"></ol>
    <details class="im-sous-sol" id="im-sous-sol">
      <summary id="im-sous-sol-titre">SOUS-SOL</summary>
      <ul id="im-sous-sol-liste"></ul>
    </details>
  </nav>
```
et `:16` `<div class="pa-label">PROJET ACTIF</div>` → `<div class="pa-label" id="pa-label">ÉTAGE</div>`.

Étage rendu (1 `<li>` par `immeuble.etages[]`, ordre rang) :
```html
<li class="im-etage [sel] [dormant] [al-bloque|al-urgent]" data-slug="SLUG" tabindex="0" role="button" aria-current="page|∅">
  <span class="im-num">É3</span>
  <span class="im-nom">TITRE</span>
  <span class="im-agents"><i class="im-agent" style="--c:COULEUR_ROLE[role]" title="role · tid"></i>…</span>
  <span class="im-cpt"><b class="c-encours" title="en cours">n</b><b class="c-revue" title="revue">n</b><b class="c-bloque" title="bloqué">n</b></span>
  <span class="im-todo" title="todo du chef">n</span>
  <span class="im-alerte">TEXTE</span>
</li>
```
Toit `#im-toit` : `TOIT · CHEF` + `en session|arrêté|injoignable` (vivant true|false|null) + `todo N · U urgent` + `toit.alerte.texte` (classe `al-sonde` si niveau sonde) ; clic → `basculerTiroir(true)`.
Sous-sol : `#im-sous-sol-titre` = `SOUS-SOL · <n>` ; `<li data-slug>` cliquable si `selectionnable`, sinon `<li class="archive">` ; `<details>` fermé par défaut, jamais rouvert par le rendu.

```js
const IMMEUBLE = {slug: null};                // slug demandé par la page (hash) ; null = défaut serveur
const RE_SLUG_PAGE = /^[a-z0-9][a-z0-9-]{0,47}$/;
function etageDemande() -> string|null        // location.hash '#/<slug>' et RE_SLUG_PAGE → slug ; sinon null
function allerEtage(slug)                      // slug === IMMEUBLE.slug → charger() ; sinon location.hash = '#/' + slug (hashchange fait le reste)
function surHash()                             // IMMEUBLE.slug = etageDemande() ; if (SAISIE.tid !== null) fermerSaisie() ; $('#sortie').hidden = true ; charger()
function rendreImmeuble(s)                     // s.immeuble null → #immeuble.hidden = true, return ; sinon toit + étages + sous-sol
function sonnerEtages(evs)                     // slugs = evs.map(e => e.projet).filter(Boolean) ; .im-etage[data-slug] += classe 'sonne' 2.5 s
function brancherImmeuble()                    // délégation clic #im-etages / #im-sous-sol-liste [data-slug] → allerEtage ; #im-toit → basculerTiroir(true) ;
                                               // keydown #immeuble : ↑/↓ focus étage voisin, Entrée/Espace → allerEtage ; addEventListener('hashchange', surHash)
```
Modifications de l'existant (signatures inchangées : `construireSalle(s)`, `rendreTaches(s)`, `rendreTodo(s)`, `pilote`, `entreesPalette(s)`) :
```
charger()        : const demande = IMMEUBLE.slug ;
                   fetch('state.json?' + (demande ? 'projet=' + encodeURIComponent(demande) + '&' : '') + 't=' + Date.now(), {cache:'no-store'})
                   réponse arrivée et IMMEUBLE.slug !== demande → ignorée (ni ETAT ni rendre)
                   s.immeuble?.selection.refus non vide → history.replaceState(null, '', location.pathname + location.search) ; IMMEUBLE.slug = null
rendre(s)        : rendreImmeuble(s) juste après rendreDeck(s) ; signature salle = JSON.stringify([s.projet.slug, …existant…])
rendreTodo(s)    : chaque .ti gagne <button class="ti-etage" data-etage="SLUG">titre court</button> (projet "" → <span class="ti-etage toit">toit</span>) ;
                   brancherTodo : [data-etage] → allerEtage(slug) ; en-tête #todo-count = s.todo_total ?? items.length
sonnerie(s)      : après annoncer(neufs) → sonnerEtages(neufs)
annoncer(evs)    : sous-ligne = [e.projet, e.tid, e.t, verdict].filter(Boolean).join(' · ')
entreesPalette(s): + 1 entrée par immeuble.etages[] et sous_sol selectionnable :
                   {titre: `⇅ étage ${e.titre}`, sous: `${e.slug} · ${en-cours} en cours · ${bloque} bloqué`, exe: null, cmd: '', saisie: '', aller: e.slug}
executerEntree   : e.aller → fermerPalette(); allerEtage(e.aller); return   (testé avant e.saisie)
raccourci global : Alt+↑ / Alt+↓ (hors xterm, palette fermée) → étage rang-1 / rang+1 de la sélection, bornes saturées
amorçage         : IMMEUBLE.slug = etageDemande(); brancherImmeuble(); puis la ligne existante
```
État visuel : `sel` = bord accent + fond clair ; `dormant` = hauteur 16 px, seuls num+nom ; `al-bloque` = bord gauche #ff3b5c ; `al-urgent` = #ffcc33 ; compteurs à 0 → `opacity:.35` ; `sonne` = pulsation 2.5 s.
Mise en page : desktop = barre pleine largeur, 1 ligne/étage, 28 px, `max-height: 40vh; overflow-y:auto`.
≤ 480 px (vise 390) : `.im-agents` max 4 pastilles puis `+N` ; `.im-alerte` = icône seule (title = texte) ; grille `auto 1fr auto auto` ; aucun débordement horizontal (`document.documentElement.scrollWidth <= 390`).

## C9 — lots

| lot | rôle | WL (droit) | dépend |
|---|---|---|---|
| L1 serveur | implementeur | `bin/dash.py` E · `bin/vx.py` L · `bin/supervision.py` L (:291-348) | ∅ |
| L3 chef/sonnerie | implementeur | `bin/terminal.py` E · `bin/sonnerie.py` E · `bin/agentx` L | ∅ (∥ L1) |
| L2 front | implementeur | `dash/dash.js` E · `dash/index.html` E · `dash/dash.css` E | L1 `retenir` |

Fichiers E disjoints : L1 {dash.py} ∩ L3 {terminal.py, sonnerie.py} = ∅. `bin/vx.py`, `roles.json` : ∅ modification.
Contrat à recopier : L1 ← C1-C5 (lecture), C7 ; L3 ← C5, C6 ; L2 ← C1, C3 (page), C4 (forme item), C5 (page), C8.

DoD L1 (relance salle par l'humain après livraison) :
```
python3 bin/dash.py --json | python3 -c "import json,sys; s=json.load(sys.stdin); i=s['immeuble']; print(len(i['etages']), len(i['sous_sol']), i['selection'], s['projet']['slug']==i['selection']['slug'])"
  → 8 2 {'slug': '<épingle>', 'source': 'epingle', 'refus': ''} True
python3 bin/dash.py --json --projet orthopro | python3 -c "import json,sys; s=json.load(sys.stdin); print(s['projet']['slug'], s['immeuble']['selection']['source'], {a['exe']['projet'] for t in s['taches'] for a in t['actions'] if a['exe']} <= {'orthopro'})"
  → orthopro requete True
python3 bin/dash.py --json --projet '../x' | python3 -c "import json,sys; s=json.load(sys.stdin); print(s['immeuble']['selection']['refus'])"
  → slug inconnu : ../x
python3 bin/dash.py --json | python3 -c "import json,sys; s=json.load(sys.stdin); t=s['todo']; print(len(t)<=40, all('projet' in i for i in t), [i['prio'] for i in t]==sorted(i['prio'] for i in t), s['todo_total']>=len(t))"
  → True True True True
mesure C7 « Performance » → froid ≤ 600 ms · chaud médiane ≤ 120 ms
python3 -c "import sys; sys.path.insert(0,'bin'); import dash; e=dash.construire_etat(); print(len(set(e) - {'immeuble','todo_total'}))"
  → 19   (clés T001 inchangées ; jeton ajouté par do_GET seulement)
```
DoD L3 :
```
rg -c 'projet courant' bin/terminal.py → (aucune sortie, code 1)
python3 -c "import sys; sys.path.insert(0,'bin'); import sonnerie; print(sonnerie.projet_de('---\ntache: T001\nprojet: agentx-immeuble\nstatut: fait\n---','T001','eclaireur'))" → agentx-immeuble
python3 -c "import sys; sys.path.insert(0,'bin'); import sonnerie; print(repr(sonnerie.projet_de('rien','','eclaireur')), repr(sonnerie.projet_de('projet: inexistant-zz','T999','eclaireur')))" → '' ''
main() sur EVENEMENTS redirigé vers le scratchpad (jamais run/evenements.jsonl réel) → 1 ligne JSON, 8 clés, "projet" présent
```
DoD L2 :
```
node --check dash/dash.js → (aucune sortie, code 0)
rg -c 'id="immeuble"' dash/index.html → 1
Chromium http://127.0.0.1:7777 (salle relancée après L1) : 8 étages + toit + SOUS-SOL · 2 ; clic étage → #/slug, #projet-nom = titre, actions /api/run portent ce slug (onglet réseau) ;
  hash inconnu #/zz → hash effacé ; Alt+↓ change d'étage ; ⌘K « étage » liste 8+1 entrées ; 390 px : scrollWidth == 390 ; captures 1280 et 390 collées
```
Ensuite : 1 tâche evaluateur par lot (`--dep`), puis verificateur navigateur sur L2.

## Point de non-retour

- `?projet=` + hash `#/<slug>` : liens partagés et favoris en dépendent → changer le format d'URL casse les liens
- `evenements.jsonl` avec `projet` : les lecteurs (page, futurs bilans) supposent le champ ; le retirer = régression silencieuse
- `_todo` sans `personnel` + `projet` sur chaque item : tout consommateur de `todo` suppose l'étiquette
- cache par signature (st_mtime_ns, st_size) : une écriture qui ne change ni l'un ni l'autre (FS à mtime grossier) reste invisible jusqu'à la suivante ; tout calcul par étage doit passer par `_bloc_projet`
