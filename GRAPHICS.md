# Graphics Design Guidelines

## Canvas

- Base resolution: 1920x1080
- OBS Browser Source must use the same resolution.
- The page background must remain transparent.
- Do not introduce page scrolling.
- Keep important content inside the defined safe area.

## Design direction

- Theme: summer beach
- Tone: bright, playful, slightly cartoon-like
- Avoid photorealistic materials.
- Avoid excessive gloss, bloom, and visual noise.
- Decorative elements must not reduce text readability.

## Layout

- Use absolute positioning for major broadcast regions.
- Use flexbox or grid inside individual components.
- Do not use viewport units unless explicitly required.
- Do not change the game capture region without updating its screen specification.
- Elements must not overlap the game capture region unless explicitly intended.

## Typography

- Use the project-defined font families.
- Important information must remain readable at stream viewing size.
- Use tabular numbers for timers.
- Runner names must remain on one line.
- Long text must use an explicitly defined overflow strategy.
- Text contrast must be checked against both bright and dark game footage.

## Assets

- Prefer PNG, WebP, or SVG depending on the asset.
- Do not stretch decorative raster edges.
- Use 9-slice-style composition for variable-width panels.
- Do not modify source assets destructively.
- Keep Blender and Affinity source files separate from exported web assets.

## Animation

- Animations must define hidden, entering, visible, and exiting states.
- Do not use infinite animation for important information.
- Avoid abrupt appearance unless intentionally specified.
- Respect `prefers-reduced-motion` in preview and development environments.
- Animations must leave the component in a deterministic final state.

## Implementation

- Presentational components must receive display data through props where practical.
- Do not access Replicants directly from reusable visual components.
- Keep dimensions and reusable design values in CSS variables.
- Avoid arbitrary z-index values. Use the defined layer scale.
- Avoid inline styles unless values must be calculated dynamically.

## Verification

After changing graphics:

- Run the type check and build.
- Open the relevant preview page with Playwright.
- Check browser console errors.
- Capture a 1920 ×1080 screenshot.
- Check normal, long-text, and empty-data states.
- Check transparency against both light and dark preview backgrounds.
