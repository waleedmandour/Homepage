# ScholarScribe Project Images

This folder holds the image assets used by `index.html` for the ScholarScribe project page.

## Application screenshots (carousel)

The "Application Interface" section shows these screenshots in a carousel (autoplay with arrows, dots, keyboard, and swipe support). Filenames are numbered to keep the slide order obvious.

| Filename | Slide | Caption (EN) |
|---|---|---|
| `01-tour-light.png` | 1 | Welcome Tour. Six guided steps through the essentials |
| `02-models-light.png` | 2 | Models. Install and run local LLMs via Ollama, with a RAM fit check |
| `03-about-light.png` | 3 | About. Version, environment, and the guided tour launcher |
| `04-cleaner-light.png` | 4 | AI Text Cleaner. Deterministic, rule-based cleaning that never leaves your device |
| `05-models-dark.png` | 5 | Dark Mode. A comfortable palette for late-night writing sessions |

To add, remove, or reorder slides: edit the `<figure class="carousel-slide">` entries in the "Application Interface" section of `index.html`, then update the `aria-label="N of M"` counters on each slide. The dots and the counter are generated automatically from the number of slides.

## Branding assets

| Filename | Purpose |
|---|---|
| `scholarscribe-logo.png` | Main logo shown in the floating hero logo frame (falls back to an inline SVG monogram if missing) |
| `favicon-32.png` | 32x32 favicon |
| `apple-touch-icon.png` | iOS home screen icon |

## Notes for future uploads

- Keep screenshots at a consistent size so the carousel aspect ratio (1180 x 758) fits without cropping; the CSS uses `object-fit: contain`, so other sizes letterbox instead of distorting.
- Use PNG format (lossless, supports transparency) and keep each file under 500 KB if possible.
- Filenames are case-sensitive on GitHub Pages (Linux).
- All screenshot images are committed to the repo, so the carousel has no `onerror` fallbacks; make sure a referenced file exists before pushing.
