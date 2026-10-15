---
pack: T009
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
---

# Pack T009 — L3 : salle à N rôles, deck en grille, panneau RH

> Seule source de vérité de l'agent T009. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre la salle générique sur `s.roles` (couleurs, postes, bureaux, deck) et ajouter le panneau `#rh` (personnel) dans `dash/dash.js`, `dash/index.html`, `dash/dash.css` — à la lettre de `contrat.md` §C9-L3.

## Definition of Done
- [ ] `majRegistre(s)` 1re ligne de `rendre()` ; littéral `COULEUR_ROLE` (dash.js:7-10) remplacé par `const COULEUR_ROLE = {}` rempli dynamiquement
- [ ] `postesSalle(roles)` §C9 (formule exacte) ; `POSTES` en `let`, recalculé dans `construireSalle`
- [ ] `construireSalle` : 0 appel `bureau(` avec une clé de rôle littérale : `rg -n "bureau\('(eclaireur|architecte|implementeur|verificateur|scribe|chef)'" dash/dash.js` → ∅
- [ ] props déplacés (fusée, radar) ; tableau pipeline mural à `s.pipeline.length` barres ; `GLYPHES` + 6 clés §C9
- [ ] `COULEUR_STATUT` + `rejete`, `abandonne`
- [ ] `#deck` en grille CSS `repeat(auto-fill, minmax(150px, 1fr))` ; `s.registre_erreur` → `.deck-erreur`
- [ ] `#rh` inséré après `.chart-panel` (HTML §C9 verbatim) ; `rendreRH(s)` : 2 tables, colonnes §C9, `—` si null, `.ko` si ≥ 0.5, `aucune tâche livrée` si 0/absent
- [ ] toasts : suffixe `verdict : <v>` si `e.verdict`
- [ ] `node --check dash/dash.js` → rc 0
- [ ] rendu réel : `python3 bin/dash.py --json > .cache/etat-T009.json` puis harnais node (fichier jetable `.cache/rendu-T009.mjs`) qui exécute `postesSalle(etat.roles)` → 12 postes distincts, tous dans le viewBox 700×480 après projection iso existante ; si `etat.roles` encore à l'ancien format (L2 en parallèle) → construire 13 rôles depuis `roles.json` et le dire
- [ ] `rg -n "alert\(|confirm\(|prompt\(" dash/dash.js` → même compte qu'avant (relevé AVANT collé)
- [ ] `git diff --stat -- dash/` collé ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `dash/dash.js` | E | `:7-13` couleurs · `:38-85` rendreDeck · `:150-470` salle (POSTES `:261`, bureau `:420-428`, construireSalle `:366-465`) · `:787-870` toasts · `:892` rendre |
| `dash/index.html` | E | après `.chart-panel` (~`:78-90`) |
| `dash/dash.css` | E | `#deck`, `.rh-*`, `.deck-erreur` |
| `vault/projets/agentx-entreprise/contrat.md` | L | **§C1 L46-66 (13 rôles) · §C7 L315-351 (state.json) · §C9-L3 L397-428 : contrat verbatim** |
| `roles.json` | L | si présent (lot L1 en parallèle) ; sinon §C1 |

## Contrats
`contrat.md` §C9-L3 = contrat recopié, à appliquer à la lettre. Rappels :
```js
function postesSalle(roles) -> {[cle]: [gx, gy]}
  // chef : [9.9, 0.7] fixe ; affectables ordre s.roles, ligne par ligne
  // COLS = n <= 6 ? 3 : 4 ; X0 = 1.2 ; PAS_X = 2.25 ; Y0 = 2.0 ; rows = ceil(n/COLS) ; PAS_Y = rows > 1 ? Math.min(2.2, 4.4/(rows-1)) : 0
  // poste i : [X0 + (i % COLS) * PAS_X, Y0 + floor(i / COLS) * PAS_Y]
s.roles[i] = {cle, nom, sous, label, couleur, modele, affectable, livre_en, juge, objet, valeur, jauge, etat, actif, actifs, en_cours, note}
s.personnel = {perimetre, projets, archives, taches, roles:[{cle,taches,livrees,retenues,virees,en_revue,taux_renvoi}], modeles:[…]}
s.registre_erreur : "" | message
```

## Décisions actées
- le front affiche, ne recalcule aucune règle — contrat C0 B
- 0 donnée inventée : RH vide → « aucune tâche livrée », jamais de chiffre de démo
- console/terminal/actions = lot L4 (après toi) : ne pas toucher `:981-1275` ni `#term`, `#console-out`

## Hors périmètre
- Console, terminal, palette, actions par tâche (L4)
- `bin/*` (L1/L2 en parallèle)
- Restyler les panneaux existants hors `#deck` et `#rh`

## Environnement
- JS sans build, sans module ; `node` v22 dispo pour `--check` et harnais jetable sous `.cache/`
- `dash.js`/`dash.css` servis à chaque requête : pas de relance serveur nécessaire
- pas de navigateur requis ; capture visuelle = tâche de vérif suivante
- arbre partagé : L1/L2 écrivent `bin/*` en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/` seulement), Grep, `Bash(node:*)`, `Bash(python3 bin/dash.py --json:*)`, `Bash(rg:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T009
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | écart au contrat: § — raison
## Pour la suite
- ≤ 5 lignes : lignes actuelles de rendreTaches, rendre(), amorçage, console legacy (pour L4)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
