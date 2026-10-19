#!/bin/sh
# usage : ./install.sh [slug] — lien node_modules → <front>/node_modules du projet (projets/<slug>.json), idempotent
set -e
H=$(cd "$(dirname "$0")" && pwd)
F=$(cd "$H" && BANC_PROJET="$1" node -e "import('./projet.mjs').then(m => console.log(m.chargerProjet().front))")
ln -sfn "$F/node_modules" "$H/node_modules"
echo "node_modules -> $(readlink "$H/node_modules")"
