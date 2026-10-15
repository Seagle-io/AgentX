---
tache: T021
projet: seagle-pilotage
statut: revue
---
## Livré
- bin/dash.py:32 — import produits (registre)
- bin/dash.py:212-236 — `_evenements(etage_de)` : setdefault etage ; démo `{}` (:1169)
- bin/dash.py:446-484 — `_quand`, `_bloc_produit` pur : agrégat §C2 sans rang/num
- bin/dash.py:487-491 — `_etage(agg, rang, n, cle, todo_n)` : place, compte, étage regardé éveillé
- bin/dash.py:494-510 — `_groupes` : cle actif → projets, entreprise dernière ; invalide → slug→[p]
- bin/dash.py:513-535 — `_sous_sol(fermes, etage_de)` : + `produit`
- bin/dash.py:538-572 — `_choisir(projets, groupes, etage, projet)` : 5 étapes §C2
- bin/dash.py:575-690 — `construire_etat(projet, etage)` : mode, metas 1 lecture, todo.etage, selection.projet, produits_erreur
- bin/dash.py:1242-1244 — do_GET lit `etage` + `projet`
- bin/dash.py:1375,1384 — `--etage` ; `--json --projet X` inchangé
## Vérifié comment
python3 -m py_compile bin/dash.py → rc=0
python3 bin/dash.py --json [args] | (len etages, dernier, num, selection, inv) →
  ∅ → 4 seagle 1 {'slug': 'agentx', 'projet': 'agentx-immeuble', 'source': 'epingle', 'refus': ''} True
  --projet orthopro → 4 seagle 1 {'slug': 'kora', 'projet': 'orthopro', 'source': 'requete', 'refus': ''} True
  --etage zz → 4 seagle 1 {'slug': 'agentx', 'projet': 'agentx-immeuble', 'source': 'epingle', 'refus': 'slug inconnu : zz'} True
  --etage orthopro → 4 seagle 1 {'slug': 'kora', 'projet': 'orthopro', 'source': 'requete', 'refus': ''} True
étages → [('kora',4,['dashboard-grille','orthopro']), ('geolens',3,['geolens-charge-3d','geolens-preview-3d','geolens-viewer']), ('agentx',2,['agentx-voix','agentx-entreprise','agentx-serveur','agentx-immeuble']), ('seagle',1,['seagle-pilotage','seagle-site'])]
perf §C7 → froid 235 ms · chaud médiane 93 ms
salle-banc :7826 (vault symlink, sans run/projet, 1 évén. orthopro) curl /state.json? →
  ∅ → {'slug': 'agentx', 'projet': 'agentx-entreprise', 'source': 'activite', 'refus': ''} · voix: ['dictee','ecoute','en_cours','journal','mode','parle'] · evts: [('orthopro','kora')]
  etage=kora → {'slug': 'kora', 'projet': 'dashboard-grille', 'source': 'requete', 'refus': ''}
  etage=kora&projet=dashboard-grille → {'slug': 'kora', 'projet': 'dashboard-grille', 'source': 'requete', 'refus': ''}
  projet=seagle-site → {'slug': 'seagle', 'projet': 'seagle-site', 'source': 'requete', 'refus': ''}
  etage=zz → {…'source': 'activite', 'refus': 'slug inconnu : zz'}
  taches 14 actions[0] ['integrer','virer'] · todo T036: ['T021 prête mais aucun agent lancé — dispatcher', …] · todo sans etage: 0
  sous_sol [('dashboard-direct','kora'), ('2026-10-05-recherche-floue','')]
  POST /api/run board → {"commande": "vx.py board", "code": 0, …} · POST /api/voix/zz → 400 {"erreur": "route inconnue : zz"} · /api/voix/mode sans jeton → 403
  kill → curl → 000
banc secours (copie vault, produits.json absent) → mode projets | produits_erreur 'produits.json absent' · 11 étages produit None, projets=[slug] · ('orthopro',∅) → slug orthopro requete · (∅,'kora') → refus 'slug inconnu : kora' · todo etage==projet True
grep cache/voix/run/T036 → dash.py:358 `cle = (sig, _empreinte_evenements())` · :407 actions · :843 T036 · :1250 voix · :1304 /api/run — inchangés
git diff --stat -- bin/dash.py → 1 file changed, 136 insertions(+), 48 deletions(-)
## Écarts
- lecture hors WL : ∅
- écart au contrat : §C2 étape 4 — `_choisir` relit blocs via `_bloc_projet` (cache, 0 relecture), signature sans blocs
- écart au contrat : mode projets, tous étages dormants → étape 5 `projets[0]` ≠ T019 `etages[0]`
- choix : `projet` invalide + `etage` valide → étage retenu, refus "" (refus = rien résolu)
- choix : `todo[].etage` mode projets = slug projet ; `evenements[].etage` mode projets = "" (produit_de)
## Pour la suite
- étage : `{"slug":"kora","titre":"Kora","statut":"actif","activite":"2026-10-16 00:19","age_j":0.0,"dormant":false,"compteurs":{…},"total":57,"agents":[{"role","tid","projet"}],"todo":18,"alerte":{"niveau":"bloque","texte":"1 bloquée(s)"},"produit":{"cle":"kora","couleur":"#14b8a6","entreprise":false},"projets":[{"slug":"orthopro","titre":"…","statut":"cadrage","activite":"…","encours":0,"revue":0,"bloque":1,"actif":false}],"selectionnable":true,"selection":false,"rang":0,"num":4}`
- étage 0 projet : `activite ""`, `age_j 0.0`, `dormant true` sauf sélectionné, `selectionnable false`
- mode projets : même forme, `produit null`, `projets` = 1 élément
- salle :7777 à relancer (dash.py chargé au démarrage)
- projet d'un produit `archive` sélectionné → `selection.slug` = cle sans étage (cas ∅ aujourd'hui)
## Retour sur le pack
- Manquait: signature `_choisir` sans activité/dormance pour l'étape 4 ; forme étage 0 projet (`activite`, `age_j`) non dite
- Inutile: ∅
