---
pack: T018
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
---

# Pack T018 — Correctifs serveur : virer concurrent, motif échappé, projet par défaut

> Seule source de vérité de l'agent T018. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rendre `tache`/`virer` sûrs en concurrence, échapper le motif dans toute commande à copier, faire choisir à la salle le projet le plus récemment actif — dans `bin/vx.py` et `bin/dash.py`, prouvé sur banc jetable.

## Definition of Done
- [ ] S1 verrou : `flock` exclusif (`fcntl.LOCK_EX`) sur `<proj>/.verrou` autour de lecture-ids → écriture dans `cmd_tache` et de tout `cmd_virer` (relecture du statut incluse) ; `mkdir(parents=True, exist_ok=False)` aux 2 sites
- [ ] S1 banc : `virer A ∥ virer B` (2 process `&`) → 2 remplaçantes d'ids distincts ; `virer A ∥ virer A` → exactement 1 rc 0, l'autre rc ≠ 0 « aucun agent a virer » ; sorties collées
- [ ] S2 `dash.py` `executer` sous un `threading.Lock` module ; S1 rejoué via 2 `curl` parallèles sur `/api/run` d'une salle-banc → mêmes résultats
- [ ] S3 `doctor` : id en double dans un projet → ligne `<slug>/<tid> : id en double (<dossier1>, <dossier2>)`, rc ≠ 0 ; prouvé sur banc avec 2 dossiers T0xx forgés
- [ ] S4 échappement : `shlex.quote(motif)` aux 4 sites (cf. Contrats) ; banc : éval `virer` au motif ``a `touch $B/INJ` $(echo X) "q"`` → commande de `integrer`, de `retenir` (die) et `todo`/`actions` de `python3 bin/dash.py --json` copiée-collée dans `bash -n -c` rc 0 et exécutée via `bash -c` → 0 fichier `INJ`, motif reçu intact par vx (`rejete` + `motif:` lu)
- [ ] S5 `virer` sur tâche sans `context.md` → `die` lisible rc 2, 0 traceback, rien d'écrit
- [ ] S6 `construire_etat` sans épingle : projet non clos dont `journal.md` a le `mtime` le plus récent (absent → 0) ; épingle toujours prioritaire ; banc : 2 projets, toucher le journal de l'un → `state.json.projet.slug` suit
- [ ] `python3 -m py_compile bin/vx.py bin/dash.py` rc 0 ; vrai vault : `./bin/agentx doctor` rc 0
- [ ] `git diff --stat -- bin/` collé ; 0 autre fichier hors `.cache/banc-T018/`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/vx.py` | E | imports `:17-27` · `lister_projets :166` · `cmd_tache :231-245` · `_trouver_tache :266-273` · `cmd_virer :323-375` · retenir die `:400-407` · integrer suite `:518-523` · `cmd_doctor :687-740` |
| `bin/dash.py` | E | imports `:15-28` · `executer :176-185` · `construire_etat :301-316` · actions `:515-524` · todo virer `:574-578` |
| `.cache/banc-T018/` | E | banc jetable |

## Contrats
Défauts verbatim (T016, T012) :
```
D1 · virer T003 ∥ virer T007 → 2 dossiers T014-gamma-encours + T014-zeta-fait ; T003 et T007 ont remplacee_par: T014
     virer T006 ∥ virer T006 → 2 rc 0 ; remplaçantes T012 et T013 ; doctor → vault coherent. rc 0
     bin/vx.py:336-340 id = max+1, mkdir exist_ok=True, 0 verrou · bin/dash.py:176-179 executer sans verrou (ThreadingHTTPServer :1077)
D2 · cmd à copier = --motif "{eval_motif}" sans échappement ; backtick / $( collé dans bash = exécuté
T012 · virer sur un context.md absent → exception non gérée
```
4 sites d'échappement (lignes actuelles) :
```python
# dash.py:524
virer = act("virer", "✕ virer", f'{vx} virer {t} --motif "{motif or "<motif>"}" --projet {slug}', …)
# dash.py:577
f"python3 bin/vx.py virer {t} --motif \"{l['eval_motif']}\" --projet {slug}",
# vx.py:405-406
die(f"{e} conclut virer : python3 bin/vx.py virer {tid} --motif \"{motif}\" " f"--projet {proj.name} (ou --sans-eval)")
# vx.py:523
suite = f"   -> python3 bin/vx.py virer {evalue} --motif \"{motif or '<motif>'}\" --projet {proj.name}"
```
`<motif>` sans motif : garder `"<motif>"` littéral (placeholder lisible).
Code actuel à corriger :
```python
# vx.py:333-340 (cmd_virer)
taches = lister_taches(proj)
nums = [int(x.group(1)) for _, m in taches if (x := re.match(r"T(\d+)", str(m.get("id", ""))))]
n = f"T{max(nums) + 1:03d}"
nd.mkdir(parents=True, exist_ok=True)
# vx.py:346-348 lit d/"context.md" sans test d'existence
# dash.py:305-311
proj = projets[0]
for p in projets:  # on pilote le projet actif, sinon le premier
    bmeta, _ = lire_frontmatter(p / "brief.md")
    if str(bmeta.get("statut", "")).strip() not in ("clos", "archive", ""):
        proj = p; break
# puis EPINGLE (run/projet) relu, prioritaire
```
`virer` lit déjà `meta` avant contrôle de statut : sous verrou, relire `task.md` APRÈS acquisition.

## Décisions actées
- décisions 2026-10-15 « correctifs après vérif T016 » (decisions.md) : shlex.quote · flock `<proj>/.verrou` · Lock executer · doctor registre invalide rc 3 conservé · projet par journal le plus récent
- motif reste nettoyé comme aujourd'hui (`[`→`(`, espaces) ; seul l'affichage/copie change
- stdlib seulement (`fcntl`, `shlex`, `threading`) ; Linux

## Hors périmètre
- `dash/*` (tâche T017 en parallèle) ; `bin/rh.py`, `bin/roles.py`, `bin/terminal.py`
- `/api/term/*`, liste blanche `construire_argv`
- `.verrou` dans `.gitignore` : NE PAS toucher (le chef le fera)

## Environnement
- banc : `B=.cache/banc-T018; rm -rf $B; mkdir -p $B/vault $B/.claude; cp -r bin dash roles.json $B/; cp -r vault/_templates $B/vault/; cp -r .claude/agents $B/.claude/` puis recopier tes `bin/*.py` modifiés dans `$B/bin/` avant chaque essai ; `ROOT` = parent de `bin/` → le banc lit `$B/vault`
- fixtures : `python3 $B/bin/vx.py projet banc --titre Banc` ; `tache "<t>" --projet banc --role implementeur` ; `set Tx --statut en-cours --projet banc` (pack non vide requis pour `pret` : écrire un context.md lintable dans le banc)
- salle-banc : `python3 $B/bin/dash.py --port 7795 --no-open &` ; POST `/api/run` exige header `X-AgentX-Jeton: <state.json.jeton>` + `Content-Type: application/json` ; tuer par pid, `curl` → 000 à la fin ; NE PAS POST `/api/term/*` (socket de la vraie session chef)
- vrai vault : jamais muté (`git status --short vault/` inchangé par toi)
- `garde_bash` refuse tout Bash citant push/migrations ; salle réelle :7777 : ne pas toucher

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (WL + banc), Grep, `Bash(python3:*)`, `Bash(bash -n:*)`, `Bash(bash -c:*)`, `Bash(curl:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/banc-T018)`, `Bash(kill:*)`, `Bash(rg:*)`, `Bash(git diff:*)`, `Bash(git status:*)`, `Bash(./bin/agentx doctor)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 70 lignes, sections exactes :

```markdown
---
tache: T018
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute (S1-S6)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
