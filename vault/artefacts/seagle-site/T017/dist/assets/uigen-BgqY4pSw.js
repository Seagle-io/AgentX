const n=`---
title: "UIgen — Génération de composants React par prompt naturel"
status: prototype
date: 2025-02-03
authors: ["Équipe Seagle"]
tags: ["codegen", "React", "Tailwind", "prompt-engineering", "LLM", "AST"]
readTime: "10 min"
---

## Résumé

UIgen est un prototype explorant la génération automatique de composants React/Tailwind CSS à partir de descriptions en langage naturel. L'expérience vise à comprendre les limites réelles du pair-programming IA sur des bases de code existantes — pas sur des exemples synthétiques, mais sur des projets en production.

> **Statut :** Prototype fonctionnel. Taux de composants utilisables sans modification : 61%. Expérience non recommandée en production dans l'état actuel.

---

## 1. Contexte

### 1.1 Ce qu'on voulait tester

Depuis GPT-4 et Claude 3, il est possible de générer du code React correct syntaxiquement. La vraie question n'est pas *"peut-on générer du code ?"* mais *"le code généré s'intègre-t-il dans une base de code réelle ?"*

Nos contraintes spécifiques :
- Tailwind CSS v4 (config via CSS, pas via \`tailwind.config.js\`)
- Design system maison avec tokens CSS custom
- Composants basés sur Radix UI
- TypeScript strict

### 1.2 Hypothèse

> *Avec un contexte de codebase suffisamment riche injecté dans le prompt, un LLM peut générer des composants directement intégrables dans > 70% des cas.*

---

## 2. Méthodologie

### 2.1 Construction du contexte

La clé d'un bon codegen est le contexte fourni au modèle. Notre prompt système inclut :

\`\`\`
CONTEXTE CODEBASE:
- Stack: React 18, TypeScript, Tailwind CSS v4
- Imports courants: {liste des imports fréquents}
- Design tokens: {extrait de style.css}
- Exemple de composant existant: {composant de référence}
- Conventions de nommage: {exemples}
- Pattern d'export: export default function ComponentName()
\`\`\`

Ce contexte est généré **dynamiquement** en analysant les 20 derniers fichiers modifiés dans le projet.

### 2.2 Pipeline de génération

\`\`\`
Prompt utilisateur
        │
        ▼
  Context Builder
  (analyse AST des fichiers récents)
        │
        ▼
  Prompt Assembly
  (system + context + user prompt)
        │
        ▼
  Claude 3.5 Sonnet
  (temperature: 0.2, max_tokens: 4096)
        │
        ▼
  Code Extractor
  (parsing markdown → blocs code)
        │
        ▼
  AST Validator
  (TypeScript compiler API)
        │
        ▼
  Composant généré
\`\`\`

### 2.3 Validation AST

Avant de présenter le composant à l'utilisateur, nous validons la syntaxe via l'API TypeScript :

\`\`\`typescript
import ts from "typescript"

function validateComponent(code: string): ValidationResult {
  const sourceFile = ts.createSourceFile(
    "generated.tsx",
    code,
    ts.ScriptTarget.Latest,
    true
  )
  const diagnostics = ts.getPreEmitDiagnostics(
    ts.createProgram(["generated.tsx"], { strict: true })
  )
  return {
    valid: diagnostics.length === 0,
    errors: diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, "\\n"))
  }
}
\`\`\`

---

## 3. Résultats

### 3.1 Taux de succès par complexité

Nous avons évalué 120 prompts couvrant différentes complexités :

| Complexité | Description | Utilisable sans modif | Utilisable avec modif | Inutilisable |
|---|---|---|---|---|
| Simple | Bouton, badge, avatar | **89%** | 9% | 2% |
| Moyen | Card avec états hover, form field | **71%** | 22% | 7% |
| Complexe | Tableau avec sorting, modal avec animation | **38%** | 41% | 21% |
| Expert | DataGrid, Command Palette | **12%** | 35% | 53% |

**Taux global : 61%** — loin de notre hypothèse de 70%.

### 3.2 Causes d'échec

| Cause | Fréquence |
|---|---|
| Import manquant ou incorrect | 34% |
| Non-respect du design system (tokens) | 28% |
| Logique d'état incorrecte | 19% |
| Tailwind v4 vs v3 confusion | 14% |
| Autres | 5% |

> **Observation :** La confusion Tailwind v3/v4 est systématique. Les modèles ont été entraînés massivement sur Tailwind v3 et génèrent souvent \`tailwind.config.js\` ou des configurations incompatibles avec la syntaxe v4.

### 3.3 Ce qui fonctionne bien

- Composants purement présentationnels (pas de state)
- Refactoring de composants existants ("rends ce composant responsive")
- Génération de variantes ("crée une version dark de ce bouton")
- Documentation JSDoc

---

## 4. Limites identifiées

### 4.1 Le contexte ne suffit pas pour les patterns implicites

Certaines conventions ne sont pas verbalisables facilement. Par exemple : *"on n'utilise jamais de margin sur les composants racines, seulement du padding"* — cette règle n'est nulle part dans le code, elle est dans les têtes de l'équipe.

### 4.2 Cohérence à grande échelle

Générer un composant isolé fonctionne. Générer 10 composants cohérents entre eux est beaucoup plus difficile sans un système de vérification de cohérence inter-composants.

### 4.3 Animations Framer Motion

Le LLM génère des animations syntaxiquement correctes mais visuellement pauvres. L'animation est un domaine où l'intuition visuelle ne se compense pas par du contexte textuel.

---

## 5. Ce qu'on a appris

**UIgen est utile comme accélérateur, pas comme remplaçant.** Le bon usage est :

1. Générer un premier jet (~2 min vs ~15 min manuellement)
2. Corriger les 2–3 problèmes habituels (~5 min)
3. Affiner visuellement (~10 min)

Gain net : ~40% sur la durée de création d'un composant moyen.

---

## 6. Prochaines étapes

- [ ] Fine-tuning sur notre design system (via LoRA sur un modèle open-source)
- [ ] Intégration d'un linter de cohérence inter-composants
- [ ] Support Storybook : générer les stories en même temps
- [ ] Évaluation sur d'autres stacks (Vue 3, Svelte)

---

## 7. Références

1. Chen, M. et al. — *"Evaluating Large Language Models Trained on Code"* (Codex), arXiv 2021
2. Rozière, B. et al. — *"Code Llama: Open Foundation Models for Code"*, arXiv 2023
3. Anthropic — *"Claude's approach to code generation"*, docs.anthropic.com
4. TypeScript Compiler API — https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
`;export{n as default};
