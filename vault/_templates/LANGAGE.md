# Langage inter-agents — « dense »

Tout ce qu'un agent écrit pour un autre agent (pack, result.md, decisions.md,
note) est en **dense**. Seul le chef ↔ humain parle français courant.
But : zéro token qui ne change pas une action.

## Règles
1. **Pas de prose.** Lignes `clé: valeur`, listes `- `, tableaux. Jamais de
   paragraphe, de politesse, de récit, de « je pense que ».
2. **Coordonnées, pas contenu.** `chemin:L1-L2 — fait en ≤ 8 mots`.
   Un extrait n'est recopié que s'il est un *contrat* (signature, schéma, format),
   alors en bloc de code, verbatim, intégral.
3. **Un fait = une ligne.** Verbe à l'impératif ou participe. Nombres > adjectifs
   (`3 appels` et non `plusieurs`). Absence explicite : `∅`.
4. **Justification ≤ 8 mots**, après ` — `. Sinon lien `[[note]]` ou `decisions.md#date`.
5. **Vocabulaire fixe** :
   `DoD` definition of done · `WL` whitelist · `E`/`L` écriture/lecture ·
   `OK`/`KO` · `NV` non vérifié · `HP` hors périmètre · `BLQ` bloqué ·
   `→` produit/implique · `≠` écart avec le déclaré · `?` question (une seule).
6. **Plafonds** : pack ≤ 120 lignes · result ≤ 60 (éclaireur ≤ 150) ·
   `## Pour la suite` ≤ 5 lignes · `## Retour sur le pack` ≤ 4 lignes.
7. **Vérification = commande + sortie brute**, jamais une phrase. Si rien lancé : `NV — raison`.
8. **Exception unique** : en `BLQ`, la question est une phrase complète,
   précise, répondable par oui/non ou une valeur.

## Exemple (result d'éclaireur, 9 lignes)
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
