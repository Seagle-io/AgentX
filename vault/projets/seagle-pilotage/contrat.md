---
projet: seagle-pilotage
source: T002
cree: 2026-10-15
tags: [contrat]
---

# Contrat — étage = produit, registre `produits.json`, porte `agentx publier`

Contrainte qui décide : le rattachement projet → produit doit survivre à la création de projets par le chef (CLI) sans toucher aux chemins `vault/projets/<slug>/` (hooks, sonnerie `RE_CHEMIN`, packs, `lister_projets` en dépendent) → **rattachement porté par le projet, registre produits sans liste de projets**.
Décision : [[decisions#2026-10-16 — étage = produit : `produit:` dans brief.md, étage agrège, porte publier en lecture git]].
Supersède [[agentx-immeuble/contrat]] §C1 (étages), §C2 (ordre), §C3 (sélection) ; §C4-C7 inchangés sauf mention.

## C0 — options

Rattachement projet → produit :
| option | coût now | coût 1 an | rend impossible |
|---|---|---|---|
| **R1** `produit: <cle>` dans brief.md (CLI `projet --produit`, `rattacher`) | 1 champ + 1 cmd + 11 `rattacher` | 0 ; brief déjà dans `_signature` → cache gratuit | ∅ |
| R2 `projets: [slugs]` dans produits.json | 1 liste | 2 sources (projet créé ≠ registre) ; registre dépend du vault ; doctor obligatoire | registre valide sans vault |
| R3 dossiers `vault/produits/<p>/projets/` | déplacer 11 projets | chaque chemin codé (hooks, sonnerie, packs, liens Obsidian) à réécrire | liens `vault/projets/<slug>` stables |

Étage :
| option | coût now | coût 1 an | rend impossible |
|---|---|---|---|
| **E1** étage agrège ses projets (blocs en cache, somme en mémoire) | `_bloc_produit` pur | ≈ 0 ms/étage ; N projets/étage libres | ∅ |
| E2 1 projet permanent par produit | fusionner 11 projets ; TID en collision | tâches illimitées dans 1 dossier ; board illisible | projets parallèles d'un produit |
| E0 bête : garder étage = projet, colorier par produit | 0 | 11 → 30 étages, tour compressée (`n > 8`) | « un étage = un produit » (cadrage humain) |

Choix : R1 + E1. R2 casse dès le 1er `agentx projet` oublié ; R3 coûte tous les chemins ; E2 casse les TID ; E0 contredit le cadrage.

Migration (L2, via CLI, 0 édition à la main) :
```
agentx-entreprise, agentx-immeuble, agentx-voix            → agentx
geolens-viewer, geolens-preview-3d, geolens-charge-3d      → geolens
orthopro, dashboard-grille, dashboard-direct (clos)        → kora
seagle-site, seagle-pilotage                               → seagle   (entreprise)
```

## C1 — registre `produits.json` (L1)

Racine du dépôt. Propriétaire unique : `bin/produits.py` (stdlib, n'importe ni vx ni dash ; modèle `bin/roles.py`).
```json
{
  "version": 1,
  "produits": [
    {"cle": "kora", "nom": "Kora", "sous": "orthophonie : dossier patient, agenda", "couleur": "#14b8a6",
     "entreprise": false, "etat": "actif", "env": "vault/projets/orthopro/env.md",
     "depots": [
       {"chemin": "~/Documents/Workspace/OrthoPro/ortho-front", "branche_publication": "master", "ui": ["src"]},
       {"chemin": "~/Documents/Workspace/OrthoPro/ortho-back",  "branche_publication": "master", "ui": []}],
     "site": {"depot": "~/Documents/Workspace/seagle-website", "branche": "main",
              "pages": ["src/pages/Kora/index.tsx"], "textes": ["src/lib/local/*/Kora.ts"],
              "captures": ["public/kora/*.webp"]},
     "marketing": {"vault": "~/Documents/Workspace/Seagle-Marketing",
                   "calendriers": ["Calendrier éditorial.md", "05 - Calendrier.md"], "motifs": ["Kora", "OrthoPro"]},
     "sources": [{"domaine": "finance", "chemin": "~/Documents/Workspace/OrthoPro/Businessplan.md"},
                 {"domaine": "finance", "chemin": "~/Documents/Workspace/OrthoPro/PRICING_LICENCES.md"},
                 {"domaine": "finance", "chemin": "~/Documents/Workspace/OrthoPro/PLAN_FACTURATION.md"}]},
    {"cle": "geolens", "nom": "Geolens", "sous": "viewer 3D, packs, analyse de risque", "couleur": "#38bdf8",
     "entreprise": false, "etat": "actif", "env": "",
     "depots": [{"chemin": "~/Documents/Workspace/Geolens/geolens-web-feat-viewer-online", "branche_publication": "master", "ui": ["web/src"]}],
     "site": {"depot": "~/Documents/Workspace/Geolens-website", "branche": "main",
              "pages": ["src/pages/Logiciel.tsx"], "textes": ["src/site.ts", "src/content/pages.ts"],
              "captures": ["public/images/logiciel/vue-*.webp"]},
     "marketing": {"vault": "~/Documents/Workspace/Seagle-Marketing",
                   "calendriers": ["Calendrier éditorial.md", "05 - Calendrier.md"], "motifs": ["Geolens"]},
     "sources": [{"domaine": "finance", "chemin": "~/Documents/Workspace/Geolens/Devis DEV-2026-001 - SEAGLE - Geolens V2.docx"}]},
    {"cle": "agentx", "nom": "AgentX", "sous": "système multi-agent à vault", "couleur": "#6366f1",
     "entreprise": false, "etat": "actif", "env": "",
     "depots": [{"chemin": "~/Documents/Workspace/AgentX", "branche_publication": "main", "ui": ["dash"]}],
     "site": null, "marketing": null, "sources": []},
    {"cle": "seagle", "nom": "Seagle", "sous": "entreprise : site, marketing, finance, juridique, RSSI", "couleur": "#e2b04a",
     "entreprise": true, "etat": "actif", "env": "",
     "depots": [{"chemin": "~/Documents/Workspace/seagle-website", "branche_publication": "main", "ui": ["src"]}],
     "site": null,
     "marketing": {"vault": "~/Documents/Workspace/Seagle-Marketing", "calendriers": ["Calendrier éditorial.md"], "motifs": []},
     "sources": [{"domaine": "finance", "chemin": "~/Documents/Workspace/Seagle-Marketing/07 - KPIs et budget.md"},
                 {"domaine": "finance", "chemin": "~/Documents/Workspace/Audit-geolens/charte_seagle/DEVIS_GEOLENS_BPIFRANCE.docx"},
                 {"domaine": "finance", "chemin": "~/Documents/Workspace/Audit-geolens/charte_seagle/DEVIS_GEOLENS_MEP_V1.docx"}]}
  ]
}
```
Valeurs NV (vérifiées en DoD L1, sinon L1 `bloque`) : `ortho-front` `ui: ["src"]` ; `agentx` `branche_publication: "main"` ; Geolens `env` "" (fiche env.md geolens non constatée). Couleurs = choix de rendu.
```python
FICHIER = ROOT / "produits.json"
ETATS = ("actif", "archive")
DOMAINES = ("finance", "juridique", "marketing", "rssi", "produit")
RE_CLE = re.compile(r"[a-z][a-z0-9]{1,19}")
RE_COULEUR = re.compile(r"#[0-9a-f]{6}")
RE_BRANCHE = re.compile(r"[A-Za-z0-9._/-]{1,64}")
class RegistreInvalide(ValueError)
@dataclass(frozen=True) class Depot:     chemin: str; branche_publication: str; ui: tuple[str, ...]
@dataclass(frozen=True) class Site:      depot: str; branche: str; pages: tuple; textes: tuple; captures: tuple
@dataclass(frozen=True) class Marketing: vault: str; calendriers: tuple; motifs: tuple
@dataclass(frozen=True) class Source:    domaine: str; chemin: str
@dataclass(frozen=True) class Produit:   cle; nom; sous; couleur; entreprise: bool; etat; env: str;
                                         depots: tuple[Depot, ...]; site: Site | None; marketing: Marketing | None; sources: tuple[Source, ...]
def charger(chemin: Path = FICHIER) -> dict[str, Produit]   # ordre fichier ; cache (chemin, st_mtime_ns) ; lève RegistreInvalide
def erreur() -> str                                         # "" si valide, sinon message
def tous() -> tuple[str, ...]                               # () si invalide
def produit(cle: str) -> Produit | None
def entreprise() -> Produit | None                          # l'unique entreprise:true
def chemin(s: str) -> Path                                  # Path(s).expanduser()
def produit_de(meta_brief: dict) -> tuple[str, str]         # (cle, "brief"|"defaut"|"") : meta["produit"] ∈ tous() → brief ; sinon entreprise → defaut ; registre invalide → ("", "")
def verifier(p: Produit) -> list[str]                       # FS + git LECTURE : chemins existent ; .git ; `git -C d rev-parse --verify -q <branche>` ; [] = OK ; jamais levé
```
`_valider` (pur, 0 accès disque hors JSON) — message `produits[i].<champ> : <valeur> invalide (...)` :
- racine objet ; `version` int == 1 ; `produits` liste non vide ; types exacts (bool ≠ int)
- `cle` RE_CLE, unique ; `nom` 1..24 car. ; `sous` 1..48 ; `couleur` RE_COULEUR, unique ; `etat` ∈ ETATS
- `entreprise` : exactement 1 `true`, et `etat == "actif"`
- `depots[]` liste (vide OK) ; `chemin` commence par `/` ou `~/` ; `branche_publication` RE_BRANCHE ; `ui[]` relatifs, ∌ `..`, ≠ `/…`
- `site` null ou objet ; `depot` comme `chemin` ; `branche` RE_BRANCHE ; `pages`, `textes`, `captures` listes de motifs relatifs (glob git `:(glob)`), `captures` non vide
- `marketing` null ou objet ; `vault` comme `chemin` ; `calendriers` ≥ 1 relatif ; `motifs` liste str
- `env` "" ou commence par `vault/projets/` et finit par `.md` ; `sources[].domaine` ∈ DOMAINES
Erreur → `state.produits_erreur` (bandeau comme `registre_erreur`, dash.js:74-80) ; vx `publier`/`rattacher` → `die(..., 3)`.

## C2 — état serveur (L4)

`state.json` : clés existantes inchangées ; + `"produits_erreur": str`. `immeuble` :
```
"immeuble": {
  "mode": "produits"|"projets",                # "projets" = produits_erreur ≠ "" → comportement T019 intégral, produit null
  "selection": {"slug": str,                   # cle de l'étage (mode projets : slug projet)
                "projet": str,                 # == state.projet.slug (invariant)
                "source": "requete"|"epingle"|"activite"|"defaut", "refus": str},
  "epingle": str,                              # slug projet (run/projet)
  "toit": {…inchangé…},
  "etages": [{
    "slug": str, "titre": str,                 # cle, nom produit
    "statut": str,                             # etat produit ("actif") ; mode projets : statut brief
    "rang": int, "num": int, "activite": str, "age_j": float, "dormant": bool,
    "compteurs": {…STATUTS…}, "total": int, "agents": [{"role","tid","projet"}],
    "todo": int, "alerte": {"niveau": ""|"bloque"|"urgent", "texte": str}, "selection": bool,
    "produit": {"cle": str, "couleur": str, "entreprise": bool} | null,
    "projets": [{"slug": str, "titre": str, "statut": str, "activite": str,
                 "encours": int, "revue": int, "bloque": int, "actif": bool}],   # ouverts, activite desc ; actif = projet détaillé
    "selectionnable": bool                     # projets non vide
  }],
  "sous_sol": [{…existant…, "produit": str}],  # projets clos/archive + vault/archive/* ; produit "" si inconnu
  "mesure_ms": int
}
"todo": [{…existant…, "projet": str, "etage": str}]      # etage = cle ("" = toit)
"evenements": [{…existant…, "projet": str, "etage": str}]
```
Règles :
- étages = produits `etat == "actif"` (entreprise toujours présente, même 0 projet) ; produit `archive` → ∅ étage, ses projets au sous-sol
- projet sans `produit:` valide → étage entreprise (`produit_de` → `defaut`) ; `doctor` le signale (C4)
- agrégat : `activite` max ; `compteurs`, `total` somme ; `agents` concat tri (projet, tid) ≤ 12 ; `todo` items = concat ; `alerte` : Σbloque > 0 → `"<n> bloquée(s)"`, sinon 1er item prio 1 de l'étage
- `dormant` = tous ses projets dormants (C2 T019, `DORMANCE_J = 7`) ou 0 projet, et ≠ étage sélectionné
- ordre = **ordre du fichier** (stable, ≠ activité) ; entreprise forcée en dernier (rez-de-chaussée, `num = 1`) ; rang 0 = sous le chef
- tri todo C4 : `rang_etage` = rang de l'étage du projet

Sélection (`do_GET` : `etage = q.get("etage",[""])[0]`, `projet = q.get("projet",[""])[0]`) :
```
1. projet valide (RE_SLUG, ∈ lister_projets, clos accepté)          → étage = produit_de(projet) ; source requete
2. etage ∈ étages selectionnables                                     → projet = épingle si ∈ étage, sinon projets[0] de l'étage ; source requete
   etage ∉ étages mais ∈ lister_projets (ancien lien #/<projet>)      → traité comme 1.
   demande non vide non résolue                                        → refus "slug inconnu : <x[:48]>", on continue
3. épingle ∈ lister_projets                                           → son étage ; source epingle
4. projet le plus actif des étages non dormants                       → source activite
5. lister_projets()[0]                                                 → source defaut
```
Signatures `bin/dash.py` :
```python
def construire_etat(projet: str | None = None, etage: str | None = None) -> dict   # positionnel inchangé
def _bloc_produit(prod: "produits.Produit | None", blocs: list[dict], sel: str, maintenant: float) -> dict
    # pur : 0 IO ; entrées = blocs de _bloc_projet (cache inchangé) ; sortie = agrégat ci-dessus sans rang/num
def _groupes(ouverts: list[Path], metas: dict[str, dict]) -> dict[str, list[Path]]   # cle → projets ; mode projets : slug → [p]
def _etage(...)                                # garde son rôle ; reçoit l'agrégat de _bloc_produit
def _choisir(projets, groupes, etage: str | None, projet: str | None) -> tuple[Path, str, str, str]   # (sel, cle, source, refus)
```
- `lire_frontmatter(brief)` déjà lu par poll (dash.py:492) : `produit` y est pris, 0 lecture de plus
- `_evenements()` : `ev.setdefault("etage", produit du projet ou "")`
- `main()` : + `--etage` ; `--json --projet X` inchangé
- perf : budget C7 T019 inchangé (chaud médiane ≤ 120 ms, froid ≤ 600 ms, 11 projets) ; même commande de mesure ; `produits.charger()` = 1 `stat` par poll

## C3 — front (L5)

```js
const IMMEUBLE = {slug: null, projet: null};       // + projet
function etageDemande() -> {etage: string|null, projet: string|null}   // '#/<cle>' | '#/<cle>/<slug>' ; chaque partie RE_SLUG_PAGE
function allerEtage(cle, projet = null)            // hash '#/'+cle (+ '/'+projet)
charger()   : 'state.json?' + (etage ? 'etage=…&' : '') + (projet ? 'projet=…&' : '') + 't=…'
              refus → hash effacé, IMMEUBLE = {slug:null, projet:null}
rendreImmeuble / construireTour : titre = nom produit ; --c = e.produit?.couleur ; e.selectionnable false → non cliquable, title 'aucun projet'
#pa-label  : 'ÉTAGE <titre>' + puces e.projets[] (<button data-projet>) → allerEtage(cle, slug) ; .actif = projet détaillé
sous-sol   : clic → allerEtage(p.produit || p.slug, p.slug)
sonnerEtages(evs) : clés = e.etage || e.projet
rendreTodo : .ti-etage → allerEtage(i.etage, i.projet)
s.produits_erreur → bandeau 'produits.json invalide : …' (même gabarit que registre_erreur)
```
- signature `rendreTour` (dash.js:1343) + `e.produit?.couleur`, `e.projets.length`
- ancien hash `#/<projet>` : envoyé en `etage=` → serveur résout (C2 étape 2) → hash réécrit `#/<cle>/<projet>` par `history.replaceState`

## C4 — CLI (L2)

```
agentx projet <slug> [--titre T] [--produit <cle>]   # écrit `produit: <cle>` dans brief.md ; cle ∉ tous() → die 2 avec la liste
agentx rattacher <projet> <cle>                       # réécrit le frontmatter du brief (ecrire_frontmatter), journalise « rattaché à <cle> »
agentx doctor                                         # + « projet <slug> : produit absent|inconnu (<v>) » ; + produits.erreur() ; + verifier(p) par produit actif
agentx publier <cle> [--json] [--taches] [--acquitter <id> --motif "<1 ligne>"]   # délègue : import publier ; publier.cmd(args)
```
- `vault/_templates/brief.md` : + ligne `produit: {{PRODUIT}}` après `depot:` ; absent → valeur vide
- `--produit` optionnel : absent → `produit:` vide → étage entreprise + alerte doctor

## C5 — porte `agentx publier <cle>` (L3)

Module `bin/publier.py` (stdlib ; importe `produits`, `vx`) ; `main()` propre (`python3 bin/publier.py <cle> …` = même chose). **0 écriture git, 0 réseau** (`fetch` interdit : la porte juge les refs locales) ; écriture vault seulement avec `--taches` / `--acquitter`.
```python
def cmd(args) -> None                                     # imprime, sys.exit(code)
def evaluer(cle: str, aujourd_hui: date | None = None) -> dict   # pur lecture ; forme JSON ci-dessous
def git(depot: Path, *argv: str) -> str                   # subprocess ["git","-C",depot,*argv], timeout 10 s, erreur → GitErreur(msg)
```
Codes : 0 GO · 1 NO-GO · 2 usage (cle inconnue, entreprise:true, site null) · 3 registre invalide ou `verifier()` ≠ [].
Pathspec : chaque motif du registre passé en `:(glob)<motif>`. `S` = site.depot, `B` = site.branche, `SP` = pages+textes+captures.

| # | contrôle | commande (lecture) | écart si | id | gravité | rôle |
|---|---|---|---|---|---|---|
| P0 | registre | `produits.erreur()`, `verifier(p)` | ≠ "" / ≠ [] | — | exit 3 | — |
| P1 | site sur sa branche | `git -C S log --format='%h %cs %s' -n 50 B..HEAD -- SP` | ≥ 1 ligne | `site-branche:<cle>:<HEAD court>` | bloquant | devops |
| P2 | référence site | `T_txt = git -C S log -1 --format=%cI B -- pages textes` ; `T_cap = … -- captures` | vide → écart P1 forcé (« pages absentes de B ») | — | — | — |
| P3 | commits non reflétés | par dépôt d : `git -C d log --no-merges --format='%h %cI %s' -n 200 --since=T_txt d.branche_publication -- ui…` | sujet ~ `RE_FEAT` | `textes:<cle>:<1er hash feat>` | bloquant | marketing |
|  |  |  | autres lignes | `commits:<cle>:<1er hash>` | avertissement | ∅ tâche |
| P4 | captures vs UI | `T_ui = max_d git -C d log -1 --format=%cI d.branche_publication -- ui…` | `T_cap < T_ui` | `captures:<cle>:<T_ui date>` | bloquant | designer |
| P5 | calendrier marketing | lecture `vault/<calendrier>` (pas git) | ligne ∋ motif (insensible casse) et `RE_OUVERT` | `marketing:<sha1(fichier+ligne)[:8]>` | bloquant | marketing |
```python
RE_FEAT   = re.compile(r"^(feat|ajout|nouveau|new)\b", re.I)
RE_OUVERT = re.compile(r"à (faire|corriger|vérifier|valider|relire)|\bTODO\b|- \[ \]", re.I)
```
- P3 heuristique = sujets de commit seulement ; comparaison texte ↔ fonctionnalité **non tentée** : l'écart `textes` dit « à vérifier par un agent » + liste des sujets feat (≤ 20)
- `ui: []` partout (ex. ortho-back) → dépôt ignoré en P3/P4
- verdict : NO-GO ⇔ ≥ 1 écart bloquant non acquitté ; avertissements jamais bloquants
- ids stables : un acquit expire seul quand la preuve change (nouveau HEAD, nouveau feat, nouvelle date UI)

Acquits : `vault/projets/publication-<cle>/acquits.md`, append-only, 1 ligne `- <AAAA-MM-JJ> \`<id>\` — <motif>` ; `--acquitter` refuse un id absent de l'évaluation courante (exit 2).
`--taches` : projet `publication-<cle>` créé si absent (`cmd_projet`, `produit: <cle>`, titre `Publication <Nom>`) ; 1 tâche par écart bloquant non acquitté ; titre `publier <cle> : <type> <id-court>` ; doublon (même id dans le titre d'une tâche ∈ STATUT_OUVERT) → sauté ; statut `a-faire` ; pack pré-rempli : Mission (écart), DoD (`agentx publier <cle> --json` → id absent), Fichiers autorisés (site.depot fichiers du motif, L/E), Contrats (preuves verbatim), Hors périmètre (« jamais push, jamais migration ») ; **`## Décisions actées` garde le marqueur du gabarit** → `pack-lint` FAIL tant que le chef n'a pas relu.
Sortie `--json` :
```json
{"produit": "kora", "verdict": "NO-GO", "horodate": "2026-10-15 14:03",
 "controles": [{"id": "P1", "statut": "ecart", "commande": "git -C … log …", "duree_ms": 12}],
 "ecarts": [{"id": "site-branche:kora:29d349b", "type": "site-branche", "gravite": "bloquant",
             "titre": "16 commits du site hors main touchent Kora", "preuves": ["29d349b 2026-10-14 …"],
             "role": "devops", "acquitte": false, "tache": ""}],
 "taches_creees": []}
```
`controles[].statut` ∈ ok|ecart|avertissement|erreur ; `preuves` ≤ 20 lignes brutes ; texte (sans `--json`) : `GO|NO-GO <cle>` puis 1 ligne par écart `[bloquant] <id> — <titre>`.

## C6 — captures (L6)

```
outils/captures/capturer.mjs <cle> --base <url> --sortie <dir> [--essai] [--ecrans a,b]
outils/captures/<cle>.mjs → export default {
  ecrans:  {<nom>: <route>},                               // Kora : agenda, bilan, bilan-detail, bilan-trames, dashboard, documents,
                                                           //   exercise-edit, exercises, forum, my-day, patient-detail, patient-suivi, settings
  themes:  ['dark', 'light'] | [null],
  tailles: [{suffixe: '1280', largeur: 1280, hauteur: int, dpr: 1}, {suffixe: '2400', …}],   // mesurées sur les fichiers existants
  nom:     (theme, ecran, suffixe) => string,              // Kora : `${theme}-${ecran}-${suffixe}.webp` ; Geolens : `vue-${ecran}.webp`
  async connexion(page, env) {}, async theme(page, t) {} }
```
- Playwright résolu par `createRequire(<site.depot>/package.json)` (site : `scripts/og-images.mjs` l'utilise), sinon chaque `depots[].chemin` ; introuvable → exit 3 (0 `npm install`)
- webp : screenshot PNG → `sharp` (même résolution) sinon `cwebp` sinon `python3 -c PIL` ; aucun → exit 3
- `--essai` : 0 navigateur, imprime les noms prévus ; doit égaler `git -C S ls-tree --name-only B -- <captures>` hors `game-*`, vidéos, posters (manuels)
- produit lancé : par l'humain par défaut (BLQ + commande exacte de `env`) ; par l'agent seulement si `env` dit le lancement sans migration au boot ; Geolens : stack locale seule, **jamais** l'URL du serveur de test ; comptes et données de démonstration seulement (données patients réelles → BLQ)
- branche : créée par l'**agent**, hors arbre de travail de l'humain :
```
git -C <S> worktree add <ROOT>/.cache/captures/<cle>/site -b captures/<cle>-<AAAAMMJJ> <B>
avant : copie des fichiers <captures> du worktree → .cache/captures/<cle>/<AAAAMMJJ-HHMM>/avant/
node outils/captures/capturer.mjs <cle> --base <url> --sortie .cache/captures/<cle>/<AAAAMMJJ-HHMM>/apres/
copie apres/ → worktree (mêmes noms) ; git -C <worktree> add <captures> ; git -C <worktree> commit -m "captures <cle> <AAAA-MM-JJ>"
```
- jamais push ; worktree refusé par `garde_bash` → `bloque` avec la commande ; humain : relit avant/après, fusionne, pousse, `git worktree remove`
- tâches de capture réelles = celles créées par `publier --taches` (rôle designer), pas ce lot

## C7 — étage Seagle (entreprise)

- agrège : projets `produit: seagle` (seagle-site, seagle-pilotage) + futurs projets métier (marketing, finance, juridique, RSSI) ; projets sans produit (défaut)
- rôles métier : tâches `juriste`, `tresorier`, `marketing`, `rssi`, `produit`, `syndicat` dans un projet de l'étage seagle (`agentx projet <slug> --produit seagle`) ; un sujet propre à un produit → projet de l'étage du produit
- `syndicat` → étage seagle : conditions de travail = entreprise ; `personnel` reste global (toit)
- sources = `sources[]` du registre (chemins) + `marketing.vault` → WL des packs en L ; `tresorier`/`juriste` citent `chemin:ligne`, **0 montant recopié** dans le vault ; `.docx` = binaire, NV sans parseur → BLQ si nécessaire
- 2 vaults marketing (Seagle-Marketing, OrthoPro/Marketing) : registre = Seagle-Marketing seul ; doublon → tâche marketing de l'étage seagle
- `publier seagle` → exit 2 (porte produit seulement)

## C8 — cohabitation `agentx-voix`

- E de voix (selon pack chef) : `bin/dash.py`, `dash/*` ; E seagle : L4 `dash.py`, L5 `dash/*` → collision ; L1 L2 L3 L6 L7 disjoints → ∅ contrainte
- règle : 1 fichier E = 1 tâche `en-cours`/`revue` à la fois, tous projets confondus ; avant L4/L5 : `./bin/agentx board --projet agentx-voix` → 0 tâche en-cours/revue touchant ces fichiers
- ordre : L4 puis L5 avant toute tâche voix sur `dash.*` ; après L5 retenu, packs voix citant `dash.py:` / `dash.js:` = coordonnées périmées → chef corrige ces packs (règle 4) avant dispatch voix
- `agentx-voix` reste à l'étage agentx ; 0 dispatch voix par ce projet

## C9 — lots

| lot | rôle | WL (E / L) | dépend |
|---|---|---|---|
| L1 registre | implementeur | E `produits.json`, `bin/produits.py` · L `bin/roles.py`, `roles.json` | ∅ |
| L6 captures | devops | E `outils/captures/{capturer,kora,geolens}.mjs` · L `vault/projets/orthopro/env.md`, routes ortho-front (chef localise, NV), `W/seagle-website/scripts/og-images.mjs`, `W/seagle-website/public/kora/` (listing) | ∅ (C1 recopié) |
| L2 CLI | implementeur | E `bin/vx.py`, `vault/_templates/brief.md` · L `bin/produits.py` | L1 |
| L3 porte | implementeur | E `bin/publier.py` · L `bin/produits.py`, `bin/vx.py`, `vault/_templates/context.md` | L1 |
| L7 tests | testeur | E `tests/test_produits.py`, `tests/test_publier.py` · L `bin/produits.py`, `bin/publier.py`, `produits.json` | L1, L3 |
| L4 serveur | implementeur | E `bin/dash.py` · L `bin/produits.py`, `bin/vx.py` | L1, L2 retenu, C8 |
| L5 front | implementeur | E `dash/dash.js`, `dash/index.html`, `dash/dash.css` | L4 retenu, C8 |

Vagues : {L1, L6} → {L2, L3} → {L4, L7} → {L5}. E disjoints par vague. 1 evaluateur `--dep` par lot ; verificateur porte après L3 (casse : acquit, doublons `--taches`, refs absentes) ; verificateur Chromium après L5.
Contrat à recopier : L1 ← C1 · L2 ← C0 migration, C4 · L3 ← C1 (signatures), C5 · L4 ← C1 (signatures), C2 · L5 ← C2 (forme), C3 · L6 ← C1 (kora, geolens), C6 · L7 ← C1, C5.

DoD L1 :
```
python3 -c "import sys; sys.path.insert(0,'bin'); import produits as p; print(repr(p.erreur()), p.tous(), p.entreprise().cle)"
  → '' ('kora', 'geolens', 'agentx', 'seagle') seagle
python3 -c "import sys; sys.path.insert(0,'bin'); import produits as p; print({c: p.verifier(p.produit(c)) for c in p.tous()})"
  → {'kora': [], 'geolens': [], 'agentx': [], 'seagle': []}      # sinon bloque, sortie collée
registre muté au scratchpad (2 entreprise, couleur en double, cle "Kora", ui "../x") → charger(chemin) lève RegistreInvalide ×4, messages collés
```
DoD L2 :
```
./bin/agentx rattacher <slug> <cle> ×11 (table C0) puis ./bin/agentx doctor → 0 ligne « produit absent|inconnu »
./bin/agentx projet zz-essai --produit inconnu → code 2, liste des clés ; (aucun dossier créé)
python3 -c "import sys; sys.path.insert(0,'bin'); import vx; print(sorted({vx.lire_frontmatter(p/'brief.md')[0].get('produit','') for p in vx.lister_projets()}))"
  → ['agentx', 'geolens', 'kora', 'seagle']
```
DoD L3 :
```
python3 bin/publier.py kora --json | python3 -c "import json,sys; r=json.load(sys.stdin); print(r['verdict'], sorted({e['type'] for e in r['ecarts']}))"
  → NO-GO ['site-branche', …]       # seagle-website : 16 commits hors main (carte T001)
python3 bin/publier.py geolens --json → verdict + écarts, preuves = sorties git brutes ; echo $? → 0|1
python3 bin/publier.py seagle ; echo $? → 2 · python3 bin/publier.py zz ; echo $? → 2
git -C ~/Documents/Workspace/seagle-website status --porcelain avant == après (0 écriture git)
--taches ×2 sur une copie scratch du vault → 2e passage : taches_creees == []
```
DoD L4 : DoD L1 de [[agentx-immeuble/contrat]] §C9 adaptées : `len(etages) == 4`, `etages[-1].slug == 'seagle'`, `selection.projet == projet.slug`, `--projet orthopro` → `selection.slug == 'kora'`, `--etage zz` → refus ; `produits.json` renommé au scratch → `mode == 'projets'`, `produits_erreur` ≠ "" ; mesure perf C7 collée.
DoD L5 : `node --check dash/dash.js` → ∅ ; Chromium :7777 (salle relancée) : 4 étages + direction, seagle en bas ; clic Kora → `#/kora/<projet>` ; puce projet → détail change ; `#/orthopro` → réécrit `#/kora/orthopro` ; `#/zz` → effacé ; 390 px scrollWidth == 390 ; captures 1280 + 390 collées.
DoD L6 : `node --check` ×3 → ∅ ; `node outils/captures/capturer.mjs kora --essai` → noms == listing `public/kora/{dark,light}-*` (diff ∅) ; tailles mesurées collées.
DoD L7 : `python3 -m unittest discover -s tests -v` → sortie collée, 0 échec ; git simulé par dépôts temporaires au scratchpad (jamais les dépôts réels en écriture).

## Point de non-retour

- `produit:` dans 11+ briefs : tout consommateur (dash, doctor, publier) suppose le champ ; revenir à R2/R3 = migration inverse
- hash `#/<cle>/<projet>` + `?etage=` : liens et favoris en dépendent ; `#/<projet>` T019 reste résolu (ne pas retirer la résolution C2 étape 2)
- ids d'écart (`<type>:<cle>:<preuve>`) dans `acquits.md` et titres de tâches : changer le format = acquits orphelins, doublons de tâches
- ordre des étages = ordre de `produits.json` : réordonner le fichier = déplacer les étages pour l'humain
- projet `publication-<cle>` : nom réservé par produit
