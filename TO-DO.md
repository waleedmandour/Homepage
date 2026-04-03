# Website Consistency Review — waleedmandour.org
## Comprehensive Audit: Inconsistencies & Missing Data

Cross-referenced with ORCID (0000-0002-9262-5993), ResearchGate, Google Scholar, and all 19 HTML files + README.md.

---

## 🔴 HIGH PRIORITY — Broken Links & Contradictions

### 1. Broken Google Scholar links in subpage footers
- **Files:** `teaching/index.html` (line 839), `community/index.html` (line 751)
- **Problem:** Footer links to `https://scholar.google.com/citations?user=waleedmandour` — this is an invalid profile URL (missing the correct user ID)
- **Should be:** `https://scholar.google.com/citations?user=aM8h3-4z8gUC&hl=en`
- **Impact:** Visitors clicking the Google Scholar icon get a 404/error page

### 2. Broken footer links on contact page
- **File:** `contact/index.html` (lines 966–1004)
- **Problem:** Footer uses `.html` extension links: `research.html`, `publications.html`, `projects.html`, `news.html`, `contact.html` — but the actual site uses directory-based URLs (`/research/`, `/publications/`, etc.)
- **Impact:** All footer navigation links on the contact page produce 404 errors

### 3. NileTESOL membership status contradiction
- **README.md (line 196):** "Steering Committee Member, NileTESOL (May 2018 – **Present**)" — claims still active
- **index.html (line 848):** "**former** Steering Committee Member of NileTESOL" — claims no longer active
- **community/index.html (line 664):** "**Former** Steering Committee Member of NileTESOL" — claims no longer active
- **teaching/index.html (line 769):** Lists "NileTESOL" as current role with no end date — implies still active
- **Action needed:** Decide which is correct and update all pages consistently

---

## 🟡 MEDIUM PRIORITY — Data Inaccuracies

### 4. Wrong publication title in README
- **File:** `README.md` (line 156)
- **Current:** "Literacy in Two of Arthur Miller's Plays: A Corpus-Based Study"
- **Correct (per publications page & ORCID):** "**Orality vs. Literacy** in Two of Arthur Miller's Plays: A Corpus-Based Study"
- **Missing word:** "Orality vs." — changes the entire meaning of the paper

### 5. Publication type disagreement — Open Access Corpus Web Tool
- **README.md (line 162):** Classifies as "Conference Presentation, NileTESOL, November 2019"
- **publications/index.html (line 785):** Classifies as "Journal Article, CDELT, 2020-04-01" with DOI
- **Action needed:** Verify which is correct — a conference presentation or a peer-reviewed journal article (significant credibility difference)

### 6. Publication type disagreement — Medical Collocations Thesis
- **README.md (line 164):** Lists "A Corpus-Based Study of Collocations in the Medical Discourse..." as "Research Article"
- **publications/index.html (line 886):** Correctly classifies as "Dissertation/Thesis"
- **Action needed:** Update README to say "MA Thesis" instead of "Research Article"

### 7. "Words of Peace" — undersold in README
- **README.md (line 160):** Lists only as "Research Article, ResearchGate" — no conference, no DOI
- **publications/index.html (line 810):** Correctly shows it as "Conference Paper, ICHSS 2020" with DOI: `10.5281/zenodo.3607882`
- **Action needed:** Update README to include conference name and DOI

### 8. Google Scholar citation count mismatch
- **README.md badge (line 5):** Claims "13_citations"
- **publications/index.html (line 661):** Shows "12 Total Citations"
- **Action needed:** Verify against live Google Scholar and sync both

### 9. i10-index shown as 0
- **File:** `publications/index.html` (line 681)
- **Problem:** Shows `i10-index: 0`, but with 9+ publications and 12+ citations, this seems incorrect
- **Action needed:** Verify against live Google Scholar profile

### 10. Future-dated "Last updated: February 2026" on publications page
- **File:** `publications/index.html` (lines 721, 736)
- **Problem:** Claims "Last updated: February 2026" — this appears to be a typo/placeholder
- **Action needed:** Update to actual last update date (likely February 2025)

### 11. AMTA Software dated "December 2025" in README
- **File:** `README.md` (line 146)
- **Problem:** Lists AMTA software as "OSF, December 2025" — this is in the future
- **Action needed:** Verify actual publication date and correct if needed

### 12. Three different email addresses used across site
- `w.abumandour@squ.edu.om` — used on index.html, contact/index.html, README.md ✅ (primary)
- `waleedmandour@gmail.com` — used on contact/index.html (personal)
- `waleed@waleedmandour.org` — used in footers of teaching/ (line 840) and community/ (line 752)
- **Action needed:** Verify that `waleed@waleedmandour.org` is a working email address; consider removing or replacing with the SQU address

---

## 🟢 LOW PRIORITY — Cosmetic & Polish

### 13. Copyright year mismatch across pages
- `teaching/index.html` (line 835): © 2024
- `publications/index.html` (line 901): © 2024
- `community/index.html` (line 747): © 2024
- `contact/index.html` (line 1041): © 2025
- **Action needed:** Sync all to © 2025 (or use dynamic year)

### 14. Tagline variations across pages
- **index.html:** PhD | Senior Instructor | Google Certified Trainer | SQU (most complete)
- **teaching/index.html:** PhD | Senior Instructor | Google Certified Trainer (missing SQU)
- **All other subpages:** PhD | Senior Instructor | SQU (missing Google Certified Trainer)
- **Action needed:** Decide on one standard tagline and apply everywhere

### 15. Arabic position title inconsistency
- **contact/index.html (line 847):** Uses "مدرس أول" (more like "Assistant Professor")
- **All other pages:** Use "محاضر أول" ("Senior Instructor/Lecturer")
- **Action needed:** Standardize to "محاضر أول"

### 16. Different profile photo sources
- **index.html (line 600):** Uses local `images/photo.png`
- **All subpages:** Use Google-hosted URL (`lh3.googleusercontent.com/...`)
- **Risk:** If images diverge, homepage shows different photo than subpages
- **Action needed:** Consider using the same source for consistency

### 17. Navigation bar max-width inconsistency
- `teaching/`, `community/`: nav max-width = 900px
- `index.html`, `publications/`, `contact/`, `projects/`: nav max-width = 1000px
- **Action needed:** Standardize to one width

### 18. Home link uses relative path on publications page
- **File:** `publications/index.html` (line 598): `href="index.html"` (relative)
- **All other subpages:** Use `href="https://waleedmandour.org/"` (absolute)
- **Action needed:** Standardize to absolute URLs for consistency

### 19. Missing map placeholder on contact page
- **File:** `contact/index.html` (lines 859–862)
- **Problem:** Shows "(Placeholder for Embedded Google Map of SQU Location)" instead of actual map
- **Action needed:** Embed actual Google Map iframe or remove placeholder

### 20. Dead sample analysis link on projects page
- **File:** `projects/index.html` (line 846)
- **Problem:** iAWE "Sample Analysis" link points to `href="#"` (dead link)
- **Action needed:** Point to actual sample or remove link

### 21. CLIL teaching interest missing from teaching page
- **README.md (line 188):** Lists "Content and Language Integrated Learning (CLIL)" as teaching interest
- **teaching/index.html:** CLIL is absent from the interests grid
- **Action needed:** Add CLIL to teaching page interests section

### 22. Full legal name never displayed
- **ORCID:** Lists "Waleed Saad Mandour"
- **Website:** Only uses "Dr. Waleed Mandour" everywhere
- **Suggestion:** Consider adding full name on contact page or about section for academic indexing purposes

### 23. Publications on ORCID but missing from website publications page
The following items appear on ORCID but not as dedicated entries on publications/index.html:
- "Empowering bilingual lexicography with AI: AMTA in dictionary design" (AsiaLex 2024)
- "Student Peer Assessment Suite" (OSF software)
- "Egyptian Medical Corpora" (OSF dataset)
- "iAWE Student Corpus" (OSF dataset)
- **Note:** Some are listed in README.md research tools table, but not on the publications page itself

### 24. ResearchGate profile verification needed
- **URL:** `https://www.researchgate.net/profile/Waleed-Mandour`
- **Problem:** ResearchGate returned a CAPTCHA/security check, so profile content couldn't be verified
- **Action needed:** Manually verify the link still works and profile data is current

### 25. Phone number displayed without formatting
- **File:** `contact/index.html` (line 819)
- **Problem:** Raw number `+96872745868` displayed without spaces/dashes
- **Suggestion:** Format as `+968 7274 5868` for readability

---

## Summary

| Severity | Count | Categories |
|----------|-------|------------|
| 🔴 High | 3 | Broken links, credential contradictions |
| 🟡 Medium | 9 | Data inaccuracies, date errors, email inconsistencies |
| 🟢 Low | 13 | Cosmetic, polish, missing content |
| **Total** | **25** | |

**Recommended fix priority:** Items #1–#3 first (broken links), then #4–#7 (publication accuracy), then #8–#12 (data sync), then the rest.
