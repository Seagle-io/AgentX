# Decisions — La salle parle et écoute

Une decision = un bloc. Jamais de reecriture, on ajoute.

## 2026-10-15
- périmètre : 🔊 mode vocal + ■ stop, 🎙️ dictée, annonces vocales, voix versionnée — humain, entretien
- méthode : via AgentX (projet vault) — humain, entretien
- 1 interrupteur (flag `claude-voix-on`) = voix du chef + annonces — simplicité, hypothèse au brief
- annonces émises par `sonnerie.py` (hook), pas par la page — 0 doublon d'onglets, marche page fermée
- `bin/voix.py` parle le protocole fichiers/socket, pas la CLI `parle` — T001 ∥ T002
- hooks voix restent globaux, scripts versionnés + symlinks — sinon double voix en session AgentX
- `bin/dictee` versionné aussi — 🎙️ exige `dictee.etat`
- `AGENTX_VOIX_DIR` règle tout l'état voix — tests sans toucher l'humain
