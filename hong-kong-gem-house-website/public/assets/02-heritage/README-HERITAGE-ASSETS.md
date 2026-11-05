# Hong Kong Gem House — Heritage Asset Pack v2

These are separate assets for Screen 2 — Our Heritage. They are not full-page screenshots.

## Folder structure

- `hero/heritage-hero-background.webp` — wide ivory/map/gem hero background with route markers and location labels.
- `timeline/timeline-kayalpattinam.webp` — sepia coastal heritage scene.
- `timeline/timeline-sri-lanka.webp` — Sri Lankan temple/lake scene.
- `timeline/timeline-bangkok.webp` — Bangkok temple skyline at sunset.
- `timeline/timeline-hong-kong.webp` — Hong Kong harbour skyline at sunset.
- `lower-banner/heritage-quote-banner.webp` — dark sapphire/tweezers banner with open left-side negative space.
- `icons/` — matching diamond, globe and shield/check icons. SVG files are transparent vectors; PNG equivalents are included where export support was available.

## Install

Merge the contents of this ZIP into the project's `public/assets/02-heritage/` folder. Keep the existing assets until the page code is updated and checked.

The final public paths will be:

- `/assets/02-heritage/hero/heritage-hero-background.webp`
- `/assets/02-heritage/timeline/timeline-kayalpattinam.webp`
- `/assets/02-heritage/timeline/timeline-sri-lanka.webp`
- `/assets/02-heritage/timeline/timeline-bangkok.webp`
- `/assets/02-heritage/timeline/timeline-hong-kong.webp`
- `/assets/02-heritage/lower-banner/heritage-quote-banner.webp`
- `/assets/02-heritage/icons/icon-generational-diamond.svg`
- `/assets/02-heritage/icons/icon-global-globe.svg`
- `/assets/02-heritage/icons/icon-guaranteed-authenticity.svg`

## Notes

- The location labels are embedded in the hero artwork. Please inspect spelling and map placement before publishing; generated artwork can contain imperfect lettering or stylised geography.
- The four timeline photos are generated illustrative visuals, not verified historical documentary photographs.
- Use `object-fit: cover` for timeline photos. Choose `object-position` individually if you need to preserve a landmark during responsive cropping.
- The SVG icons are transparent and resolution-independent. Prefer SVG on the website.
