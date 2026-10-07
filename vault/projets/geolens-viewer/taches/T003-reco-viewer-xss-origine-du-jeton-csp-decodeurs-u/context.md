---
pack: T003
projet: geolens-viewer
role: eclaireur
cree: 2026-10-07
---

# Pack T003 — Reco viewer : XSS, origine du jeton, CSP, décodeurs unpkg

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Localiser dans le viewer vendoré de G chaque site XSS et chaque prérequis CSP de l'audit, et rendre le correctif minimal par site + la faisabilité d'une CSP sans `unsafe-inline` script, sans rien modifier. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] manifeste project.json : tous les sites où nom, description, société, métadonnées d'acquisition atteignent `innerHTML`/`insertAdjacentHTML`/template HTML (≈10 selon audit) — `chemin:L — champ — sink`
- [ ] `showToast` : définition + nombre d'appels avec texte utilisateur (`rg -c`)
- [ ] XSS réfléchie `viewer.html?project=` : lecture du paramètre → écriture dans le message d'erreur
- [ ] data-URL de POI restaurées sans validation : coordonnées + format attendu
- [ ] jeton ajouté à toute URL absolue : `makeSignUrl`/`__glrSignUrl` (install.ts:104) — condition actuelle, origine API disponible où ?
- [ ] helper d'échappement existant ? (`rg -n "escapeHtml|escape\(" web/src`) — signature recopiée si oui
- [ ] CSP actuelle : meta/headers dans `web/viewer.html`, `web/src/viewer/index.html`, `web/index.html`, nginx ; nombre de `<script>` inline, `on*=` inline (`rg -c`), styles inline ; verdict faisabilité script-src sans unsafe-inline
- [ ] décodeurs DRACO/KTX2 depuis unpkg : coordonnées, version three, chemins équivalents dans node_modules/three/examples/jsm/libs
- [ ] tests viewer existants par zone (`rg -l` sous web/src/viewer/**/__tests__)
- [ ] `result.md` ≤ 150 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule. Fichiers viewer : localiser par rg puis `sed -n` ciblé (≤ 60 l par plage) ; main.ts jamais en entier.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-audit/RAPPORT_REVUE_AXES1.txt` | L | L143-184 et L215-245 web |
| `/home/jdrac/Documents/Workspace/AgentX/.cache/geolens-audit/SYNTHESE_AUDIT.txt` | L | §4.1 XSS, CSP |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/install.ts` | L | signature URL |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/backend/HttpBackend.ts` | L | backend, plages ciblées |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/viewer.html` | L | page viewer, CSP |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/index.html` | L | doublon ~97 % |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/index.html` | L | portail |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/nginx.conf` | L | en-têtes |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/vite.config.ts` | L | build, assets |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/main.ts` | L | plages ciblées seulement |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/package.json` | L | version three |

## Contrats
```
window.glrAPI = HttpBackend (backend/HttpBackend.ts:82) ; URL signée via window.__glrSignUrl (install.ts:104) ; makeSignUrl ignore data: et blob:
viewer monté en iframe (web/src/pages/Project.tsx:108)
règle check:viewer-html : node scripts/check-viewer-html-sync.mjs (viewer.html ↔ viewer/index.html)
monolithe gelé : web/src/viewer/main.ts (9404 l) → correctif = helper dans module dédié
```

## Décisions actées
- lecture seule — reco avant contrat
- pas de réécriture React du viewer — audit : prématuré
- 0 dépendance ajoutée (pas de DOMPurify sauf preuve nécessité)

## Hors périmètre
- modifier un fichier ; API, infra ; portail React (`web/src/pages`) sauf CSP
- stockage navigateur, renouvellement du jeton (lot 2 audit)

## Environnement
- node v22.22.1 ; node_modules api+web installés ; e2e : non installé
- base verte 2026-10-07 : typecheck OK · lint 0 err · api 571 tests · web 1665 tests
- G sans `.git` : pas de `git diff` ; copie de référence AgentX/.cache/geolens-baseline-2026-10-07
- shell humain fish : utiliser `bash -c` si syntaxe POSIX

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, ls, wc, find, sed -n, head, npm audit --omit=dev --json)
- rg/wc/find/sed -n ciblé libres sur G/api, G/web/src, G/worker, G/scripts, G/e2e : localiser, pas de lecture intégrale hors WL
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T003
statut: fait | bloque
---
## Constats
- ID-audit · chemin:L1-L2 — mécanisme ≤ 12 mots — confirmé | ≠ audit (préciser)
## Correctif minimal
- ID-audit · fichiers E (chemins exacts) · changement ≤ 20 mots · test de non-régression (fichier test + cas)
## Contrats
```
signatures/types/config existants à recopier dans les packs d'implémentation, verbatim
```
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : lots à fichiers disjoints, collisions entre lots
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
