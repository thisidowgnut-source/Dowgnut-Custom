# 07 — DOHNUT AI DOCUMENTATION SYSTEM™ v1.0.0

> Layer 7: Prompts + Skills + Governance = AI Operating System.

## Struktur Asal (dari package v1.0.0)

```text
dohnut-ai-documentation/
├── README.md
├── 00-system-index.md
├── 08-changelog.md
├── prompts/00-prompt-catalog-v1.0.0.md
├── skills/
│   ├── 01-skill-taxonomy-v1.0.0.md
│   └── 02-skill-matrix-v1.0.0.md
├── governance/
│   ├── 01-governance-and-conventions.md
│   ├── 02-glossary-v1.0.0.md
│   ├── 03-quality-gates-v1.0.0.md
│   └── 04-implementation-roadmap-v1.0.0.md
└── schemas/
    ├── 01-data-contracts-v1.0.0.md
    └── prompt-registry.yaml
```

## A. PROMPT STANDARD

Setiap prompt library entry mesti ada:

- Context
- Persona
- Required inputs
- Optional inputs
- Output format
- Constraints
- Few-shot examples
- Versioning (semver)

Kategori: Content Generation · Data Analysis · Coding · Quality Review · Project Management · Brand/Creative · AI Orchestration

## B. SKILL FRAMEWORK

| Kategori | Contoh |
|---|---|
| Domain skills | Industri/domain knowledge |
| Tool skills | Python, SQL, Figma, AI APIs, Hugging Face, LangChain |
| Analytical skills | Critical thinking, statistical reasoning, data modelling |
| Communication skills | Technical writing, presentation, collaboration |

**Skill levels:** Asas → Lanjutan → Ekspert

## C. MARKDOWN STANDARD

- YAML front matter
- H1/H2/H3/H4 hierarchy
- Consistent tables
- Syntax-highlighted code blocks
- Nested lists maksimum 3 levels
- Internal + external links
- Consistent terminology + file naming convention
- Cross references
- Semantic versioning + CHANGELOG

## Quality Gates

1. Brand compliance (palette, voice, DOH rules)
2. Parody safety (guardrails 05)
3. Visual QA 3-soalan (06)
4. Prompt versioning (registry)
