#!/usr/bin/env python3
"""Génère des sources de supervision d'exemple pour la démo.

Ce ne sont pas des chiffres simulés affichés comme s'ils venaient de ta prod :
ce sont de vrais fichiers, écrits sur disque, que le tableau de bord lit comme
il lirait les tiens. Les chemins sont visibles dans chaque panneau.

    python3 demo/supervision.py          écrit demo/supervision/* + supervision.json
    python3 demo/supervision.py --effacer  retire les deux
"""

from __future__ import annotations

import json
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "demo" / "supervision"
CONFIG = RACINE / "supervision.json"

ERREURS = [
    ("error", "TypeError: cannot read property 'titre' of undefined", "api/recherche.ts:48", 14),
    ("error", "SearchIndexError: trigramme introuvable pour une requête vide", "search/index.ts:71", 6),
    ("warn",  "slow query: recherche floue 240ms > budget 80ms", "api/recherche.ts:61", 5),
    ("error", "FetchError: upstream catalogue timeout after 5000ms", "data/catalogue.ts:22", 3),
    ("warn",  "deprecated: normaliser() sans option accents", "search/normaliser.ts:9", 2),
]

RETOURS = [
    (5, "La recherche trouve enfin mes fautes de frappe, merci.", "anon-204"),
    (4, "Beaucoup plus rapide qu'avant. Parfois un résultat bizarre en tête.", "anon-117"),
    (2, "« chausure » marche mais « chausures » au pluriel ne donne rien.", "anon-331"),
    (5, "Rien à dire, ça marche.", "anon-88"),
    (3, "Correct, mais je ne comprends pas l'ordre des résultats.", "anon-452"),
    (1, "Plante quand je colle un texte long dans la barre.", "anon-19"),
    (4, "Bonne amélioration. Les accents sont bien gérés maintenant.", "anon-277"),
    (2, "Les résultats sponsorisés remontent trop haut.", "anon-390"),
    (5, "Rapide et pertinent.", "anon-61"),
    (4, "Très bien sur mobile aussi.", "anon-512"),
]


def ecrire():
    DOSSIER.mkdir(parents=True, exist_ok=True)
    alea = random.Random(20261004)          # reproductible : même démo à chaque fois
    maintenant = datetime.now()

    lignes = []
    for niveau, message, ou, n in ERREURS:
        for _ in range(n):
            quand = maintenant - timedelta(minutes=alea.randint(1, 23 * 60))
            lignes.append({"ts": quand.isoformat(timespec="seconds"),
                           "niveau": niveau, "message": message, "ou": ou})
    lignes.sort(key=lambda o: o["ts"])
    (DOSSIER / "erreurs.jsonl").write_text(
        "\n".join(json.dumps(o, ensure_ascii=False) for o in lignes) + "\n", encoding="utf-8")

    (DOSSIER / "telemetrie.json").write_text(json.dumps({
        "maj": maintenant.isoformat(timespec="seconds"),
        "metriques": [
            {"nom": "requêtes / min", "valeur": 412, "delta": "+6 %"},
            {"nom": "p95", "valeur": 64, "unite": "ms", "delta": "-3 %"},
            {"nom": "taux d'erreur", "valeur": 0.42, "unite": "%", "delta": "+0.1 %"},
            {"nom": "sessions actives", "valeur": 1284, "delta": "+11 %"},
        ],
        "series": {
            "p95_ms": [71, 69, 74, 68, 66, 70, 65, 64, 67, 63, 61, 64],
            "req_min": [310, 338, 352, 401, 428, 412, 395, 441, 462, 430, 408, 412],
        },
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    avis = []
    for i, (note, texte, qui) in enumerate(RETOURS):
        quand = maintenant - timedelta(hours=alea.randint(1, 6 * 24))
        avis.append({"ts": quand.isoformat(timespec="minutes"),
                     "utilisateur": qui, "note": note, "texte": texte})
    avis.sort(key=lambda o: o["ts"])
    (DOSSIER / "retours.jsonl").write_text(
        "\n".join(json.dumps(o, ensure_ascii=False) for o in avis) + "\n", encoding="utf-8")

    # La sonde « salle » lit le battement que le tableau de bord écrit lui-même
    # (run/salle.alive) : vert tant qu'il sert, rouge dès qu'il s'arrête. On ne
    # le sonde surtout pas en HTTP — la requête imbriquée retomberait dans le
    # sondage (verrou de ré-entrance dans supervision.py).
    CONFIG.write_text(json.dumps({
        "service": "recherche-floue",
        "version": "1.4.2 (démo)",
        "sondes": [
            {"nom": "salle", "fichier": "run/salle.alive", "frais_s": 60},
            {"nom": "catalogue", "fichier": "demo/supervision/telemetrie.json", "frais_s": 86400},
            {"nom": "api", "url": "http://127.0.0.1:3000/health", "attendu": 200},
        ],
        "erreurs": "demo/supervision/erreurs.jsonl",
        "telemetrie": "demo/supervision/telemetrie.json",
        "retours": "demo/supervision/retours.jsonl",
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"sources écrites : {DOSSIER.relative_to(RACINE)}/ "
          f"({len(lignes)} erreurs, {len(avis)} retours)")
    print(f"config          : {CONFIG.relative_to(RACINE)}")
    print("la sonde « api » pointe sur un service absent : elle doit virer au rouge.")


def effacer():
    for f in DOSSIER.glob("*"):
        f.unlink()
    if DOSSIER.exists():
        DOSSIER.rmdir()
    if CONFIG.exists():
        CONFIG.unlink()
    print("sources de démo et supervision.json retirés")


if __name__ == "__main__":
    effacer() if "--effacer" in sys.argv[1:] else ecrire()
