---
name: langage-dense
description: Langage inter-agents « dense » AgentX (0 prose, lignes-faits, coordonnées, abréviations, plafonds). Charger avant d'écrire un pack, un result.md, un prompt de dispatch, une note ou une entrée decisions.md.
---
# Langage dense

Tout écrit agent → agent (pack, result.md, decisions.md, note, prompt de dispatch) = dense. Seul chef ↔ humain = français courant. But : 0 token qui ne change pas une action. [[LANGAGE]]

## Règles
1. Pas de prose : lignes `clé: valeur`, listes `- `, tableaux. Jamais paragraphe, politesse, récit, « je pense que ». [[LANGAGE]]
2. Coordonnées, pas contenu : `chemin:L1-L2 — fait ≤ 8 mots`. [[LANGAGE]]
3. Extrait recopié seulement si contrat (signature, schéma, format) → bloc de code, verbatim, intégral. [[LANGAGE]]
4. Un fait = une ligne ; verbe à l'impératif ou participe. [[LANGAGE]]
5. Nombres > adjectifs (`3 appels`, pas `plusieurs`). [[LANGAGE]]
6. Absence explicite : `∅`. [[LANGAGE]]
7. Justification ≤ 8 mots après ` — `, sinon lien `[[note]]` ou `decisions.md#date`. [[LANGAGE]]
8. Vérification = commande + sortie brute, jamais une phrase : `commande → sortie`. [[LANGAGE]]
9. Rien lancé : `NV — raison`. [[LANGAGE]]
10. Exception unique : en BLQ, la question = phrase complète, précise, répondable par oui/non ou une valeur. [[LANGAGE]]

## Vocabulaire fixe
| Abr. | Sens |
|---|---|
| DoD | definition of done |
| WL | whitelist |
| E / L | écriture / lecture |
| OK / KO | réussi / échoué |
| NV | non vérifié |
| HP | hors périmètre |
| BLQ | bloqué |
| → | produit / implique |
| ≠ | écart avec le déclaré |
| ? | question (une seule) |
[[LANGAGE]]

## Plafonds
- pack ≤ 120 lignes
- result ≤ 60 lignes (éclaireur ≤ 150)
- `## Pour la suite` ≤ 5 lignes
- `## Retour sur le pack` ≤ 4 lignes
[[LANGAGE]]

## Exemple (result d'éclaireur)
```
## Livré
- auth/session.ts:40-78 — getValidToken, refresh inline, pas de dédup
- auth/client.ts:88 — postRefresh(refresh:string):Promise<TokenPair> — 0 retry
- tests: ∅ sur auth/ (rg "session" tests/ → 0)
- piège: auth/legacy.ts duplique TokenPair:12 (type divergent, exp en ms)
## Vérifié comment
rg -n "postRefresh" src/ → 3 hits (client.ts:88, session.ts:52, legacy.ts:140)
## Pour la suite
- dédup à écrire dans session.ts:40-78 ; contrat postRefresh ci-dessus, recopier
- HP: legacy.ts — type divergent, ne pas aligner
```
