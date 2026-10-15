---
tache: T004
projet: seagle-pilotage
statut: revue
---
## Livré
- outils/captures/capturer.mjs:L1-L182 — CLI §C6, sorties 0/1/2/3
- capturer.mjs:L40-L61 — registre `$AGENTX_PRODUITS`→`produits.json`, Playwright site→depots
- capturer.mjs:L63-L88 — webp sharp→cwebp→python3 PIL, sinon exit 3
- capturer.mjs:L121-L126 — `--essai` : 0 navigateur, noms triés + diagnostic stderr
- capturer.mjs:L127-L130 — `baseLocaleSeulement` : hôte ≠ localhost/127.0.0.1/::1 → exit 2
- capturer.mjs:L140-L179 — capture : contexte par thème×taille, PNG temporaire sous `--sortie`
- outils/captures/kora.mjs:L7-L21 — 13 écrans, routes router.tsx, `{VAR}` = id démo
- kora.mjs:L25-L28 — 1280×800 dpr1 · 1280×800 dpr1.875 (=2400×1500)
- kora.mjs:L33-L53 — connexion KORA_EMAIL/KORA_MOT_DE_PASSE · thème emulateMedia+classe
- outils/captures/geolens.mjs:L7-L39 — 7 vues null, 1280×720 dpr1.875, base locale seule
- .cache/T004/produits.json — §C1 recopié (essais avant T003)
## Vérifié comment
```
node --check outils/captures/{capturer,geolens,kora}.mjs → rc 0 ×3
webp mesurés : kora *-1280 = 1280×800 (26) · *-2400 = 2400×1500 (26) · game-* 1280×889/2400×1668 (3+3) · vue-*.webp 2400×1350 (7)
dpr tranché : agenda 1280 vs 2400 — barre latérale 175→328 px, grille 1019→1910, 08h–18h 587→1100 → ×1.875, même viewport
node outils/captures/capturer.mjs kora --essai | diff - <(ls public/kora/{dark,light}-* | sort) → ∅ rc 0 (52 noms)
  stderr : route null : patient-suivi · playwright : seagle-website/node_modules/playwright/index.js · webp : sharp (seagle-website/node_modules/sharp/dist/index.cjs)
git -C seagle-website ls-tree HEAD public/kora/ hors game-/mp4/webm/poster | diff essai → ∅ · ls-tree main → 0 fichier (diff 52 lignes)
node capturer.mjs geolens --essai | diff - <(ls vue-*.webp) → ∅ · ls-tree main idem ∅ · rc 3 (playwright : introuvable, webp : python3 PIL)
which cwebp → rc 1 · python3 PIL 12.1.1 features.check('webp') → OK
kora --essai --ecrans agenda,zz → « écran inconnu : zz » rc 2 · kora sans --base → rc 2 · zz --essai → rc 2
geolens --base http://192.0.2.1/ → « stack locale seulement, refus de 192.0.2.1 » rc 2
registre factice (depots /nulle/part) kora --base … → « playwright introuvable sous : /nulle/part, /nulle/part2 » rc 3 · webp repli → python3 PIL
git -C {seagle-website,Geolens-website,ortho-front,ortho-back,geolens-web} status --porcelain avant (87 l.) | diff après → ∅ rc 0
produits.json (T003, apparu en cours) : site+depots kora/geolens == §C1 → True ; essai sans AGENTX_PRODUITS → diff ∅ ×2
git status --short → ?? outils/ (+ hors moi : todo.md M, bin/produits.py, produits.json, vault/projets/seagle-pilotage/)
capture réelle → NV — produits non lancés (pack)
```
## Écarts
- produits.json absent au démarrage → §C1 recopié `.cache/T004/produits.json`, via `AGENTX_PRODUITS` ; présent en fin, relancé dessus OK
- route introuvable : patient-suivi — 0 « suivi » dans patients/routes.tsx
- route introuvable : geolens coupe, courbes, mesure, protections, solaire, surete, zone — vues = état interne de `/projects/:id` (App.tsx:L53)
- Geolens : Playwright absent de Geolens-website et geolens-web → capture réelle exit 3 ; 0 install
- seagle-website : captures Kora sur `feat/ascii-nuit-etoilee` seulement, 0 sur `main` → B du worktree à trancher
- env.md orthopro : 0 compte de démo → variables inventées KORA_EMAIL, KORA_MOT_DE_PASSE, KORA_{BILAN,EXERCICE,PATIENT}_ID, GEOLENS_*
- NV : sélecteurs de connexion (input email/password, button submit) et mécanisme de thème Kora — composants hors WL
- qualité webp 85 — choix, originale inconnue
- 0 lecture hors WL
## Pour la suite
- humain : lancer front `:5173` + back `:3000` de Kora (env.md), base de démo, sans migration
- `KORA_EMAIL=… KORA_MOT_DE_PASSE=… KORA_BILAN_ID=… KORA_EXERCICE_ID=… KORA_PATIENT_ID=… node outils/captures/capturer.mjs kora --base http://127.0.0.1:5173 --sortie .cache/captures/kora/<AAAAMMJJ-HHMM>/apres/`
- 1re passe conseillée : `--ecrans agenda` puis comparer avec dark-agenda-*.webp (thème, connexion NV)
- patient-suivi : fournir route ou hook d'action (onglet ?) ; Geolens : hook `preparer(page, ecran)` par vue + Playwright à fournir
## Retour sur le pack
- Manquait: comptes de démo absents d'env.md ; mécanisme de thème et formulaire de login Kora (fichiers) ; Playwright Geolens non vérifié ; branche B des captures Kora (main vide)
- Inutile: ∅
