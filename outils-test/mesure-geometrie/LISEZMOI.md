# mesure-geometrie

    node g2.mjs <port> <fx.json|-> <CODE> [corrige] > planches.json
    python3 an.py planches.json
- `g2.mjs` : lance son propre Vite (config `../banc-impression`, port libre ≠ 5200), rend `?code=CODE` en media print ; planches = `G2_PLANCHE` (défaut `div.relative`) contenant des points `G2_POINT` (défaut `:scope > div.absolute`) ; log Vite `.sorties/_logs/g2-vite-<port>.log`
- sortie : `[{ left, right, pw, w, h, dots: [{ l, x, y, w, h }], line }]` en mm (points relatifs à la planche)
- `an.py` : par planche, `trait<2mm(rect)` (segments i→i+1 à < 2 mm d'un autre point), chevauchements, points hors cadre
- exemple : `node g2.mjs 5297 ../banc-impression/fixtures/orthoworkspace/RELIER/img34.json RELIER`
