---
pack: T012
projet: agentx-immeuble
role: implementeur
cree: 2026-10-15
---

# Pack T012 — Correctifs immeuble : saisie sur mauvais étage, Alt+flèches, 1er événement

> Seule source de vérité de l'agent T012. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger les 3 défauts du vérificateur T009 dans `dash/dash.js` — une action de tâche ne doit jamais partir vers un autre étage que celui affiché — et le prouver en rejouant ses scénarios sur banc.

## Definition of Done
- [ ] D1 : bascule d'étage (hash, clic, Alt+flèche, palette) → dès `surHash`, saisie fermée ET lignes de `#tasks` inertes (0 `.tbtn` cliquable, classe ou attribut visible) jusqu'à la réponse du nouvel étage ; dans `charger`, réponse dont `s.projet.slug` ≠ `ETAT.projet.slug` → `SAISIE.tid = null` avant `rendre` ; preuve : scénario V2b (réponse retardée 1500 ms, saisie ouverte sur alpha, bascule vers gamma, Entrée) → 0 requête `/api/run` vers alpha, vault banc alpha inchangé (diff collé)
- [ ] D1 bis : toute requête `pilote()` porte `projet` = `ETAT.projet.slug` de l'état affiché ; si `IMMEUBLE.slug` (demandé) ≠ `ETAT.projet.slug` (affiché) → action refusée côté page, message dans `#sortie-etat`
- [ ] D2 : Alt+↑/↓ calcule le voisin depuis l'étage demandé (`IMMEUBLE.slug`, sinon sélection de `ETAT`) ; preuve V3b : 2 × Alt+↓ avant la 1re réponse → rang 2 (gamma)
- [ ] D3 : `SON.vu` initialisé au 1er état reçu même si `evenements` est vide ; preuve V6a : `run/evenements.jsonl` absent au chargement, puis 1 événement `projet: beta` → toast + `.sonne` sur beta ; un rechargement de page ne rejoue pas les anciens événements
- [ ] 0 régression : scénarios V1-V9 du script T009 rejoués → 35/35 (sortie collée)
- [ ] `node --check dash/dash.js` rc 0 ; `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → ∅
- [ ] `git diff --stat -- dash/` → `dash/dash.js` seul (+ ton script sous `.cache/T012/`)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.js` | E | `rendreTaches` · `sonnerie` (`SON.vu`) · `IMMEUBLE`/`surHash`/`allerEtage` · `charger` · `pilote` · raccourci Alt+↑/↓ (keydown capture) |
| `.cache/banc-T009/e2e-T009.mjs` | L | scénarios V1-V9, V2b, V3b, V6a à rejouer |
| `.cache/banc-T009/setup.py` | L | montage du banc |
| `.cache/T012/` | E | ton banc, ton script |

## Contrats
Défauts verbatim (T009 result.md) :
```
D1 · saisie de motif ouverte pendant une bascule d'étage dont la réponse state.json est lente (1500 ms) :
  obtenu : #projet-nom = gamma, mais #tasks garde les lignes alpha avec la saisie ouverte.
  Entrée envoie {"action":"virer","tid":"T004","projet":"alpha"} → alpha T004 passe de en-cours à rejete.
  dash/dash.js:590 — rendreTaches sort tôt si SAISIE.tid est posé.
  dash/dash.js:1163-1169 — charger ne ferme pas la saisie quand l'étage de la réponse change.
  dash/dash.js:986 — surHash laisse les lignes de l'ancien étage cliquables jusqu'à la réponse.
D2 · Alt+↓ deux fois avant la 1re réponse : on arrive sur beta (rang 1) au lieu de gamma (rang 2).
  dash/dash.js:1404-1406 calcule le voisin depuis ETAT périmé (x.selection) au lieu de IMMEUBLE.slug.
D3 · run/evenements.jsonl absent au chargement : le 1er événement projet: beta ne sonne pas.
  dash/dash.js:922 if (SON.vu === null){ SON.vu = dernier; return; }
```
Numéros de ligne d'avant T010 : repérer par nom de fonction. `surHash` actuel (T005) :
```js
function surHash()  // IMMEUBLE.slug = etageDemande() ; if (SAISIE.tid !== null) fermerSaisie() ; $('#sortie').hidden = true ; charger()
```

## Décisions actées
- une action part toujours vers l'étage AFFICHÉ et confirmé par le serveur, jamais vers un étage en transition
- `fermerSaisie` existant réutilisé ; jamais `alert/confirm/prompt`
- un hash refusé côté page (`#/BETA`) reste dans l'URL : conforme §C8, hors périmètre

## Hors périmètre
- `bin/*`, `dash/dash.css`, `dash/index.html` ; vue d'ensemble animée (T011, après toi)

## Environnement
- démarrer APRÈS T010 (designer, même fichier) : lire l'arbre tel qu'il est
- banc : `B=.cache/T012/banc; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` puis fixtures via `setup.py` de T009 (adapter le chemin) ; recopier ton `dash/dash.js` dans `$B/dash/` avant chaque essai
- salle-banc `python3 $B/bin/dash.py --port 7805 --no-open &` ; kill par pid, `curl` → 000
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `/api/term/*` simulé (`open|etat` → `{"vivant":true}`, GET → `text/event-stream` vide, `in` → `{}`) ; `/api/run` NON intercepté (le banc doit muter)
- vrai vault jamais muté ; salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL), Grep, `Bash(node:*)`, `Bash(python3:*)`, `Bash(curl:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/T012/banc)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T012
projet: agentx-immeuble
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (V2b, V3b, V6a, V1-V9)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
