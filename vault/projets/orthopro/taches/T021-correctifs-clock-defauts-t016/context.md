---
pack: T021
projet: orthopro
role: implementeur
cree: 2026-10-05
---

# Pack T021 — Correctifs clock (T016)

> Seule source de vérité de l'agent T021. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Clore les 3 points du vérificateur T016 dans `widget/clock/` : garde `!date` du rappel quotidien rétablie, `alarmProblem` strict sur `HH:MM`, `catch` de suppression robuste aux rejets non-`Error`.

## Definition of Done
- [ ] C1 `clock-widget.tsx` : formulaire `repeat === 'daily'` + champ jour vidé → bouton + submit bloqués comme à HEAD (`git show HEAD:src/modules/dashboard/components/widget/clock/clock-widget.tsx` : chercher la garde `!date`) ; comportement HEAD recopié dans `alarmProblem` si c'est là que vit la validation
- [ ] C2 `clock.util.ts:59-63` `alarmProblem` : heure ne matchant pas `/^([01]\d|2[0-3]):[0-5]\d$/` → `'incomplete'` (ou le code problème existant le plus proche) ; regex recopiée localement (TIME non exportée de reminders.ts, ne pas l'exporter)
- [ ] C3 `clock-widget.tsx:123-124` : `.catch((e: unknown) => addToast({ variant: 'error', title: 'Suppression impossible', description: e instanceof Error ? e.message : undefined }))` — même garde que `add` L121
- [ ] `clock.util.test.ts` : +3 cas : `'25:00'` → problème, `'9:00'` → problème, `'09:00'` → null ; +1 cas daily sans date → problème
- [ ] `node --test …/clock/clock.util.test.ts` → fail 0 ; `npx eslint …/clock/` → 0 ; `npm run typecheck` → 0 ; sorties collées
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock-widget.tsx` | E | C1 C3 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock.util.ts` | E | C1? C2 |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/clock/clock.util.test.ts` | E | +4 cas |
| `/home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/shared/lib/reminders/reminders.ts` | L | TIME L28, ReminderInput |

## Contrats
```ts
// T016
// 1. clock.util.ts:59-63 — alarmProblem({ time: '25:00', label: '', repeat: 'once', date: '2026-10-06' }, new Date(2026, 9, 6, 12)) → null (attendu : problème) ; idem '9:00'
// 2. daily + champ jour vidé : HEAD bouton + submit bloqués (!date) / T009 soumission autorisée — rétablir HEAD
// 3. clock-widget.tsx:124 (e: Error) => e.message — Promise.reject(null) → TypeError ; add L121 garde instanceof Error
// reminders.ts:28  const TIME = /^([01]\d|2[0-3]):[0-5]\d$/   (non exportée — recopier)
// readReminders écarte un time hors TIME → alarme perdue sans message si '25:00' stocké
```

## Décisions actées
- iso-fonctionnel avec HEAD sauf erreurs remontées — T009/T016
- reminders.ts intouchable (partagé ReminderWatcher) — HP

## Hors périmètre
- visuel WidgetCard (rognage cadran : recette humaine) ; redécoupe clock-dial/alarm-dialog ; index.tsx

## Budget
- Lectures hors whitelist : **3 maximum**, à journaliser.
- Outils autorisés : Read, Edit, Grep, Bash(node --test, npx eslint, npm run typecheck, rg, git show, git diff) — cwd ortho-front
- Shell : `export PATH=$HOME/.nvm/versions/node/v24.15.0/bin:$PATH`
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit`
- Si bloqué : statut `bloque`, une question, arrêt.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes, sections exactes :

```markdown
---
tache: T021
statut: fait | bloque
---
## Livré
- chemin:L — Cn — fait
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | …
## Pour la suite
- ≤ 3 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
