---
tache: T025
statut: fait
---
## Fait
- vault/connaissances/geolens-banc-preview-3d.md — neuve, 94 l : lancement, GPU, sondes, souris, pièges, témoins, scripts (éphémères signalés)
- vault/connaissances/geolens-web-outillage.md:16-18,41 — 196/1849, tsc viewer, eslint ignore viewer, modules purs, lien banc
- vault/_templates/context.md — +4 l (84→88) : WL (contrat recopié/relecture DoD/architecte), Contrats (prémisses), Environnement (banc, base tests), Budget (outils)
## Manques agrégés
- fichier requis par la DoD (lib, voisin, result.md vérifié) absent de WL · ≥ 10 (pv T001,T003,T010,T011,T014,T020 ; ch T013,T031,T033,T035) · retenu (gabarit:WL)
- fichier lu inutilement, contrat déjà recopié · ≥ 7 (pv T003,T011,T013,T016 ; ch T001,T021,T032) · retenu (gabarit:WL)
- prémisse de comportement fausse/non prouvée (gauche=orbite, EDL, HEAD≠fluid, molette ortho) · 6 (pv T002,T003,T006,T008,T010,T017) · retenu (gabarit:Contrats)
- scripts banc : chemin/BASE/params des runs ref · 6 (pv T012,T022,T024,T003 ; ch T001,T035) · retenu (gabarit:Environnement)
- compte de tests de base périmé/parallèle · 4 (pv T018,T019 ; ch T032 ; T005) · retenu (gabarit:Environnement)
- outil hors liste (tsc, python3, banc, make -n) → NV · 5 (pv T007,T013,T021,T023 ; ch T015/T019) · retenu (gabarit:Budget)
- decisions.md absent de WL (architecte) · 2 (ch T002,T004) · retenu (gabarit:WL)
- types/signatures externes manquants · ≥ 6 · écarté (déjà au gabarit Contrats ; défaut d'application)
- comptes seed DEMO · 3 (ch T016,T017,T028) · écarté (déjà au gabarit)
- flag bêta 3DGS, accueil, clé savedViews, BASE, camLen, GPU/SwiftShader, charge machine · ≥ 2 chacun · écarté du gabarit (propre geolens) → note banc
- typecheck viewer / eslint ignore · 2 (pv T007 ; ch T032) · écarté (geolens) → note outillage
- numéros de ligne décalés · 1 · écarté (< 2)
## Vérifié comment
wc -l → context.md 88 · geolens-banc-preview-3d.md 94
rg "\[\[" notes → seuls liens : geolens-web-outillage, geolens-banc-preview-3d, fastify-trustproxy-5-12, geolens-web-securite-carte, verif-conteneurs-jetables (tous existants)
python3 bin/vx.py index → index ecrit : vault/INDEX.md (7 projet(s))
python3 bin/vx.py doctor → vault coherent.
NV : commande composée de la note banc (API + vite preview + git archive) non rejouée — assemblée depuis T033/T006/T035
## Écarts
- lecture hors WL: result.md T001-T035 (tous deux projets), `rg -A3 "Retour sur le pack"` — les dumps n'incluent pas cette section (1 lecture agrégée)
- `T0*`/`/tmp/t0**` chemins de scripts cités depuis dumps, existence NV
- gabarit context.md déjà modifié (git M) avant T025 ; seules mes 4 lignes ajoutées
## Pour la suite
- packs de vérif/banc : citer `[[geolens-banc-preview-3d]]` au lieu de recopier le lancement ; copier d'abord les scripts utiles du scratchpad dans `G/e2e/` (éphémère)
- WL : retirer les fichiers au contrat recopié ; ajouter en L tout fichier que la DoD demande de relire
- défaut de gabarit (≥ 6) : prémisses de comportement non prouvées → chef : `rg`/mesure avant dispatch
- relever base de tests sur HEAD au dispatch ; autoriser explicitement tsc/banc/make -n
## Retour sur le pack
- Manquait: section « Retour sur le pack » absente des dumps (lecture des result.md nécessaire) | Inutile: décisions D1-D8 (non utilisées)
