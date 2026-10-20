# AgentX — système de travail multi-agent à vault

Ce dépôt **est** le système : un vault en markdown (source de vérité), un CLI
déterministe qui en fait la comptabilité, et des agents qui ne lisent que ce
qu'on leur donne.

## Le principe, en une phrase

Un chef de projet lit large et **fait lire étroit** : il écrit un *context pack*
par tâche — le contexte minimum suffisant — et les agents exécutants ne lisent
que ça.

## Réflexes

- Travail qui demande plus d'un agent, ou qui touche plus de 3 fichiers
  → charge la compétence **`chef-de-projet`** (ou lance `/projet`).
- Besoin de l'état du vault → `/board`. **Jamais** de `Glob` sur `vault/` :
  le CLI existe pour ça.
- Ne jamais passer une tâche en-cours à la main : `./bin/agentx dispatch` le fait.
- Retouche (≤ 3 fichiers, ≤ 30 lignes) → `tache --retouche`, 0 enfant, `retenir` sur preuves collées (`pack-retouche`).
- Session chef courte : 1 par vague ou projet ; > ~150k de contexte ou pause > 1 h →
  passation (`todo.md` + `journal.md`), « `/clear` puis `/board` », reprise par `agentx board`.
- Passation auto (`vx passation --projet X [--note N]`, ON par défaut, garde 200k) : **1 seule**
  injection `/clear` puis `/board` dans le terminal du chef, verrou `injection.lock` 60 s ;
  0 autre écriture dans le terminal du chef, jamais de message dans le chat de l'humain.
- `dispatch` lance l'attente de fond (`run/attentes/`, ligne « réveil chef ») : le chef enchaîne
  au réveil, il n'attend pas à la main. Agent mort : relancé 1× par `attendre` (`--sans-relance` refuse).
- BLQ à question fermée (diff dans l'arbre, pack inchangé, réponse ≤ 5 lignes, < 5 min) :
  `vx repondre` puis `dispatch --relancer` (exception à la règle 4) ; sinon `virer`.
- Multi-chefs : `./bin/agentx chef liste|ouvrir <etage>.. [--cle K] [--compte C]|arreter <cle>|reaffecter <etage> <cle|defaut>|comptes` ;
  ≤ 3 chefs, 1 chef par étage, démons détachés. Refus : `plafond` · `etage-tenu` · `cle-prise` · `cle-invalide` · `etage-inconnu` · `chef-inconnu`.
- Comptes Claude : un agent neuf part sous le compte du chef qui tient l'étage (`CLAUDE_CONFIG_DIR` via
  `agents.env_par_compte`, fiche `compte`) ; agent repris = compte de sa fiche ; sans chef dédié ⇒ `defaut`.
  Comptes = dossiers `~/.config/agentx/comptes/<nom>` (`AGENTX_COMPTES_DIR`), `defaut` = `~/.claude` ; login mené par l'humain
  (`claude auth login`), le serveur ne le lance jamais. Refus : `compte-invalide` · `compte-inconnu` · `compte-deconnecte` · `compte-fige` · `chef-mort`.
- Dispatch depuis une session chef (`AGENTX_CHEF`) d'un étage tenu par un autre chef ⇒ refus
  (« projet <slug> tenu par le chef <cle> : dispatch refusé depuis le chef <appelant> »). `state.json` : `immeuble.chefs`, `chefs_max`, `comptes`.
- Modèle et effort par tâche (`--modele`/`--effort`, défauts par rôle dans la compétence
  `chef-de-projet`), passés à l'appel `Agent` (`model`, `effort`) — instruction explicite de régler `effort`.
- Toute la comptabilité passe par le CLI, jamais par édition à la main des
  frontmatter :

```bash
./bin/agentx board               # tableau de bord
./bin/agentx tache "<titre>" --projet X --role R --pack - [--dispatch]  # création + pack (stdin) + lint en 1 appel
./bin/agentx attendre T1 T2 --projet X [--tout] [--integrer [--appliquer]] [--build] [--suite] [--sans-relance]  # bloque jusqu'au result.md (0 rendu, 1 mort, 3 délai) ; rc 4 = jamais lancé
./bin/agentx repondre T009 --projet X --texte "<≤ 5 lignes>"  # réponse à un BLQ, puis dispatch --relancer T009
./bin/agentx passation --projet X [--note N]            # todo + journal, reprise par /clear puis /board
./bin/agentx commit-vague --projet X [--depuis SHA] [--depot D]  # affiche le commit proposé, n'exécute jamais
./bin/agentx renoncer T1 --projet X --raison "<…>" [--verif] [--critique]  # contrôle renoncé ≠ enfant abandonné
./bin/agentx a-clore [--json]    # projets prêts à clore
./bin/agentx manques --projet X [--role R] [--json]  # « Manquait » des result.md par catégorie
./bin/agentx ready               # tâches dispatchables maintenant
./bin/agentx doctor              # deps fantômes, cycles, incohérences
./bin/agentx integrer --projet X [--court]  # ce que le chef lit des result.md, rien de plus
./bin/agentx virer T009 --motif "<1 ligne>" --projet X  # rejette, crée la remplaçante
./bin/agentx retenir T009 --projet X                    # revue → fait (aussi en-cours si result.md revue|fait)
./bin/agentx personnel           # taux de renvoi par rôle
./bin/agentx chef liste [--json]  # chefs : clé, état, étages, pid, compte ; n/3 vivants
./bin/agentx chef ouvrir <etage>.. [--cle K] [--compte C]  # chef dédié sur ces étages
./bin/agentx chef reaffecter <etage> <cle|defaut>  # change le chef d'un étage (chef vivant)
./bin/agentx help
```

`bin/agentx` est le point d'entrée unique. Sans argument il **démarre tout** —
index, contrôle de cohérence, salle détachée, navigateur — et rend la main ;
c'est idempotent. `agentx stop` / `agentx statut` pour le reste. Tout autre
argument est aiguillé vers `bin/vx.py`. Fonctionne depuis n'importe où.

- Services partagés d'une vague (banc, back) : `./bin/agentx env up|down|statut <svc>`,
  déclarés dans `environnement.json` (local, non versionné ; modèle
  `environnement.exemple.json`, chemins via `{racine}`). Le chef les démarre ; l'agent n'en lance aucun
  (`garde_bash` refuse les serveurs de dev). Pack : `- service: <nom> → <url>`.
  `agentx` sans argument ne démarre pas l'env.
- Vérification et critique visuelle : skill **`outils-test`** (`outils-test/` : banc
  d'impression, mesures, fixtures) — on n'écrit pas un banc, on s'en sert.
- Un hook `PreToolUse` (`bin/garde_dispatch.py`) **refuse tout appel `Agent`** d'un
  rôle AgentX : ils tournent détachés (`./bin/agentx dispatch`), et refuse le
  dispatch d'une tâche sans pack validé en `pret`/`en-cours`. Pas de tâche,
  pas d'agent : la salle n'affiche que le vault. Rôles non-AgentX : `Agent` inchangé.
- Agent mort sans result ⇒ `dispatch <TID>` relance, même en vague active.
- Dispatch : `./bin/agentx dispatch <TID>|--vague T1 T2 …|--etat|--relancer <TID> --projet X`
  (`--relancer` : respawn, et si la session revient sans rien faire, arrêt + fiche effacée + relance neuve)
  lance les agents détachés (`claude --bg`), écrit une fiche `run/agents/` par agent et
  passe la tâche `en-cours`. `claude --bg`/`-p` hors `dispatch` : refusés par `garde_bash`.
- Un hook `PreToolUse` (`bin/garde_bash.py`) **refuse à tout agent** le push git,
  les migrations (TypeORM, Prisma, Alembic), les commandes git destructives et la suppression de volumes Docker (`prune`, `volume rm`, `down -v`) :
  l'humain les lance lui-même, l'agent passe la tâche en `bloque` avec la
  commande exacte.
- `garde_vault.py` refuse aux rôles AgentX `Write` sur un fichier existant (Edit seul) et pose un verrou
  court (10 s) par fichier ; `verrou.py` le libère en `PostToolUse` ; 2 agents sur un même fichier ⇒ le 2e réessaie.
- Les hooks `SubagentStop` **et** `Stop` (`bin/sonnerie.py`) notent dans `run/evenements.jsonl`
  qu'un agent de rôle AgentX a rendu (rôle, TID et statut lus dans le
  frontmatter de son `result.md`). La salle le lit et **sonne** : deux notes
  montantes pour un livrable, descendantes pour un `bloque`. Cloche en haut à
  droite de l'horloge pour couper le son ; les annonces restent visibles.
- Voix (`bin/voix.py`, état dans `AGENTX_VOIX_DIR`, défaut `~/.cache`) : `state.json` porte `voix` ;
  la page bascule le mode vocal, coupe la parole et la dictée par `POST /api/voix/{mode,stop,micro}`
  (hôte local + jeton). Mode vocal ON ⇒ `sonnerie.py` fait aussi annoncer par `parle` chaque agent
  qui rend. Démons `bin/parle` (Piper) et `bin/dictee` (Whisper) ; hooks voix globaux (`bin/parle_hook.py`).
- La session chef de la salle vit dans un démon détaché (`bin/terminal.py --daemon`) :
  relancer ou arrêter la salle ne la tue pas ; seul ■ arrêter dans la page la ferme.
- Pilotage visuel → `/salle` (page animée sur http://127.0.0.1:7777, lit le
  vault toutes les 2 s). Son état sans navigateur : `./bin/agentx salle --json`.
  La salle est un **immeuble** : un étage par projet ouvert, chef au dernier étage,
  projets clos au sous-sol ; la todo agrège tous les étages.
- La page peut lancer `board`, `ready`, `doctor`, `index`, `personnel`, `integrer`,
  `set`, `virer` et `retenir` — liste blanche stricte côté serveur. **Écrire un pack et dispatcher
  restent ici** : la page propose alors de copier la commande, pas de la lancer.
- `bin/dash.py` et `bin/supervision.py` sont chargés au démarrage du serveur :
  après les avoir modifiés, **relance la salle** — rafraîchir la page ne suffit
  pas. Le front v2 (`apps/web/dist`) est servi tel quel ; `npm run build` suffit à le rafraîchir.
- Supervision (prod, dépôts, erreurs, télémétrie, retours) : sources déclarées dans
  `supervision.json` (`"depots": [...]` → branche, fichiers modifiés, avance et
  retard, dernier commit, lus par git). **N'invente jamais de métrique** — sans source, le panneau
  dit « aucune source ». Une sonde au rouge ou une erreur récurrente remonte
  d'elle-même en tête de la todo du chef.
- Question à l'humain : `- [ ] ? <question>` dans `vault/projets/<slug>/todo.md` ⇒ étiquette
  `VOTRE CHOIX` en tête de la todo + panneau « Vos choix » sur la page de l'étage. Réponse ⇒
  `decisions.md`, ligne cochée.

## Commandes

`/projet` cadrer et planifier · `/pack <TID>` rédiger un pack ·
`/dispatch` lancer une vague · `/board` état · `/salle` tableau de bord animé ·
`/clore <projet>` capitaliser · `/rh` bilan du personnel (renvois, verdicts) ·
`/syndicat [projet]` conditions de travail des agents (revendications chiffrées).

## Rôles

17+1 rôles, registre unique `roles.json` : `eclaireur` (localise, lecture seule) ·
`architecte` (en tête : vérifie arborescence et structure, tranche, produit
des contrats) · `designer` (maquette, UI) ·
`implementeur` (code, périmètre fermé) · `testeur` (écrit et lance les tests) ·
`devops` (build, env, déploiement) · `verificateur` (tente de casser, sans droit
d'édition) · `critique` (juge le visuel seul, après chaque modification front) ·
`relecteur` (relit le diff) · `securite` (audite failles, secrets) ·
`evaluateur` (juge la DoD : retenir ou virer) · `scribe` (capitalise, améliore les packs) ·
`juriste` (droit, contrats, fiscalité) · `tresorier` (budget, trésorerie, coûts) ·
`produit` (besoin, specs, priorités) · `marketing` (positionnement, messages) ·
`rssi` (risques, politique, conformité) · `syndicat` (conditions de travail des agents).
`rssi` gouverne le risque et la conformité ; `securite` audite le code d'un périmètre.
`syndicat` chiffre packs, budgets, WL, blocages, renvois et propose des revendications
(≠ `scribe` qui capitalise le savoir, ≠ `evaluateur` qui juge un livrable) ; il propose, n'édite ni pack ni gabarit.
Producteurs (implementeur, testeur, designer, devops, juriste, tresorier, produit, marketing, rssi)
livrent en `revue` ; seul `retenir` → `fait`.

## Règles qui tiennent le système

1. **Un pack = la seule source de vérité d'un exécutant.** S'il doit ouvrir
   autre chose que sa whitelist, le pack est raté — corrige le pack, pas l'agent.
2. **Whitelist ≤ 12 fichiers.** Au-delà, la tâche se découpe. C'est le critère
   de découpe principal.
3. **Les contrats se recopient, ne se référencent pas.** Coller une signature
   dans un pack économise trois lectures de fichier.
4. **Jamais un agent bloqué relancé avec le même pack.** On corrige le pack et on
   crée une tâche neuve. Mécanisé : `virer` crée la remplaçante, lint bloque tant
   que le pack n'est pas corrigé. Reprendre une tâche (DÉFAUTS, BLQ, pack amendé)
   = `virer` puis remplaçante ; jamais relancer ni re-messager un agent avec un
   pack modifié en place.
5. **« non vérifié » vaut « non fait ».** Aucun agent ne déclare un test passant
   sans en avoir collé la sortie.
6. **Une vague = une commande `dispatch --vague`.** Sinon c'est séquentiel.
7. **`decisions.md` et `result.md` sont append-only.** On supersède, on ne
   réécrit pas.
8. **Chaque `result.md` note ce qui manquait dans son pack.** Le `scribe` agrège,
   les gabarits s'améliorent. C'est la seule boucle d'apprentissage du système.
9. **Entre agents, langage dense** (`vault/_templates/LANGAGE.md`) : lignes-faits,
   coordonnées, contrats verbatim, 0 prose. Le français courant est réservé au
   dialogue chef ↔ humain.
10. **Le vault est un vault Obsidian.** Markdown + frontmatter YAML, liens en
    `[[wikilink]]`, `tags:` en frontmatter, pas de HTML. Chaque fichier va à
    l'essentiel : pas de commentaire-gabarit survivant, pas de section vide,
    pas de récit. Ce qui n'aide pas un futur pack n'y entre pas.
