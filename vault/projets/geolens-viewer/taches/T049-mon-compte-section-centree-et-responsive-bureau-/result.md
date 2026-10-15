---
tache: T049
statut: fait
---
## Livré
- G/web/src/pages/Account.tsx:37-60 — contenu enveloppé `.gl-account-page`, carte `gl-account-card`
- G/web/src/pages/Account.tsx:43 — style inline carte supprimé, 0 logique touchée
- G/web/src/theme.css:624-632 — bloc Contrat + `.gl-sub` overflow-wrap anywhere
- AgentX/.cache/shot-account.mjs:7-24 — 4 largeurs, mesure bouton + padding carte
- AgentX/.cache/shots-T049/account-{1440,768,390,360}.png — captures pleine page

## Vérifié comment
`node .cache/shot-account.mjs .cache/shots-T049` →
```
1440 {"docW":1440,"winW":1440,"card":{"left":460,"right":980,"width":520},"cardPad":"24px","h1":{"left":460,"width":520},"btn":{"width":134}}
768 {"docW":768,"winW":768,"card":{"left":124,"right":644,"width":520},"cardPad":"24px","h1":{"left":124,"width":520},"btn":{"width":134}}
390 {"docW":390,"winW":390,"card":{"left":12,"right":378,"width":366},"cardPad":"18px","h1":{"left":12,"width":366},"btn":{"width":328}}
360 {"docW":360,"winW":360,"card":{"left":12,"right":348,"width":336},"cardPad":"18px","h1":{"left":12,"width":336},"btn":{"width":298}}
```
(extrait des clés utiles ; sortie brute complète = mêmes valeurs + x/y/top/bottom/height)
- centrage : 460/460 · 124/124 · 12/12 · 12/12 → écart 0
- h1.left === card.left : 4/4 · docW === winW : 4/4
- bouton ≤560 : 366−2×18−2 (bordure) = 328 OK · 336−38 = 298 OK
`npm --prefix web run typecheck; echo $?` → `typecheck_exit=0`
`npm --prefix web run lint` → `✖ 1 problem (0 errors, 1 warning)` (Admin.tsx:368 préexistant)
`npm --prefix web test -- --run` → `Test Files 176 passed (176)` · `Tests 1691 passed (1691)`
`git -C G status --short` → ` M web/src/pages/Account.tsx` ` M web/src/theme.css`
`git -C G diff --stat` → `Account.tsx | 44 +-` · `theme.css | 9 +` · 32+/21−

## Écarts
- ∅ lecture hors WL
- theme.css bloc = 9 lignes (8 Contrat + 1 `.gl-sub` exigé par note Contrat :60)
- Account.tsx : diff 44 l = réindentation +2 du contenu enveloppé

## Pour la suite
- `.gl-account-page` = gabarit réutilisable pour pages formulaire unique (520 px centré)
- Account.tsx:44,49,51,53 : styles inline préexistants (h2 fontSize, label/div marginTop) conservés
- bouton ≤560 px : largeur = carte − 2×padding − 2 px bordure
- serveurs :4000/:5180 non touchés ; 0 commit

## Retour sur le pack
- Manquait: ∅ (DoD bouton « ≈ » : préciser bordure 1 px de `.gl-card`)
- Inutile: Layout.tsx, PasswordInput.tsx (L) — non ouverts, Contrat suffisant
