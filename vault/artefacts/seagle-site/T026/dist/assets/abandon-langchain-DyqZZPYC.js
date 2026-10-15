const e=`---
title: "Pourquoi on a abandonné LangChain sur 2 projets"
status: publié
date: 2025-02-20
authors: ["Équipe Seagle"]
tags: ["LangChain", "architecture", "opinion", "DX", "LLM"]
readTime: "5 min"
---

## Résumé

On a retiré LangChain de deux projets en production. Pas parce que le framework est mauvais — mais parce qu'il nous coûtait plus qu'il ne nous apportait. Voici ce qu'on a mis à la place et pourquoi.

---

## 1. D'abord, soyons honnêtes

LangChain a accéléré notre démarrage. L'abstraction des appels LLM, les chains prédéfinies, l'intégration des vector stores — quand on explorait, c'était utile. On n'allait pas écrire notre propre parser d'output depuis zéro.

Ce qui suit n'est pas un hatespeech. C'est un retour d'expérience sur un projet qui a atteint ses limites avec un outil spécifique.

---

## 2. Le premier projet : pipeline RAG d'analyse documentaire

### Symptôme

Après 4 mois, notre pipeline RAG avait 7 abstractions LangChain empilées. Chaque mise à jour de version cassait quelque chose. Le debug d'une réponse incorrecte prenait 2-3h parce qu'il fallait comprendre quelle couche avait transformé quoi.

### Le problème fondamental

LangChain ajoute des couches d'abstraction sur des opérations qui ne sont pas si complexes :

\`\`\`python
# Ce que LangChain fait
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    chain_type_kwargs={"prompt": PROMPT}
)
result = qa_chain({"query": question})

# Ce qu'on fait maintenant
chunks = vectorstore.query(question, k=5)
response = llm.chat([
    {"role": "system", "content": SYSTEM_PROMPT},
    {"role": "user", "content": f"Sources:\\n{chunks}\\n\\nQuestion: {question}"}
])
\`\`\`

La version "maison" fait la même chose. Elle est lisible par n'importe quel développeur Python. Elle ne dépend pas d'une version spécifique d'une librairie tierce. Et quand elle bug, on voit exactement où.

### Ce qu'on a migré vers

\`qdrant-client\` directement pour le vector store, SDK Anthropic/OpenAI directement pour les LLMs, un module de 200 lignes pour le retrieval hybride. C'est tout.

---

## 3. Le deuxième projet : agent de classification et routage

### Symptôme

On utilisait \`LangChain Agents\` avec des tools custom. Le comportement de l'agent était imprévisible entre les versions. Un upgrade de \`langchain-core\` avait changé le format de parsing des tool calls — silencieusement. On a découvert le problème en production.

### Le problème fondamental

Les agents LangChain ajoutent une logique de planification et de parsing sur laquelle on n'a pas de contrôle direct. Quand Claude ou GPT-4 génèrent un tool call légèrement hors format, LangChain essaie de parser quand même et produit des résultats incorrects.

Avec le SDK Anthropic directement :

\`\`\`python
response = client.messages.create(
    model="claude-3-5-sonnet",
    tools=tools,
    messages=messages
)
# On gère le tool_use block explicitement
if response.stop_reason == "tool_use":
    for block in response.content:
        if block.type == "tool_use":
            result = dispatch_tool(block.name, block.input)
\`\`\`

C'est 20 lignes de plus. Et on sait exactement ce qui se passe.

---

## 4. Ce qu'on garde de LangChain

**Pour le prototypage rapide**, LangChain reste utile. Quand on explore un nouveau cas d'usage et qu'on veut une preuve de concept en 2 heures, les abstractions font gagner du temps.

**LangSmith** (le tracing/observabilité) est bon. On continue à l'utiliser indépendamment de LangChain pour tracer nos appels LLM.

**Les document loaders** — pour parser des formats exotiques (Notion, Confluence, SharePoint), les intégrations LangChain sont souvent meilleures que ce qu'on écrirait soi-même. On les importe à la carte sans prendre le reste.

---

## 5. Ce qui nous a convaincu de migrer

Trois critères ont dicté la décision :

1. **Debuggabilité** : quand quelque chose ne fonctionne pas, peut-on trouver pourquoi en moins de 30 minutes ? Avec nos stacks custom, oui. Avec LangChain, pas toujours.

2. **Stabilité** : les breaking changes entre versions mineures de LangChain sont fréquents. Sur des projets en production avec des SLAs, c'est un risque réel.

3. **Dépendance** : LangChain a son propre modèle mental ("chains", "runnables", "LCEL"). Tout nouveau développeur doit apprendre LangChain avant d'être productif. Notre code custom ne demande que Python et les SDKs officiels.

---

## 6. Le framework qu'on recommande aujourd'hui

Pour des applications LLM en production :

- **SDK officiel du provider** (Anthropic, OpenAI) pour les appels LLM
- **Client natif du vector store** (Qdrant, Pinecone, Weaviate) pour les embeddings
- **Un module custom léger** (200-400 lignes) pour la logique RAG spécifique au projet
- **LangSmith ou Langfuse** pour l'observabilité

Ce n'est pas plus complexe que LangChain. C'est juste plus transparent.

---

## Conclusion

LangChain a résolu un vrai problème en 2023 : l'absence d'abstractions standard pour les apps LLM. Depuis, les SDKs officiels ont mûri, les patterns se sont stabilisés, et la complexité de LangChain est devenue un coût sans contrepartie pour nos cas d'usage.

La règle qu'on applique maintenant : **si tu ne comprends pas ce que fait l'abstraction, ne l'utilise pas en production.**
`;export{e as default};
