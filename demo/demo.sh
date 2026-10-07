#!/usr/bin/env bash
# Rejoue la démo « recherche-floue » depuis zéro.  bash demo.sh [s par beat]
set -e
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
rm -rf vault/projets/recherche-floue
bash "demo/monter.sh"
bash "demo/packs.sh"       | tail -2
bash "demo/packs-vague4.sh"
python3 demo/supervision.py
echo "── projet neuf, 9 tâches, 7 packs, supervision branchée. Le scénario démarre."
bash "demo/scenario.sh" "${1:-8}"
