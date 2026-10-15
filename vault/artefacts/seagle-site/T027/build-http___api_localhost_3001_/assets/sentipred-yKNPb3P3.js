const e=`---
title: "SentiPred — Prédiction sentimentale par l'IA : modéliser l'affect avant qu'il ne s'exprime"
status: en-cours
date: 2025-04-15
authors: ["Équipe Seagle"]
tags: ["sentiment", "prédiction", "affectif", "LLM", "NLP", "psychologie-computationnelle"]
readTime: "13 min"
---

## Résumé

SentiPred explore la capacité des modèles de langage à **prédire des états émotionnels futurs** à partir de signaux textuels présents — avant que ces émotions ne soient exprimées explicitement. L'enjeu dépasse l'analyse de sentiment classique (positif/négatif/neutre sur un texte passé) pour s'attaquer à une question plus profonde : un LLM peut-il modéliser la trajectoire affective d'un individu ou d'un collectif à partir de ses traces langagières ?

> **Statut :** Étude en cours. Première architecture de prédiction entraînée. Résultats préliminaires sur corpus emails B2B disponibles.

---

## 1. Contexte

### 1.1 Les limites de l'analyse de sentiment classique

L'analyse de sentiment est un domaine mature. Les outils actuels (VADER, RoBERTa, CamemBERT fine-tuné) atteignent des F1 > 0.90 sur des textes bien étiquetés. Mais ils répondent tous à la même question : **"Comment se sentait l'auteur quand il a écrit ce texte ?"**

Cette question est rétrospective. Or les applications les plus à fort impact nécessitent une réponse **prospective** :

- *Ce client va-t-il churner dans les 30 prochains jours ?*
- *Cette relation commerciale est-elle en train de se dégrader silencieusement ?*
- *Dans quel état émotionnel sera ce collaborateur lors de notre réunion de demain ?*

### 1.2 Ce que "prédiction sentimentale" veut dire

Nous distinguons trois niveaux de complexité croissante :

| Niveau | Question | Horizon | Difficulté |
|---|---|---|---|
| **L1 — Détection** | Quel est le sentiment actuel ? | Passé immédiat | Résolu |
| **L2 — Projection** | Le sentiment va-t-il se maintenir ? | 1–7 jours | En cours |
| **L3 — Anticipation** | Quel sentiment va émerger d'une situation nouvelle ? | 7–30 jours | Exploratoire |

SentiPred travaille principalement sur L2, avec des expériences exploratoires sur L3.

---

## 2. Architecture

### 2.1 Vue d'ensemble

\`\`\`
Historique conversationnel (N derniers messages)
            │
            ▼
   ┌─────────────────────┐
   │  Temporal Encoder   │  (RoBERTa multilingual fine-tuné)
   │  Signal extraction  │  → vecteurs affectifs horodatés
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │  Drift Detector     │  → détecte les inflexions de trajectoire
   │  (sliding window)   │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │  LLM Contextualizer │  (Claude 3.5 Sonnet)
   │  Prompt engineering │  → interprète les drifts avec contexte
   └──────────┬──────────┘
              │
              ▼
   Prédiction : {sentiment_t+7, confiance, facteurs_déclencheurs}
\`\`\`

### 2.2 Temporal Encoder

Le cœur du système est un encoder qui produit des **vecteurs affectifs horodatés** sur chaque message. Ce n'est pas un score unique, mais un vecteur dans l'espace VAD (Valence-Arousal-Dominance) :

\`\`\`python
from transformers import AutoModelForSequenceClassification

# Fine-tuning sur corpus annoté VAD (EmoBank + NRC-VAD)
model = AutoModelForSequenceClassification.from_pretrained(
    "cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual",
    num_labels=3  # V, A, D
)

# Output par message
{
  "timestamp": "2025-03-15T14:23:00Z",
  "text_preview": "On va devoir revoir les délais...",
  "vad": { "valence": -0.42, "arousal": 0.31, "dominance": -0.18 },
  "confidence": 0.74
}
\`\`\`

### 2.3 Drift Detector

La prédiction ne vient pas d'un seul message mais de la **dynamique** sur une fenêtre glissante. Le Drift Detector cherche des patterns caractéristiques :

\`\`\`python
# Patterns identifiés empiriquement sur le corpus d'entraînement
DRIFT_PATTERNS = {
    "escalade_silencieuse": {
        "description": "Valence stable mais arousal croissant",
        "predictor": arousal_slope > 0.15 and abs(valence_slope) < 0.05,
        "predicted_outcome": "friction_t7",
        "precision": 0.71
    },
    "désengagement_progressif": {
        "description": "Arousal décroissant, messages raccourcis",
        "predictor": arousal_slope < -0.20 and length_slope < -0.30,
        "predicted_outcome": "churn_risk_t30",
        "precision": 0.68
    },
    "pivot_positif": {
        "description": "Saut de valence après dominance basse",
        "predictor": valence_delta > 0.40 and prior_dominance < -0.25,
        "predicted_outcome": "engagement_t7",
        "precision": 0.79
    }
}
\`\`\`

### 2.4 LLM Contextualizer

Le LLM n'est pas le moteur de prédiction — il est l'interprète. Il reçoit le drift détecté et le contexte relationnel pour produire une explication actionnable :

\`\`\`
SYSTEM: Tu es un analyste de dynamiques relationnelles. 
Tu reçois des signaux de dérive émotionnelle détectés dans des échanges professionnels.
Ton rôle est d'interpréter ces signaux et de proposer des actions préventives.
Ne suppose jamais de certitude. Formule en probabilités.

USER: Drift détecté : escalade_silencieuse sur 8 jours.
Contexte : relation client depuis 14 mois, projet en phase de livraison.
Dernier message notable : "Ok, on verra bien." (valence -0.31, arousal +0.44)

EXPECTED OUTPUT:
{
  "interpretation": "Probable tension autour des délais non exprimée directement...",
  "risk_level": "medium",
  "recommended_action": "Appel proactif de clarification sous 48h",
  "confidence": 0.67
}
\`\`\`

---

## 3. Résultats préliminaires

### 3.1 Corpus d'évaluation

Évaluation sur **320 fils de conversation B2B** anonymisés (emails + messages Slack), étiquetés rétrospectivement par des analystes humains sur l'issue à J+7 et J+30.

| Métrique | L2 (J+7) | L3 (J+30) |
|---|---|---|
| AUC-ROC global | **0.74** | 0.61 |
| Précision churn risk | **0.68** | 0.54 |
| Précision escalade | **0.71** | 0.58 |
| Rappel pivot positif | **0.79** | 0.63 |
| Faux positifs | 18% | 29% |

> **Observation :** Les performances à J+7 sont encourageantes. L'horizon J+30 reste difficile — trop de variables exogènes non capturées dans le texte seul.

### 3.2 Ce que le modèle ne voit pas

Le modèle opère uniquement sur le **texte**. Il manque :

- Le ton de voix (appels téléphoniques)
- Le langage corporel (visioconférences)
- Les événements contextuels extérieurs (problèmes perso, pression concurrentielle)
- Le non-dit (ce qui n'est pas écrit)

Un drift émotionnel peut être entièrement invisible dans le texte si l'interlocuteur est un bon communicant qui maîtrise sa façade écrite.

---

## 4. Questions éthiques

### 4.1 Le consentement comme condition non-négociable

Prédire les états émotionnels d'une personne sans son consentement est **éthiquement inacceptable** et potentiellement illégal (RGPD, Art. 9 sur les données sensibles).

SentiPred est conçu pour des cas d'usage **opt-in** uniquement :

- Outil d'auto-analyse pour les managers qui souhaitent monitorer leurs propres patterns relationnels
- Outil de team analytics avec consentement collectif explicite
- Outil de CRM augmenté avec clause contractuelle claire

### 4.2 Le risque de la prophétie auto-réalisatrice

Si un système prédit "ce client va churner" et que l'équipe commerciale traite ce client différemment en conséquence, la prédiction peut **causer** le résultat qu'elle prédit. Ce feedback loop doit être documenté et brisé par des protocoles de double-aveugle dans l'interprétation.

### 4.3 Biais de représentation

Les modèles entraînés sur des corpus majoritairement anglophones ou issus de cultures WEIRD (Western, Educated, Industrial, Rich, Democratic) peuvent mal interpréter des patterns émotionnels culturellement spécifiques. Notre corpus est FR/EN mais reste culturellement limité.

---

## 5. Applications envisagées

| Domaine | Application | Statut |
|---|---|---|
| CRM B2B | Alertes de dérive relationnelle client | Prototype |
| RH | Détection précoce de désengagement | Exploration |
| Support client | Priorisation des tickets à risque émotionnel élevé | Exploration |
| Auto-analyse | Dashboard personnel de patterns relationnels | Idée |

---

## 6. Prochaines étapes

- [ ] Augmenter le corpus d'évaluation (320 → 1 000 conversations)
- [ ] Ajouter une dimension multilingue (DE, ES)
- [ ] Intégration avec les données de tickets support (SeaSearch pipeline)
- [ ] Protocole de validation externe par psychologues cliniciens
- [ ] Rédaction du cadre éthique complet (en collaboration avec un juriste RGPD)

---

## 7. Références

1. Russell, J.A. — *"A Circumplex Model of Affect"*, Journal of Personality and Social Psychology 1980
2. Mohammad, S.M., Turney, P.D. — *"NRC Word-Emotion Association Lexicon"*, SEMEVAL 2010
3. Buechel, S., Hahn, U. — *"EmoBank: Studying the Impact of Annotation Perspective and Representation Format on Dimensional Emotion Analysis"*, EACL 2017
4. Kramer, A.D.I. et al. — *"Experimental Evidence of Massive-Scale Emotional Contagion Through Social Networks"*, PNAS 2014
5. Binns, R. — *"Fairness in Machine Learning: Lessons from Political Philosophy"*, FAT* 2018
6. Keltner, D., Gross, J.J. — *"Functional Accounts of Emotions"*, Cognition & Emotion 1999
`;export{e as default};
