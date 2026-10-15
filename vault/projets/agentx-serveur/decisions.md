# Decisions — AgentX sur un serveur distant, un terminal chef par compte

Une decision = un bloc. Jamais de reecriture, on ajoute.

## 2026-10-16 — cadrage (humain)
- **Décision** : à terme AgentX tourne sur un serveur distant ; 1 session chef par compte (Julien, Sylvain), qui partagent le même vault et se coordonnent par lui.
- **Décision** : accès = tunnel SSH + compte GitHub de l'organisation Seagle-io.
- **Décision** : étude maintenant (RSSI : analyse de risques ; architecte : contrat ; devops : déploiement), code après Seagle et la console vocale.

## 2026-10-16 — identité par oauth2-proxy GitHub, isolation par 1 utilisateur Unix par compte (T002)
- **Contexte** : un chef = `claude` avec Bash → qui pilote un chef a un shell sous son uid ; seule frontière fiable = uid noyau.
- **Décision** : oauth2-proxy (`--github-org=Seagle-io`) → dash.py sur socket unix vérifiée par `SO_PEERCRED` ; 1 utilisateur Unix + 1 démon chef systemd par compte ; vault partagé groupe `agentx` ; coordination par `vx.py` sous verrou (`--si`, `chef:`, `conflits_e`). [[contrat]]
- **Écarté** : OAuth codé dans dash.py — sécurité maison sans gain ; identité = utilisateur SSH seul — pas de contrôle continu de l'org (gardé en repli) ; conteneur par compte — coût Docker sans isolation de plus sur le vault ; 1 démon par compte sous le même utilisateur — 0 isolation.
- **Conséquence** : facile — +1 compte = 1 ligne config + provisionnement, coût Claude séparé par uid ; difficile — revenir à 1 utilisateur (chown), changer le port de callback 7777.
- **À revoir si** : github.com indisponible durablement (→ repli identité SSH) ; > 5 comptes ; besoin d'isoler aussi le vault entre comptes.
