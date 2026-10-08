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
- Toute la comptabilité passe par le CLI, jamais par édition à la main des
  frontmatter :

```bash
./bin/agentx board               # tableau de bord
./bin/agentx ready               # tâches dispatchables maintenant
./bin/agentx doctor              # deps fantômes, cycles, incohérences
./bin/agentx integrer --projet X # ce que le chef lit des result.md, rien de plus
./bin/agentx help
```

`bin/agentx` est le point d'entrée unique. Sans argument il **démarre tout** —
index, contrôle de cohérence, salle détachée, navigateur — et rend la main ;
c'est idempotent. `agentx stop` / `agentx statut` pour le reste. Tout autre
argument est aiguillé vers `bin/vx.py`. Fonctionne depuis n'importe où.

- Un hook `PreToolUse` (`bin/garde_dispatch.py`) **refuse tout appel `Agent`** d'un
  rôle AgentX sans tâche vault en `pret`/`en-cours` au pack validé. Pas de tâche,
  pas d'agent : la salle n'affiche que le vault.
- Un hook `PreToolUse` (`bin/garde_bash.py`) **refuse à tout agent** le push git,
  les migrations (TypeORM, Prisma, Alembic), les commandes git destructives et la suppression de volumes Docker (`prune`, `volume rm`, `down -v`) :
  l'humain les lance lui-même, l'agent passe la tâche en `bloque` avec la
  commande exacte.
- La session chef de la salle vit dans un démon détaché (`bin/terminal.py --daemon`) :
  relancer ou arrêter la salle ne la tue pas ; seul ■ arrêter dans la page la ferme.
- Pilotage visuel → `/salle` (page animée sur http://127.0.0.1:7777, lit le
  vault toutes les 2 s). Son état sans navigateur : `./bin/agentx salle --json`.
- La page peut lancer `board`, `ready`, `doctor`, `index`, `pack-lint` et
  `set` — liste blanche stricte côté serveur. **Écrire un pack et dispatcher
  restent ici** : la page propose alors de copier la commande, pas de la lancer.
- `bin/dash.py` et `bin/supervision.py` sont chargés au démarrage du serveur :
  après les avoir modifiés, **relance la salle** — rafraîchir la page ne suffit
  pas. `dash.css` et `dash.js`, eux, sont servis à chaque requête.
- Supervision (prod, dépôts, erreurs, télémétrie, retours) : sources déclarées dans
  `supervision.json` (`"depots": [...]` → branche, fichiers modifiés, avance et
  retard, dernier commit, lus par git). **N'invente jamais de métrique** — sans source, le panneau
  dit « aucune source ». Une sonde au rouge ou une erreur récurrente remonte
  d'elle-même en tête de la todo du chef.

## Commandes

`/projet` cadrer et planifier · `/pack <TID>` rédiger un pack ·
`/dispatch` lancer une vague · `/board` état · `/salle` tableau de bord animé ·
`/clore <projet>` capitaliser.

## Rôles

`eclaireur` (localise, lecture seule) · `architecte` (tranche, produit des
contrats) · `implementeur` (code, périmètre fermé) · `verificateur` (tente de
casser, sans droit d'édition) · `scribe` (capitalise, améliore les packs).

## Règles qui tiennent le système

1. **Un pack = la seule source de vérité d'un exécutant.** S'il doit ouvrir
   autre chose que sa whitelist, le pack est raté — corrige le pack, pas l'agent.
2. **Whitelist ≤ 12 fichiers.** Au-delà, la tâche se découpe. C'est le critère
   de découpe principal.
3. **Les contrats se recopient, ne se référencent pas.** Coller une signature
   dans un pack économise trois lectures de fichier.
4. **Jamais un agent bloqué relancé avec le même pack.** On corrige le pack et on
   crée une tâche neuve.
5. **« non vérifié » vaut « non fait ».** Aucun agent ne déclare un test passant
   sans en avoir collé la sortie.
6. **Une vague = un seul message, N appels `Agent`.** Sinon c'est séquentiel.
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
