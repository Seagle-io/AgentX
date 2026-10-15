---
projet: seagle-pilotage
titre: "Seagle : piloter Geolens, Kora et l'entreprise depuis l'immeuble"
statut: cadrage
objectif: l'immeuble a un étage par produit Seagle (Geolens, Kora, puis tous les autres) et un étage permanent pour l'entreprise ; avant chaque publication sur main/master, `agentx publier <produit>` rend GO ou NO-GO (site, captures, textes, marketing)
depot: /home/jdrac/Documents/Workspace/AgentX
produit: seagle
cree: 2026-10-15
tags: [projet]
---

# Brief — Seagle : piloter Geolens, Kora et l'entreprise depuis l'immeuble

## Objectif
AgentX pilote l'entreprise Seagle : 1 étage par produit (registre extensible), 1 étage permanent « Seagle (entreprise) » (site, marketing, finance, juridique, RSSI), et une porte de publication qui empêche de publier un produit sans site, captures et textes à jour.

## Definition of Done du projet
- [ ] registre des produits (comme `roles.json`) : Geolens, Kora au minimum, ajout d'un produit = 1 entrée ; chaque projet du vault rattaché à un produit ou à l'entreprise
- [ ] immeuble : étage = produit (agrège ses projets) ; étage Seagle (entreprise) permanent ; chef au dernier étage ; nombre d'étages non borné
- [ ] `agentx publier <produit>` : GO / NO-GO motivé (commits de la branche de publication non reflétés sur le site, captures plus anciennes que l'interface, textes de fonctionnalités, entrées du calendrier marketing) ; tâches créées à l'étage du produit pour chaque écart
- [ ] captures refaites par les agents (Playwright, produit lancé en local) sur une branche du site, avant/après ; l'humain valide et pousse
- [ ] vérifié sur banc et dans Chromium ; évaluateur `retenir` sur chaque lot

## Contraintes dures
- jamais de push ni de migration par un agent ; BDD serveur de test Geolens intouchable ; Kora (OrthoPro) : jamais de migration
- 0 donnée inventée ; 0 contenu financier chiffré recopié dans le vault public
- un seul chef

## Hors périmètre
- publier à la place de l'humain ; modifier les produits eux-mêmes
- comptabilité réelle (aucune source facture/tableur trouvée)

## Hypothèses retenues
- branche de publication = branche par défaut du remote (Kora : `master`, `Ultime` = travail ; Geolens : `master`) — à invalider si l'humain publie depuis une autre branche
- Geolens est présenté par `Geolens-website`, pas par `seagle-website` (0 page Geolens) — à invalider si le site Seagle doit présenter Geolens

## Questions ouvertes
- ∅ (entretien 2026-10-15 : feu vert avant push · étage Seagle permanent qui absorbe seagle-site · captures refaites par les agents · étage = produit, à terme tous les produits)

## Carte du terrain
- carte complète : [[carte]] (T001)
- Kora = OrthoPro : `W/OrthoPro/{ortho-back,ortho-front}`, remotes Seagle-io/ortho-*, master ; textes `seagle-website/src/lib/local/*/Kora.ts:23-75` ; captures `seagle-website/public/kora/` (61, manuelles)
- Geolens : `W/Geolens/geolens-web-feat-viewer-online` (master) ; site `W/Geolens-website` (textes `src/site.ts`, captures `public/images/logiciel/vue-*.webp`, 7)
- seagle-website : HEAD local `feat/ascii-nuit-etoilee`, 16 commits d'avance sur `main` (2026-09-18) — pages Kora actuelles absentes de main
- marketing : `W/Seagle-Marketing/` (Obsidian, calendrier éditorial, 10 posts) ; finance : 3 devis .docx + business plan Kora (chemins seulement)
