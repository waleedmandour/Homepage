# ScholarScribe Project Images

This folder holds the image assets used by `index.html` for the ScholarScribe project page.

## Required image files (to be uploaded by Dr. Waleed Mandour)

| Filename | Purpose | Recommended dimensions |
|---|---|---|
| `scholarscribe-logo.png` | Main logo shown in the page header and the floating hero logo frame. Replace the current SVG fallback. | 512×512 px (square, transparent background preferred) |
| `screenshot-models.png` | Screenshot of the **Models** tab (model catalog + RAM verdict) | 1200×800 px (or similar 3:2 aspect ratio) |
| `screenshot-cleaner.png` | Screenshot of the **AI Text Cleaner** tab (24-rule transformations + .docx modes) | 1200×800 px |
| `screenshot-citations.png` | Screenshot of the **Citation Manager** tab (BibTeX validation: undefined / unused / count) | 1200×800 px |
| `screenshot-privacy.png` | Screenshot of the **Privacy Audit** tab (event log + summary card) | 1200×800 px |
| `screenshot-style.png` | Screenshot of the **Style Analysis / Voice Consistency** tab (12 metrics + distance score) | 1200×800 px |
| `screenshot-disclosure.png` | Screenshot of the **Disclosure Assistant** tab (venue templates) | 1200×800 px |

## Notes for upload

- The page already has graceful fallbacks: if an image is missing, the screenshot card is hidden automatically via the `onerror` handler, and the logo falls back to an inline SVG monogram. So uploading the images is purely additive — the page renders correctly even with an empty `images/` folder.
- Use PNG format (lossless, supports transparency).
- Keep each screenshot under 500 KB if possible (use PNG compression / TinyPNG).
- Filenames must match exactly (case-sensitive on Linux/GitHub Pages).

Once you have uploaded the images, commit and push to `main` — GitHub Pages will rebuild within 1–2 minutes.
