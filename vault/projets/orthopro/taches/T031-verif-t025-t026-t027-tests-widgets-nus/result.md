---
tache: T031
statut: fait
verdict: OK
---
## Vérifié comment
- `npm run test:unit` → `tests 396 · pass 395 · fail 1` ; fail = `src/modules/dashboard/t030.probe.test.ts:28` (sonde T030, ≠ T025-27)
- sondes externes : t030.probe 12 tests/1 fail · today/dates.probe 4/0 → 396−16 = 380, 0 fail
- `node --test` 10 tests WL → `tests 60 · pass 60 · fail 0` ; par fichier 14·7·6·6·4·4·6·6·4·3 = déclaré
- `tsc -p tsconfig.app.json` → exit 2, 1 erreur, `scratchpad/head/dashboard-layout.util.ts(1,47) TS2307` (importé par t030.probe:6) ; hors-sonde 0 · e2e exit 0 · node exit 0
- `npx eslint` 9 util.ts + shortcuts.config.ts + `widget/*/*.test.ts` → 0 sortie, exit 0
- TZ=UTC/Pacific/Kiritimati/Pacific/Pago_Pago/America/St_Johns/Australia/Lord_Howe → pomodoro+forum+kpi+storage+mascot+daily-anecdote 39/0 chacune
- (b) `rg -n "^import|from '"` 9 util → 0 `.tsx`/`react`/`dashboard-widgets` ; relatifs `.ts` sauf `daily-anecdote.util.ts:3` `import type { AnecdoteMode } from './daily-anecdote.config'` (sans `.ts`) + L2 alias `@/api/dashboard-daily` — 2 `import type`, effacés au runtime
- (c) exports vs test : pomodoro 13 (non nommé : `dayOf` — exercé via `fresh`/`restore`, mutant tué) · shortcuts 1 · tongue-twister 4 const + type `Skip` · daily-anecdote 1 · contact-code 3 · forum 2 · kpi 4 · storage 2 · mascot 1 → non exercés ∅
- chosenIds : `diff` corps `shortcuts.config.ts:6-7` vs `shortcuts.util.ts:5-6` → seul écart `export` ; même `DEFAULT_SHORTCUTS` (catalog)
- équivalence ancien inline ↔ util relue : pomodoro restore/fresh/paused/adoptDurations, tongue nextSkip/offsetFor, anecdote `filter(Boolean)`↔`pick ? [pick] : []`, kpi `plural(n>1)`, forum `shortDate`=même toLocaleDateString, storage, mascot → identiques
## Diff .tsx
| fichier | +/- | import | appel | voulu | AUTRE |
|---|---|---|---|---|---|
| pomodoro/pomodoro.tsx | 20/52 | 4 | 16+ / 48− (type, fresh, clock, today déplacés→util) | 0 | 0 |
| shortcuts/shortcuts.tsx | 3/3 | 2+/1− | 1+/2− | 0 | 0 |
| tongue-twister/tongue-twister-widget.tsx | 6/6 | 1+ | 5+/6− (2 `onClick` seuls ; className/texte identiques) | 0 | 0 |
| daily-anecdote/daily-anecdote-widget.tsx | 2/1 | 1+ | 1/1 | 0 | 0 |
| contact-code/contact-code-widget.tsx | 5/4 | 1+ | 4/4 (`alt` = même chaîne ; className identique) | 0 | 0 |
| word-of-day/word-of-day-widget.tsx | 2/2 | 0 | 0 | 2/2 key | 0 |
| forum/dashboard-forum.tsx | 1/12 | 1+ | 11− since/tint déplacés | shortDate (dans util:11) | 0 |
| kpi/index.tsx | 4/3 | 1+ | 3/3 | plural (util) | 0 |
| kpi/dashboard-kpi.tsx | 2/3 | 1+ | 1/3 | 0 | 0 |
| storage/storage-widget.tsx | 4/3 | 2+/1− | 2/2 (texte WidgetNote identique) | 0 | 0 |
| mascot/mascot.tsx | 2/7 | 1+ | 1/7 (otherFace déplacé, `FACES.length` passé) | 0 | 0 |
## Mutations
Copie util+test dans scratchpad/t031/run, imports réécrits en absolus → 0 écriture arbre partagé ; `sha256sum -c` 9 util → 9 OK après ; `git diff --stat` ∅ (util non suivis par git)
- pomodoro — L49 `? 1 : 0`→`? 0 : 0` → 13/1 KO `finishPhase` → orig intact
- pomodoro — L72 `Math.ceil`→`Math.floor` → 13/1 KO `clock` → intact
- pomodoro — L25 `toDateString`→`toISOString` → 12/2 KO `fresh`,`restore` → intact
- pomodoro — L67 suppr `&& was !== now` → 13/1 KO `adoptDurations : inchangé…` → intact
- kpi — L8 `>= 0`→`> 0` → 5/1 KO `trendBadge: hausse` · L20 `> 0`→`>= 0` → KO `noShowsTone` · L13 `> 0`→`> 1` → KO `patientsSub` → intact
- storage — L8 `>=`→`>` → 3/1 KO `seuil 90 %` · L5 suppr `quota &&` → KO `quota null, 0…` → intact
- daily-anecdote — L14 `pick ? [pick] : []`→`[pick]` → 5/1 KO `pick hors liste` → intact
- daily-anecdote — `mode one && pick===0 → []` → 6/0 **SURVIT** (voir Pour la suite)
- forum L10 `<30`→`<=30` KO · mascot L4 `>=`→`>` 0/3 KO · tongue L19 suppr `|| undefined` KO · shortcuts L6 défaut→`[]` 5/2 KO · contact L4 240→200 KO
## Défauts
- ∅ (aucun scénario entrée → sortie fausse/plantage produit)
## Écarts
- lecture hors WL: `src/shared/lib/format/date.ts` (rg shortDate/plural) — équivalence voulu
- lecture hors WL: `src/modules/dashboard/t030.probe.test.ts:6` (rg) — origine fail + TS2307
- mutation par copie scratchpad au lieu d'Edit inverse — 0 Edit dispo ; arbre partagé non touché
## Pour la suite
- contrat (b) KO à la lettre : `daily-anecdote.util.ts:3` relatif sans `.ts` (type-only, runtime 0) — trancher règle `import type`
- `daily-anecdote.util.test.ts` : 0 cas mode `one` + `pick: 0` → mutant « pick falsy » survit ; ajouter `data(0),'one'` → `['a']`
- `word-of-day` `key={d.text}` : 2 définitions même texte → clé React dupliquée (NV, ∅ test de rendu)
- `otherFace(0, 1)` → 1 (hors [0,1)) ; préexistant HEAD, FACES.length>1 en pratique
- `npm run test:unit`/`typecheck` pollués par sondes T030 (t030.probe → scratchpad) : à retirer avant clôture
## Retour sur le pack
- Manquait: utils non suivis par git → `git diff --stat` util inopérant, prévoir `sha256sum` · test shortcuts = `shortcuts.test.ts` (≠ `.util.test.ts`) · WL dit « 11 util.ts » = 9 util + 1 config + 1 test · vérificateur sans Edit → mutation par copie à prévoir
- Inutile: ∅
