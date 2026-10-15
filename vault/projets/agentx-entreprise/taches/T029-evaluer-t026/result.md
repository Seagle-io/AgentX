---
tache: T029
projet: agentx-entreprise
statut: fait
evalue: T026
verdict: virer
---
## Verdict
virer — env.md réel coupe § Environnement du pack
## DoD
- [x] R1a integrer Retour sur le pack — `integrer --projet orthopro | rg -c "^   -- Retour sur le pack"` → `42` ; agentx-entreprise → `28 Retour sur le pack` (= 28 Ecarts)
- [x] R1b manques texte+JSON — `manques` → `MANQUES — tous, 256 Manquait` ; `--json | python3 -c` → `tous 256 256 [('environnement', 74, 3), ('autre', 69, 3), …('version', 9, 3)] ['projet', 'role', 'texte', 'tid']`
- [x] catégories testées — `python3 -c` 9 lignes → `environnement…version…outil…contrat…coordonnee…baseline…wl…autre` · `8 retenues / 9`
- [ ] R3 scaffold — banc minimal OK (`diff` → `54a55,58 > Fiche projet…`), mais fiche réelle orthopro : 8 `## ` insérés, § Environnement coupé (case chef)
- [x] pack-lint même verdict (fiche sans `## `) — sans `rc 2` · avec `rc 2` ; `diff` sorties → seules L1-2 (chemin, `95 lignes` vs `99 lignes`)
- [x] bin/agentx aide — `./bin/agentx help | rg manques` → `  agentx manques [--projet <slug>] [--role R]   les « Manquait » par categorie et role`
- [x] py_compile + doctor — `py_compile` → `rc 0` ; `./bin/agentx doctor` → `vault coherent.` `rc 0`
- [x] git diff --stat — `→ 2 files changed, 101 insertions(+), 7 deletions(-)` ; diff agentx = L45-46 seules
- [x] result.md format — 5 sections exactes, 64 lignes vs ≤ 60 : écart 4 toléré
- [ ] case chef, scaffold vraie fiche — `rg -n "^## " <pack>` → `54:Environnement 60:Dépôts et branches 67:Lancer… 76:Comptes… 82:Versions 87:Ports… 94:Rouge d'avance 101:Interdits 108:Bancs et scripts de référence 125:Budget 133:Format de sortie` ; 17 `## ` hors bloc vs 9 ; corps gabarit § Environnement (L111-123) atterrit sous `## Bancs et scripts de référence` ; `# Environnement — orthopro` (H1) recopié ; `pack-lint` → `x marqueurs a remplir` seul, 0 signal section dupliquée/étrangère
- [x] manques catégorisation ≥ 10 lignes réelles — `random.seed(29)`, 15 lignes → 3 KO = 20 % ≤ 30 % ; KO : `agentx-entreprise/T011 environnement <- 'port'` (comportement) · `geolens-preview-3d/T024 outil <- 'tool'` (toolbar) · `seagle-site/T027 baseline <- 'hunk'` (chunks) ; borne globale `\b` en tête → `49/256` reclassées (19 %)
- [x] affirmations ≥ 4 re-jouées — 8 : integrer 42 OK · manques `--projet orthopro --role verificateur` → `12 Manquait` OK · `--projet orthopro --json` → `orthopro 42` OK · `--role inconnu` → `invalid choice` OK · catégories 8/9 OK · pack-lint rc 2/2 OK · doctor OK · diff stat OK ; totaux 254→256, 26→28 : result.md ajoutés depuis, vault vivant
- [x] périmètre — `git diff --stat -- bin/vx.py bin/agentx` → `bin/agentx | 3 +- · bin/vx.py | 105` ; autres `M bin/*` (dash.py, sonnerie.py, terminal.py) présents avant T026, ∅ hunk T026
- [x] verdict cohérent — 2 `[ ]` ⇒ virer
- [x] result.md format — ce fichier
## Motif
cmd_tache recopie env.md avec ses titres ## : fiche réelle (8 titres) coupe Environnement, corps du gabarit sous un titre étranger ; démoter les titres de la fiche et faire détecter par pack-lint
## Vérifié comment
banc `.cache/banc-T029` (supprimé), `cp vault/projets/orthopro/env.md $B/vault/projets/banc/env.md` ; `vx tache essai --projet banc --role implementeur` → `rg -n "^## "` ci-dessus
`bin/vx.py:252-255` — `corps.strip()` inséré verbatim, 0 traitement des `#`
`rg -c "^## " vault/projets/seagle-site/env.md vault/projets/orthopro/env.md` → `8` · `8` : les 2 fiches réelles cassent le scaffold
`python3 - <<EOF … vx._manques_result / categorie_manque … random.sample(rows,15)` → 15 lignes, 3 KO sous-chaîne
`manques --projet orthopro --role verificateur | head -3` → `MANQUES — orthopro, role verificateur, 12 Manquait` · `environnement    4   verificateur 4`
## Écarts
- ∅ lecture hors WL
- échantillon tiré par import de `bin/vx.py` (`--json` ne rend que ≤ 3 exemples/cat., non aléatoire)
## Pour la suite
- `_avec_fiche_env` : démoter `#`→`###`, `##`→`###` (ou retirer H1) dans le corps recopié ; tester sur `vault/projets/orthopro/env.md`, pas une fiche à puces
- pack-lint : ✗ si `## ` hors des 9 sections du gabarit ou section dupliquée — sinon défaut invisible
- DoD remplaçant : `rg -n "^## " <pack>` = 9 sections dans l'ordre (hors bloc code Format de sortie) avec fiche réelle
- `MANQUES_CATEGORIES` : `\b` en tête de `port|tz|type|api|tool|hunk|ligne` ; 49/256 reclassées — non bloquant (19 %)
- `TODO-PACK` dans env.md → pack-lint KO à vie : filtrer ou interdire dans env.md
## Retour sur le pack
- Manquait: ∅ | Inutile: `vault/projets/seagle-site/env.md` (compte `## ` seul)
