# Vault partagé entre Julien et Sylvain

Le vault n'est plus dans git. On le partage par le **dossier d'équipe Nextcloud « AgentX-vault »**
(fichiers.seagle.io, groupe `agentx`), synchronisé par le client de bureau Nextcloud dans `AgentX/vault`
sur chaque machine. Chaque machine **signe** ce qu'elle écrit, et **un projet n'a qu'un porteur à la fois**.

Ce qui est signé :
- `brief.md` → `porteur: julien` (la personne qui tient le projet) ;
- `task.md` → `par: sylvain` (qui a créé la tâche) ;
- `journal.md` → chaque ligne finit par `· @julien` ;
- `agentx board` et `INDEX.md` affichent le porteur et une colonne `PAR` ; la salle affiche `@nom` sur chaque étage et en haut à droite.

Les données d'avant le partage n'ont pas d'auteur : elles s'affichent `—` et ne bloquent rien.

## 1. Avant de connecter (une seule fois par machine)

1. Récupère le code AgentX à jour (`git pull`) : il contient `bin/personne.py`. Si une machine fait tourner l'ancien code, elle ne signe rien et crée encore des fichiers `.verrou` dans le vault.
2. Le compte Nextcloud doit être dans le groupe `agentx` (c'est déjà le cas de `adm-julien` et `Sylvain`).
3. Dans le client Nextcloud : **Paramètres → Général → Modifier les fichiers ignorés**, ajoute ces lignes (celles qui manquent).
   Écris `INDEX.md` **sans** `/` devant : `/INDEX.md` n'est pas appliqué au dossier du vault (constaté le 3 novembre).

```
INDEX.md
*.tmp
.verrou
```

Le vault porte aussi ces règles dans `vault/.sync-exclude.lst` (synchronisé). Dans **Paramètres → Général**, décoche
« Demander confirmation avant de synchroniser les dossiers de plus de 500 Mo » le temps de la première synchro :
sinon `artefacts/` (≈ 700 Mo) reste en attente et ne se synchronise pas.

`INDEX.md` est régénéré par chaque machine (`agentx index`) : s'il était synchronisé, il serait en conflit en permanence. `.verrou` est l'ancien emplacement des verrous : ils sont maintenant dans `run/verrous/`, en local.

## 2. Connecter le dossier d'équipe

Arrête d'abord les écritures dans le vault : pas de chef en train de dispatcher (`agentx chef liste`, `agentx dispatch --etat`).

**Julien** (son vault local est la source de la copie du serveur) :
1. Sauvegarde : `tar -czf ~/vault-avant-synchro.tgz --exclude=node_modules -C ~/Documents/Workspace/AgentX vault`
2. Client Nextcloud → ton compte → **Ajouter une synchronisation de dossier** :
   dossier local `~/Documents/Workspace/AgentX/vault`, dossier distant `AgentX-vault`, tous les sous-dossiers cochés.
3. Attends la fin (icône verte), puis `agentx doctor`. Un fichier modifié des deux côtés depuis la copie du serveur
   revient en « conflicted copy » : voir la section 5.

**Sylvain** (son vault local a divergé depuis le 28 octobre) :
1. Mets ton vault de côté : `mv ~/Documents/AgentX/vault ~/Documents/AgentX/vault.local-sylvain && mkdir ~/Documents/AgentX/vault` (adapte le chemin à ton dépôt).
2. Ajoute la synchronisation de dossier (dossier local = le `vault` vide, dossier distant = `AgentX-vault`) et attends le téléchargement (environ 720 Mo).
3. Compare : `diff -rq vault.local-sylvain vault | grep -v node_modules`.
   Un projet présent seulement chez toi : copie son dossier dans `vault/projets/` (il partira sur le serveur).
   Un projet présent des deux côtés avec des différences : choisissez ensemble la bonne version avant de copier quoi que ce soit.
4. Ensuite seulement, relance tes chefs.

## 3. Régler son identité

```fish
agentx moi              # affiche qui tu es pour AgentX et d'où ça vient
agentx moi sylvain      # la fixe (fichier local ~/.config/agentx/personne, jamais dans le vault)
```

Par défaut, AgentX prend le premier mot de `git config user.name` (`Julien` donne `julien`). La variable
`AGENTX_PERSONNE` l'emporte sur tout (utile pour un test). Ce nom n'a pas besoin d'être celui du compte Nextcloud.

## 4. Porter ses projets

```fish
agentx porteur kora-scale             # « ce projet est à moi »
agentx porteur seagle-bft sylvain     # tu le passes à Sylvain
agentx porteur vieux-projet -         # plus de porteur
agentx board --porteur moi            # mes projets
agentx board --porteur sylvain        # ceux de Sylvain
agentx board --porteur -              # ceux qui n'ont pas encore de porteur
```

Ce que fait le porteur :
- seul le porteur crée des tâches (`tache`, `virer`) et dispatche dans son projet. Depuis l'autre machine,
  ces commandes sont **refusées** avec le nom du porteur. Le chef Claude s'arrête et te le demande ;
- sur la machine qui n'est pas celle du porteur, `doctor`, `ready` et la todo de la salle n'annoncent plus
  « en-cours sans agent » : les agents tournent chez le porteur, et le `run/` local n'en sait rien ;
- chaque changement de porteur est noté au journal (`porteur : julien -> sylvain · @sylvain`).

Pourquoi : deux machines qui créent une tâche dans le même projet à moins d'une minute d'écart
(le temps que la synchro passe) prendraient le même numéro, **T050 deux fois**. Le porteur unique l'évite.
Après un changement de porteur, attends que le `brief.md` soit arrivé sur l'autre machine
(`agentx board --projet <slug>` y affiche le nouveau porteur) avant d'y créer des tâches.

Les projets sans porteur restent libres pour tout le monde. **Revendiquez vite ceux que vous menez.**

### Une tâche lancée reste à celui qui l'a lancée

Même dans un projet sans porteur, une tâche dispatchée n'est reprise par personne d'autre :
- `dispatch` signe le `task.md` : `lance_par: julien` (la personne de la machine qui fait tourner l'agent) ;
- tant que la tâche est `en-cours` ou `bloque`, l'autre machine refuse `dispatch`, `dispatch --relancer`
  et la relance automatique d'`attendre` :
  `T001 en-cours chez julien (vous : sylvain) : dispatch refuse — sa tache, son agent` ;
- chez l'autre, `doctor` et la todo de la salle n'annoncent pas « en-cours sans agent » pour cette tâche ;
- dès que la tâche est rendue (`revue`, `fait`…), elle redevient libre. Une tâche sans `lance_par`
  (lancée avant ce changement, ou par une machine à l'ancien code) reste libre : seul le porteur la protège.

Limite : deux dispatchs de la même tâche `pret` depuis les deux machines avant que la synchro passe (≈ 1 min)
lancent deux agents. Le porteur unique l'évite. `virer` et `retenir` ne regardent que le porteur.

## 5. Conflits

Le client Nextcloud ne fusionne jamais : si un fichier change des deux côtés avant d'être synchronisé, il garde
la version du serveur sous le nom normal et ta version locale sous `nom (conflicted copy AAAA-MM-JJ HHMMSS).md`.

- `agentx board` affiche `! conflits de synchro : N copie(s)` ; `agentx doctor` les liste une par une ; la salle les montre dans la carte « vault ».
- Pour résoudre : compare les deux fichiers, garde la bonne version sous le nom normal, puis **supprime la copie**.
  - `journal.md` : c'est un fichier en ajout seul, il suffit de recopier les lignes qui manquent ;
  - `task.md`, `result.md`, `context.md` : garde le plus avancé (statut, sections remplies) ;
  - `INDEX.md` : ne devrait pas arriver (il est ignoré) ; sinon supprime la copie et lance `agentx index`.
- En cas d'erreur, l'historique de chaque fichier est dans Nextcloud (web → fichier → Versions).

**Même numéro de tâche en double** : `agentx doctor` affiche `id en double (T050-a, T050-b)`. Si l'une des deux
n'est pas encore lancée, renomme son dossier avec le prochain numéro libre, et change à la main `id:` et le titre `# T0xx`
de son `task.md` et `pack:` de son `context.md`. C'est la seule édition manuelle permise ici. Si les deux sont lancées, laisse-les rendre,
puis demande au chef de réparer avant toute intégration.

## 6. Ce qui ne se partage pas

Ces éléments restent locaux à chaque machine :
- `run/` : agents, chefs, événements, verrous. Chacun ne voit dans sa salle que **ses** agents vivants ;
- `produits.json`, `environnement.json`, `supervision.json` et `~/.config/agentx/` (identité, comptes Claude).

## 7. Chemins : le `.env`

Le vault et `produits.json` n'écrivent aucun chemin de machine. Ils écrivent des variables :
- `${WORKSPACE}/Kora/Kora`, `${WORKSPACE}/seagle-website/…` : le dossier qui contient tes dépôts ;
- `${AGENTX}/bin/vx.py` : la racine du dépôt AgentX, trouvée seule (inutile de la fixer).

Chaque machine fixe ses valeurs dans `.env`, à la racine d'AgentX (jamais versionné, jamais dans le vault) :

```fish
cp .env.exemple .env      # puis adapte : WORKSPACE=~/dev, par exemple
```

`agentx` lit `.env` au démarrage et passe les variables aux agents et au chef (Bash les développe ;
le prompt de l'agent donne leur valeur). L'environnement réel l'emporte sur `.env`.
Le lint d'un pack et `agentx doctor` avertissent (`!`) s'ils trouvent un chemin de la machine en dur
(`/home/<toi>/…`, `~/Documents/Workspace/…`) : écris `${WORKSPACE}/…`. Les scripts archivés dans
`vault/artefacts/` (`.mjs`, `.ts`, `.sh`) gardent leurs chemins : ce sont des archives.

**Personne n'est obligé d'avoir les projets de l'autre.** Le vault montre tous les projets, mais chaque machine
ne clone que les dépôts qu'elle mène, et `produits.json` est local (non versionné ; modèle `produits.exemple.json`).
Un dépôt introuvable (jamais cloné, variable non définie) ou un produit absent de ton registre ne bloque rien :
- `doctor` le signale en `!` (une ligne par produit) sans échouer ;
- `board`, `ready`, `index` et la salle l'ignorent (la carte du dépôt passe en `ko`) ;
- `dispatch` refuse seulement les tâches dont le pack touche ce dépôt (« dépôt introuvable sur cette machine ») :
  aucun agent n'est lancé pour rien ;
- `publier` refuse : on ne publie pas un produit dont le dépôt manque.
