# apps/web — salle v2

Front de la salle AgentX : Vite 8, React 19, TypeScript, Tailwind 4, React Router, TanStack Query, Zustand, i18next, Zod. Lint Biome + script `check-fetch`, tests Vitest, e2e Playwright.

## Structure

```
src/
  main.tsx            monte Router + Query + i18n sur #root
  index.css           tokens (@theme inline reference) + 4 blocs par thème
  api/<entité>/       crud.ts = seul endroit où fetch est permis
  engine/             TS pur (sans React ni DOM) : immeuble isométrique
  salle/              module : routes.tsx, pages/, component/, script/, tests/
  shared/ui           composants réutilisables (modèle button.tsx)
  shared/page         gabarits de page
  shared/lib          utils.ts (cn), i18n/, store/, theme/
tests/                Playwright (smoke.spec.ts)
scripts/check-fetch.mjs
```

Alias `@` → `src`. Un README par dossier.

## Commandes

```
npm install          # versions exactes (package-lock.json)
npm run dev          # vite --strictPort (lancé par ./bin/agentx env up salle-v2-dev, port 5174)
npm run build        # tsc -p tsconfig.app.json --noEmit && vite build → dist/ (base ./)
npm run lint         # biome check src && node scripts/check-fetch.mjs
npm run format       # biome format --write src
npm run test         # vitest run (src/**/tests/**/*.ts)
npm run e2e          # playwright test (SALLE_URL, défaut http://127.0.0.1:5174)
```

Proxy dev : `/state.json` et `/api` → `SALLE_API` (défaut `http://127.0.0.1:7777`).
