const e=`---
title: "Ce qu'on a appris en 6 mois de RAG en production"
status: publié
date: 2025-01-15
authors: ["Équipe Seagle"]
tags: ["RAG", "production", "LLM", "embeddings", "reranking"]
readTime: "8 min"
---

## Résumé

Six mois de RAG en production sur des corpus d'entreprise — bilans financiers, contrats, documentations techniques. Ce qu'on a appris n'est pas dans les articles Medium.

---

## 1. Contexte

On a déployé SeaSearch sur trois bases documentaires clients : un cabinet de conseil (PDF de bilans), un éditeur logiciel (documentation technique Confluence/Notion) et un cabinet juridique (contrats et jurisprudence). Volume total : environ 180 000 chunks après preprocessing.

Ce qui suit est un retour terrain brut, sans filtre marketing.

---

## 2. Chunking : ce qu'on pensait vs ce qui fonctionne

### Ce qu'on pensait

Le chunking fixe à 512 tokens avec 10% d'overlap, c'est le standard. Ça marche bien dans tous les benchmarks.

### Ce qu'on a constaté

Sur des documents structurés (bilans, contrats avec clauses numérotées), le chunking fixe coupe systématiquement au mauvais endroit. Une clause juridique coupée en deux donne deux chunks inutilisables : le premier n'a pas de conclusion, le second n'a pas de contexte.

**Ce qu'on utilise maintenant :** chunking sémantique basé sur la structure du document. On détecte les sections (heading levels, numérotation de clauses) et on chunk au niveau des unités de sens naturelles. Le chunk peut être 80 tokens ou 1200 tokens — peu importe, tant qu'il est cohérent.

Résultat sur nos benchmarks internes : +23% de pertinence sur les questions qui croisent plusieurs parties d'un même document.

---

## 3. Retrieval : le problème du top-k

### L'illusion du recall

Augmenter k (nombre de chunks récupérés) améliore le recall mais dégrade la précision. Avec k=20, le LLM se noie dans des chunks vaguement pertinents et hallucine des synthèses qui mixent des informations de documents différents.

**Ce qu'on utilise maintenant :** retrieval en deux passes.

1. **Sparse + dense hybrid** : BM25 pour le lexical, embeddings pour le sémantique. Score combiné. On garde top-20.
2. **Reranking cross-encoder** : on passe les 20 candidats dans un cross-encoder (on utilise \`ms-marco-MiniLM-L-6-v2\`). On ne garde que le top-5.

Le reranking coûte ~40ms de latence supplémentaire. C'est le meilleur investissement qu'on ait fait sur ce stack.

---

## 4. Évaluation : la partie que tout le monde évite

C'est le sujet dont personne ne parle parce que c'est ingrat et coûteux. Mais sans évaluation rigoureuse, on optimise à l'aveugle.

### Notre framework d'évaluation

On utilise RAGAS avec un dataset de questions/réponses de référence construit manuellement — 50 paires par corpus client. La construction du dataset prend 2-3 jours de travail humain. C'est incompressible.

Métriques suivies :
- **Faithfulness** : la réponse est-elle fondée sur les chunks récupérés ? (lutte contre les hallucinations)
- **Answer Relevancy** : la réponse répond-elle vraiment à la question ?
- **Context Precision** : les chunks récupérés sont-ils pertinents ?
- **Context Recall** : les chunks nécessaires ont-ils été récupérés ?

### Ce qu'on a découvert

Sur notre premier déploiement, faithfulness = 0.71. Soit 29% de réponses avec des éléments inventés. En production. Sur des documents juridiques. Problème.

Le coupable : le prompt système. On demandait au LLM de "répondre de manière complète" — ce qui l'encourageait à compléter les trous avec ses connaissances paramétrique plutôt que de dire "je ne sais pas".

Correction : instruction explicite de ne jamais aller au-delà des sources, avec phrase de fallback calibrée. Faithfulness → 0.94 après 3 itérations.

---

## 5. Ce qui ne fonctionne pas (encore)

**Questions multi-hop** : "Quelle était la marge brute du client X en 2023 et comment a-t-elle évolué par rapport à 2022 ?" — le retrieval récupère bien les deux documents, mais la synthèse comparative reste fragile. On travaille sur du graph RAG pour les relations inter-documents.

**Requêtes ambiguës** : quand l'utilisateur ne sait pas ce qu'il cherche, le retrieval récupère des chunks corrects mais la réponse est inutile. Problème de reformulation de requête, pas de RAG.

**Mises à jour fréquentes du corpus** : re-indexer 180k chunks prend 4h. On a mis en place un indexing incrémental mais c'est encore artisanal.

---

## 6. Stack actuel

\`\`\`
Preprocessing   → unstructured.io + custom parsers PDF/DOCX
Chunking        → semantic chunker maison (Python)
Embeddings      → text-embedding-3-small (OpenAI) ou nomic-embed-text (local)
Vector store    → Qdrant (self-hosted)
BM25            → Elasticsearch (index parallèle)
Reranker        → sentence-transformers ms-marco-MiniLM-L-6-v2
LLM             → Claude 3.5 Sonnet (principal) / GPT-4o (fallback)
Évaluation      → RAGAS + dataset custom
\`\`\`

---

## 7. Ce qu'on ferait différemment

1. Commencer par l'évaluation, pas par l'architecture. On aurait économisé 3 semaines.
2. Ne pas sous-estimer le preprocessing. 80% des problèmes de qualité viennent de documents mal parsés.
3. Le reranking n'est pas optionnel sur des corpus hétérogènes.
4. Tester avec de vraies questions d'utilisateurs finaux dès la semaine 1.

---

## Conclusion

RAG en production, c'est 20% d'architecture et 80% de data engineering et d'évaluation continue. Les articles qui promettent "un RAG fonctionnel en 30 minutes" ne mentent pas sur la technique — ils omettent simplement tout ce qui fait la différence entre un démo et un système fiable.
`;export{e as default};
