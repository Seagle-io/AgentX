const e=`---
title: "DataDrift — Vieillissement des données d'entraînement et stratégies d'injection de données fraîches"
status: en-cours
date: 2025-04-20
authors: ["Équipe Seagle"]
tags: ["LLM", "training-data", "knowledge-cutoff", "RAG", "fine-tuning", "temporal-drift"]
readTime: "12 min"
---

## Résumé

DataDrift est une étude expérimentale sur la dégradation temporelle des performances des LLMs à mesure que leurs données d'entraînement vieillissent, et sur l'efficacité comparée des stratégies d'injection de connaissances fraîches (RAG, fine-tuning continu, hybrid retrieval). L'enjeu est critique en contexte B2B : un modèle qui ignore les évolutions réglementaires, les nouveaux concurrents ou les changements de marché des 12 derniers mois est un modèle partiellement aveugle.

> **Statut :** Étude en cours. Protocole de mesure du drift temporel finalisé. Premières courbes de dégradation disponibles sur 4 modèles.

---

## 1. Contexte

### 1.1 Le problème du knowledge cutoff

Tous les grands modèles de langage ont une date de coupure (*knowledge cutoff*) — le moment au-delà duquel leurs données d'entraînement ne contiennent plus d'information. Cette date est rarement précise et souvent opaque :

| Modèle | Cutoff officiel | Cutoff effectif (estimé) |
|---|---|---|
| GPT-4o (2024-08-06) | Oct 2023 | ~Août 2023 (sous-représentation fin de période) |
| Claude 3.5 Sonnet | Avr 2024 | ~Fév 2024 |
| Mistral Large 2 | ~2024 | Non publié |
| Llama 3.1 70B | Déc 2023 | ~Oct 2023 |

> Le cutoff effectif est systématiquement **antérieur** au cutoff officiel : les données proches de la date de coupure sont sous-représentées dans le corpus d'entraînement (moins de temps pour être indexées, republices, commentées sur le web).

### 1.2 La double dégradation

Un modèle déployé en production subit deux types de vieillissement simultanés :

\`\`\`
Temps ──────────────────────────────────────────►

[Cutoff]   [Déploiement]             [Aujourd'hui]
    │              │                       │
    │◄─── Gap 1 ──►│◄────── Gap 2 ────────►│
    │   (existant)  │   (s'accumule)        │
    │               │                       │
    └── Données     └── Nouvelles réalités  └── Performance
        manquantes      non modélisées          dégradée
\`\`\`

- **Gap 1** — Délai entre la fin des données d'entraînement et le déploiement (~6–12 mois en moyenne)
- **Gap 2** — Accumulation de nouvelles réalités post-déploiement (croissant dans le temps)

### 1.3 Ce que DataDrift tente de quantifier

1. **Courbe de dégradation** : à quelle vitesse et selon quelle courbe les performances se dégradent-elles sur des questions temporellement situées ?
2. **Sensibilité par domaine** : certains secteurs (finance, droit, tech) vieillissent-ils plus vite que d'autres ?
3. **Efficacité des remèdes** : RAG, fine-tuning, hybrid — lequel compense le mieux, à quel coût ?

---

## 2. Protocole de mesure du drift

### 2.1 Dataset temporellement annoté

Nous construisons un dataset de **600 questions** réparties en 6 fenêtres temporelles :

\`\`\`
T-24 mois ──► T-18 ──► T-12 ──► T-6 ──► T-3 ──► T-aujourd'hui
   100q           100q     100q     100q     100q       100q
\`\`\`

Chaque question est catégorisée par **domaine de vieillissement** :

| Domaine | Exemple de question | Vitesse de vieillissement |
|---|---|---|
| Réglementaire | "Quelle est la règle CSRD applicable aux PME ?" | Rapide |
| Technologique | "Quelle est la dernière version stable de React ?" | Très rapide |
| Marché / Concurrence | "Qui sont les acteurs principaux du RAG en Europe ?" | Rapide |
| Scientifique | "Quel est le SOTA en vision par ordinateur ?" | Moyen |
| Historique / Stable | "Quelle est la capitale de la France ?" | Nul |

### 2.2 Métriques

\`\`\`python
# Pour chaque modèle M et chaque fenêtre temporelle T :
drift_score(M, T) = accuracy(M, questions_T) / accuracy(M, questions_T_minus_24)

# Courbe de drift : drift_score sur toutes les fenêtres
# 1.0 = pas de dégradation, 0.0 = modèle aveugle

# Temporal Decay Rate (TDR) : vitesse de dégradation par mois
TDR(M) = (1 - drift_score(M, T_0)) / months_elapsed
\`\`\`

---

## 3. Résultats préliminaires

### 3.1 Courbes de dégradation (4 modèles, sans RAG)

Résultats sur les 200 questions des fenêtres T-6 et T-aujourd'hui :

| Modèle | T-24 (baseline) | T-12 | T-6 | T-0 (aujourd'hui) |
|---|---|---|---|---|
| Claude 3.5 Sonnet | 1.00 | 0.93 | 0.81 | **0.61** |
| GPT-4o | 1.00 | 0.91 | 0.78 | **0.58** |
| Mistral Large 2 | 1.00 | 0.89 | 0.74 | **0.54** |
| Llama 3.1 70B | 1.00 | 0.85 | 0.69 | **0.48** |

> **Observation clé :** tous les modèles perdent entre 40% et 50% de leur précision sur des questions portant sur les 6 derniers mois — indépendamment de leurs performances absolues.

### 3.2 Vieillissement par domaine

La dégradation n'est pas uniforme. Sur le domaine *Technologique* (évolutions de frameworks, nouvelles bibliothèques) :

\`\`\`
T-24 ─── 1.00
T-12 ─── 0.87
T-6  ─── 0.61   ← chute marquée
T-3  ─── 0.44
T-0  ─── 0.31   ← quasi-inutilisable sans RAG
\`\`\`

Sur le domaine *Historique/Stable* :
\`\`\`
T-24 ─── 1.00
T-0  ─── 0.99   ← dégradation quasi-nulle
\`\`\`

Le domaine **Réglementaire** présente le pattern le plus dangereux : dégradation brutale et invisible (le modèle répond avec la même confiance sur une loi abrogée que sur une loi en vigueur).

---

## 4. Stratégies de remédiation

### 4.1 RAG (Retrieval-Augmented Generation)

L'approche que nous connaissons le mieux via [[SeaSearch]]. Efficacité sur le drift temporel :

\`\`\`python
# Impact mesuré du RAG sur les questions T-0
accuracy_sans_rag = 0.58  # GPT-4o sur questions T-0
accuracy_avec_rag = 0.89  # GPT-4o + RAG sur corpus actualisé

delta = +0.31  # +31 points
\`\`\`

**Limites du RAG pour ce cas d'usage :**
- Nécessite que la source fraîche existe et soit indexée
- Ne corrige pas les hallucinations confiantes sur des "faits" dépassés
- Latence additionnelle (pipeline RAG complet)

### 4.2 Fine-tuning continu

L'alternative : mettre à jour les poids du modèle périodiquement avec des données fraîches.

| Approche | Coût | Fréquence réaliste | Efficacité drift |
|---|---|---|---|
| Full fine-tuning | ~$50k–$500k | Annuel | Élevée |
| LoRA / QLoRA | ~$500–$5k | Trimestriel | Moyenne-élevée |
| Instruction tuning léger | ~$100–$500 | Mensuel | Faible-moyenne |

**Problème majeur : le catastrophic forgetting**

\`\`\`
Modèle base ──► Fine-tuning T+12 ──► Fine-tuning T+24
     │                │                    │
     └─ Sait A, B, C  └─ Sait D, E, F     └─ Oublie A, B, C
                          Oublie un peu         Sait G, H, I
                          A, B, C
\`\`\`

Le fine-tuning continu sans précautions dégrade les connaissances antérieures. Les techniques de *continual learning* (EWC, replay buffers) atténuent mais ne résolvent pas entièrement ce phénomène.

### 4.3 Hybrid Retrieval + Prompt Anchoring

Notre approche préférée pour les cas B2B : combiner RAG avec un *temporal anchor* dans le prompt système.

\`\`\`
SYSTEM (avec temporal anchoring) :
"La date actuelle est {date}. Tes données d'entraînement couvrent jusqu'à {cutoff}.
Pour toute question impliquant des réalités postérieures à cette date, 
tu DOIS utiliser les documents fournis en contexte et signaler explicitement
si ta réponse repose sur des connaissances potentiellement obsolètes."
\`\`\`

Effet mesuré du temporal anchoring seul (sans RAG) :

| Comportement | Sans anchoring | Avec anchoring |
|---|---|---|
| Réponses fausses confiantes | 34% | **12%** |
| Réponses avec mention d'incertitude | 8% | **61%** |
| Refus de répondre appropriés | 3% | **18%** |

> Le modèle ne *sait* pas plus de choses, mais il *ment* moins avec confiance.

---

## 5. Modèle de fraîcheur documentaire

Pour les déploiements RAG, nous développons un score de fraîcheur composite :

\`\`\`python
def freshness_score(document, query_date):
    age_days = (query_date - document.date).days
    
    # Decay function selon le domaine
    decay_rates = {
        "reglementaire":  0.015,  # -1.5% par jour
        "technologique":  0.025,  # -2.5% par jour
        "marche":         0.020,  # -2.0% par jour
        "scientifique":   0.008,  # -0.8% par jour
        "stable":         0.001,  # -0.1% par jour
    }
    rate = decay_rates.get(document.domain, 0.010)
    
    return math.exp(-rate * age_days)  # Décroissance exponentielle

# Utilisation dans le reranking RAG
final_score = semantic_score * 0.7 + freshness_score * 0.3
\`\`\`

---

## 6. Prochaines étapes

- [ ] Compléter le dataset à 600 questions (actuellement 320)
- [ ] Tester le modèle de fraîcheur dans le pipeline SeaSearch
- [ ] Benchmark LoRA mensuel vs RAG hebdomadaire sur un cas d'usage réel
- [ ] Publication du dataset annoté temporellement (sous licence CC-BY)
- [ ] Étude du "confident hallucination" sur données réglementaires périmées

---

## 7. Références

1. Kasner, Z., Dusek, O. — *"Beyond Factuality: A Comprehensive Evaluation of Large Language Models as Knowledge Generators"*, EMNLP 2023
2. Lazaridou, A. et al. — *"Internet-Augmented Language Models through Few-Shot Prompting for Open-Domain Question Answering"*, arXiv 2022
3. Luu, K. et al. — *"Time Waits for No One! Analysis and Challenges of Temporal Misalignment"*, NAACL 2022
4. Jang, J. et al. — *"Towards Continual Knowledge Learning of Language Models"*, ICLR 2023
5. Shi, W. et al. — *"REPLUG: Retrieval-Augmented Black-Box Language Models"*, NAACL 2023
6. Dhingra, B. et al. — *"Time-Aware Language Models as Temporal Knowledge Bases"*, TACL 2022
`;export{e as default};
