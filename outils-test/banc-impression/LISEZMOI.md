# Banc d'impression (T124)

Rend la vraie route `ExercisePrint` (`/exercises/banc-<CODE>/print`, MemoryRouter) pour un format, exercice construit depuis `getFormatDef(CODE).demoItems`.

Règle `noMaterial` (T128 — BULL REPN CQT MEMQ DBLQ) : exercice = `items: []`, `params: {}`, consigne = `defaultInstructions` du format. `<p>.format.ts` ne déclare aucune valeur de réglage : les défauts sont ceux que le `PrintComponent` applique à `params` vide — rien d'inventé côté banc.

## Installation
    ./install.sh [slug]    # lien node_modules → <front>/node_modules du projet, idempotent

## Projet (`projets/<slug>.json`)
Tout ce qui est propre au projet ; 0 chemin projet dans le code. Choix : `--projet <slug>` | env `BANC_PROJET` | défaut = l'unique `projets/*.json`. Env `BANC_FRONT` remplace `front`.
- `front`, `port` (serveur partagé), `plugins` (chemins sous `<front>/node_modules`), `alias` (`{ "@/": "src/" }`)
- `shims` (`module → projets/<fichier>`, réexporte le vrai module via `@/….ts`), `registre` (adaptateur : `export const codes = [{ code, print, demo, noMaterial, correction }]`)
- `css` + `sources` → `.banc-css/<slug>.css` généré (`@import` + `@source` Tailwind)
- `page` (composant de la route), `route`, `entree` (`{code}` remplacé) ; `contenu` (sélecteur imprimé), `corrige` (libellé de la case), `ecran_erreur` (regex), `images`, `api` (→ 404), `interdit` (regex d'URL = err)
- `projets/<slug>/` : shims + registre du projet

## Commande
    B=/home/sylvain/Documents/AgentX/outils-test/banc-impression
    node $B/shot.mjs --out <dir> PAIRSIMI ORDM FICHOBS
    node $B/shot.mjs --out <dir> --all-print   # codes à PrintComponent, lus du registre
    node $B/shot.mjs --out <dir> --fixture MOTDIF/long MOTDIF   # fixture du banc (fixtures/<slug>/MOTDIF/long.json) ou chemin d'un fichier

`--out` relatif → `/tmp/banc-sorties/<dir>` (volatile) ; absolu → tel quel.
`--port <n>` : accepté, ignoré (stderr `--port ignoré : serveur partagé 5200`) — 1 seul Vite pour tous les runs simultanés (T173), port = `port` du projet.

## Fixture (`--fixture <fichier.json>`, T161)
Clé = code ; code absent du JSON → demoItems (inchangé). Code présent → rendu même sans demoItems.

    { "MOTDIF": { "items": [{ "id": "i0", "word": "arc en ciel" }, { "id": "i1", "word": "fer à repasser" }],
                  "link": false, "title": "Mots longs", "instructions": "…", "metadata": {}, "params": {} } }

- `items` (requis) : forme des `demoItems` du format ; `link` (défaut `true`) → `linkDemoItems` (mots du vocabulaire démo liés, image) ; `false` → items tels quels
- `metadata` → `cosmetics` de l'exercice ; `params` → `params` du niveau (metadata vue par le format = `{ ...cosmetics, ...params }`)
- `title` défaut = label du format ; `instructions` défaut = `defaultInstructions({ ...metadata, ...params })`
- passage : shot.mjs lit le JSON → `page.addInitScript` → `window.__bancFixture` → `getExercise` (exercises-shim.ts) ; sans `--fixture` rien n'est injecté (sortie identique, cmp T161)
- `--fixture X` : chemin existant, sinon `fixtures/<slug>/X`, sinon `fixtures/<slug>/X.json`
- fixtures du projet : `fixtures/<slug>/<CODE>/<nom>.json`, 1 code par fichier, index `fixtures/<slug>/INDEX.md` (code, nom, ce qu'elle teste, tâches)
- fixture à toi : dans ton propre `<dir>` (banc partagé)

## Sortie (par code, dans <dir>)
- `<CODE>-enonce.pdf` + `<CODE>-enonce-p<N>.png` — A4, media print, pdftoppm -r 110
- `<CODE>-corrige.pdf` + `-p<N>.png` — si hasCorrection !== false (case « Afficher le corrigé » cochée)
- `<CODE>-ecran-1440.png` — capture écran pleine page
- stdout : `CODE pages=N errs=[...]` (N = pages énoncé) | `CODE SKIP no-demo|no-print|inconnu` (no-demo = ni demoItems ni noMaterial)

## Fonctionnement
- serveur Vite partagé (T173) : 127.0.0.1:5200 (strictPort, env `BANC_PORT=5200`) ; log `vite.log` (partagé) ; cache `.vite-cache-5200` (jamais F/node_modules/.vite)
- état dans `.banc-5200/` : `clients/<pid>` (1 fichier par shot.mjs vivant, effacé en sortie), `superviseur` (pid), `verrou/` (mkdir atomique, > 30 s = abandonné)
- 1er shot.mjs sans superviseur vivant → lance, détaché, `shot.mjs` en mode superviseur (env `BANC_SUPERVISEUR=1`) qui lance Vite ; suivants → s'inscrivent et réutilisent
- superviseur, toutes les 1 s : clients au pid mort effacés (kill -9 toléré) ; 0 client vivant 5 s de suite → Vite tué, superviseur sorti ; verrou gardé jusqu'à la mort de Vite (un client qui arrive relance un serveur neuf)
- fixture par page (`addInitScript`) → runs avec et sans `--fixture` simultanés sur le même serveur sans mélange
- `projets/orthoworkspace/exercises-shim.ts` (alias `@/api/exercises`) : `export *` du vrai module ; `getExercise` construit l'exercice (demoItems ou fixture) ; `resolveLaunch` rejette → repli niveau entier
- mots de démo liés (T130) : `linkDemoItems` du front sur le vocabulaire de l'aperçu (`DEMO_WORDS` + `DEMO_RHYMES`, = `DEMO_VOCABULARY`) ; mot lié = `{ id: UUID fixe, word, image: '/stimuli/images/<mot>.webp' }`
- `projets/orthoworkspace/resources-shim.ts` (alias `@/api/resources`) : `export *` du vrai module ; `resolveMedia` → `{ [id]: { image: '/stimuli/images/<mot>.webp' } }`, sans réseau
- `http://127.0.0.1:5200/api/**` → 404 (apparence, banque de mots : valeurs livrées) ; 404 console filtrés des errs
- `**/stimuli/images/**` → `ferme.webp` local ; requête vers :3000 = err
- `node_modules` = lien vers `<front>/node_modules` (`install.sh`) ; playwright et vite lus par ce lien
- dossier du banc = dossier de `projet.mjs` (`import.meta.url`) ; état `.banc-<port>/`, `vite.log`, `.vite-cache-<port>`, `.banc-css/` dans ce dossier (gitignorés)
- préchauffage (T135) : avant les captures, le 1er code est rendu une fois → Vite finit d'optimiser les deps (cache neuf = « optimized dependencies changed. reloading »)
- `server.watch: null` : une édition concurrente (shim, front) ne recharge plus la page en pleine capture ; une édition est prise au run suivant
- attente rendu = `.print-police` visible (15 s) + 1,5 s ; case « Afficher le corrigé » attendue 5 s avant comptage
- contrôle blanc : PDF < 2 Ko ou page 1 > 99,5 % pixels blancs (`pdftoppm -r 40 -gray`) ; aussi rechargement Vite pendant l'essai, ou toute err
- échec → 1 relance du code (page neuve, fichiers écrasés, `CODE relance — raison` sur stderr) ; 2e échec → errs `rendu blanc` / `rechargement vite` + errs de l'essai ; jamais de fichier blanc silencieux

## Limites
- 1 seul niveau, séance 1, pas de lignes d'écriture, pas d'apparence/famille d'images
- images : toutes = ferme.webp ; seuls les mots de `DEMO_VOCABULARY` en ont, comme l'aperçu réel — sac soleil maison moto bateau pomme voiture restent texte
- un format dont l'affichage par défaut est le texte (PAIRSIMI, observé ; `DEFAULT_PAIRES_DISPLAY` non lu) n’imprime aucune image : `metadata` vide, rien d'inventé
- formats noMaterial : réglages par défaut seulement (rendu identique entre 2 runs, cmp)
- marges du PDF = celles du CSS `@page` du front (preferCSSPageSize)
