# AMTA Lexicography Assistant — v1.3

**A Google Sheets™ Add-on that compiles specialized academic dictionaries intelligently.**

AMTA Lexicography Assistant operationalises the AI-augmented **Method of Triangulation Approach (AMTA)** for specialised lexicography. It turns Google Sheets™ into a lexicographic workstation that automates term extraction, corpus-statistical validation, and multilingual definition drafting — grounded in real academic literature rather than raw model output.

- **Live page:** <https://waleedmandour.org/projects/AMTA/>
- **Install (free):** [Google Workspace Marketplace](https://workspace.google.com/marketplace/app/amta_lexicography_assistant/331538166887)

## What it does

1. **Term Discovery** — retrieves domain-specific terminology from 8+ academic APIs: Semantic Scholar, Scopus, OpenAlex, Europe PMC, CORE, arXiv, and Google Scholar (via SerpApi).
2. **Statistical Validation** — computes Keyness scores and reference frequencies against the built-in BAWE corpus to confirm genuine academic usage.
3. **RAG Definitions** — reads the abstracts of real papers before prompting Gemini to draft definitions, translations (Arabic, Spanish, French, Chinese, and more), and usage examples — minimising hallucination.
4. **Export & Publish** — exports to Lexonomy-ready XML, JSON, or CSV directly to Google Drive.

## What's new in v1.3

- **Resilient multi-provider AI** — Gemini remains primary; users may add a free **Groq** API key (cloud) or a local **LM Studio** server as automatic fallbacks.
- **Bilingual user guide (EN/AR)** — a professional Modern Standard Arabic edition of the full guide, with one-click language switching and in-app PDF export.
- **Adaptive quota management** — per-user keys, adaptive pacing, automatic model discovery, and circuit-breaker protection.
- **Extended diagnostics** — a Provider Settings dialog, per-provider connection tests, and a consolidated API Quotas & Limits report.

## Documentation

| Document | Purpose |
|---|---|
| [Setup Guide](setup.html) | Installation, API keys, and first run |
| [Privacy Policy](privacy.html) | Data handling and storage |
| [Terms of Service](terms.html) | Conditions of use |
| [Support](support.html) | Help and contact |

## Academic citation

If you use this tool or its methodology in your research, please cite the foundational framework:

> Mandour, W. (2025, December 23). *AI-augmented Method of Triangulation Approach for specialised lexicography*. OSF. <https://doi.org/10.17605/OSF.IO/8QB9V>

## Data attribution

Scholarly metadata and abstracts are retrieved via the [Semantic Scholar Open Data Platform](https://www.semanticscholar.org/product/api) (Kinney et al., 2023, *arXiv:2301.10140*), in accordance with their attribution guidelines.
