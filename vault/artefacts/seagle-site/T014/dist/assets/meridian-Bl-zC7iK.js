const e=`---
title: "Meridian — Extraction sémantique structurée sur documents PDF complexes"
status: prototype
date: 2025-03-01
authors: ["Équipe Seagle"]
tags: ["extraction", "PDF", "structured-outputs", "NLP", "Zod", "multimodal"]
readTime: "11 min"
---

## Résumé

Meridian est un prototype d'extraction sémantique structurée appliquée à des documents PDF complexes : bilans comptables, contrats juridiques, appels d'offres publics. L'objectif est de produire des objets JSON typés et validés depuis des documents hétérogènes, avec une précision suffisante pour alimenter des systèmes downstream sans validation manuelle systématique.

> **Statut :** Prototype. Précision suffisante sur les bilans simples (F1 = 0.89). Travaux en cours sur les contrats multi-parties et les appels d'offres.

---

## 1. Contexte

### 1.1 Le problème de l'extraction PDF

Les PDFs sont le format de facto des documents B2B en France. Ils sont aussi l'un des formats les plus difficiles à parser :

- **PDFs natifs** : texte extractible mais sans structure sémantique
- **PDFs scannés** : OCR nécessaire, avec bruit
- **PDFs générés depuis Word** : structure préservée mais encodage parfois corrompu
- **Tableaux** : rarement bien encodés, souvent des images

La chaîne classique (PDF → texte → regex → JSON) échoue dès qu'un document sort du format attendu.

### 1.2 Ce que Meridian tente

Meridian utilise une approche en deux phases :

1. **Extraction multimodale** : traitement du PDF comme image + texte simultanément
2. **Validation typée** : les sorties LLM sont validées contre un schéma Zod avant d'être acceptées

---

## 2. Architecture

### 2.1 Phase 1 : Parsing hybride

\`\`\`typescript
async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  // Extraction texte (pdfjs)
  const textContent = await extractText(buffer)

  // Rendu pages en images (pdf2pic)
  const pageImages = await renderPages(buffer, { dpi: 150 })

  // Détection des tables (Camelot via Python bridge)
  const tables = await extractTables(buffer)

  return { textContent, pageImages, tables }
}
\`\`\`

### 2.2 Phase 2 : Extraction LLM avec structured outputs

\`\`\`typescript
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"

const BilanSchema = z.object({
  entreprise: z.object({
    nom: z.string(),
    siret: z.string().regex(/^\\d{14}$/),
    exercice: z.number().int().min(2000).max(2030),
  }),
  actif: z.object({
    immobilisations: z.number(),
    creances: z.number(),
    tresorerie: z.number(),
    total: z.number(),
  }),
  passif: z.object({
    capitauxPropres: z.number(),
    dettes: z.number(),
    total: z.number(),
  }),
  resultat: z.number(),
})

const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 2048,
  tools: [{
    name: "extract_bilan",
    description: "Extraire les données structurées d'un bilan comptable",
    input_schema: zodToJsonSchema(BilanSchema),
  }],
  tool_choice: { type: "tool", name: "extract_bilan" },
  messages: [{ role: "user", content: buildPrompt(parsedDoc) }],
})
\`\`\`

### 2.3 Validation et réconciliation

La validation Zod est stricte : si un champ obligatoire est manquant ou mal formaté, le document passe en **révision manuelle** plutôt qu'en échec silencieux.

\`\`\`typescript
const parsed = BilanSchema.safeParse(extractedData)

if (!parsed.success) {
  // Log des erreurs de validation
  await flagForReview(documentId, parsed.error.issues)
  return { status: "needs_review", errors: parsed.error.issues }
}

// Vérification de cohérence comptable
const actifTotal = parsed.data.actif.total
const passifTotal = parsed.data.passif.total
const delta = Math.abs(actifTotal - passifTotal)

if (delta > actifTotal * 0.01) { // tolérance 1%
  await flagForReview(documentId, [{ field: "balance", issue: \`Déséquilibre bilan : \${delta}€\` }])
}
\`\`\`

---

## 3. Résultats par type de document

### 3.1 Bilans comptables (format Liasse Fiscale)

| Métrique | Score |
|---|---|
| F1 champs numériques | **0.89** |
| SIRET extrait correctement | 94.7% |
| Exercice extrait correctement | 98.2% |
| Cohérence Actif = Passif | 87.3% |
| Temps moyen par document | 4.2s |

### 3.2 Contrats (travaux en cours)

Les contrats présentent des difficultés spécifiques :

- **Clauses conditionnelles** : "sauf en cas de..." rend l'extraction binaire inadaptée
- **Références croisées** : une clause peut modifier une autre clause plusieurs pages plus loin
- **Versions successives** : un contrat peut être un avenant à un contrat non fourni

Résultats préliminaires sur 40 contrats de prestation simple :

| Champ | Précision |
|---|---|
| Parties contractantes | 96% |
| Date de signature | 91% |
| Durée du contrat | 84% |
| Montant total | 79% |
| Conditions de résiliation | **52%** |

> La faible performance sur les conditions de résiliation reflète leur diversité de formulation et leur nature souvent implicite ou multifactorielle.

### 3.3 Appels d'offres publics (BOAMP/TED)

Non encore évalués formellement. Observation qualitative : la structure très standardisée des AO BOAMP facilite l'extraction. Les AO européens (TED) sont plus variables.

---

## 4. Multimodalité : apport réel ?

Nous avons comparé extraction texte seul vs texte + image sur 100 bilans :

| Approche | F1 | Coût/doc | Latence |
|---|---|---|---|
| Texte seul (pdfjs) | 0.83 | $0.004 | 2.1s |
| **Texte + images pages** | **0.89** | $0.018 | 4.2s |
| Images seules | 0.81 | $0.022 | 5.8s |

L'apport de la vision (+6 points de F1) justifie le surcoût sur les documents avec des tableaux complexes. Pour les bilans simples sans tableaux, le texte seul suffit.

---

## 5. Cas limites identifiés

### 5.1 PDFs scannés en couleur

Les PDFs scannés en couleur avec fond non-blanc dégradent significativement l'OCR. Pré-traitement nécessaire : binarisation + déskewing.

### 5.2 Bilans consolidés

Les bilans consolidés de groupes incluent des entités multiples et des éliminations d'interco. Notre schéma actuel ne les gère pas — ils sont flaggés automatiquement.

### 5.3 Annotations manuscrites

Certains documents scannés incluent des annotations au stylo. Elles sont parfois confondues avec le contenu imprimé.

---

## 6. Prochaines étapes

- [ ] Schéma contrats complets (conditions générales, SLA, pénalités)
- [ ] Support des PDFs chiffrés (déchiffrement avec mot de passe fourni)
- [ ] Interface de correction humaine avec apprentissage actif
- [ ] Benchmark sur appels d'offres BOAMP (100 documents)
- [ ] Publication du schéma Zod "Bilan" en open-source

---

## 7. Références

1. Anthropic — *"Tool use (function calling)"*, docs.anthropic.com (2024)
2. Camelot — *Table Extraction for Humans*, https://camelot-py.readthedocs.io
3. Colbert, O. et al. — *"DocLayNet: A Large Human-Annotated Dataset for Document-Layout Segmentation"*, KDD 2022
4. Zod — TypeScript-first schema validation, https://zod.dev
5. Direction Générale des Finances Publiques — *Format Liasse Fiscale 2025*, impots.gouv.fr
`;export{e as default};
