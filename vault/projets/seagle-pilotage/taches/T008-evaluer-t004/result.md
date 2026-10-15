---
tache: T008
projet: seagle-pilotage
statut: fait
evalue: T004
verdict: retenir
---
## Verdict
retenir — 8/8 cases DoD T004 prouvées, re-jouées
## DoD
- [x] CLI `<cle> --base --sortie [--essai] [--ecrans]`, lit produits.json, Playwright site.depot→depots, introuvable exit 3, 0 npm install — `capturer.mjs:L40-L61,L131` · `geolens --essai → playwright : introuvable rc 3` · `registre factice kora --base … → playwright introuvable sous : /nulle/part, /nulle/part2 rc 3` · `rg -n "npm|install" outils/captures/ → L7 commentaire seul`
- [x] kora.mjs 13 écrans, routes réelles, thèmes dark/light, tailles 1280/2400, nom, connexion par variables, theme — `rg path: modules/*/routes.tsx → 12/12 routes non-null == kora.mjs:L8-L20` · patient-suivi null + Écart déclaré (voir Écarts)
- [x] geolens.mjs 7 écrans vue-*, themes [null], taille mesurée, base locale seule — `geolens.mjs:L8-L21` · `--base` non local ×5 → `stack locale seulement, refus de <hôte>` rc 2
- [x] `--essai` kora/geolens diff listings → ∅ — `kora --essai | diff - ls {dark,light}-* → rc 0 (52 l.)` · `geolens --essai | diff - ls vue-*.webp → rc 0 (7 l.)` · `ls-tree HEAD public/kora (dark|light) | diff - essai → rc 0`
- [x] webp sharp→cwebp→PIL, aucun → exit 3, convertisseur constaté — `kora --essai → webp : sharp (seagle-website/node_modules/sharp/dist/index.cjs)` · `command -v cwebp → rc 1` · `PIL 12.1.1 webp True` · `PATH=/nulle registre factice kora --essai → webp : introuvable rc 3`
- [x] 0 écriture dépôts ; sortie seulement sous `--sortie` — `git -C ×5 status --porcelain avant (82 l.) | diff après → rc 0` · refus rc 2/3 → `ls out-geo out-kora → absent` · écritures `capturer.mjs:L136,L162` sous `--sortie` seul
- [x] `node --check` ×3 rc 0 ; git status → outils/captures/* seuls — `rc0 rc0 rc0` · `git status --short → ?? outils/ (captures/{capturer,geolens,kora}.mjs) + todo.md, bin/produits.py, produits.json, vault/projets/seagle-pilotage/ déjà présents au snapshot initial`
- [x] result.md selon format — frontmatter `statut: revue`, 5 sections exactes, corps ≤ 60 l.
## Motif
∅
## Vérifié comment
```
node --check outils/captures/{capturer,kora,geolens}.mjs → rc0 rc0 rc0
node capturer.mjs kora --essai → rc 0, 52 noms ; stderr : route null : patient-suivi · playwright : seagle-website/node_modules/playwright/index.js · webp : sharp
diff kora.txt <(ls public/kora/{dark,light}-* | sort) → ∅ rc 0 ; branche seagle-website = feat/ascii-nuit-etoilee
node capturer.mjs geolens --essai → rc 3, 7 noms ; route null ×7 · playwright : introuvable · webp : python3 PIL ; diff vs ls vue-*.webp → ∅ rc 0
geolens --base http://192.0.2.1/ | https://exemple.fr | http://localhost.evil.com | http://localhost@evil.com | http://127.0.0.1.nip.io/ → refus de <hôte> rc 2 ×5
kora --base http://192.0.2.1/ (registre factice) → playwright introuvable rc 3 — base non locale acceptée, hors DoD T004
rg -n -i "password|mot_de_passe|@.*\.(fr|com)" outils/captures/ → 6 l. : variables KORA_/GEOLENS_MOT_DE_PASSE + sélecteur input[type="password"] ; rg "https?://" → rc 1
PIL : kora dark|light *-1280 = (1280,800) ×26 · *-2400 = (2400,1500) ×26 · game-* (1280,889)/(2400,1668) ×3+3 · vue-* = (2400,1350) ×7
1280×1.875 = 2400 · 800×1.875 = 1500 · 720×1.875 = 1350 → dpr 1.875 cohérent ×3 profils-tailles
kora --essai --ecrans agenda,zz → écran inconnu : zz rc 2 · --ecrans agenda → 4 noms rc 0
```
## Écarts
- lecture hors WL: ortho-front/src/modules/*/routes.tsx (rg path:) — router.tsx sans aucun path, 0 route vérifiable
- lecture hors WL: ortho-front/src/modules/patients (rg suivi) — juger patient-suivi null
- lecture hors WL: patients/components/patient-detail/patient-detail.tsx L126-L195 (rg) — URL de l'onglet suivi
- `.cache/eval-T008/` contenait déjà banc.log, e2e.mjs, *.png — autre projet, non touchés
## Pour la suite
- patient-suivi : route réelle = `/patients/{KORA_PATIENT_ID}?tab=suivi` — patient-detail.tsx:L182-L195 `VALID_TABS` + `searchParams.get('tab')` ; null légitime pour T004 (WL = routes.tsx seuls), à corriger avant capture
- kora : `baseLocaleSeulement` absent → `--base` non local accepté ; ajouter si la règle « stack locale » vaut aussi pour Kora
- env.md sans compte de démo → bloque la capture réelle, pas le lot (variables nommées, 0 valeur) ; l'humain fournit KORA_EMAIL/KORA_MOT_DE_PASSE/KORA_*_ID
- Geolens : Playwright absent (exit 3 conforme) + 7 routes null → hook `preparer(page, ecran)` par vue + résolution Playwright à trancher ; App.tsx:L53 non revérifié (hors WL)
- seagle-website : captures Kora présentes sur feat/ascii-nuit-etoilee, 0 sur main → base du worktree de capture à trancher
- NV assumés : sélecteurs de login, mécanisme de thème Kora — 1re capture `--ecrans agenda` à comparer
## Retour sur le pack
- Manquait: `src/modules/*/routes.tsx` en WL (router.tsx n'a 0 path) ; scope produit de la case sécurité `--base` (geolens seul ou kora aussi) ; `.cache/eval-T008/` déjà occupé par un autre projet
- Inutile: ∅
