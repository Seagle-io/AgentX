---
tache: T011
projet: agentx-voix
statut: revue
---
## Livré
- bin/voix.py:21 — `import stat`
- bin/voix.py:44-55 — `_lire(p, n)` : régulier seul, n derniers octets
- bin/voix.py:58-72 — `_pid_dictee` : `_lire(32)`, cmdline ∋ `dictee` avant `os.kill`
- bin/voix.py:75-81 — `_etat_dictee` : `_lire(32)`
- bin/voix.py:109-114 — `journal` : 64 Ko de queue, `except Exception` → `[]`
- .cache/voix-T011/robu2.py — copie T010 + 6 cas (dictee vivant, recyclé, fifo, dossier)
- .cache/voix-T011/banc_t002.py — DoD T002 rejouée, :7822
## Vérifié comment
- `python3 -m py_compile bin/voix.py` → `rc=0`
- `grep -n "read_text\|\.read()" bin/voix.py` → ∅ `rc=1` ; seules lectures : `:54 f.readline(n)` `:55 f.read(n)` dans `_lire` (n = 32 / 4096 / 65536)
- `git diff --no-index --stat .cache/voix-T011/voix.avant.py bin/voix.py` → `1 file changed, 23 insertions(+), 5 deletions(-)`
- `bin/dash.py` : md5 `07dd3079…` avant = après ; `git diff --stat -- bin/dash.py` → `21 ++++++++++++++++++++-` (= T008, inchangé)
- `robu2.py banc/bin robu2 <cas>` ×21 (15 T010 + 6), RLIMIT_AS 512 Mo, os.kill instrumenté → `cas: 21 EXC: 0` ; `signaux!=0` ≠ ∅ seul `dictee_off` : `[(1011550, 10)]` (enfant à nous, enregistré non envoyé)
- `journal_zero_lien journal -> len=0 [] 0ms` · `journal_fifo -> len=0 []` · `journal_dir -> len=0 []`
- `pid_moi` / `pid_recycle` (pid vivant, cmdline sans dictee) → `dictee:false`, `ValueError dictee n'est pas lancé`, `os.kill appels: []`
- `dictee_on_nn` → `"dictee": true, "ecoute": true` ; `dictee_etat_zero` → `ecoute:false`, `ValueError état inconnu — relance dictee`
- `robu.py` (T004) → 26 lignes, `grep -c EXC` → `0`
- journal 51793432 o, 20 appels → `mediane 0.760 ms max 0.938 ms len=30 dernier={'t': 'fin', 'texte': 'dernier'}` (avant 846 ms)
- `phrases.py banc/bin` → 5 chaînes exactes du contrat T002
- `banc_t002.py` :
  - `voix {…6 clés…} | cles 6 | journal len 3` (3 + 1 corrompue)
  - `mode on (200, {'ok': True, …'mode': True…}) flag True` · `mode off 200 flag False recu […{'cmd': 'stop'}…]`
  - `sans jeton (403, …)` · `on=oui (400, {'erreur': 'on attendu : true|false'})` · `xyz (400, {'erreur': 'route inconnue : xyz'})`
  - `micro on 200 ecoute True usr1 1 etat on` · `micro on bis 200 usr1 1` · `micro off 200 ecoute False usr1 2 etat off`
  - `stop 200 recu [{'cmd': 'stop'}, …]`
  - `sonnerie ON rc=0 0.038s recu [{'cmd': 'say', 'text': 'Implémenteur : tâche 19 livrée.'}]` · `OFF rc=0 0.037s recu []` · `socket absent rc=0 0.036s`
  - `micro dictee mort (400, {'erreur': "dictee n'est pas lancé"}) | dictee.pid toujours la: 1012953`
  - `port 7822 ferme: URLError`
- banc_panne (`etat` lève RuntimeError) → `voix None | nb cles 22 | erreur None`
- `cmp bin/voix.py banc/bin/voix.py` → identique
## Écarts
- ∅ lecture hors WL
- `py_compile` sur `bin/` réel → `bin/__pycache__` régénéré
- dossiers laissés : `.cache/voix-T011/{banc,banc_panne,v,j50,robu1,robu1b,robu1c,robu2}` (j50 = 50 Mo)
- `ss` hors outils autorisés : port vérifié par curl (`rc=7` avant, `URLError` après)
## Pour la suite
- règle cmdline : le vrai `bin/dictee` doit avoir `dictee` dans `/proc/<pid>/cmdline` — NV sur le démon réel (hors périmètre)
- `robu.py etat_bin` / `robu2 pid_moi` : `dictee` passe true → false (pid du test ≠ dictee), attendu par la règle
- `_lire` : fichier > n → 1re ligne coupée écartée ; pid/etat > 32 o → invalide → None
- TOCTOU stat→open (échange par fifo) non couvert : exige un attaquant qui écrit déjà dans le cache
## Retour sur le pack
- Manquait: `ss` absent des outils autorisés ; robu2 `etat_*` utilisent pid_moi → plus testants après règle cmdline | Inutile: ∅
