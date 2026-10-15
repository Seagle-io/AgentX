---
tache: T022
projet: agentx-entreprise
statut: fait
evalue: T021
verdict: retenir
---
## Verdict
retenir — 11/11 cases DoD T021 prouvées
## DoD
- [x] roles.json 5 entrées scribe→vault, API ok, couleurs ≥ 60 — `script contrat` → `5× contrat True keys True` · `ordre [...'scribe','juriste','tresorier','produit','marketing','rssi','vault']` · `uniques True` · `roles.erreur(), len(affectables())` → `ok 16` · distances → `juriste 70.6 testeur · tresorier 78.5 eclaireur · produit 86.3 chef · marketing 77.8 implementeur · rssi 99.8 verificateur` tous OK
- [x] 5 agents : name/description/tools/model, ossature, corps ≤ 70 — `script frontmatter` → `5× name True tools True model True desc True` · corps `50·51·48·48·49` ; sections rôle·interdits·Langage·Discipline·Règles métier·Méthode·Sortie
- [x] règles métier, `rg -c "jamais"` ≥ 2 — → `juriste:3 produit:5 tresorier:5 marketing:4 rssi:3`
- [x] SKILL.md titre seize + 5 lignes tableau — `rg -n seize` → `SKILL.md:15:## Les seize rôles dont tu disposes` ; diff `+L32-36` 5 lignes rôle·pour·modèle·livre en
- [x] CLAUDE.md 16 rôles, 5 décrits, producteurs, rssi≠securite — `rg` → `CLAUDE.md:74:16 rôles` ; diff L79-85 : 5 décrits, L83 rssi≠securite, L84 producteurs
- [x] terminal.py:43 seul littéral T021, py_compile — `git diff -U0 bin/terminal.py` → 5 hunks ; 4 = T004 (`T004/result.md:15` liste `-25,-27,3,-30,0,-48`) ; 5e `@@ -39 +43 @@` = T021 ; `py_compile rc=0`
- [x] evaluateur.md:3 + dispatch.md:30 producteurs — `rg "testeur, designer, devops"` → `evaluateur.md:3`, `dispatch.md:30` portent les 5
- [x] garde est_role_agentx — → `[True, True, True, True, True, False]`
- [x] doctor rc 0 ; dash 18 rôles — → `vault coherent.` `doctor rc=0` · `18 ['scribe', 'juriste', 'tresorier', 'produit', 'marketing', 'rssi', 'vault']`
- [x] diff --stat E collé ; 0 autre fichier — `git diff --stat` E = `evaluateur 2 · dispatch 2 · SKILL 9 · CLAUDE 12 · terminal 16 · roles.json 5` + 5 `??` agents ; autres M (`bin/dash.py`, `bin/sonnerie.py`, `dash/*`, `vault/*`) = T003/T004/T005/chef
- [x] result.md T021 au format — 5 sections exactes, 52 lignes ≤ 60, statut `revue`
### Règles → agent
| règle | juriste | tresorier | produit | marketing | rssi |
|---|---|---|---|---|---|
| commun livrable vault/artefacts + result.md | :25-26,:51 | :24-25,:52 | :24-25,:49 | :25-26,:49 | :24-25,:50 |
| commun 0 donnée inventée → source | :36 | :35 | :35 | :35 | :36 |
| commun hypothèse `H:` + invalidation | :37 | :36 | :36 | :36 | :36 |
| commun jamais d'action sortante 0 envoi…paiement | :40-41 | :41-42 | :38-39 | :38-39 | :39-40 |
| juriste FR par défaut · Légifrance version · BOFiP · jurisprudence n° | :33 · :34 · :35 · :35 | | | | |
| juriste certain/interprétation/à confirmer · jamais conseil définitif | :38 · :39 | | | | |
| tresorier chiffres fichiers pack · script collé · HT/TTC devise | | :33 · :37 · :38 | | | |
| tresorier jamais banque/virement · prudent défaut | | :40 · :39 | | | |
| produit problème avant solution · spec 5 items · RICE sourcé · jamais code | | | :31 · :32 · :34 · :37 | | |
| marketing ossature · promesse vérifiable · ton marque · jamais faux avis/chiffres/dénigrement | | | | :32 · :33 · :34 · :37 | |
| rssi gouvernance≠securite · risques 5 champs · RGPD/NIS2/ISO article | | | | | :31 · :33 · :34 |
| rssi PSSI/incident/accès/fournisseurs · commande audit · jamais intrusion/système réel · jamais secret | | | | | :35 · :31-32 · :37 · :38 |
- doctrine `rg -i "11 rôles|onze"` 5 fichiers → `rc=1` (∅)
## Motif
∅
## Vérifié comment
`python3 - (frontmatter + contrat roles.json + math.dist)` → sorties ci-dessus
`rg -n "testeur, designer, devops" CLAUDE.md bin/terminal.py .claude/agents/evaluateur.md .claude/commands/dispatch.md .claude/skills/chef-de-projet/SKILL.md` → 5 lignes : `terminal.py:43`, `CLAUDE.md:84`, `evaluateur.md:3`, `dispatch.md:30`, `SKILL.md:223`, toutes `…devops, juriste, tresorier, produit, marketing, rssi`
`python3 -m py_compile bin/terminal.py` → `rc=0`
`git diff -U0 bin/terminal.py` → `@@ -25 +25,2` `@@ -27,3 +28,3` `@@ -30,0 +32,3` `@@ -39 +43` `@@ -48 +52`
`git diff -- roles.json` → `+5` lignes L16-20, 0 `-`
`./bin/agentx doctor` → `vault coherent.` rc=0
## Écarts
- lecture hors WL: `vault/projets/agentx-immeuble/taches/T004-l3-chef-au-toit-et-sonnerie-avec-projet/result.md` (rg terminal) — attribuer 4 hunks terminal.py à T004
- tresorier.md:33-34 ajoute « taux ou prix publics → URL + date » à « chiffres seulement fichiers pack » — cohérent avec règle commun (URL admise) + WebSearch au frontmatter ; non compté affaiblissement
- SKILL.md:223 modifié hors `:15-30` déclaré — requis par case cohérence doctrine
## Pour la suite
- NV : `T004/result.md:14` affirme `contrat.md L160-188 == terminal.py L24-52` verbatim ; T021 a changé `:43` → contrat agentx-immeuble §C6 probablement désaligné, à resynchroniser
- dash.js GLYPHES : objets `avis budget specs contenus risques` → glyphe `resultat` (tâche front)
- packs rôles métier : WL doit porter `vault/artefacts/<projet>/<TID>/` en E (répertoire absent aujourd'hui)
- tresorier : trancher si taux publics web admis (pack T021 « seulement » vs commun « URL »)
## Retour sur le pack
- Manquait: preuve d'attribution des 4 hunks terminal.py à T004 (1 lecture hors WL) ; T021 DoD « 1 hunk » non réécrite pour arbre partagé
- Inutile: `bin/roles.py` en WL — `rg "^def "` suffisait
