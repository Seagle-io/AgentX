---
tache: T006
projet: seagle-pilotage
statut: revue
---
## Livré
- bin/publier.py:1-351 — neuf, porte §C5 (stdlib, importe produits+vx)
- bin/publier.py:30-32 — RE_FEAT, RE_OUVERT verbatim ; RE_ACQUIT
- bin/publier.py:37-57 — GitErreur, Refus(code 2|3), git() timeout 10 s
- bin/publier.py:103-117 — P0 : erreur→3, inconnu/entreprise/site null→2, verifier→3
- bin/publier.py:120-232 — evaluer : P1-P5, acquits, verdict, forme JSON §C5
- bin/publier.py:235-253 — _projet (cmd_projet produit=cle), _acquitter append-only
- bin/publier.py:256-315 — --taches : doublon `<type> <id-court>`, cmd_tache, pack pré-rempli
- bin/publier.py:318-351 — cmd(args) Namespace(cle,json,taches,acquitter,motif) ; main()
## Vérifié comment
```
python3 -m py_compile bin/publier.py → rc=0
python3 bin/publier.py kora --json | python3 -c "…print(r['verdict'], sorted({e['type']…}))" → NO-GO ['commits', 'marketing', 'site-branche', 'textes']
python3 bin/publier.py kora → rc=1
  [bloquant] site-branche:kora:29d349b — 6 commits du site hors main touchent Kora ; pages absentes de main
  [bloquant] textes:kora:e15a824 — 2 commits feat de ortho-front depuis les textes du site (2026-09-18) : à vérifier par un agent
  [avertissement] commits:kora:b44dc91 — 198 autres commits UI de ortho-front depuis 2026-09-18
  [bloquant] marketing:3214f882 / marketing:b43da040 (Calendrier éditorial.md:19,22) ; marketing:16f92ad6 (05 - Calendrier.md:23)
  P4 erreur "T_cap vide (P2)" : git ls-tree main public/kora/ → 0 fichier ; rev-list --count main..HEAD → 16 (6 touchent SP)
python3 bin/publier.py geolens → rc=1
  [avertissement] commits:geolens:b551616 — 16 autres commits UI de geolens-web-feat-viewer-online depuis 2026-10-02
  [bloquant] captures:geolens:2026-10-14 — captures du site (2026-10-01) antérieures à l'UI (2026-10-14)
publier.py seagle → "seagle : entreprise, porte produit seulement" rc=2 · zz → rc=2 · agentx (site null) → rc=2
banc couleur dupliquée → "produits.json invalide : produits[1].couleur : #38bdf8 invalide (…)" rc=3
banc site.branche zz-absente → "registre non verifie : …Geolens-website : branche zz-absente absente" rc=3
banc geolens --acquitter zz:geolens:0 --motif essai → "ecart absent de l'evaluation courante" rc=2
banc --acquitter sans --motif → rc=2 · --motif sans --acquitter → rc=2
banc geolens --acquitter captures:geolens:2026-10-14 --motif "essai banc T006" → GO, "(acquitté)" rc=0
  acquits.md → "- 2026-10-16 `captures:geolens:2026-10-14` — essai banc T006" ; brief.md:7 produit: geolens
banc kora --taches --json ×2 → 1er taches_creees ['T001'…'T005'] rc=1 ; 2e taches_creees [] rc=1
banc vx.py pack-lint T001|T002|T003 → "x le pack contient encore des marqueurs a remplir" rc=2 ; WL 7|6|2 fichiers
cmd(argparse.Namespace(cle='geolens',…)) via import → NO-GO geolens rc=1
git -C <d> rev-parse HEAD + status --porcelain|md5sum ×5 (seagle-website, Geolens-website, ortho-front, ortho-back, geolens-web) avant/après → diff ∅
rg -n "fetch|pull|push|checkout|commit|worktree" bin/publier.py → L151,161,178,181,182 « commits » (titres/type §C5) ; L282 « jamais push » (Hors périmètre §C5)
git status --short → ?? bin/publier.py (autres M/?? = T005 et antérieurs)
ls vault/projets | rg publication → ∅ (vrai vault intact)
```
## Écarts
- ∅ lecture hors WL
- `aujourd_hui` → horodate seulement (`AAAA-MM-JJ 00:00`) — contrat muet sur son usage
- P5 id = sha1(nom calendrier + texte ligne)[:8] — texte, pas n°, stable si lignes bougent
- P3 1 écart par dépôt ui ; P1+P2 fusionnés en 1 écart `site-branche` (titres joints « ; »)
- WL pack créé : motif > 6 fichiers → motif glob (lint `~ chemin introuvable`)
## Pour la suite
- verdict réel kora : NO-GO — site-branche 29d349b (captures absentes de main), textes e15a824, 3 marketing
- verdict réel geolens : NO-GO — captures:geolens:2026-10-14 (captures 2026-10-01 < UI 2026-10-14)
- contrôle `erreur` (git KO) n'impose pas NO-GO (⇔ §C5 littéral) ; P0 verifier rend le cas rare — à trancher
- RE_FEAT ne prend pas « Ajoute… » (`ajout\b`) : 198 commits ortho-front en avertissement
- P5 kora : lignes calendrier « à faire » sans date filtrée → 3 bloquants permanents tant que non acquittés
## Retour sur le pack
- Manquait: usage de `aujourd_hui` ; forme d'un élément de `taches_creees` (choisi : TID) ; « fichier+ligne » = texte ou n° | Inutile: `vault/_templates/context.md` (lu seulement pour les titres)
