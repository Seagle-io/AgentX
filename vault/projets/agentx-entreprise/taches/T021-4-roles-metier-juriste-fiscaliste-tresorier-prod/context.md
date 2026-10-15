---
pack: T021
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
---

# Pack T021 — 5 rôles métier : juriste-fiscaliste, trésorier, produit, marketing, RSSI

> Seule source de vérité de l'agent T021. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Ajouter 5 rôles affectables à l'entreprise AgentX — `juriste`, `tresorier`, `produit`, `marketing`, `rssi` — : entrées `roles.json`, 5 agents `.claude/agents/<cle>.md`, et listes de rôles à jour dans la doctrine (SKILL.md, CLAUDE.md, consigne chef, évaluateur, dispatch).

## Definition of Done
- [ ] `roles.json` : 5 entrées insérées après `scribe`, avant `vault` (cf. Contrats) ; `python3 -c "import sys;sys.path.insert(0,'bin');import roles;print(roles.erreur() or 'ok', len(roles.affectables()) if hasattr(roles,'affectables') else '')"` → `ok` (adapter au nom réel de l'API lu dans `bin/roles.py`) ; couleurs uniques, distance RGB euclidienne ≥ 60 avec chaque couleur existante (script collé)
- [ ] 5 fichiers `.claude/agents/{juriste,tresorier,produit,marketing,rssi}.md` : frontmatter `name`, `description` (quand l'utiliser), `tools`, `model` (cf. Contrats) ; corps = même ossature que `.claude/agents/evaluateur.md` (rôle · interdits · Langage dense · Discipline de contexte · Méthode · Sortie), ≤ 70 lignes de corps chacun
- [ ] règles métier par agent (cf. Contrats « Règles ») présentes, vérifiables par `rg` : `rg -c "jamais" .claude/agents/{juriste,tresorier,produit,marketing,rssi}.md` → ≥ 2 chacun
- [ ] `SKILL.md` : titre « Les seize rôles dont tu disposes » ; 5 lignes ajoutées au tableau (rôle · pour · modèle · livre en)
- [ ] `CLAUDE.md` § Rôles : « 16 rôles » + 5 rôles décrits ; ligne Producteurs complétée (`juriste, tresorier, produit, marketing, rssi`) ; `rssi` ≠ `securite` dit en 1 ligne
- [ ] `bin/terminal.py:43` : liste des producteurs complétée ; seul ce littéral change (`git diff -U0 bin/terminal.py` → 1 hunk) ; `python3 -m py_compile bin/terminal.py` rc 0
- [ ] `.claude/agents/evaluateur.md` description + `.claude/commands/dispatch.md:30` : liste des producteurs complétée
- [ ] garde : `python3 -c "import sys;sys.path.insert(0,'bin');import roles;print([roles.est_role_agentx(r) for r in ['juriste','tresorier','produit','marketing','rssi','inconnu']])"` → `[True, True, True, True, True, False]`
- [ ] `./bin/agentx doctor` rc 0 ; `python3 bin/dash.py --json | python3 -c "import json,sys;s=json.load(sys.stdin);print(len(s['roles']),[r['cle'] for r in s['roles']][-7:])"` → 18 rôles, les 5 nouveaux présents
- [ ] `git diff --stat` des fichiers E collé ; 0 autre fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `roles.json` | E | registre unique |
| `bin/roles.py` | L | validation (MODELES, RE_CLE, RE_COULEUR, bornes), API |
| `.claude/agents/juriste.md` | E | neuf |
| `.claude/agents/tresorier.md` | E | neuf |
| `.claude/agents/produit.md` | E | neuf |
| `.claude/agents/marketing.md` | E | neuf |
| `.claude/agents/rssi.md` | E | neuf |
| `.claude/skills/chef-de-projet/SKILL.md` | E | tableau rôles `:15-30` |
| `CLAUDE.md` | E | § Rôles `:72-81` |
| `bin/terminal.py` | E | `:43` seulement |
| `.claude/agents/evaluateur.md` | E | description `:3` seulement ; L : ossature de référence des agents |
| `.claude/commands/dispatch.md` | E | `:30` seulement |

## Contrats
Entrées `roles.json` (couleur : choisis, contrainte DoD) :
```
{"cle": "juriste",   "nom": "JURISTE",   "sous": "droit, contrats, fiscalité",   "livrable": "avis",       "couleur": "#……", "modele": "opus",   "affectable": true, "livre_en": "revue", "juge": false, "objet": "avis"},
{"cle": "tresorier", "nom": "TRÉSORIER", "sous": "budget, trésorerie, coûts",    "livrable": "budget",     "couleur": "#……", "modele": "opus",   "affectable": true, "livre_en": "revue", "juge": false, "objet": "budget"},
{"cle": "produit",   "nom": "PRODUIT",   "sous": "besoin, specs, priorités",     "livrable": "specs",      "couleur": "#……", "modele": "opus",   "affectable": true, "livre_en": "revue", "juge": false, "objet": "specs"},
{"cle": "marketing", "nom": "MARKETING", "sous": "positionnement, messages",     "livrable": "contenus",   "couleur": "#……", "modele": "sonnet", "affectable": true, "livre_en": "revue", "juge": false, "objet": "contenus"},
{"cle": "rssi",      "nom": "RSSI",      "sous": "risques, politique, conformité", "livrable": "analyse",  "couleur": "#……", "modele": "opus",   "affectable": true, "livre_en": "revue", "juge": false, "objet": "risques"}
```
`objet` inconnu de `GLYPHES` (dash.js) → glyphe `resultat` : accepté (glyphes = tâche front ultérieure).
Frontmatter agents :
```
juriste   tools: Read, Grep, Glob, Write, WebSearch, WebFetch          model: opus
tresorier tools: Read, Grep, Glob, Write, Bash, WebSearch, WebFetch    model: opus
produit   tools: Read, Grep, Glob, Write, WebSearch, WebFetch          model: opus
marketing tools: Read, Grep, Glob, Write, WebSearch, WebFetch          model: sonnet
rssi      tools: Read, Grep, Glob, Write, WebSearch, WebFetch          model: opus
```
Règles (à écrire dans chaque agent, dense) :
```
commun    livrable = markdown dans vault/artefacts/<projet>/<TID>/ (chemin donné par le pack) + result.md ; 0 donnée inventée : chaque chiffre, fait, citation → source (chemin:L ou URL + date de consultation) ; hypothèse = marquée « H: » avec ce qui l'invaliderait
commun    jamais d'action sortante : 0 envoi (mail, formulaire), 0 publication, 0 dépôt, 0 signature, 0 paiement — brouillons seulement, l'humain envoie
juriste   droit français par défaut (sinon juridiction du pack) ; sources primaires : Légifrance (article + version en vigueur à la date), BOFiP pour la fiscalité, jurisprudence citée par n° ; distinguer « certain (texte) » / « interprétation » / « à confirmer par un avocat ou expert-comptable » ; jamais de conseil présenté comme définitif sur un enjeu engageant (contentieux, montage fiscal)
tresorier chiffres seulement depuis les fichiers du pack (exports, factures, relevés) ; tout calcul = script python3 collé + sortie ; montants HT/TTC et devise explicites ; jamais d'accès bancaire, jamais de virement ; scénario prudent par défaut
produit   problème utilisateur avant solution ; spec = contexte · utilisateurs · critères d'acceptation vérifiables · hors périmètre · métrique de succès ; priorisation chiffrée (RICE ou équivalent, entrées sourcées) ; jamais de code
marketing positionnement · cible · messages · preuves ; toute promesse produit = vérifiable dans les sources du pack ; ton de la marque si fourni ; jamais de faux avis, faux chiffres, ni dénigrement nommé de concurrent
rssi      gouvernance, pas audit de code (= `securite`) : analyse de risques (actif · menace · vraisemblance · impact · mesure), PSSI, conformité (RGPD, NIS2, ISO 27001 — exigence citée par article/clause), plan de réponse à incident, revue des accès et des fournisseurs ; peut commander un audit `securite` via `## Pour la suite` ; jamais de test d'intrusion ni d'accès à un système réel ; jamais un secret recopié (type + chemin:L seulement)
```
Liste producteurs cible (terminal.py:43, CLAUDE.md:80, evaluateur.md:3, dispatch.md:30) :
```
implementeur, testeur, designer, devops, juriste, tresorier, produit, marketing, rssi
```

## Décisions actées
- 1 rôle `juriste` couvre droit + fiscalité (demande humaine « juriste/fiscaliste »)
- `rssi` (gouvernance, risques, conformité) distinct de `securite` (audit technique d'un périmètre de code) — demande humaine « 1 RSSI »
- les 4 livrent en `revue` → jugés par `evaluateur` comme tout producteur
- pas de nouveaux skills installés dans cette tâche

## Hors périmètre
- `dash/*` (T005 en cours : glyphes, deck) ; `bin/dash.py`, `bin/vx.py`, `bin/roles.py`
- autres agents `.claude/agents/*` que evaluateur.md (description seule)

## Environnement
- `garde_bash` refuse tout Bash dont le texte cite push/migrations : écrire avec Write/Edit, jamais heredoc
- nouveaux agents visibles par Claude Code seulement après redémarrage de session
- arbre partagé : `dash/*` écrit par T005 en parallèle ; `bin/dash.py` évalué par T007

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, Grep, `Bash(python3:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(./bin/agentx doctor)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T021
projet: agentx-entreprise
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
