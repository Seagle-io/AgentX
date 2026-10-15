---
pack: T029
projet: seagle-pilotage
role: implementeur
cree: 2026-10-16
---

# Pack T029 — Branche git de travail affichée sur chaque étage (correctif de T027 viré)

> Seule source de vérité de l'agent T029. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Corriger `_branche` dans `bin/dash.py:488-504` (livré par T027, viré) pour qu'aucun `.git/HEAD` hostile ne fasse tomber `state.json` ni n'affiche un libellé faux — reste du livrable T027 conforme, intouché.

## Definition of Done
- [ ] motif du renvoi T027 corrigé : HEAD non UTF-8 (`b'\xff\xfe\x00ref'`) → `_branche` rend `None`, `state.json` garde `immeuble` (sortie `curl` collée : clés + `depots` de l'étage visé `etat "ko"`)
- [ ] `ref: refs/remotes/x` (ref hors `refs/heads/`) → `None` ; jamais `détachée ref: …`
- [ ] sha hex 40 car. → `détachée <sha7>` ; `ref: refs/heads/feat/x` → `feat/x` ; `.git` fichier `gitdir:` → branche lue ; `.git` fichier non UTF-8 → `None` ; HEAD vide → `None`
- [ ] 8 cas ci-dessus en 1 script `.cache/seagle-T029/cas.py` (import par chemin de la copie banc), sortie collée
- [ ] réel inchangé : `python3 bin/dash.py --json` → kora master×2 · geolens master · agentx master · seagle `feat/ascii-nuit-etoilee` `ecart True` (collé)
- [ ] `python3 -m py_compile bin/dash.py` rc 0 ; `python3 -m unittest discover -s tests` → OK ; `git diff --stat -- bin/dash.py` **collé tel quel** (motif T027 : non collé)

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/dash.py` | E | `_branche` :488-504 seulement |
| `.cache/seagle-T029/` | E | banc, script de cas |

## Contrats
Code actuel (`bin/dash.py:488`) :
```python
def _branche(chemin: str) -> str | None:
    """Branche lue dans <chemin>/.git/HEAD (ou `.git` fichier `gitdir: X`) ; None si illisible. 0 sous-processus."""
    try:
        git = Path(chemin) / ".git"
        if git.is_file():
            ref = git.read_text(encoding="utf-8").strip()
            if not ref.startswith("gitdir:"):
                return None
            git = Path(ref[7:].strip())
            if not git.is_absolute():
                git = Path(chemin) / git
        tete = (git / "HEAD").read_text(encoding="utf-8").strip()
    except OSError:
        return None
    if tete.startswith("ref: refs/heads/"):
        return tete[16:]
    return "détachée " + tete[:7] if tete else None
```
Cible : `except (OSError, UnicodeDecodeError)` ; après lecture : `ref: refs/heads/B` → B ; `re.fullmatch(r"[0-9a-f]{40}([0-9a-f]{24})?", tete)` → `"détachée " + tete[:7]` ; sinon → `None`. Signature et docstring inchangées.
Motif de renvoi T027 (verbatim) : `_branche laisse fuir UnicodeDecodeError sur HEAD non UTF-8 (contrat illisible→None), state.json tombe ; ref hors refs/heads affichée 'détachée ref: re' ; git diff --stat non collé`

## Décisions actées
- `None` → `depots[].etat "ko"`, `branche ""`, front affiche `⎇ ?` (déjà livré, ne pas toucher)
- 0 subprocess ; 0 cache

## Hors périmètre
- tout autre code de `bin/dash.py`, `dash/*`, `bin/sonnerie.py`, `bin/voix.py` (modifiés par le chef, pas à toi) ; relancer :7777

## Environnement
- banc : `B=.cache/seagle-T029/banc; rm -rf $B; mkdir -p $B; cp -r bin dash roles.json produits.json $B/; ln -s "$PWD/vault" $B/vault` ; pour le cas `state.json` : `produits.json` du banc avec un `depots[].chemin` vers `.cache/seagle-T029/hostile` (HEAD binaire) puis `python3 $B/bin/dash.py --port 7832 --no-open` ; kill par pid noté (jamais `pkill -f`)
- arbre partagé : `git status` d'AgentX peut bouger pendant ta tâche (chef) — normal
- `garde_bash` refuse push/migrations ; sorties `| tail -n 40`

## Budget
- Lectures hors whitelist : **2 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/seagle-T029/`, `result.md`), `Bash(python3:*)`, `Bash(curl -s:*)`, `Bash(kill:*)`, `Bash(cp:*)`, `Bash(ln:*)`, `Bash(mkdir:*)`, `Bash(rm -rf .cache/seagle-T029/banc)`, `Bash(printf:*)`, `Bash(git diff:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 40 lignes de corps, sections exactes :

```markdown
---
tache: T029
projet: seagle-pilotage
statut: revue | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 3 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```
