const e=`---
title: "Fine-tuning vs prompting : notre retour terrain"
status: publié
date: 2025-02-03
authors: ["Équipe Seagle"]
tags: ["fine-tuning", "prompting", "LLM", "B2B", "coût"]
readTime: "6 min"
---

## Résumé

On a testé les deux approches sur 3 projets clients réels : classification d'emails B2B, extraction d'entités dans des contrats, et génération de comptes-rendus de réunion. Le verdict n'est pas celui qu'on attendait.

---

## 1. La question qu'on nous pose tout le temps

"On devrait fine-tuner notre propre modèle ?"

La réponse honnête : dans 80% des cas non. Mais les 20% restants sont exactement là où vos concurrents ne vont pas.

---

## 2. Projet 1 — Classification d'emails B2B

### Contexte

Un distributeur industriel reçoit ~300 emails/jour : demandes de devis, réclamations, relances, demandes techniques. L'objectif était de classer automatiquement et de router vers le bon service.

### Approche prompting

GPT-4o avec un prompt de classification en few-shot (8 exemples par catégorie). Précision sur notre set de test : **91.2%**. Temps de développement : 2 jours. Coût par email : ~0.004€.

### Approche fine-tuning

Fine-tuning de \`gpt-4o-mini\` sur 800 exemples labelisés (4 jours de préparation des données + 2h de training). Précision sur le même set de test : **94.7%**. Coût par email après fine-tuning : ~0.0008€ (5× moins cher).

### Verdict

Pour ce cas d'usage, le fine-tuning gagne sur les deux tableaux : précision légèrement supérieure ET coût opérationnel bien plus bas. Le ROI se calcule en semaines dès que le volume est là.

**Quand fine-tuner ici :** dès que le volume dépasse ~500 emails/jour. En dessous, le gain ne compense pas le coût de préparation des données.

---

## 3. Projet 2 — Extraction d'entités dans des contrats

### Contexte

Extraction structurée dans des contrats de prestation de services : parties, durée, montant, conditions de résiliation, pénalités. Documents longs (20-80 pages), format très variable selon les cabinets.

### Approche prompting

Claude 3.5 Sonnet avec un prompt détaillé + structured outputs (JSON). Précision globale sur 50 contrats : **87%** avec de fortes disparités selon les champs. Le montant et les parties : 96%. Les conditions de résiliation : 71% (clauses ambiguës, rédigées en langage oblique).

### Approche fine-tuning

On a préparé 150 contrats annotés. Fine-tuning sur GPT-4o-mini. Résultat : amélioration marginale sur les champs simples, aucune amélioration significative sur les clauses complexes.

**Pourquoi ça n'a pas marché :** le problème n'était pas le modèle — c'était l'ambiguïté intrinsèque du texte juridique. Le fine-tuning apprend des patterns, il ne résout pas l'ambiguïté sémantique. Ce qu'il nous fallait, c'était un meilleur prompt + une étape de validation humaine sur les champs à risque.

### Verdict

**Ici, le fine-tuning n'a pas aidé.** Le prompting soigneusement ingénié avec Claude 3.5 était déjà au plafond atteignable sans annotation humaine post-extraction.

---

## 4. Projet 3 — Comptes-rendus de réunion

### Contexte

Génération de comptes-rendus structurés depuis des transcriptions de réunions (Zoom/Teams). Format client imposé : décisions, actions, responsables, dates. Ton corporate spécifique à l'entreprise.

### Approche prompting

GPT-4o avec un prompt incluant le format attendu et 3 exemples de comptes-rendus validés. Satisfaction des utilisateurs : "ça marche mais ça ne ressemble pas à nos CRs".

**Le problème :** le ton, le niveau de détail, la façon de formuler les actions (infinitif vs substantif, style direct vs indirect) — tout ça est spécifique à la culture interne de l'entreprise. Impossible à capturer dans un prompt sans l'alourdir démesurément.

### Approche fine-tuning

Fine-tuning sur 60 paires (transcription → compte-rendu validé). Résultat : les utilisateurs ont arrêté de faire des corrections sur le fond. Ils modifient encore ~15% des formulations, contre 55% avant.

### Verdict

**Le fine-tuning gagne clairement quand le style est l'enjeu principal.** C'est impossible à capturer par prompting sans un prompt de 2000 tokens qui dégrade les performances. Ici, 60 exemples suffisaient.

---

## 5. Le modèle de décision qu'on utilise maintenant

\`\`\`
Prompting en premier si :
  ✓ Volume faible ou incertain
  ✓ Le problème est de la compréhension, pas du style
  ✓ Le domaine évolue vite (le fine-tuning devient obsolète)
  ✓ Pas de données annotées disponibles

Fine-tuning si :
  ✓ Volume élevé + coût opérationnel important
  ✓ Style ou format très spécifique impossible à capturer en prompt
  ✓ Tâche de classification simple avec beaucoup d'exemples
  ✓ Latence critique (les modèles fine-tunés sont souvent plus rapides)
\`\`\`

---

## 6. Ce qu'on aurait voulu savoir plus tôt

**La préparation des données, c'est 70% du travail.** Si vous n'avez pas au moins 100 exemples annotés de qualité, ne fine-tunez pas.

**Le fine-tuning ne corrige pas un problème de données.** Si votre tâche est mal définie, vous allez juste apprendre à reproduire les erreurs du passé.

**Tester le prompting sérieusement avant de conclure que c'est insuffisant.** On est surpris du nombre de cas où un prompt bien travaillé (chain-of-thought, few-shot structuré, persona) rattrape 80% du gap avec le fine-tuning.

---

## Conclusion

Fine-tuning et prompting ne sont pas en compétition — ils répondent à des questions différentes. Le prompting répond à "comment utiliser un modèle généraliste ?" Le fine-tuning répond à "comment avoir un modèle spécialisé pour ma tâche spécifique ?"

La question utile n'est pas "lequel est meilleur ?" mais "pour ce cas d'usage, à ce volume, avec ces contraintes — lequel a le meilleur ROI ?"
`;export{e as default};
