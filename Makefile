# AgentX — raccourcis make. Toute la logique vit dans bin/agentx ; ici, que des alias.
#
#   make run        démarre tout (index, contrôle, salle détachée, navigateur) et rend la main
#   make stop       arrête la salle (la session chef survit)
#   make statut     la salle tourne-t-elle ? sur quel port ?
#   make board      tableau de bord du vault
#   make doctor     incohérences du vault
#   make build      reconstruit le front v2 (apps/web/dist)
#   make test       tests Python (tests/) + tests du front (vitest)
#
# Variables : PORT=8080 PROJET=<slug> ARGS="--no-open"

AGENTX := ./bin/agentx
PORT   ?=
PROJET ?=
ARGS   ?=

RUN_FLAGS := $(if $(PORT),--port $(PORT)) $(if $(PROJET),--projet $(PROJET)) $(ARGS)

.PHONY: run stop statut board ready doctor build test invariants help

run:
	$(AGENTX) $(RUN_FLAGS)

stop:
	$(AGENTX) stop

statut:
	$(AGENTX) statut

board:
	$(AGENTX) board

ready:
	$(AGENTX) ready

doctor:
	$(AGENTX) doctor

build:
	cd apps/web && npm run build

test:
	# discover -s bin non supporté : AGENTX_ROOT lu à l'import
	rc=0; for f in bin/test_*.py; do python3 -m unittest $$f || rc=1; done; exit $$rc
	python3 -m unittest discover -s tests -v
	cd apps/web && npm test

help:
	$(AGENTX) help

invariants:
	cd apps/web && node ../../outils-test/invariants-salle/invariants.mjs
