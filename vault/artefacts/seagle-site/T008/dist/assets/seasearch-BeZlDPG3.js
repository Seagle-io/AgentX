const e=`---
title: "SeaSearch — RAG sur base documentaire privée d'entreprise"
status: en-cours
date: 2025-01-10
authors: ["Équipe Seagle"]
tags: ["RAG", "embeddings", "LLM", "enterprise", "NLP", "vector-search"]
readTime: "15 min"
---

## Résumé

SeaSearch est une expérience d'architecture Retrieval-Augmented Generation (RAG) appliquée à des bases documentaires privées d'entreprise (PDF, DOCX, emails, wikis internes). L'objectif est d'offrir un moteur de recherche sémantique capable de répondre à des questions en langage naturel sur un corpus privé, avec des réponses sourcées, vérifiables, et une latence totale inférieure à 300ms (P90).

> **Statut actuel :** Pipeline de base opérationnel sur corpus de test (2 400 documents). Phase d'optimisation du reranking en cours.

---

## 1. Contexte & Motivation

### 1.1 Pourquoi ce problème est difficile

La recherche documentaire en entreprise souffre de trois pathologies bien connues :

1. **Recherche lexicale** — les moteurs classiques (Elasticsearch, Solr) cherchent des mots-clés exacts. La question *"Quelle est notre politique de remboursement pour les formations ?"* ne trouve pas le document intitulé *"Prise en charge CPF — procédure interne"*.

2. **Hallucination LLM** — un modèle interrogé sans contexte invente des réponses plausibles mais fausses.

3. **Latence** — les pipelines RAG naïfs accumulent les latences : embedding (80ms) + vector search (40ms) + LLM (800ms+) = >1s, inacceptable pour un usage quotidien.

### 1.2 Hypothèse

> *Un pipeline RAG correctement optimisé (chunking adaptatif, reranking, caching LLM) peut atteindre une latence P90 < 300ms tout en maintenant un taux de réponses correctement sourcées > 90%.*

---

## 2. Architecture du pipeline

### 2.1 Indexation

\`\`\`
Documents bruts (PDF/DOCX/MD/HTML)
          │
          ▼
   ┌─────────────┐
   │  Extraction │  (pypdf2, python-docx, BeautifulSoup)
   └──────┬──────┘
          │ texte brut
          ▼
   ┌─────────────┐
   │  Chunking   │  (RecursiveCharacterSplitter, chunk=512, overlap=64)
   └──────┬──────┘
          │ chunks
          ▼
   ┌─────────────────────┐
   │  Embedding          │  (text-embedding-3-small, 1536 dims)
   └──────┬──────────────┘
          │ vecteurs
          ▼
   ┌─────────────┐
   │  pgvector   │  (PostgreSQL + extension vector)
   └─────────────┘
\`\`\`

### 2.2 Requête (runtime)

\`\`\`
Question utilisateur
        │
        ▼
  Embedding requête (text-embedding-3-small)
        │
        ▼
  ANN Search pgvector (top-20, cosine)
        │
        ▼
  Reranking (Cohere rerank-multilingual-v3) → top-5
        │
        ▼
  Prompt assembly + LLM (Claude 3.5 Haiku)
        │
        ▼
  Réponse + sources citées
\`\`\`

### 2.3 Choix de pgvector vs Pinecone

Nous avons évalué trois solutions de vector search :

| Solution | Latence P50 | Latence P99 | Coût/mois (100k docs) | Déploiement |
|---|---|---|---|---|
| Pinecone (starter) | 45ms | 120ms | ~70$ | SaaS |
| Qdrant (cloud) | 32ms | 89ms | ~45$ | SaaS/self |
| **pgvector** | **28ms** | **74ms** | **~8$** | self-hosted |
| Weaviate | 51ms | 134ms | ~90$ | SaaS/self |

**Choix : pgvector** — latence compétitive, coût minimal, déjà dans notre stack PostgreSQL, pas de dépendance externe supplémentaire.

---

## 3. Chunking : observations

Le chunking est la décision la plus impactante sur la qualité des réponses. Nos tests sur 200 questions de validation :

### 3.1 Stratégies testées

| Stratégie | Chunk size | RAGAS Faithfulness | RAGAS Answer Relevancy |
|---|---|---|---|
| Fixed-size | 256 tokens | 0.71 | 0.68 |
| Fixed-size | 512 tokens | 0.79 | 0.74 |
| Fixed-size | 1024 tokens | 0.76 | 0.71 |
| **Recursive** | **512 + overlap 64** | **0.84** | **0.81** |
| Semantic | variable | 0.82 | 0.83 |
| Markdown-aware | variable | 0.88 | 0.85 |

> **Observation clé :** Le chunking "Markdown-aware" (qui respecte les titres, sections, listes) surpasse le chunking sémantique sur nos corpus, probablement parce que la majorité de nos documents internes sont structurés en markdown ou en DOCX avec des styles de titre.

### 3.2 Le problème des tables

Les tables PDF/DOCX sont systématiquement mal découpées par les chunkeurs standard. Notre solution : extraction préalable des tables en markdown via \`camelot-py\`, puis chunking indépendant avec métadonnée \`type: "table"\`.

---

## 4. Reranking : la décision critique

Sans reranking, la recherche vectorielle (top-20) retourne des chunks pertinents thématiquement mais pas toujours les meilleurs pour répondre à la question précise.

### 4.1 Comparatif rerankers

| Reranker | nDCG@5 | Latence ajoutée | Coût |
|---|---|---|---|
| Aucun (top-5 ANN) | 0.61 | 0ms | 0 |
| Cross-encoder (local) | 0.74 | +180ms | ~0 |
| **Cohere rerank-v3** | **0.83** | **+45ms** | ~0.002$/1k req |
| Cohere rerank-v3 (multilingual) | 0.81 | +48ms | ~0.002$/1k req |

Le **Cohere rerank** apporte le meilleur compromis latence/qualité. La version multilingue est légèrement moins bonne en français pur mais couvre mieux les corpus mixtes.

---

## 5. Évaluation : framework RAGAS

Nous utilisons [RAGAS](https://docs.ragas.io/) pour évaluer automatiquement les réponses sur un dataset de 200 questions/réponses de référence construites manuellement.

\`\`\`python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_recall

results = evaluate(
    dataset=eval_dataset,
    metrics=[faithfulness, answer_relevancy, context_recall]
)
# Résultats actuels :
# faithfulness: 0.87
# answer_relevancy: 0.82
# context_recall: 0.79
\`\`\`

### 5.1 Principales sources d'erreur

1. **Contexte insuffisant** (21% des erreurs) — la réponse est dans un document mais le chunk retourné ne contient pas assez de contexte adjacent.
2. **Ambiguïté de la question** (18%) — "Quel est le délai ?" sans préciser le sujet.
3. **Documents trop anciens** (14%) — pas de gestion de la fraîcheur documentaire.

---

## 6. Optimisations latence

Pour atteindre < 300ms P90, nous combinons trois mécanismes :

\`\`\`
Latence totale = embedding(30ms) + ANN(28ms) + rerank(45ms) + LLM(?)
\`\`\`

Le LLM est le goulot. Solutions :

1. **Prompt caching Anthropic** — les instructions système et le contexte fréquent sont mis en cache. Gain : ~40% sur les requêtes répétées.
2. **Claude 3.5 Haiku** vs Sonnet — 3× plus rapide pour une perte de qualité marginale sur les tâches de Q&A documentaire.
3. **Streaming** — affichage token par token dès les 80ms, perception d'une réponse immédiate.

**Résultats mesurés (corpus 2 400 docs) :**

| Percentile | Sans optim | Avec optim |
|---|---|---|
| P50 | 1 240ms | **187ms** |
| P90 | 2 100ms | **298ms** |
| P99 | 4 800ms | **680ms** |

---

## 7. Prochaines étapes

- [ ] Gestion de la fraîcheur documentaire (re-indexation différentielle)
- [ ] Support des images dans les PDF (vision multimodale)
- [ ] Interface utilisateur de validation (feedback humain pour amélioration continue)
- [ ] Benchmarks sur corpus clients réels (sous NDA)
- [ ] Publication des datasets d'évaluation anonymisés

---

## 8. Références

1. Lewis, P. et al. — *"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"*, NeurIPS 2020
2. Es, S. et al. — *"RAGAS: Automated Evaluation of Retrieval Augmented Generation"*, arXiv 2023
3. Nogueira, R., Cho, K. — *"Passage Re-ranking with BERT"*, arXiv 2019
4. Documentation pgvector — https://github.com/pgvector/pgvector
5. Anthropic — *"Prompt Caching"*, docs.anthropic.com (2024)
`;export{e as default};
