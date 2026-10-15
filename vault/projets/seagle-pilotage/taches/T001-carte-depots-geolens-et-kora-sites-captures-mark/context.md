---
pack: T001
projet: seagle-pilotage
role: eclaireur
cree: 2026-10-15
---

# Pack T001 — Carte : dépôts Geolens et Kora, sites, captures, marketing, finance

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Cartographier ce qu'AgentX doit surveiller pour piloter Seagle : dépôts des produits Geolens et Kora (branches de publication), ce que les sites (seagle-website, Geolens-website) affichent de chaque produit (pages, textes de fonctionnalités, captures d'écran et leur origine), le vault marketing, et toute source financière — pour qu'un architecte conçoive la « porte de publication » (vérifier site et captures avant chaque publication sur main/master).

## Definition of Done
- [ ] Kora : confirmer par preuve que Kora = OrthoPro (orthophonie) ou non ; dépôts réels (chemin, remote, branche par défaut, branche de publication `main|master`, dernier commit) : `git -C <d> remote -v`, `branch -a`, `log -1 --format='%h %ad %s'` collés pour chaque dépôt Kora et Geolens (`~/Documents/Workspace/OrthoPro/*`, `~/Documents/Workspace/Geolens/*`)
- [ ] sites : pour seagle-website (`src/pages/Kora*`, `src/pages/Geolens*`, `src/lib/local/{fr,en}/Kora*|Geolens*`) et Geolens-website : liste des captures d'écran / images produit (chemin, taille, date git du dernier changement), qui les référence (`chemin:L`), comment elles sont produites (script ? `scripts/og-images.mjs` ? manuel ?)
- [ ] textes de fonctionnalités des pages produit : où vivent-ils (`chemin:L1-L2`), nombre de fonctionnalités annoncées par produit ; date du dernier changement vs date du dernier commit produit
- [ ] écart actuel constatable : dernier commit produit sur main/master vs dernière mise à jour de sa page/captures sur le site (dates collées) ; 0 jugement de fond, des dates
- [ ] `Seagle-Marketing/` (vault Obsidian) : structure (fichiers, rôle de chacun en ≤ 8 mots), calendrier éditorial, posts liés à Geolens/Kora
- [ ] finance : existe-t-il une source locale (devis, factures, tableaux) ? chemins seulement, 0 contenu chiffré recopié (ex. `Geolens/Devis DEV-2026-001…docx`)
- [ ] build/lancement local de chaque produit et de chaque site (commande, port) tel que documenté (README, package.json) — pour générer des captures ; NV si non documenté
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/` | L | site de l'entreprise (pages Kora, Geolens) |
| `~/Documents/Workspace/Geolens-website/` | L | site produit Geolens |
| `~/Documents/Workspace/Geolens/` | L | dépôts Geolens (git en lecture) |
| `~/Documents/Workspace/OrthoPro/` | L | dépôts Kora présumés (git en lecture) |
| `~/Documents/Workspace/Seagle-Marketing/` | L | vault marketing |
| `vault/projets/orthopro/env.md` | L | fiche env Kora présumée |
| `vault/projets/seagle-site/env.md` | L | fiche env du site |
| `vault/projets/geolens-viewer/env.md` | L | fiche env Geolens |

## Contrats
Indices déjà constatés par le chef :
```
seagle-website/src/lib/local/en/Navbar.ts:27  kora: { label: "Kora", desc: "AI-assisted speech therapy management" }
seagle-website/src/lib/site-routes.json:16   "kora": { "fr": "/solutions/kora", … }
seagle-website/Kora.md · scripts/og-images.mjs (citent Kora)
supervision.json depots : OrthoPro/ortho-back, OrthoPro/ortho-front, seagle-website
Geolens/ : geolens-web-feat-viewer-online, geolens-reality-main, geomodeling-main, geoplan-main, safer, Doc-Geolens…
```

## Décisions actées
- lecture seule partout : 0 build, 0 install, 0 serveur lancé, 0 commande git qui écrit (pas de fetch, pull, checkout)
- BDD serveur de test Geolens intouchable ; OrthoPro : jamais de migration, jamais de push
- 0 contenu financier chiffré recopié ; 0 secret (chemin + nom de variable seulement)

## Hors périmètre
- proposer une architecture ; juger la qualité des sites ou du marketing

## Environnement
- `rg -h` = aide en rg 14 : utiliser `-I` ; exclure `node_modules`, `dist`, `.git`
- `git -C <dépôt> log|branch|remote|show --stat` en lecture seule autorisé
- `garde_bash` refuse les commandes citant push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `carte.md`), `Bash(git -C:*)`, `Bash(rg:*)`, `Bash(ls:*)`, `Bash(wc:*)`, `Bash(python3 -c:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack ≤ 60 lignes de corps ; carte détaillée dans `carte.md` (même dossier, Obsidian), liée `[[carte]]` :

```markdown
---
tache: T001
projet: seagle-pilotage
statut: fait | bloque
---
## Livré
- fait-ligne : chemin:L — constat (≤ 12 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- coordonnées à recopier dans le pack de l'architecte (≤ 25 lignes)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
