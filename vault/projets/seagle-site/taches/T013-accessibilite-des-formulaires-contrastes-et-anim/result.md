---
tache: T013
statut: fait
---
## Livré
- src/pages/Booking/index.tsx:60,87-88 — jours : aria-label date longue + aria-pressed
- src/pages/Booking/index.tsx:369 — créneaux : aria-label heure + aria-pressed
- src/pages/Booking/index.tsx:332-334 — champs : aria-label = placeholder
- src/pages/Booking/index.tsx:338,346 — erreurs role="alert"
- src/pages/Booking/index.tsx:227 · Contact/index.tsx:141 · SecurePass/index.tsx:109 — focus-visible outline 1px text-hi, offset 2px
- src/pages/Contact/index.tsx:228 — erreur role="alert"
- src/pages/ServiceDetail/index.tsx:1,47,53-109,376 — `ink` assombri par service, appliqué en clair seul (`light:`)
- src/style.css:17 — `--th-text-lo` sombre .35→.46 : 3.01→4.58 (#000), 4.66 surface, 4.68 surface-hi
- src/style.css:52 — `--th-text-lo` clair .38→.58 : 2.51→4.71 page, 4.57 surface-hi (.57 = 4.5 page seul)
- src/style.css:103-106 — reduced-motion : marquee/pulse/bounce `animation:none` ; marquee.tsx ∅
- ink clair (page #f3f2ee) : cyan 2.49→4.65 #1f7785 · violet 3.76→4.64 #7b46f5 · vert 1.71→4.60 #1b7c59 · rouge 3.32→4.63 #d91313 · orange 2.46→4.63 #b64d05 · jaune 1.70→4.65 #886805 · bleu 2.41→4.63 #0a74a4 · rose 3.00→4.61 #d11672
- NON livré (BLQ) : `--th-text-faint` (L18,L53) et `--th-text-md` clair (L51) inchangés
## Vérifié comment
- `npx tsc --noEmit -p .` → (vide), exit 0
- `npx vite build --outDir …/T013/dist` → ✓ built in 7.98s ; avant = `…/T013/dist-avant` (même arbre, sans diff T013)
- `BASE=:4408 node T013/audit.mjs contrast` + `node T013/resume.mjs` → combos <seuil hors img/canvas : 66 avant → 38 après
- décompte occurrences (avant → après) : lo 836→0 · accent ServiceDetail 5→0 · faint 94→93 (BLQ) · md clair 641→661 (BLQ) · lo op<1 61→39 / accent op<1 12→6 (fondu motion en cours, op 0.95-0.99 ; statique ≥4.57)
- `node audit.mjs motion` (reduce) → avant `/` marquee+pulse, kora bounce, leef bounce, infra pulse ; après 0 animation CSS sur 15 pages ; canvasChanged 0
- `node verif-motion.mjs` → no-preference : `/` ["marquee","pulse"], kora/leef ["bounce"], infra ["pulse"] ; reduce : [] ×4
- `node audit.mjs forms` → /contact labels=1 ×4 inchangé ; /rendez-vous ∅ formulaire (API créneaux injoignable depuis preview) → `verif-formulaires.mjs` (API routée Playwright), 2 thèmes :
  jours n=31 sansNom=0 pressed=["vendredi 16 octobre"] ; créneaux "10:00 pressed=false" ×3 ; champs aria-label=Nom / E-mail / Quelques mots… ; alerteRdv ["La réservation n'a pas pu être envoyée…"] ; alerteContact ["L'envoi a échoué…"] ; focus Rdv/Contact/sp-demo `fv=true outline=solid 1px rgba(255,255,255,0.92) offset=2px` (clair rgba(10,10,15,0.9)) ; repos outline=none
- captures `T013/{avant,apres}-{light,dark}-{home,contact,rendez-vous,services-infrastructure}.png` + `apres-*-focus-rendez-vous.png` → validation humaine NV
- prérendu → NV — prérendu réservé au chef
## Écarts
- lecture hors WL: src/components/kit/ascii-core.ts:62-69 — `rg th-text-` a montré que l'ASCII lit ces tokens (bloquant)
- DoD 4 partielle — faint/md clair non relevés (BLQ ci-dessous)
- DoD 7 partielle — contraste faint/md restant ; forms/motion OK
- DoD 1 : « jours L66-69 » = flèches de mois (déjà nommées) ; jours réels L82-96
- clair : lo .58 > md .55 → hiérarchie inversée tant que md non tranché
- question BLQ : `ascii-core.ts:66-67` (`readInk`) lit `--th-text-md` et `--th-text-faint` comme encres md/lo de tous les visuels ASCII (AsciiField, AsciiCurtain, kora-logo, ProximityText, scramble), donc relever ces tokens change les visuels ASCII déclarés intouchables : je relève quand même, ou je découple (utilitaires `--color-md`/`--color-faint` → nouveaux tokens texte ≥ 4.5 dans style.css, avec surcharge `.force-dark`, et `--th-text-md`/`--th-text-faint` laissés tels quels pour l'ASCII) ?
## Pour la suite
- BLQ faint/md : cibles calculées — sombre faint .20→.46 ; clair md/faint .55/.22→.58 (≥4.5 page+surface-hi) ; `node T013/ratio.mjs` recalcule
- hors périmètre <4.5 en clair : `/` « export » #2ca9bc, « −6 h 40 / week » jaune, « all systems normal » bleu, « reçu : du bruit » vert, seo « [1] »/« AI overview » rose (Home, SecurePass, visuals.tsx, global-seo-shots)
- `Kicker color` (motion-kit) non audité ici ; `animate-bounce`/`pulse` pages Orbit/MonaLisa/… couvertes par la règle CSS globale
- T013/dist, dist-avant (builds) à supprimer si inutiles ; preview 4408 arrêté
## Retour sur le pack
- Manquait: `ascii-core.ts` lit md/faint (conflit DoD 4 ↔ ASCII intouchable) ; Booking « L66-69 » = flèches, jours L82 ; API créneaux absente du preview → mock requis
- Inutile: ∅
## Reprise après BLQ
- décision chef : découpler ; `--th-text-md`/`--th-text-faint` = valeurs d'origine (L16,L18 · L39-40 · L57-58), intouchées
- `--th-text-lo` : non lu par ascii-core (`rg th-text-lo src/components/kit src/components/ui/ascii-*` → ∅) → valeur gardée (.46 / .58)
- src/style.css:19-22,41-42,60-61 — `--th-copy-md`/`--th-copy-faint` : sombre .55/.46 · force-dark .62/.40 · clair .66/.58
- src/style.css:78,80 — `--color-md`/`--color-faint` → `--th-copy-*`
- ratios (ratio.mjs) clair page : md 6.24 · lo 4.71 · faint 4.71 (surface-hi 5.99/4.57/4.57) ; sombre #000 : md 6.27 · lo/faint 4.58 ; hiérarchie clair md > lo = faint
- force-dark faint .40 = lo force-dark (3.77 sur #0a0a0a, zone `.on-figures` faux positif) — garde lo ≥ faint
- `npx tsc --noEmit -p .` → exit 0 ; `npx vite build --outDir …/T013/dist` → ✓ built in 4.68s
- `git diff --stat -- src/components/kit 'src/components/ui/ascii-*'` → `ascii-gallery-nav.tsx | 36` seul — modif préexistante (git status début de session), ∅ T013
- `node verif-ascii.mjs` (reduce, toDataURL par canvas, /, kora, leef, 2 thèmes) : avant×2 → `stable` ; `diff ascii-avant.json ascii-apres.json` → `canvas-identiques` ; captures `ascii-{avant,apres}-*.png`
- audit contrast relancé → 16 combos (66 avant) ; périmètre lo/md/faint/accents : 0 à op=1 ; restants op<1 (fondu) : lo/faint 52, md 1, accents 2 ; hors périmètre inchangés (export, all systems normal, reçu : du bruit, [1], AI overview)
- motion (reduce) → css 0, canvasChanged 0 ; verif-formulaires → sansNom 0, pressed ["vendredi 16 octobre"], 3 champs nommés, alertes Rdv 1 / Contact 1, focus `solid 1px offset 2px`, 2 thèmes
- captures `apres-*.png` régénérées ; preview 4408 arrêté
- pour la suite : placeholders et jours désactivés (`text-faint`) passent à .58 clair / .46 sombre, plus visibles → validation humaine
