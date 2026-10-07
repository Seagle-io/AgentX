---
pack: T031
projet: orthopro
role: verificateur
cree: 2026-10-05
---

# Pack T031 — Vérif T025/T026/T027 (tests widgets nus)

> Seule source de vérité de l'agent T031. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Réfuter les 3 lots d'extraction + tests sur 12 widgets : (a) chaque `.tsx` modifié n'a changé que des imports/appels (0 balise, 0 texte, 0 classe modifiés — sauf `shortDate`/`plural` et `key` word-of-day, voulus) ; (b) chaque util est pur (0 import .tsx/react/dashboard-widgets, imports relatifs `.ts`) ; (c) chaque export d'util est exercé par son test ; (d) les tests ne sont pas tautologiques (contre-exemple par mutation).

## Definition of Done
- [ ] `npm run test:unit` → pass/fail collé (attendu 380/0) ; `npm run typecheck` ; `npx eslint` sur les 11 util.ts WL — collés
- [ ] (a) pour chacun des 11 `.tsx` touchés (liste ci-dessous) : `git diff HEAD -- <fichier> | rg "^[-+]" | rg -v "^[-+]{3}"` → classer chaque ligne : import | appel util | shortDate/plural | key | AUTRE ; toute ligne AUTRE = DÉFAUT à citer (balise/classe/texte changé) ; résumé en tableau
- [ ] (b) `rg -n "^import" <11 util.ts>` collé ; aucune ligne avec `.tsx`, `react`, `dashboard-widgets` ; tous les relatifs suffixés `.ts`
- [ ] (c) pour chaque util : `rg -o "export (const|function) \w+" util` vs noms présents dans le test → exports non exercés listés (DÉFAUT si ≥ 1)
- [ ] (d) mutation : pour 4 utils au choix (dont pomodoro et kpi), modifier TEMPORAIREMENT un opérateur ou une constante dans l'util, relancer son test → doit échouer ; restaurer par Edit inverse (pas git checkout) ; `git diff --stat <util>` final identique à avant — sorties collées
- [ ] `shortcuts.util.ts` duplique `chosenIds` (1 ligne) de `shortcuts.config.ts` : vérifier qu'ils sont identiques
- [ ] verdict `OK` | `DÉFAUTS`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
Lecture : les 11 util.ts ci-dessous + leurs tests jumeaux (même dossier, même nom suivi de .test.ts, implicitement autorisés). Les `.tsx` sont inspectés UNIQUEMENT via `git diff HEAD -- <chemin>` (sortie de commande, pas de Read).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/pomodoro/pomodoro.util.ts` | E | mutation temporaire puis restauré |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/shortcuts/shortcuts.util.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/shortcuts/shortcuts.config.ts` | L | chosenIds |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/tongue-twister/tongue-twister.util.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/daily-anecdote/daily-anecdote.util.ts` | E | mutation |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/contact-code/contact-code.util.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/useful-links/useful-links.catalog.test.ts` | L | test sans util |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/forum/forum.util.ts` | L | |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/kpi/kpi.util.ts` | E | mutation |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/storage/storage.util.ts` | E | mutation |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/mascot/mascot.util.ts` | L | |
.tsx à diff-er : pomodoro/pomodoro.tsx · shortcuts/shortcuts.tsx · tongue-twister/tongue-twister-widget.tsx · daily-anecdote/daily-anecdote-widget.tsx · contact-code/contact-code-widget.tsx · word-of-day/word-of-day-widget.tsx · forum/dashboard-forum.tsx · kpi/index.tsx · kpi/dashboard-kpi.tsx · storage/storage-widget.tsx · mascot/mascot.tsx

## Contrats
```
règle util : 0 import .tsx / react / dashboard-widgets ; imports relatifs suffixés .ts (node --test)
changements voulus dans les .tsx : import util, appel util, shortDate (forum L14), plural (kpi), key={d.text} (word-of-day L30-31)
déclaré : pomodoro 13 exports/14 cas · shortcuts shownShortcuts/7 · tongue-twister 5 exports/6 · daily-anecdote shownAnecdotes/6 · contact-code QR_OPTIONS,qrAlt,copyToast/4 · useful-links catalog/4 · forum since,tint/6 · kpi trendBadge,patientsSub,noShowsSub,noShowsTone/6 · storage storageRatio,isSaturated/4 · mascot otherFace/3
HEAD = 9cc4a91 (état avant vague 3) : git diff HEAD -- <fichier>
```

## Décisions actées
- pas de test de rendu React ; preuve « 0 logique » acceptée pour daily-quote, word-of-day — HP
- restauration après mutation par Edit inverse uniquement — arbre partagé

## Hors périmètre
- corriger ; visuel ; today/forecast/activity/worklists (T029) ; grille (T030)

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser.
- Outils autorisés : Read, Edit (mutations temporaires, 4 fichiers E), Grep, Bash(npm run, npx, node --test, rg, git diff, git status), Write (result.md)
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH` ; cwd ortho-front
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit`
- Si bloqué : statut `bloque`, une question, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 70 lignes, sections exactes :

```markdown
---
tache: T031
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Vérifié comment
commande → sortie brute
## Diff .tsx
| fichier | +/- | import | appel | voulu | AUTRE |
## Mutations
- util — mutation → test KO (ligne) → restauré (diff --stat identique)
## Défauts
- ∅ | n. fichier:L — défaut — reproduction
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
