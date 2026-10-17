# salle/component

Composants propres au module salle (non réutilisables ailleurs).

- `SalleLayout.tsx` — gabarit : en-tête, Outlet, TodoPanel ; useFloorRoute/useFloorKeys 1× ; StateError à la place de l'Outlet
- `SalleHeader.tsx` — titre, badge slug/démo, horloge (horodate du polling), ticker, lien immeuble
- `FloorList.tsx` — liste des étages + sous-sol (nav)
- `Deck.tsx` — grille de `RoleCard` (rôles à tâche + chef + vault), ≤ 8 pulsées
- `RoleCard.tsx` — carte d'un rôle (pastille, jauge, tag)

S'appuie sur : shared/ui, shared/page, api/state, shared/lib/store, todo
