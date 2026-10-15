# Decisions — Seagle : piloter Geolens, Kora et l'entreprise depuis l'immeuble

Une decision = un bloc. Jamais de reecriture, on ajoute.

## 2026-10-15 — cadrage (humain)
- **Décision** : AgentX pilote l'entreprise Seagle ; 1 étage = 1 produit (à terme tous les produits) ; étage Seagle (entreprise) permanent : site, marketing, finance, juridique, RSSI ; le projet seagle-site y est absorbé.
- **Décision** : porte de publication = feu vert AVANT push (`agentx publier <produit>`) ; captures refaites par les agents sur une branche du site, l'humain valide et pousse.
- **Conséquence** : le modèle « étage = projet » (agentx-immeuble) devient « étage = produit » ; les projets deviennent le travail en cours d'un étage.

## 2026-10-16 — étage = produit : `produit:` dans brief.md, étage agrège, porte publier en lecture git
- **Contexte** : chemins `vault/projets/<slug>/` figés (hooks, sonnerie, packs) ; projets créés par CLI → rattachement porté par le projet.
- **Décision** : registre `produits.json` (`bin/produits.py`, sans liste de projets) ; `produit: <cle>` dans brief.md via `agentx projet --produit` / `rattacher` ; étage = agrégat en mémoire des blocs projet en cache ; ordre des étages = ordre du registre, entreprise au rez-de-chaussée ; `agentx publier` = 5 contrôles git/fichiers en lecture, ids d'écart stables, acquits append-only, `--taches` pré-remplit sans valider le pack ; captures sur `git worktree` branche `captures/<cle>-<date>` créée par l'agent. Détail : [[contrat]].
- **Écarté** : `projets[]` dans produits.json (2 sources, dérive au 1er projet oublié) ; dossiers `vault/produits/<p>/projets/` (réécrit tous les chemins) ; 1 projet permanent par produit (TID en collision) ; étage = projet colorié (contredit le cadrage).
- **Conséquence** : ajouter un produit = 1 entrée JSON ; projet sans produit → étage entreprise + alerte doctor ; registre invalide → immeuble T019 par projet (mode dégradé) ; P3 juge les sujets de commit, pas le texte du site.
- **À revoir si** : l'humain publie Kora depuis `Ultime` (≠ `master`) ; le site Seagle doit présenter Geolens ; un projet sert 2 produits ; > 12 produits actifs (tour compressée) ; `garde_bash` refuse `git worktree add`.

## 2026-10-16 — après éval T013 et T012
- **Décision** : §C5 amendé — un contrôle en `erreur` impose NO-GO (sinon un acquit de `site-branche` masque P4) ; P3 sans troncature silencieuse (pagination ou titre « ≥ N, fenêtre jusqu'au <date> ») ; P2 : titre selon la référence vide (pages ou captures).
- **Décision** : `RE_FEAT` élargi à `ajoute|ajout` (sujets réels du site) — non bloquant.
- **Différé** : quoter les 6 `titre:` déjà non quotés des briefs et les 215 lignes `: ` du vault — tâche de normalisation à part (todo).

## 2026-10-16 — points §C2 relevés par T024 (chef)
- `projet` invalide + `etage` valide → étage retenu, `refus ""` : acté (choix T021) ; le front garde le hash
- mode projets, tous dormants : étape 5 `lister_projets()[0]` peut tomber sur un clos ; viser `etages[0]` (T019) — correctif dash.py différé, repli seulement
- `_choisir.cle_de` relit le brief d'un projet clos (≠ « 0 lecture de plus ») : perf mesurée 80 ms chaud, dans le budget ; correctif différé
