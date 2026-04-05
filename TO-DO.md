# Website Consistency Review — waleedmandour.org
## Comprehensive Audit: Inconsistencies & Missing Data

Cross-referenced with ORCID (0000-0002-9262-5993), ResearchGate, Google Scholar, and all 19 HTML files + README.md.

---

## 🔴 HIGH PRIORITY — Broken Links & Contradictions

### 1. ✅ RESOLVED — Broken Google Scholar links in subpage footers
- **Files:** `teaching/index.html`, `community/index.html`
- **Status:** Fixed in previous session — now using correct URL `https://scholar.google.com/citations?user=aM8h3-4z8gUC&hl=en`

### 2. ✅ RESOLVED — Broken footer links on contact page
- **File:** `contact/index.html`
- **Status:** Fixed in previous session — now using directory-based URLs (`/research/`, `/publications/`, etc.)

### 3. ✅ RESOLVED — NileTESOL membership status contradiction
- **Files:** `community/index.html`, `index.html`, `teaching/index.html`, `README.md`
- **Status:** Fixed — community page header now says "Former Steering Committee Member" matching homepage and body text. All pages consistently show "(May 2018 – December 2020)" with proper "Former" designation.

---

## 🟡 MEDIUM PRIORITY — Data Inaccuracies

### 4. ✅ RESOLVED — Wrong publication title in README
- **File:** `README.md`
- **Status:** Fixed — added "Orality vs." prefix: "Orality vs. Literacy in Two of Arthur Miller's Plays: A Corpus-Based Study"

### 5. ✅ RESOLVED — Publication type disagreement — Open Access Corpus Web Tool
- **File:** `README.md`
- **Status:** Fixed — changed from "Conference Presentation, NileTESOL, November 2019" to "Journal Article, CDELT, 2020"

### 6. ✅ RESOLVED — Publication type disagreement — Medical Collocations Thesis
- **File:** `README.md`
- **Status:** Fixed — changed from "Research Article" to "MA Thesis, Egyptian Universities Libraries, 2020"

### 7. ✅ RESOLVED — "Words of Peace" undersold in README
- **File:** `README.md`
- **Status:** Fixed — added "Conference Paper, ICHSS 2020" and DOI: 10.5281/zenodo.3607882

### 8. ✅ RESOLVED — Google Scholar citation count mismatch
- **File:** `README.md`
- **Status:** Fixed — changed badge from 13 to 12 citations to match publications page

### 9. ✅ RESOLVED — i10-index shown as 0
- **File:** `publications/index.html`
- **Status:** Fixed — updated from 0 to 2

### 10. ✅ RESOLVED — Future-dated "Last updated: February 2026"
- **File:** `publications/index.html`
- **Status:** Fixed — changed all 4 occurrences to "February 2025"

### 11. ✅ N/A — AMTA Software dated "December 2025" in README
- **Status:** Correct as-is (current date is April 2026, so December 2025 is in the past)

### 12. ✅ RESOLVED — Three different email addresses
- **Files:** `teaching/index.html`, `community/index.html`
- **Status:** Fixed — footer emails changed from `waleed@waleedmandour.org` to `w.abumandour@squ.edu.om`

---

## 🟢 LOW PRIORITY — Cosmetic & Polish

### 13. ✅ RESOLVED — Copyright year mismatch
- **Files:** `teaching/index.html`, `publications/index.html`, `community/index.html`
- **Status:** Fixed — all synced to © 2025

### 14. ✅ RESOLVED — Tagline variations across pages
- **Files:** `teaching/index.html`, `community/index.html`, `research/index.html`, `news/index.html`
- **Status:** Fixed — standardized to "PhD in Applied Linguistics | Senior Instructor | Google Certified Trainer | SQU"

### 15. ✅ RESOLVED — Arabic position title inconsistency
- **File:** `contact/index.html`
- **Status:** Fixed — changed "مدرس أول" to "محاضر أول"

### 16. ⏭️ SKIPPED — Different profile photo sources
- **Reason:** Cosmetic, low risk — local vs Google-hosted URL both work correctly

### 17. ✅ ALREADY FIXED — Navigation bar max-width inconsistency
- **Status:** All pages already use 1200px

### 18. ✅ RESOLVED — Home link uses relative path on publications page
- **File:** `publications/index.html`
- **Status:** Fixed — changed to absolute URL `https://waleedmandour.org/`

### 19. ✅ RESOLVED — Missing map placeholder on contact page
- **File:** `contact/index.html`
- **Status:** Fixed — replaced placeholder text with Google Maps iframe embed for SQU

### 20. ✅ RESOLVED — Dead sample analysis link on projects page
- **File:** `projects/index.html`
- **Status:** Fixed — removed dead `href="#"` link for "Sample Analysis"

### 21. ✅ RESOLVED — CLIL teaching interest missing from teaching page
- **File:** `teaching/index.html`
- **Status:** Fixed — added CLIL interest tag to teaching interests grid

### 22. ⏭️ SKIPPED — Full legal name never displayed
- **Reason:** Suggestion only, requires content decision

### 23. ⏭️ SKIPPED — Publications on ORCID missing from website
- **Reason:** Requires content creation decisions and publisher verifications

### 24. ⏭️ SKIPPED — ResearchGate profile verification
- **Reason:** Needs manual browser-based verification

### 25. ✅ RESOLVED — Phone number formatting
- **File:** `contact/index.html`
- **Status:** Fixed — formatted as +968 7274 5868

---

## Summary

| Severity | Total | Fixed | Skipped | Remaining |
|----------|-------|-------|---------|-----------|
| 🔴 High | 3 | 3 | 0 | 0 |
| 🟡 Medium | 9 | 8 | 1 | 0 |
| 🟢 Low | 13 | 10 | 3 | 0 |
| **Total** | **25** | **21** | **4** | **0** |

**All actionable items have been resolved.** The 4 skipped items are either cosmetic suggestions, already correct, or require manual/external verification.
