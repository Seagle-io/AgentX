---
pack: T006
projet: agentx-entreprise
role: scribe
cree: 2026-10-15
---

# Pack T006 — Définitions des 6 nouveaux agents

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
1 ligne : verbe + livrable + critère + `chemin`. Pas « améliorer X ».

## Definition of Done
checklist binaire, vérifiable par commande ou lecture.
- [ ] TODO-PACK
- [ ] TODO-PACK
Regex de DoD : compter ses occurrences sur HEAD, écrire « → N sur HEAD » ; imports inclus dans « net 0 ligne ».
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
WL exhaustive ≤ 12. Droit E (écriture) / L (lecture). Plage de lignes si gros.
Inclure en L les **dépendances de comportement** (hooks, helpers appelés par le code E). 1 ligne de DoD par fichier E, sinon le retirer.
Chaque chemin/symbole cité : `rg` du symbole sur HEAD avant écriture (pas de mémoire) ; inclure en L le fichier de helpers de test (makeTestApp…) et la garde réelle si elle vit hors du fichier cité.
Plage de lignes E : inclure les imports en tête de fichier si la tâche ajoute un import. Coordonnées = n° de ligne + ancre `rg` (les lignes dérivent entre tâches sur un même fichier).
Contrat déjà recopié ⇒ retirer le fichier de la WL (remplissage). Fichier que la DoD demande de relire/vérifier (lib, module voisin, `result.md` de la tâche vérifiée) ⇒ en L. Rôle architecte : `decisions.md` en E.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `TODO-PACK` | E | |
| `TODO-PACK` | L | |

## Contrats
signatures / schémas / formats RECOPIÉS verbatim, jamais référencés. Sinon `∅`.
Y compris les **signatures externes consommées** (composants du kit, lib tierce : props exactes + chemin du `.d.ts`) et, pour un testid, son rôle ARIA et son emplacement.
Test HTTP : recopier nom du cookie de session, route de login, helpers de fabrication (multipartBody, fixtures) et clés de seed utilisées.
Prémisse de comportement du pack (mapping d'entrée, « X est appelé », état de HEAD) : preuve `rg`/exécution, sinon NV. Fichiers non suivis ⇒ absents de `git archive HEAD` (AVANT).
Option de lib tierce : vérifier le `.d.ts` de la version INSTALLÉE après toute montée de version.
Types de ligne DB/API consommés : 1 ligne chacun (ex. `ProjectRow.storage_prefix: string`). Code async touché : sémantique d'abort, d'erreur et d'état global (flags module, promesses en vol).
```
…
```

## Décisions actées
« décision — raison ≤ 8 mots ». Tranché, pas débattu. Détail : `decisions.md#date`.
- TODO-PACK
Règle durcie (validation, borne) : `rg` des fixtures de test qu'elle casse AVANT dispatch, les lister dans le pack.

## Hors périmètre
ce que l'agent ne fait PAS, même tentant.
- TODO-PACK

## Environnement
versions d'outils, commandes qui marchent, ce qui est rouge d'avance (lint global…), ce qui est interdit (stack e2e) → « NV — raison » attendu. Regex de DoD testées à blanc, y compris sur la chaîne du test lui-même (un test qui cite `unpkg` fait mentir `rg unpkg → ∅`). Lookahead → `rg --pcre2`.
Images Docker : le chef fait `docker pull` à blanc avant dispatch ; seules les images réellement pullables figurent au pack (tag exact).
DoD périmètre : `git diff --stat -- <chemins E>`, jamais diff global (arbre partagé) ; le chef commite en local après chaque tâche.
Config lue par le code touché : chemin + parseur (`bool()`, `intIn`…) + fichier `.env*` d'exemple. Tests : comptes seed et leurs accès (admin / membre / tiers).
Tâche sur un banc existant : chemin des scripts, env par défaut (BASE, port), paramètres exacts des runs de référence (ou lien vers la note banc). Compte de tests de base : relevé sur HEAD au dispatch ; tâches parallèles ⇒ borne ≥.
Fichiers non suivis par git (`??`) : absents de `git diff`/`HEAD` → copie `<T>/avant/` avant modif, DoD diff = `git diff --no-index --stat`.
Build partagé : `--outDir` n'isole pas les plugins qui écrivent en dur (sitemap `dist/`) → build `cwd=<T>` ; DoD `md5sum` du fichier partagé avant = après.
Classe/état figé par le prérendu (`app-mounted`…) ≠ preuve de montage → sonde runtime (`__reactContainer`), pas la classe.
Serveur de test lancé : `node_modules/.bin/<outil>` (≠ `npx`) + kill par pid, port libre vérifié en fin.
Cible déployée : protocole (http ⇒ ni secure context ni Cache Storage), variables à ne jamais poser (ex. `GEOLENS_ENV=production` en http).

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(pytest:*)
- Outils : nommer chaque commande exacte de la DoD (`npx tsc`, `node banc`, `make -n`) ; commande hors liste ⇒ NV.
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Machine partagée : ne supprimer que ce que la tâche a créé, par nom (conteneurs `docker rm -fv <nom>`, fichiers listés) ; jamais de nettoyage global (prune, rm -r d'un dossier commun).
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T006
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
