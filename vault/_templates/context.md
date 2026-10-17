---
pack: {{ID}}
projet: {{PROJET}}
role: {{ROLE}}
cree: {{DATE}}
---

# Pack {{ID}} — {{TITRE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
1 ligne : verbe + livrable + critère + `chemin`. Pas « améliorer X ».

## Definition of Done
checklist binaire, vérifiable par commande ou lecture.
- [ ] <critère mesurable> — HEAD : <commande → valeur>
Seuil/compteur sans HEAD ⇒ lint KO ; compteurs recalculés sur les données du mock ; imports inclus dans « net 0 ligne ».
Mot ambigu (« hors », « aligné », « lisible ») : définir côté, référence, unité ; relire contre Contrats et HEAD.
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
WL exhaustive ≤ 12. Droit E (écriture) / L (lecture). Plage de lignes si gros.
Inclure en L les **dépendances de comportement** (hooks, helpers appelés par le code E). 1 ligne de DoD par fichier E, sinon le retirer.
Chaque chemin/symbole cité : `rg` du symbole sur HEAD avant écriture (pas de mémoire) ; inclure en L le fichier de helpers de test (makeTestApp…) et la garde réelle si elle vit hors du fichier cité.
Types/unions partagés (compta.types.ts…) et spec existant qui asserte la forme modifiée (toEqual exact, instanceof) en L ou E (≈15 tâches compta ; ≈7 specs cassés par la DoD).
Plage de lignes E : inclure les imports en tête de fichier si la tâche ajoute un import. Coordonnées = n° de ligne + ancre `rg` (les lignes dérivent entre tâches sur un même fichier).
Contrat déjà recopié ⇒ retirer le fichier de la WL (remplissage). Fichier que la DoD demande de relire/vérifier (lib, module voisin, `result.md` de la tâche vérifiée) ⇒ en L. Rôle architecte : `decisions.md` en E.
| Chemin | Droit | Pourquoi |
|---|---|---|
Consommateurs : `rg` des appelants/specs/testids de chaque fichier E → en L ou en Contrats (≈34 retours compta+prévisions).
Idiome voisin à imiter : 1 fichier du même type en L (service/spec/onglet) (≈5).
| `TODO-PACK` | E | |
| `TODO-PACK` | L | |

## Contrats
signatures / schémas / formats RECOPIÉS verbatim, jamais référencés. Sinon `∅`.
Y compris les **signatures externes consommées** (composants du kit, lib tierce : props exactes + chemin du `.d.ts`) et, pour un testid, son rôle ARIA et son emplacement.
Test HTTP : recopier nom du cookie de session, route de login, helpers de fabrication (multipartBody, fixtures) et clés de seed utilisées.
Helpers de test : recopier chemin + méthodes ET opérateurs absents du FakeRepo (Between, SUM, findAndCount, softDelete…) (≈16 tâches). Kit front : export défaut/nommé + props exactes, y compris Checkbox/Select/ChoiceChip (≈10).
Kit : classes internes d'un composant (span de Checkbox) quand la DoD fixe une taille (≈3).
DoD vs Contrats : relire les 2 pour contradictions (erreur, fuseau, nom de classe, code HTTP) avant dispatch (≈8).
Option de lib tierce : vérifier le `.d.ts` de la version INSTALLÉE après toute montée de version.
Prémisse de comportement du pack (mapping d'entrée, « X est appelé », état de HEAD) : preuve `rg`/exécution, sinon NV. Fichiers non suivis ⇒ absents de `git archive HEAD` (AVANT).
Forme d'objet consommé (clés JSON/dict, format d'un nombre : `round(100*t) %`, réponse `/api/run`) : recopiée, pas déduite du code.
Banc/fixture : coller 1 item JSON valide par format touché (mot lié `{id,word,image}`, `media`, `show`) + clés de réglage (≈9 packs exercices).
Types de ligne DB/API consommés : 1 ligne chacun (ex. `ProjectRow.storage_prefix: string`). Code async touché : sémantique d'abort, d'erreur et d'état global (flags module, promesses en vol).
```
…
```

## Décisions actées
Points d'API tranchés d'office : code HTTP, testid gardé/retiré, sémantique (modifié, vide), fuseau, null/vide (≈17 retours).
« décision — raison ≤ 8 mots ». Tranché, pas débattu. Détail : `decisions.md#date`.
- TODO-PACK
Règle durcie (validation, borne) : `rg` des fixtures de test qu'elle casse AVANT dispatch, les lister dans le pack.

## Hors périmètre
ce que l'agent ne fait PAS, même tentant.
- TODO-PACK

## Environnement
Service partagé (banc, back) : 1 ligne `- service: <nom> → <url>` (nom ∈ `environnement.json`, url identique) + `- serveur fourni par le chef (./bin/agentx env up <nom>) ; agent : n'en lance aucun ; injoignable → statut bloque, sortie collée`. Pas de service → ligne absente.
versions d'outils, commandes qui marchent, ce qui est rouge d'avance (lint global…), ce qui est interdit (stack e2e) → « NV — raison » attendu. Regex de DoD testées à blanc, y compris sur la chaîne du test lui-même (un test qui cite `unpkg` fait mentir `rg unpkg → ∅`). Lookahead → `rg --pcre2`.
Images Docker : le chef fait `docker pull` à blanc avant dispatch ; seules les images réellement pullables figurent au pack (tag exact).
Commande de test : chemin vitest avec slash final (`src/modules/Compta/`) pour exclure les dossiers préfixés (ComptaSync) ; racine git du dépôt (`ortho-back/`) ; `node -e` autorisé sur fonctions pures si DoD exige une preuve runtime (≈5) ; front : 0 import `../` (eslint, 4), tsc = `-p tsconfig.app.json`.
Linter/tests pris dans [[orthoworkspace-conventions]] ; kit dans [[orthoworkspace-kit-ui]] : citer la note, ne pas relire le code.
DoD périmètre : `git diff --stat -- <chemins E>`, jamais diff global (arbre partagé) ; le chef commite en local après chaque tâche.
`git diff --stat` inapplicable en arbre partagé non commité ou commit multi-lots (HEAD = N tâches) : le chef commite AVANT le lot, ou donne SHA par lot + compteurs/hunks de référence (fichier déjà `M` ⇒ nombre de hunks de départ).
Évaluer un livrable pendant qu'un autre lot édite les mêmes fichiers : instantané `.cache/snap-<T>/` (copie des fichiers E) pris par le chef, DoD lue sur l'instantané.
DoD de mesure sur vault vivant (compteurs, taux, nb de tâches) : comparer des Δ avant/après, jamais des valeurs absolues ; état absent du vrai vault (dormant, urgent…) ⇒ injection `state.json` dans le pack.
Marqueur de lint (`"TODO" + "-PACK"`) : jamais en clair dans un pack rempli, y compris en citation.
Outils absents/refusés (sed, grep, mv ; `garde_bash`) et syntaxe CLI exacte (`vx.py set --statut X`, positionnel refusé) : nommés au pack.
Script Playwright sur la salle : intercepter `/api/term/*` (la page POST `/api/term/open` seule) ; étages/projets requis = banc, vrai vault intact.
Config lue par le code touché : chemin + parseur (`bool()`, `intIn`…) + fichier `.env*` d'exemple. Tests : comptes seed et leurs accès (admin / membre / tiers).
Tâche sur un banc existant : chemin des scripts, env par défaut (BASE, port), paramètres exacts des runs de référence (ou lien vers la note banc). Compte de tests de base : relevé sur HEAD au dispatch ; tâches parallèles ⇒ borne ≥.
Banc partagé (Vite 5200…) périmé après édition : dire qui relance et quand, sinon statut `bloque` (≈5). Fixture : chemin absolu vérifié par `ls` ; marqueur `curl` cherché dans le JS compilé, jamais le JSX (≈6).
Front : base API absolue du dist (`VITE_API_URL`) ; `access` levels réels (`full|read`) (≈3 retours orthoworkspace-v2).
Fichiers non suivis par git (`??`) : absents de `git diff`/`HEAD` → copie `<T>/avant/` avant modif, DoD diff = `git diff --no-index --stat`.
Build partagé : `--outDir` n'isole pas les plugins qui écrivent en dur (sitemap `dist/`) → build `cwd=<T>` ; DoD `md5sum` du fichier partagé avant = après.
Classe/état figé par le prérendu (`app-mounted`…) ≠ preuve de montage → sonde runtime (`__reactContainer`), pas la classe.
Contenu citant des commandes interdites (push, migrations…) → outil Write ; `garde_bash` scanne tout le texte Bash, heredoc compris.
Tâche « copie verbatim » → `diff` dans les outils autorisés.
Serveur de test lancé : `node_modules/.bin/<outil>` (≠ `npx`) + kill par pid, port libre vérifié en fin.
Cible déployée : protocole (http ⇒ ni secure context ni Cache Storage), variables à ne jamais poser (ex. `<APP>_ENV=production` en http).

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(pytest:*)
- Outils : nommer chaque commande exacte de la DoD (`npx tsc`, `node banc`, `make -n`) ; commande hors liste ⇒ NV.
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Machine partagée : ne supprimer que ce que la tâche a créé, par nom (conteneurs `docker rm -fv <nom>`, fichiers listés) ; jamais de nettoyage global (prune, rm -r d'un dossier commun).
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.
- Contrat (`contrat-*.md@vN`) ou cases de DoD faux, contradictoires ou démentis par une mesure : `escalade: contrat|dod` + `contrat: <note>@vN` | `dod: n,m` + `question:` au frontmatter ; `## Écarts` : `chemin:L` + `commande → sortie` qui le contredit. N'amende rien, ne contourne pas : le syndicat enquête, le chef tranche.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes (result.md ≤ 60 lignes de corps ; détail long → note à part liée `[[slug]]`) :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
