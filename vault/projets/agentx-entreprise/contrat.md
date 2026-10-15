---
projet: agentx-entreprise
source: T002
cree: 2026-10-15
tags: [contrat]
---

# Contrat — registre des rôles, rejet/remplacement, RH, poste de pilotage

Contrainte qui décide : 4 implémenteurs parallèles sans canal → chaque règle (rôles, transitions, actions permises) a **1 propriétaire Python** ; le front n'en recalcule aucune, il affiche ce que `state.json` lui donne.
Décision : [[decisions#2026-10-15 — contrat T002]].

## C0 — options

| option | coût now | coût 1 an | rend impossible |
|---|---|---|---|
| A bête : ajouter 6 rôles dans les 8 sites en dur, front recalcule les actions | ~8 edits | 1 rôle = 8 sites, dérive JS/Py | ajout de rôle sans code |
| **B** registre `roles.json` + `bin/roles.py` + `bin/rh.py` ; serveur calcule `taches[].actions` ; front générique | 3 fichiers neufs | 1 rôle = 1 entrée JSON + 1 agent .md | ∅ |
| C registre lu par `vx.py` seul, front via GET `/roles.json` séparé | 1 route | 2 sources de vérité front (state + roles) | règles d'action côté serveur |

Choix : B. Marqueur de lint écrit dans ce contrat `"TODO" + "-PACK"` (collé dans le code réel) — ce fichier se recopie dans des packs lintés.

## C1 — `roles.json` (racine dépôt, propriétaire L1)

Schéma :
```
{
  "version": 1,                              # int == 1
  "roles": [                                 # liste non vide, ordre = ordre d'affichage (deck, salle, RH)
    {
      "cle":        str,   # ^[a-z]{2,20}$, unique ; = valeur `role:` des task.md ; = nom .claude/agents/<cle>.md
      "nom":        str,   # 1..16 car., affiché en capitales
      "sous":       str,   # 1..40 car., sous-titre de carte
      "livrable":   str,   # 1..20 car. → state.json roles[].label
      "couleur":    str,   # ^#[0-9a-f]{6}$, unique
      "modele":     str,   # affectable → ∈ MODELES ; sinon ""
      "affectable": bool,  # true → assignable à une tâche (ROLES)
      "livre_en":   str,   # affectable → "revue"|"fait" ; sinon ""
      "juge":       bool,  # true → ses deps en `revue` comptent comme satisfaites ; non-affectable → false
      "objet":      str    # ^[a-z]{2,20}$, clé GLYPHES (dash.js) ; inconnue → glyphe `resultat`
    }
  ]
}
invariants : "chef" et "vault" présents, affectable=false ; ≥ 1 affectable
```
Contenu complet (13 entrées) :
```json
{
  "version": 1,
  "roles": [
    {"cle": "chef",         "nom": "CHEF",         "sous": "ne code jamais · découpe",        "livrable": "packs validés", "couleur": "#3b82f6", "modele": "",        "affectable": false, "livre_en": "",      "juge": false, "objet": "pack"},
    {"cle": "eclaireur",    "nom": "ÉCLAIREUR",    "sous": "trouve où vivent les choses",     "livrable": "coordonnées",   "couleur": "#22e07a", "modele": "sonnet",  "affectable": true,  "livre_en": "fait",  "juge": false, "objet": "carte"},
    {"cle": "architecte",   "nom": "ARCHITECTE",   "sous": "tranche, produit un contrat",     "livrable": "contrats",      "couleur": "#a855f7", "modele": "opus",    "affectable": true,  "livre_en": "fait",  "juge": false, "objet": "contrat"},
    {"cle": "designer",     "nom": "DESIGNER",     "sous": "maquette, soigne l'interface",    "livrable": "maquettes/UI",  "couleur": "#e879f9", "modele": "inherit", "affectable": true,  "livre_en": "revue", "juge": false, "objet": "maquette"},
    {"cle": "implementeur", "nom": "IMPLÉMENTEUR", "sous": "code en périmètre fermé",         "livrable": "diff",          "couleur": "#ff8a3d", "modele": "inherit", "affectable": true,  "livre_en": "revue", "juge": false, "objet": "diff"},
    {"cle": "testeur",      "nom": "TESTEUR",      "sous": "écrit et lance les tests",        "livrable": "tests",         "couleur": "#818cf8", "modele": "inherit", "affectable": true,  "livre_en": "revue", "juge": false, "objet": "tests"},
    {"cle": "devops",       "nom": "DEVOPS",       "sous": "build, env, déploiement",         "livrable": "build/env",     "couleur": "#c8a27a", "modele": "inherit", "affectable": true,  "livre_en": "revue", "juge": false, "objet": "build"},
    {"cle": "verificateur", "nom": "VÉRIFICATEUR", "sous": "cherche à casser le livrable",    "livrable": "défauts",       "couleur": "#ff3b5c", "modele": "opus",    "affectable": true,  "livre_en": "fait",  "juge": true,  "objet": "defauts"},
    {"cle": "relecteur",    "nom": "RELECTEUR",    "sous": "relit le diff, lisibilité",       "livrable": "revue",         "couleur": "#a3e635", "modele": "sonnet",  "affectable": true,  "livre_en": "fait",  "juge": true,  "objet": "revue"},
    {"cle": "securite",     "nom": "SÉCURITÉ",     "sous": "audite failles et secrets",       "livrable": "audit",         "couleur": "#e2e8f0", "modele": "opus",    "affectable": true,  "livre_en": "fait",  "juge": true,  "objet": "audit"},
    {"cle": "evaluateur",   "nom": "ÉVALUATEUR",   "sous": "juge la DoD : retenir ou virer",  "livrable": "verdict",       "couleur": "#f472b6", "modele": "opus",    "affectable": true,  "livre_en": "fait",  "juge": true,  "objet": "verdict"},
    {"cle": "scribe",       "nom": "SCRIBE",       "sous": "capitalise, corrige les packs",   "livrable": "notes",         "couleur": "#ffcc33", "modele": "sonnet",  "affectable": true,  "livre_en": "fait",  "juge": false, "objet": "notes"},
    {"cle": "vault",        "nom": "VAULT",        "sous": "cohérence du dépôt",              "livrable": "doctor",        "couleur": "#2de2e6", "modele": "",        "affectable": false, "livre_en": "",      "juge": false, "objet": "resultat"}
  ]
}
```

## C2 — `bin/roles.py` (stdlib, propriétaire L1, n'importe pas vx)

```python
ROOT = Path(__file__).resolve().parent.parent
FICHIER = ROOT / "roles.json"
MODELES = ("inherit", "opus", "sonnet", "haiku")
LIVRE_EN = ("revue", "fait")

class RegistreInvalide(ValueError): ...      # message = 1 ligne lisible, ex. "roles[3].couleur : #FFF invalide"

@dataclass(frozen=True)
class Role:
    cle: str; nom: str; sous: str; livrable: str; couleur: str
    modele: str; affectable: bool; livre_en: str; juge: bool; objet: str

def charger(chemin: Path = FICHIER) -> dict[str, Role]
    # ordre du fichier ; cache par (chemin, st_mtime_ns) ; lève RegistreInvalide si absent/JSON KO/schéma C1 KO
def erreur() -> str                          # "" si charger() OK, sinon str(RegistreInvalide) ; ne lève jamais
def tous() -> tuple[str, ...]                # toutes les clés, ordre fichier ; () si invalide ; ne lève jamais
def affectables() -> tuple[str, ...]         # clés affectable=true ; () si invalide ; ne lève jamais
def role(cle: str) -> Role | None            # None si inconnu ou registre invalide
def livre_en(cle: str) -> str                # "revue"|"fait" ; "fait" si inconnu (tâches legacy)
def juges() -> tuple[str, ...]               # clés juge=true ; () si invalide
def dep_satisfaite(statut_dep: str, role_tache: str) -> bool
    # statut_dep == "fait" or (statut_dep == "revue" and role_tache in juges())
def est_role_agentx(nom: str) -> bool
    # registre OK → nom in affectables() ; registre KO → (ROOT/".claude"/"agents"/f"{nom}.md").exists()
```
Fichier absent/invalide :
- `vx.py` : `ROLES = ()` ; `tache`, `virer`, `doctor` → `die("roles.json invalide : <erreur()>", 3)` ; autres commandes OK
- `garde_dispatch.py`, `sonnerie.py` : `import roles` sous `try` ; échec import → même repli `.claude/agents/<nom>.md` ; jamais d'exception
- `dash.py` : `state.json.registre_erreur = roles.erreur()` ; `roles` = [] ; page affiche l'erreur dans `#deck`

## C3 — statuts et machine d'états

`bin/vx.py` (L1) :
```python
import roles
ROLES = roles.affectables()          # () si roles.json invalide
MODELES = roles.MODELES
STATUTS = ("a-faire", "pret", "en-cours", "bloque", "revue", "fait", "abandonne", "rejete")
STATUT_OUVERT = ("a-faire", "pret", "en-cours", "bloque", "revue")
STATUT_FERME = ("fait", "abandonne", "rejete")
```
`bin/dash.py` (L2) :
```python
ORDRE_PIPELINE = ["a-faire", "pret", "en-cours", "revue", "bloque", "fait", "rejete"]
```
Transitions (acteur = chef, toujours via CLI) :
```
a-faire  → pret                         set (après pack-lint OK)
pret     → en-cours                     set (dispatch)
en-cours → bloque                       set (result.md statut: bloque)
en-cours → revue                        set — rôle livre_en=revue
en-cours → fait                         set — rôle livre_en=fait
revue    → fait                         retenir            (SEUL chemin pour livre_en=revue)
{en-cours,bloque,revue,fait} → rejete   virer              (SEUL chemin vers rejete)
bloque   → a-faire|pret|en-cours        set
≠rejete  → abandonne                    set
abandonne → a-faire                     set
rejete   → ∅                            terminal
```
Contrôles durs dans `cmd_set` (rc 1 via `die`), le reste reste permissif (compat) :
```
--statut rejete                                   → "rejete : passe par `virer {tid} --motif \"...\"`"
--statut fait, livre_en(role)=="revue", avant≠fait → "{tid} ({role}) livre en revue : `retenir {tid}`"
avant == "rejete"                                 → "{tid} rejetee : statut terminal (remplacante : {remplacee_par})"
```
Dépendance satisfaite (board `!`, ready, dash `bloquee`, dash `_flux` livre) = `roles.dep_satisfaite(statut_dep, role_tache)`.
Journal : `retenir` écrit `-> fait` (compté par `_serie_depuis_journal`).

## C4 — champs `task.md` ajoutés

| champ | type | écrit par | sur |
|---|---|---|---|
| `remplace` | `T\d{3}` | `virer` | remplaçante |
| `remplacee_par` | `T\d{3}` | `virer` | virée |
| `motif` | str 1..200, 1 ligne | `virer` | virée |
| `retenu` | date ISO | `retenir` | retenue |
| `evaluation` | `T\d{3}` \| `chef` | `retenir` | retenue |
- absent = `""` ; tâches anciennes sans champ = valides ; `vault/_templates/task.md` inchangé
- `modele` existant : `tache` sans `--modele` → `roles.role(role).modele` (était `inherit`)
- motif normalisé : `re.sub(r"\s+", " ", m).strip().replace("[", "(").replace("]", ")").strip("\"'")` ; vide ou > 200 → die rc 1

## C5 — CLI `virer`, `retenir`, `personnel` (L1)

argparse (ajout dans `main()` après `set`) :
```python
    sp = sub.add_parser("virer", help="rejette le livrable d'un agent et cree la tache remplacante")
    sp.add_argument("tid"); sp.add_argument("--motif", required=True)
    sp.add_argument("--role", choices=ROLES or None, help="role de la remplacante (defaut : le meme)")
    sp.add_argument("--modele", choices=MODELES, help="modele de la remplacante (defaut : le meme)")
    sp.add_argument("--projet"); sp.set_defaults(f=cmd_virer)

    sp = sub.add_parser("retenir", help="valide un livrable en revue : revue -> fait")
    sp.add_argument("tid"); sp.add_argument("--projet")
    sp.add_argument("--sans-eval", action="store_true", help="retenir sans evaluation (le chef assume)")
    sp.set_defaults(f=cmd_retenir)

    sp = sub.add_parser("personnel", help="dossier RH : livrees, retenues, virees, renvoi par role et modele")
    sp.add_argument("--projet"); sp.add_argument("--json", action="store_true")
    sp.set_defaults(f=cmd_personnel)
```
`tache --role` : `choices=ROLES or None` ; validation dans `cmd_tache` (rc 3 si registre invalide).
Codes retour : 0 OK · 1 `die` métier · 2 argparse · 3 registre invalide.

### `virer TID --motif M [--role R] [--modele M] [--projet P]`
Préconditions (sinon `die` rc 1) :
```
statut ∈ {en-cours, bloque, revue, fait}   sinon "{tid} en statut « {s} » : aucun agent a virer (abandonne-la)"
motif normalisé 1..200 car.
```
Effets disque, dans l'ordre :
```
1. N = T{max(ids projet)+1:03d} ; D = proj/taches/f"{N}-{slugify(titre)}"
2. D/task.md : frontmatter, ordre exact
     id N · titre (idem) · projet · role (--role|ancien) · statut a-faire · deps (idem ancien)
     budget_tokens (idem) · modele (--modele|ancien) · cree today · maj today · tags [tache] · remplace TID
   corps = corps ancien task.md, 1re occurrence "# {TID} —" → "# {N} —"
3. D/context.md = copie de l'ancien, avec :
     frontmatter `pack: TID` → `pack: N` ; `role:` → nouveau rôle
     1re occurrence "Pack {TID}" → "Pack {N}"
     ligne insérée juste sous le titre « Décisions actées » (match deaccent().lower() startswith "## decisions actees") :
       f"- {MARQUEUR} remplace {TID} — vire : {motif} — corrige ce pack puis retire cette ligne"
       MARQUEUR = "TODO" + "-PACK"
     section absente → ligne insérée avant « ## Hors périmètre », sinon en fin de fichier
   → pack-lint N KO ("marqueurs a remplir") jusqu'à correction
   result.md NON copié
4. ancien task.md : statut rejete · motif M · remplacee_par N · maj today (clés ajoutées en fin)
5. tâches du MÊME projet, statut ∉ STATUT_FERME, TID ∈ deps → TID remplacé par N dans deps, maj today
6. journal (3 types de lignes) :
     f"{TID} viree -> rejete ({motif}) ; remplacante {N} [{role}/{modele}]"
     f"{N} creee — {titre} [{role}] (remplace {TID})"
     f"{X} deps {TID} -> {N}"            # 1 par tâche réécrite
7. cmd_index(quiet)
```
Sortie stdout exacte :
```
T004 : revue -> rejete (motif : tests non lances)
T009  vault/projets/<slug>/taches/T009-<slug-titre>
deps reecrites : T006, T007
-> corrige le pack : vault/projets/<slug>/taches/T009-<slug-titre>/context.md
-> puis : python3 bin/vx.py pack-lint T009 --projet <slug>
```
`deps reecrites : ∅` si aucune ; si ancien statut `en-cours`, ligne finale `~ T004 etait en-cours : verifie qu'aucun agent ne tourne encore`.

### `retenir TID [--sans-eval] [--projet P]`
```
statut == revue                 sinon die "{tid} en statut « {s} » : seul revue se retient"
E = max id des tâches evaluateur du projet avec TID ∈ deps
--sans-eval                     → evaluation: chef (E ignorée)
E absente                       → die "aucune evaluation de {tid} — python3 bin/vx.py tache \"Evaluer {tid}\" --projet {slug} --role evaluateur --dep {tid} (ou --sans-eval)"
E.statut ≠ fait                 → die "evaluation {E} pas encore faite (statut {s})"
E/result.md verdict ∉ {retenir,virer} → die "verdict illisible dans {E}/result.md"
verdict == virer                → die "{E} conclut virer : python3 bin/vx.py virer {tid} --motif \"<motif>\" --projet {slug} (ou --sans-eval)"
verdict == retenir              → evaluation: E
```
Effets : statut fait · retenu today · evaluation E|chef · maj today ; journal `f"{tid} statut revue -> fait (retenue, eval {E|chef})"` ; cmd_index(quiet).
Sortie : `T009 : revue -> fait (retenue, eval T012)`.

### `personnel [--projet P] [--json]` — calcul dans `bin/rh.py` (L1)
```python
# bin/rh.py — stdlib ; importe depuis vx : VAULT, lister_projets, lister_taches ; vx importe rh en local dans cmd_personnel
def personnel(projet: str | None = None) -> dict
    # périmètre : projet=None → vault/projets/* + vault/archive/* ; sinon vault/projets/<projet> seul
    # par tâche : role (str), modele (str, "" → "?"), statut
    #   taches   = toutes
    #   livrees  = statut ∈ {revue, fait, rejete}
    #   retenues = statut == fait
    #   virees   = statut == rejete
    #   en_revue = statut == revue
    #   taux_renvoi = round(virees / livrees, 3) si livrees else None
    # lignes roles : affectables() ordre registre, puis rôles inconnus rencontrés (tri alpha) ; lignes à 0 incluses
    # lignes modeles : clés rencontrées, tri alpha
```
JSON (`--json` et `state.json.personnel`) :
```json
{"perimetre": "tout", "projets": 2, "archives": 1, "taches": 23,
 "roles":   [{"cle": "implementeur", "taches": 12, "livrees": 10, "retenues": 8, "virees": 2, "en_revue": 0, "taux_renvoi": 0.2}],
 "modeles": [{"cle": "opus", "taches": 6, "livrees": 5, "retenues": 4, "virees": 1, "en_revue": 0, "taux_renvoi": 0.2}]}
```
`perimetre` = `"tout"` | slug ; `archives` = 0 si `--projet`.
Texte exact :
```python
print(f"PERSONNEL — {projets} projet(s) + {archives} archive(s), {taches} tache(s)")   # --projet : f"PERSONNEL — {slug}, {taches} tache(s)"
for titre, lignes in (("ROLE", d["roles"]), ("MODELE", d["modeles"])):
    print(f"  {titre:<13} {'TACHES':>6} {'LIVREES':>7} {'RETENUES':>8} {'VIREES':>6} {'RENVOI':>7}")
    for l in lignes:
        r = "—" if l["taux_renvoi"] is None else f"{round(100 * l['taux_renvoi'])} %"
        print(f"  {l['cle']:<13} {l['taches']:>6} {l['livrees']:>7} {l['retenues']:>8} {l['virees']:>6} {r:>7}")
```
0 tâche → `aucune tache — rien a mesurer.` rc 0. Pas de journal, pas d'écriture.

### `doctor` — ajouts (rc 2 si ≥ 1)
```
x roles.json invalide : {erreur}
x {slug}/{tid} : statut inconnu « {s} »
x {slug}/{tid} : rejete sans remplacee_par
x {slug}/{tid} : remplacee_par {N} introuvable
x {slug}/{tid} : depend de {dep} rejetee (remplacante {N})      # tâche ∉ STATUT_FERME
```

### Gardes (L1)
- `garde_dispatch.py:20` → `roles.est_role_agentx(subagent_type)` ; ajout après contrôle statut : `^role:\s*(\S+)` du task.md ≠ subagent_type → `refuser(f"{tid} est une tache « {r} », pas « {t} » : dispatche subagent_type={r}.")`
- `sonnerie.py:27` → `roles.est_role_agentx(agent_type)` ; événement gagne `verdict` :
```
{"id":"<hex16>","t":"HH:MM:SS","quoi":"agent-fini|agent-bloque","role":"<cle>","tid":"T###|","statut":"<[a-z-]+>|","verdict":"retenir|virer|"}
RE_VERDICT = re.compile(r"^verdict:\s*(retenir|virer)\b", re.M)   # 1000 premiers car.
```

## C6 — `result.md` de l'évaluateur

1 tâche evaluateur = 1 tâche évaluée = `deps: [TID]`. L'évaluateur ne lance ni `virer` ni `retenir`.
```markdown
---
tache: T012
statut: fait | bloque
evalue: T009
verdict: retenir | virer
---
## Verdict
retenir | virer — ≤ 8 mots
## DoD
- [x] <case du pack de T009> — `commande → sortie brute`
- [ ] <case> — manque : <fait>
## Motif
1 ligne ≤ 200 car., sans saut ni crochets — recopiée telle quelle dans `virer --motif` ; `∅` si retenir
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```
Règle : 1 case DoD `[ ]` ⇒ `verdict: virer`. `NV` vaut `[ ]`.

`integrer` (L1) — tâche de rôle evaluateur :
```
== <slug>/T012 [fait · result: fait · verdict: virer → T009] — Evaluer T009
   -- Verdict
   -- Motif
   -- DoD
   -- Ecarts
   -- Verifie comment
   -> python3 bin/vx.py virer T009 --motif "<Motif>" --projet <slug>     # si verdict virer et T009 ∉ {rejete, abandonne}
   -> python3 bin/vx.py retenir T009 --projet <slug>                     # si verdict retenir et T009 == revue
```
Autres rôles : inchangé. Tâche rejete : ligne `   remplacee par {N} — motif : {motif}` sous l'en-tête. Filtre par défaut inchangé (`fait, bloque, revue`).

## C7 — `state.json` (L2)

Clés ajoutées/modifiées (le reste inchangé) :
```json
{
  "registre_erreur": "",
  "statuts": ["a-faire","pret","en-cours","bloque","revue","fait","abandonne","rejete"],
  "pipeline": [{"k":"a-faire","n":2},{"k":"pret","n":1},{"k":"en-cours","n":2},{"k":"revue","n":1},
               {"k":"bloque","n":0},{"k":"fait","n":7},{"k":"rejete","n":1}],
  "roles": [
    {"cle":"implementeur","nom":"IMPLÉMENTEUR","sous":"code en périmètre fermé","label":"diff",
     "couleur":"#ff8a3d","modele":"inherit","affectable":true,"livre_en":"revue","juge":false,"objet":"diff",
     "valeur":"3/5","jauge":0.6,"etat":"au travail","actif":true,"actifs":2,"en_cours":["T006","T007"],
     "note":"T006 statut pret -> en-cours"}
  ],
  "taches": [
    {"id":"T009","titre":"…","role":"implementeur","statut":"revue","lint":"PASS","tokens":1400,"fichiers":4,
     "bloquee":false,"verdict":"VIRER","vierge":false,
     "modele":"inherit","livre_en":"revue","remplace":"T004","remplacee_par":"","motif":"",
     "evalue":"","eval":"T012","eval_verdict":"virer","eval_motif":"tests non lances",
     "actions":[
       {"k":"integrer","libelle":"intégrer","exe":{"action":"integrer","tid":"T009","projet":"x"},
        "cmd":"python3 bin/vx.py integrer T009 --projet x","saisie":""},
       {"k":"virer","libelle":"✕ virer","exe":{"action":"virer","tid":"T009","projet":"x","motif":"tests non lances"},
        "cmd":"python3 bin/vx.py virer T009 --motif \"tests non lances\" --projet x","saisie":"motif"}]}
  ],
  "personnel": {"perimetre":"tout","projets":2,"archives":1,"taches":23,"roles":[],"modeles":[]}
}
```
- `roles` : 1 entrée par entrée de `roles.json`, ordre fichier ; remplace `ROLES_META` (supprimé) ; vault/chef calculés comme aujourd'hui
- `taches[].verdict` : `RETENIR|VIRER` (frontmatter `verdict:` du result) prioritaire, sinon CONFORME/DÉFAUTS/… existant
- `taches[].evalue` : TID évalué (rôle evaluateur, 1re dep) ; `eval`/`eval_verdict`/`eval_motif` : dernière tâche evaluateur `fait` dont deps ∋ id, `""` sinon
- `eval_motif` = 1re ligne non vide de `## Motif`, `∅` → `""`
- `personnel` = `rh.personnel()` (global) ; exception → `{}`
- `_objet(de, vers)` : chef → pack ; paires exactes inchangées ; vers scribe → notes ; sinon `(role(de).objet, role(de).livrable)` ; inconnu → `("resultat","compte rendu")`
- `etat_demo` : rôles hors liste démo → `valeur "0/0"`, jauge 0, `"en attente"`, note `"aucune tâche"`

## C8 — `/api/run` et `_todo` (L2)

`construire_argv` — ajouts (ValueError sinon) :
```
action     params                                   validation                                          argv
virer      tid, projet, motif, role?, modele?       RE_TID ; slug connu ; motif str, strip, 1..200,     ["virer", tid, "--motif", motif, "--projet", projet]
                                                    ∄ [\x00-\x1f] ; role ∈ roles.affectables() si non     + ["--role", role] + ["--modele", modele] si fournis
                                                    vide ; modele ∈ roles.MODELES si non vide
retenir    tid, projet                              RE_TID ; slug connu                                 ["retenir", tid, "--projet", projet]
personnel  projet?                                  slug connu si fourni                                ["personnel"] (+ ["--projet", projet])
integrer   projet, tid?                             slug connu ; RE_TID si tid non vide                 ["integrer", tid?, "--projet", projet]
set        (existant)                               statut ∈ STATUTS et ≠ "rejete"                      inchangé
```
`retenir --sans-eval` jamais exposé à la page. Réponse inchangée `{commande, code, out, err}`.

`_actions_tache(l: dict, slug: str) -> list[dict]` — entrée `{"k","libelle","exe":dict|None,"cmd":str,"saisie":""|"motif"}`, ordre :
```
a-faire   pack(cmd "/pack T") · lint(exe pack-lint) · pret(exe set pret, si lint PASS) · abandonner(exe set abandonne)
pret      dispatch(cmd "/dispatch slug") · lint · abandonner
en-cours  integrer(si result.md) · livrer(exe set revue|fait selon livre_en, libelle "→ revue"|"→ fait", si result.md) · virer
bloque    integrer(si result.md) · reprendre(exe set a-faire) · virer · abandonner
revue     integrer · evaluer(cmd tache evaluateur, si eval=="") · retenir(exe retenir, si eval_verdict=="retenir") · virer
fait      integrer · virer
rejete    integrer
abandonne reprendre(exe set a-faire)
libellés : pack "✎ pack" · lint "lint" · pret "→ prêt" · abandonner "abandonner" · dispatch "⧉ dispatch" · integrer "intégrer"
           reprendre "↺ reprendre" · evaluer "⧉ évaluer" · retenir "✓ retenir" · virer "✕ virer"
virer : saisie "motif", exe.motif = eval_motif si eval_verdict=="virer" sinon ""
cmd "evaluer" = f'python3 bin/vx.py tache "Evaluer {T}" --projet {slug} --role evaluateur --dep {T}'
```
`_todo(proj, taches, lignes, personnel)` — règles ajoutées/modifiées :
```
prio titre                                   condition                                              cmd / exe
1    f"Virer {T}"                            eval verdict virer, T ∉ {rejete, abandonne}            virer --motif eval_motif / {"action":"virer","tid":T,"projet":slug,"motif":eval_motif}
2    f"Retenir {T}"                          eval verdict retenir, T == revue                       retenir / {"action":"retenir","tid":T,"projet":slug}
2    f"Faire évaluer {T}"                    T == revue, livre_en revue, eval == ""                 cmd evaluer / None
2    f"Passer {T} en revue"                  result.md, T ∈ {a-faire,pret,en-cours,bloque}, livre_en revue   set revue / exe set revue
2    f"Intégrer {T}" (existant)              idem, livre_en fait ; ∄ si T ∈ {revue, rejete}         inchangé
2    f"Corriger le pack de {T} (remplace {R})"  lint FAIL et champ remplace=R ; detail f"vire : {motif de R}"   f"/pack {T}" / None
4    f"Revoir le pack type de {role}"        personnel.roles : livrees ≥ 2 et taux_renvoi ≥ 0.5     "python3 bin/vx.py personnel" / {"action":"personnel"}
```
- `rejete` exclu comme `fait/abandonne` : boucle packs, Intégrer, `ouvertes`, Capitaliser
- « Faire vérifier » : `verifiees` = deps des tâches dont rôle ∈ `roles.juges()` (était verificateur seul)
- `ROLES_META` supprimé ; boucle `construire_etat:300` sur `roles.charger().values()`

## C9 — front (dash.js / index.html / dash.css)

Interdit : `alert`, `confirm`, `prompt`. Toute action = `exe` (POST api/run) ou `cmd` (copier). Le front ne décide aucune permission : il affiche `taches[].actions`.

### L3 — salle, deck, RH
```js
const COULEUR_ROLE = {};                 // vidé puis rempli par majRegistre ; littéral dash.js:7-10 supprimé
let POSTES = {};                         // était const dash.js:261 ; recalculé dans construireSalle
function majRegistre(s)                  // 1re ligne de rendre() : COULEUR_ROLE[r.cle] = r.couleur pour s.roles
function postesSalle(roles) -> {[cle]: [gx, gy]}
  // chef : [9.9, 0.7] fixe ; affectables ordre s.roles, ligne par ligne
  // COLS = n <= 6 ? 3 : 4 ; X0 = 1.2 ; PAS_X = 2.25 ; Y0 = 2.0 ; rows = ceil(n/COLS) ; PAS_Y = rows > 1 ? Math.min(2.2, 4.4/(rows-1)) : 0
  // poste i : [X0 + (i % COLS) * PAS_X, Y0 + floor(i / COLS) * PAS_Y]
function rendreRH(s)                     // #rh-roles, #rh-modeles depuis s.personnel ; appelée dans rendre() après rendreCourbe
```
- `COULEUR_STATUT` + `'rejete':'#9f1239'`, `'abandonne':'#3a4460'`
- `construireSalle` : bureaux = boucle sur `s.roles` affectables + chef (nom = `r.nom`) ; plus aucun appel `bureau()` en dur
- props déplacés : fusée `[10.7, 6.4]` · radar `[10.7, 7.9]` ; autres inchangés
- tableau pipeline mural : `pas = 5.4 / s.pipeline.length` ; `y0 = 1.7 + i*pas` ; largeur barre `pas*.67`
- `GLYPHES` + clés `verdict, revue, tests, maquette, audit, build` (inconnue → `resultat`, existant)
- signature salle (`rendre`) inclut `s.roles.map(r => r.cle + r.couleur)`
- deck : 13 cartes `#card-<cle>` inchangées ; CSS `#deck` en grille `repeat(auto-fill, minmax(150px, 1fr))` ; `s.registre_erreur` non vide → `#deck` affiche `<div class="deck-erreur">roles.json invalide : …</div>`
- toasts (`annoncer`) : `e.verdict` non vide → suffixe `verdict : <v>`
- index.html, après `.chart-panel` :
```html
<section class="panel rh-panel" id="rh">
  <div class="panel-head"><span class="panel-title">PERSONNEL · RH</span><span class="panel-meta" id="rh-meta"></span></div>
  <div class="rh-corps"><table class="rh-table" id="rh-roles"></table><table class="rh-table" id="rh-modeles"></table></div>
</section>
```
  colonnes : RÔLE|MODÈLE · TÂCHES · LIVRÉES · RETENUES · VIRÉES · RENVOI ; `taux_renvoi` null → `—` ; ≥ 0.5 → classe `.ko` ; `s.personnel.taches` 0/absent → `aucune tâche livrée` ; `#rh-meta` = `{projets} projet(s) · {archives} archive(s)`

### L4 — poste de pilotage
Supprimés : dash.js `sortie`, `ecrire`, `lancer`, `peuplerConsole`, `brancherConsole` (:981-1072) + appel `peuplerConsole(s)` (:915) ; dash.css :412-437 ; index.html `#console-out` (:140).
```js
async function copier(texte, bouton)                 // conservé verbatim (dash.js:1021-1034)
async function pilote(req, bouton)                    // ex-lancer : POST api/run, X-AgentX-Jeton ; écrit #sortie + #sortie-etat ; puis await charger()
function brancherTodo()                               // délégation #todo : [data-exe] → pilote(ETAT.todo[i].exe) ; [data-copie] → copier(ETAT.todo[i].cmd)
function brancherTaches()                             // délégation #tasks : [data-act][data-tid] → actionTache
function actionTache(tid, k, bouton)                  // a = ETAT.taches.find(t => t.id === tid).actions.find(x => x.k === k) ; a.saisie → ouvrirSaisie ; a.exe → pilote ; sinon copier(a.cmd)
const SAISIE = {tid: null, k: null};
function ouvrirSaisie(tid, k)                         // cellule .tact de la ligne → <input id="saisie-motif" maxlength="200"> prérempli a.exe.motif + ✓ + ✕
function fermerSaisie()
const PALETTE = {ouverte: false, sel: 0, entrees: [], saisie: null};
function entreesPalette(s) -> Array<{titre, sous, exe, cmd, saisie}>
  // globales : board, ready, doctor, index, personnel, integrer (exe {action, projet: s.projet.slug})
  // + par tâche : s.taches[].actions → titre `${t.id} · ${a.libelle}`, sous t.titre
  // + copie : `/dispatch ${slug}` si ∃ tâche pret
function ouvrirPalette() ; function fermerPalette() ; function filtrerPalette(q) ; function executerEntree(e, bouton) ; function brancherPalette()
function basculerTiroir(ouvrir)                       // ouvrir undefined → bascule ; localStorage 'agentx:tiroir' '1'|'0' (défaut '0')
```
Règles :
- `rendreTaches` : ligne `<div class="trow … rejete?" data-tid="T…">` + `<span class="tact">` de `<button class="tbtn" data-act="${a.k}" data-tid="${t.id}">${esc(a.libelle)}</button>` ; `.tasks-head` + `<span>ACTIONS</span>` ; retour immédiat sans repeindre si `SAISIE.tid !== null`
- saisie : Entrée → motif.trim() 1..200 → `pilote({...a.exe, motif})` puis `fermerSaisie()` ; Échap → `fermerSaisie()` ; motif vide → bordure `.ko`, rien n'est envoyé
- palette : filtre = sous-chaîne, minuscules sans accents, sur `titre + ' ' + sous` ; ↑/↓ `PALETTE.sel` ; Entrée → `executerEntree` ; entrée `saisie:"motif"` → `#palette-q` devient la saisie du motif (placeholder `motif du renvoi — Entrée`)
- raccourcis (keydown sur window, capture) :
```
Ctrl/⌘ + K   palette (ouvrir/fermer) — ignoré si document.activeElement.className === 'xterm-helper-textarea'
Ctrl + `     tiroir terminal — actif partout, y compris dans xterm
Échap        ferme, dans l'ordre : palette > saisie > plein écran (existant)
```
- tiroir : `<section class="panel term-panel tiroir" id="tiroir">` (ex-term-panel) ; `position: fixed; left:0; right:0; bottom:0; height: min(70vh, 640px)` ; fermé = `transform: translateY(calc(100% - 34px))` (jamais `display:none` : xterm garde ses cols) ; classe `.ouvert` ; après bascule `setTimeout(() => TERMINAL.fit.fit(), 50)` ; `.frame` `padding-bottom: 40px` ; ids conservés `#term #term-etat #term-full #term-start #term-stop` ; ajout `<button class="cbtn" id="tiroir-btn">▴ terminal</button>` dans `.panel-head`
- index.html, panneau tâches : titre `POSTE DE PILOTAGE` ; dans `.panel-head` : `<span class="pilote-barre" id="pilote-barre">` de `<button class="cbtn" data-lire="board|ready|doctor|index|personnel|integrer">` + `<kbd class="kbd">⌘K</kbd>` ; sous `#tasks` : `<pre class="sortie" id="sortie" hidden></pre><span class="sortie-etat" id="sortie-etat"></span>`
- fin de body, avant scripts :
```html
<div class="palette" id="palette" hidden>
  <input id="palette-q" autocomplete="off" spellcheck="false" placeholder="action, tâche, commande…">
  <ul id="palette-liste"></ul>
  <div class="palette-pied" id="palette-pied">↑↓ choisir · Entrée lancer · Échap fermer</div>
</div>
```
- amorçage fin de fichier : `brancherTodo(); brancherTaches(); brancherPalette(); brancherTerminal(); brancherSon(); boucle();`

## C10 — répartition

| lot | fichiers E | § à recopier | vague |
|---|---|---|---|
| L1 CLI+gardes | `roles.json` (neuf) · `bin/roles.py` (neuf) · `bin/rh.py` (neuf) · `bin/vx.py` · `bin/garde_dispatch.py` · `bin/sonnerie.py` | C1 C2 C3 C4 C5 C6 | 1 |
| L2 serveur | `bin/dash.py` | C2 (signatures) C3 C5(rh JSON) C6 C7 C8 | 1 |
| L3 front salle/RH | `dash/dash.js` · `dash/index.html` · `dash/dash.css` | C1 (couleurs/objet) C7 C9-L3 | 1 |
| L4 front pilotage | `dash/dash.js` · `dash/index.html` · `dash/dash.css` | C7 C8 (actions) C9-L4 | 2 (après L3) |
- L1 ∩ L2 = ∅ ; L2 lit `roles`/`rh` sans les écrire ; vérif runtime L2 après L1
- hors lots : `.claude/agents/*.md` (T006), skills (T003-T005), `SKILL.md` chef, `bin/supervision.py`
- point de non-retour : 1er `virer` exécuté → `rejete` + `remplace/remplacee_par` + deps réécrites dans le vault ; clé de rôle = valeur `role:` des task.md (renommer = migrer les task.md)
