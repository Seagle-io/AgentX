# Decisions — Dashboard : grille en modules carrés, cartes à la taille de leur contenu

Une decision = un bloc. Jamais de reecriture, on ajoute.

## 2026-10-08 — Grille 24 col en modules carrés de 24 à 48 px (pile < 944 px), marqueur `config._grid=24`, migration x,w ×2 et h inchangé
- **Contexte** : rangée = colonne ⇒ hauteur px ∝ largeur de grille ; contenus en px fixes ; back non lisible, aucun champ version ; seule voie de persistance atomique = PUT tout-ou-rien (config libre par case).
- **Choix** : module = clamp((W − 23·16)/24, 24, 48) px, gouttière 16 ; grille plafonnée à 1520 px ; pile si W < 944 (module < 24). Taille de référence = module 24 ⇒ pas 40 px = ancien pas de rangée ⇒ h identique, x et w ×2 (sans perte, réversible). Seuils `@container(max-height)` / `dash-low` gardés en px. Format neuf = ≥ 1 case du layout avec `config._grid === 24`, écrit à chaque PUT/PATCH, retiré à la lecture. Tailles catalogue = table T004 (règles minW=⌈(Lmin+16)/40⌉, h=⌈(H+16)/40⌉).
- **Écarté** : heuristique « max(x+w) ≤ 12 ⇒ ancien » parce que layout neuf tenant à gauche ⇒ ×2 à chaque lecture ; préférence utilisateur séparée parce que 2 requêtes non atomiques ; champ version back parce que back non lisible ; référence 1280 px parce que h ×0,74 arrondi (perte) et cartes < contenu sous 1280 ; STACK_BELOW 640 conservé parce que cartes < contenu entre 640 et 944 px.
- **Conséquence** : facile — rollback (x/2, w/2), seuils px intacts, y ≤ 500 inchangé, un seul paramètre (module) pour RGL/overlay/pile. Difficile — cartes jusqu'à 1,6× plus hautes que leur contenu à grille ≥ 1520 px ; grille non élargie au-delà de 1520 px ; pas de glisser sous 944 px de grille.
- **À revoir si** : le back refuse `w=24`/`x=23` ou ne renvoie pas `config._grid` ; part notable d'usage à grille 640–944 px ; retour « cartes trop hautes » sur grand écran (→ baisser MODULE_MAX).

## 2026-10-08 — Back passé à 24 col (GRID_COLS=24) + migration SQL x,w ×2 + version d'API `gridCols: 24` (PUT requis, GET renvoyé) ; marqueur `config._grid` abandonné
- **Supersède** : [[#2026-10-08 — Grille 24 col en modules carrés de 24 à 48 px (pile < 944 px), marqueur `config._grid=24`, migration x,w ×2 et h inchangé]] — partie détection/migration seulement ; géométrie (module, 1520, 944, tableau 47 widgets) conservée. Source : T005.
- **Contexte** : back lisible ; `checkConfig` refuse toute clé inconnue (catalog.ts:109) ⇒ `_grid` impossible (PUT réel 400) ; bornes x ≤ 11 / w ≤ 12 dérivent d'une seule constante (catalog.ts:118, dto.ts:14,20, rules.ts:25) ; table `dashboard_cell` x,w smallint ⇒ conversion SQL atomique et globale possible. Risque restant = fenêtre de déploiement front 12 ↔ back 24.
- **Choix** : `GRID_COLS = 24` back ; migration `ConvertDashboardTo24Cols<ts>` (up x,w ×2 avec garde « ∃ x+w>12 ⇒ throw » ; down x/2, greatest(1,(w+1)/2)) lancée par l'humain ; `SaveDashboardDto.gridCols` requis `@Equals(24)` ; `DashboardView.gridCols = 24` ; front : `fromServer` migre ssi `gridCols !== 24`, préférence legacy `dashboardWidgets` toujours migrée côté front ; tailles widgets restent côté front seul (back = bornes de grille seulement). Ordre : arrêt back → migration → back 24 → front 24.
- **Écarté** : faire bêtement (constante + migration, sans version) parce qu'un onglet front 12 ouvert pendant le déploiement réécrit en silence des cases à demi-largeur ; garder `_grid` (autoriser la clé dans checkConfig, pas de SQL) parce que deux formats vivent indéfiniment et le back ne peut pas borner x selon le format ; dupliquer le tableau de tailles côté back parce que 47 lignes × 2 dépôts sans test croisé = dérive garantie.
- **Conséquence** : facile — un seul format en base, front sans marqueur, écriture mixte impossible (400 « rechargez »), prochaine évolution = bump `gridCols`. Difficile — `gridCols` devient un champ d'API permanent ; down perd la parité (x, w impairs arrondis) ; migration rejouée hors TypeORM sur une base où toutes les cases tiennent à gauche ⇒ ×4 non détecté.
- **À revoir si** : ValidationPipe a `skipMissingProperties` (gridCols absent passerait) ; le back tourne en déploiement roulant (ancien process vivant après migration) ; la préférence `dashboardWidgets` est encore écrite par le front.

## 2026-10-13 — T006 (back 24 col) vérifié : OK (T014)
- 31 cas de casse verts (DTO gridCols, bornes x/w, GET) ; migration rejouée en SQL sur Postgres jetable : up ×2 exact, rejeu refusé, aller-retour 12→24→12 = identité
- risques chiffrés, acceptés : rejeu manuel hors TypeORM → ×4 silencieux seulement si toute la table a x+w ≤ 6 ; down → chevauchements (perte de parité) → compaction côté front au rollback
- tests de casse laissés non suivis dans ortho-back : `src/modules/Dashboard/layout/verif-t014-{dto,get}.spec.ts`

## 2026-10-13 — T007 débloqué : gate HTTP remplacée par la vérification T014 (chef)
- gate étape 0 (curl avec jeton) refusée à l'agent par le classifieur (lecture d'identifiant) → jamais contournée
- comportements visés couverts par T014 au niveau ValidationPipe identique à main.ts : PUT sans gridCols → 400, {x:0,w:24}/{x:23,w:1} → OK, GET gridCols 24
- reste à l'humain (recette) : le même contrôle en HTTP sur le back lancé, puis remettre « Accueil » vide

## 2026-10-16 — grille 24 colonnes abandonnée (humain)
- constat T013 : livraison T006–T012 jamais sur master — front `stash@{1}` + `stash@{0}` (conflit), back `stash@{0}` ; master +202 commits, 49 fichiers dashboard modifiés, revenue déplacé dans `compta/widgets/revenue`
- décision humaine : rester en 12 colonnes ; T013 abandonnée ; projet clos
- stashes laissés tels quels dans ortho-front et ortho-back : suppression = humain
