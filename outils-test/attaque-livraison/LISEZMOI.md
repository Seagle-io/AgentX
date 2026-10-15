# attaque-livraison

## ssr.mjs — SSR de composants sur cas limites
    node ssr.mjs <cas.mjs> [sortie.json]
- entrée : `cas.mjs` exporte `modules` (`{ CODE: '/src/…' }`), `cases` (`{ CODE: { nom: items } }`), `props(items, withAnswers)`, `mesure(html)`
- front = `front` du projet (`../banc-impression/projets/<slug>.json`, env `BANC_PROJET`) ; Vite en middleware, config du front, cache `.vite-cache-ssr`
- sortie : stdout `CODE/nom/enonce|corrige OK <mesure>` | `THROW <message>` ; JSON `{ clé: html }` → défaut `.sorties/_divers/ssr-out.json`
- exemple : `node ssr.mjs projets/orthoworkspace/prints-t144.mjs` (QCM, DIALBD, PHRIMG — T144)

## alias.mjs — alias du projet pour node --test
    node --import /home/sylvain/Documents/AgentX/outils-test/attaque-livraison/alias.mjs --test <test.ts>
- alias du projet (`@/` → `<front>/src/`), extensions `.ts` `.tsx` `/index.ts`, relatifs sans extension ; `import.meta.env` → `({})` dans le front (hors node_modules)
- node ≥ 22.15 (`registerHooks`, types TS retirés nativement)
