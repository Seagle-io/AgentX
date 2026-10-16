# tests

Tests Playwright e2e contre le service réel salle-v2-dev (0 interception réseau). SALLE_URL surcharge la baseURL.

- `smoke.spec.ts` — `#/` (en-tête, canvas, nav), `#/floor/salle-v2` (canvas, deck CHEF, jauges), `#/showcase` (8 sections)

S'appuie sur : @playwright/test, service salle-v2-dev

← [[../README.md]]
