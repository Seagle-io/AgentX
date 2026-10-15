---
pack: T071
projet: geolens-viewer
role: eclaireur
cree: 2026-10-08
---

# Pack T071 — Reco portail : origines externes réelles (CSP à appliquer) + police Google des rapports

> Seule source de vérité de l'agent T071. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
(1) Dresser la liste exhaustive des origines externes que le PORTAIL (web/src hors viewer, + build dist/index.html) charge réellement — scripts, styles, images, polices, fetch/XHR, workers, iframes — pour écrire une CSP portail APPLIQUÉE (aujourd'hui Report-Only dans le Caddyfile) qui ne casse rien ; (2) localiser l'`@import` Google Fonts des rapports (ReportGenerator.ts:156) et les fichiers de police locaux réutilisables ; 0 modification. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] tableau origine → directive CSP → fichier:ligne qui la charge → nécessaire oui/non (ex. tuiles carte MapView geopf/OSM, PUT S3 présigné des uploads, API externes, polices) ; `rg -n "https?://" web/src -g '!viewer/**' -g '!*.test.*'` filtré aux chargements réels
- [ ] build : `npm --prefix web run build` puis relevé de `web/dist/index.html` (scripts inline ? styles inline ? modulepreload) → conséquences CSP (script-src sans 'unsafe-inline' possible ?)
- [ ] uploads : origine du PUT présigné S3 (driver S3 : endpoint/bucket) → connect-src requis ; config à partir de S3_ENDPOINT (statique dans Caddyfile ?) — proposer la valeur
- [ ] CSP portail proposée, verbatim, en remplacement de la ligne `Content-Security-Policy-Report-Only` du Caddyfile (~:30), avec chaque source justifiée ; écart vs Report-Only actuel
- [ ] rapports : ReportGenerator.ts:156 contexte exact (document généré : iframe srcdoc ? fenêtre ? PDF ?) ; fichiers locaux Poppins (web/src/viewer/styles/fonts.css + woff2 : chemins, graisses) ; correctif minimal proposé (fichiers à toucher, @font-face local ou data URI, CSP du document de rapport)
- [ ] `result.md` ≤ 150 lignes selon « Format de sortie »

## Fichiers autorisés
Lecture seule. rg libre sur les dossiers web/src et web/dist du dépôt.
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/Caddyfile` | L | CSP Report-Only portail ~:25-32 |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/index.html` | L | entrée portail |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/MapView.tsx` | L | tuiles carte (geopf/OSM) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Import.tsx` | L | upload direct S3 (PUT présigné) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/api.ts` | L | appels API (même origine) |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/core/ReportGenerator.ts` | L | :140-170 @import fonts |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/viewer/styles/fonts.css` | L | Poppins embarquée |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/vite.config.ts` | L | entrées build, publicDir |
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/.env.production.example` | L | S3_ENDPOINT, S3_BUCKET |

## Contrats
```
CSP portail actuelle (Caddyfile, Report-Only, matcher @portail_doc : not path /api/* /viewer.html /viewer /assets/* /draco/* /basis/*) :
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://bucket-a-remplacer.s3.fr-par.scw.cloud; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'
constats antérieurs (T017) : tuiles geopf/OSM (MapView) + PUT S3 présigné → violations attendues avant enforce ; ReportGenerator.ts:156 `@import fonts.googleapis` déjà bloqué par la CSP viewer
bucket de prod pas encore créé (D21) : origine provisoire https://bucket-a-remplacer.s3.fr-par.scw.cloud
```

## Décisions actées
- D23 : CSP portail appliquée après relevé ; police des rapports embarquée
- 0 wildcard ; 0 CDN externe pour du code

## Hors périmètre
- modifier un fichier ; lancer la stack ou un navigateur ; viewer (CSP viewer déjà stricte)
- push, remote, PR, commit

## Environnement
- node v22.22.1 ; web/node_modules ; build ≈ 20-35 s, dist/ gitignoré
- G sous git HEAD 07a7a3b ; T072 modifie api/package*.json en parallèle (sans effet sur web)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash(rg, sed -n, wc, ls, npm --prefix web run build, git status), Write (result.md seul)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 150 lignes, sections exactes :

```markdown
---
tache: T071
statut: fait | bloque
---
## Origines du portail
| origine | directive | chargée par (chemin:L) | nécessaire |
## CSP portail proposée
```
verbatim, prête pour le Caddyfile
```
## Police des rapports
- contexte · fichiers locaux · correctif minimal (fichiers, taille)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : lots d'implémentation à fichiers disjoints
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
