---
tache: T020
statut: fait
verdict: DÉFAUTS
tags: [result]
---
## Mesures avant/après
$T = `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/59be6c8c-83a2-4e2f-a1d3-60657b0c7604/scratchpad/t020.vFMn` · AVANT = HEAD 345a7a0 (`dist-avant`, 0 occurrence « ouverture terminée ») · APRÈS = arbre (`dist-apres`, 1)

| id | métrique | avant | après |
|---|---|---|---|
| O1 | `__glrTiles` créé vs clic `#gx-home-explore` | −3710 ms | −3642 ms (chargé derrière l'accueil) |
| O1 | logs gel pendant l'ouverture | gel −3704→+975 ; gel +1171→+5074 (3,9 s) | 0 (4 runs) |
| O1 | 1re req .glb − création tileset | ≈ 4460 ms | 54-70 ms (4 runs) |
| O1 | req [tileset, +4 s) | 0 | 401 (4 runs) |
| O1 | req [clic, +4 s) | 21 | 182 |
| O1 | maxJobs pendant l'ouverture | 0 puis 12 à +5,5 s | 12 constant |
| O1 | errorTarget ouverture (caméra bouge 0→2,2 s) | 1 → 0,5 | 1 → 0,5 à ≈ +3,25 s |
| O1 | net (q,dl,pa=0 ∧ et 0,5) depuis clic | 12981 ms | 10999 ms |
| O1 | PNG stable (diff 1 s = 0 px) depuis clic | 14063 ms | 13291 ms |
| O1 | `__glrMotionGate` pendant l'ouverture | — | `undefined` (D3) |
| O2 | log `ouverture terminée (<type>)` | ∅ | 1× pointerdown / 1× wheel / 1× keydown |
| O2 | mouse.move seul sur canvas | — | 0 log, exemption maintenue |
| O2 | drag milieu 3 s : req / maxJobs / gel après down | 0 / 0 / +39 ms | 0 / 0 / +38 ms |
| O2 | reprise − mouseup | 1116 ms | 1110-1133 ms (4 runs) |
| O3 | clic toolbar `[data-view=top]` à +3,5 s, 0 entrée canvas : req pendant anim 2,7 s / maxJobs | — | 722 / 12 (D2) |
| O3 | idem après pointerdown canvas | — | 66 / 0 |
| O3 | saisie `#visit-seconds` | — | `ouverture terminée (keydown)` + gel (acceptable) |
| O3 | 2e ouverture `tileset-synth` (après levée) | — | 1137 req dès +309 ms, 0 gel, maxJobs 12 ; sonde périmée `openingExempt:false` (D3) |
| V1 | ortho 12 crans → zoom | 69,45 | 65,16 |
| V1 | Accueil zoom / fond% | 69,45 / 26,3 | 0,55 / 89 |
| V1 | Recadrer zoom / fond% | 69,45 / 23,6 | 1,00 / 79,6 |
| V1 | Dessus · Face · Iso zoom | 69,45 ×3 | 0,85 ×3 (= distance 300) |
| V1 | touches 7/1/3/0/H/F après zoom 44 | — | zoom = zoom-distance (0,850/0,850/0,850/0,850/0,553/0,767) |
| V2 | ortho max → `5` : dist persp / px·m⁻¹ | 0,433 / 1713,6 | 0,500 / 1484,9 (ortho 1484,4) |
| V2 | +1 cran molette avant | dist 0,500, px/m −13 % | dist 0,500, px/m = (0 recul) |
| V2 | zoom ortho max | 224,4 | 148,96-510,17 (= minDistance 0,5) |
| V3 | Z1 persp→ortho px/m | 2,231→2,231 | 2,91→2,91 |
| V3 | Z1 5 crans avant/arrière zoom | 6,751/1,080 | 6,643/1,063 |
| V3 | Z2 point sous curseur dx/dy % | 0,04/−0,13 | 0,04/−0,13 |
| V3 | Z3 30 crans : contenu / gel+reprise | 0,507 / oui | 0,545 / oui |
| V3 | 2e entrée ortho zoom / px/m | 1,000 / 7,64 | 1,000 / 9,965 |
| V3 | dolly persp 5 crans dist | — | 255,08→32,78 |
| V3 | mode2 8 crans ortho zoom | — | 14,957 (mode1 14,950) |
| V3 | pivot milieu ortho zoom 44 | — | 44,073 conservé |
| V3 | dézoom 160 crans ortho zoom | — | 0,026 (borne, contenu 0,6 %) |
| V3 | 10 bascules `5` puis H : px/m | — | 1,61 = 1,61 |
| V3 | vue enregistrée ortho zoom 44 → H → restaurer | 44,087 (px/m 98,3 = sauvé) | 1,000 (px/m 2,91 ≠ 128,25 sauvé) (D1) |

## Défauts
- D1 · `web/src/viewer/core/SceneManager.ts:1082-1094` — restaurer vue enregistrée en ortho écrase son zoom · repro : ortho `5`, 12 crans molette (zoom 44,08), `#saved-views-add`, `H`, clic `.saved-view-thumb` (`$T/sv.mjs`) · attendu : vue restaurée à l'échelle sauvée (px/m 128,25 ; AVANT 98,3 = sauvé) · obtenu : zoom 1,000, px/m 2,91 (×44 perdu) ; vue stockée = `camera:{position,target}` sans zoom → enveloppe setLookAt recale sur la distance. PNG `$T/out/sv/apres-o-saved.png` vs `apres-o-restaure.png`
- D2 · `web/src/viewer/loaders/TilesRendererLoader.ts:667` + `core/motionGate.ts:47` — entrée toolbar ne termine pas l'ouverture → D24 contourné · repro : ouvrir, 0 entrée canvas, clic `[data-view="top"]` à +3,5 s (`CASE='view:[data-view="top"]' WAIT=3500 node o3.mjs`) · attendu (D7 : après 1re entrée utilisateur, animations programmées = mouvement) : gel, maxJobs 0 · obtenu : 722 req pendant l'animation 2,7 s, maxJobs 12, 0 log ; avec pointerdown canvas préalable (`LIFTFIRST=1`) : 66 req, maxJobs 0. Même classe NV : Recadrer, Accueil, rotation auto, présentation
- D3 · `web/src/viewer/loaders/TilesRendererLoader.ts:683,700` — `__glrMotionGate` publié seulement sur transition · repro : `LIFT=pointer node o.mjs`, échantillons 250 ms avant levée · attendu (contrat) : `{allowed:true, openingExempt:true}` · obtenu : `undefined` toute l'ouverture (138 échantillons) ; après 2e ouverture du livrable : sonde de l'ancien loader `openingExempt:false` alors que 0 gel. Impact : sonde de test seulement

## Vérifié comment
- renderer → `ANGLE (NVIDIA, Vulkan 1.4.329 (NVIDIA NVIDIA GeForce RTX 4070 Ti (0x00002782)), NVIDIA)`
- pageerror → 0 sur 17 runs ; statuts → `{"200":2804,"304":13,"404":6-9}` (404 = multi-pack.json, camera_params.json, presentation.json, absents du banc)
- `grep -rl "ouverture terminée" dist-apres | wc -l` → 1 ; `dist-avant` → 0
- `npx tsc --noEmit -p tsconfig.viewer.json` → `tsc exit 0`
- `npx vitest run src/viewer/core` → `Test Files  22 passed (22)` · `Tests  153 passed (153)`
- `git -C G status --short` avant/après banc → identique (4 M, 3 ??) ; 0 modification
- scripts : `$T/o.mjs` (O1/O2, LIFT=pointer|wheel|key|move), `$T/o3.mjs` (O3, CASE), `$T/h.mjs` (V1), `$T/z.mjs` (V3 RUN a|b|c, NAV=mode2), `$T/v.mjs` (pivot, orbite, touches, dézoom, bascules), `$T/sv.mjs` (vues enregistrées, outils zoom)
- JSON : `$T/out/{avant,apres}-pointer.json`, `apres-{wheel,key,move}.json`, `out/v1/{avant,apres}.json`, `out/z/{avant,apres}-{a,b}.json`, `apres-c*.json`, `out/v/apres.json`, `out/sv/{avant,apres}.json` ; PNG même dossiers
- O1 0 entrée : écouteurs capture window → `evO1: 0` (4 runs)
- processus : `kill 2232455 2280117` → `ports: 0`

## Écarts
- lecture hors WL : `SceneManager.ts` grep `new CameraControls` — chaîne d'enveloppes par bascule ? → L1048 instance neuve, 0 défaut
- lecture hors WL : `TilesRendererLoader.ts:676-702` — confirmer D3 (publication sur transition seule)
- `T` créé sous scratchpad (≠ `mktemp -d` /tmp) — consigne session
- `result.md` T018/T019 non lus — hors WL

## Pour la suite
- D1 : stocker `zoom` (+ type caméra) dans la vue enregistrée ; restaurer après setLookAt
- D2 : trancher (humain) si clic toolbar/raccourcis hors canvas = « 1re entrée » ; sinon écouter `pointerdown` sur la racine du viewer
- `#tool-zoom-in/out` en ortho : dolly seul, px/m inchangé — AVANT idem (préexistant, hors T019)
- pose d'ouverture : AVANT finit à (210,150,210), APRÈS à (161,115,161) = Recadrer persp — NV si voulu
- reprise ≈ 1,1 s après mouseup (amortissement + 500 ms), identique AVANT

## Retour sur le pack
- Manquait: tileset chargé AVANT le clic Explorer (≈ 3,7 s, derrière l'accueil) — « 1re requête après ouverture » ambigu ; un seul livrable au banc (2e livrable = rouverture du même) ; `result.md` T018/T019 absents de la WL (affirmations implémenteur non rejouables) ; `#saved-views-*` et `tool-zoom-*` non cités
- Inutile: ∅
