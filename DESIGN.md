# Algan Design System

## Direction

Algan uses a warm, friendly food-rescue visual language: deep green for trust, coral for urgency, lime for positive confirmation, warm off-white surfaces, and rounded tactile controls. Mobile and Telegram Mini App layouts are the primary surfaces.

## Tokens

- Brand: `brand`, `brand-hover`, `brand-deep`, `brand-soft`, `brand-pale`, `highlight`.
- Accent and status: `accent`, `accent-strong`, `accent-soft`, `warning-*`, `danger-*`, `allergen-*`.
- Surfaces: `canvas`, `surface`, `panel`, `surface-muted`, `surface-soft`.
- Text: `ink`, `ink-secondary`, `ink-muted`, `ink-subtle`.
- Structure: `border`, `border-strong`, `rounded-control`, `rounded-card`, `rounded-sheet`, `rounded-shell`.
- Elevation: `shadow-card`, `shadow-floating`, `shadow-shell`, `shadow-action`, `shadow-sheet`, `shadow-marker`, `shadow-control`.

Tokens are declared in `app/globals.css` through Tailwind v4 `@theme`. Components must use semantic utilities such as `bg-brand`, `text-ink-muted`, `border-border`, and `rounded-card`; new raw hex values are not allowed in application markup.

## Components

- Primary button: 56 px minimum height, brand background, white heavy label, `rounded-control`.
- Cards: panel background, border token, `rounded-card`, card shadow only when separation from the surface is needed.
- Icon buttons: 36–44 px square, circular, muted surface; brand or accent indicates selection.
- Sheets and modals: surface background, `rounded-sheet` top corners, dimmed brand-deep overlay.
- Inputs: 52 px height, panel background, border token, brand focus ring.
- Navigation: surface background, border token, brand-soft selected pill, muted inactive icons.

## Typography and spacing

- Font: self-hosted Inter Variable (`100–900`) with Cyrillic and Kazakh character support. The same bundled font files are used on every platform.
- Page title: 30–34 px, weight 900, tight tracking.
- Section title: 18–20 px, weight 900.
- Body: 14–15 px, line height 1.5–1.7.
- Supporting text: 11–13 px using `ink-muted` or `ink-subtle`.
- Use the 4 px spacing rhythm. Primary horizontal page padding is 20–24 px.

## Usage rules

- Preserve safe-area insets for Telegram headers, bottom navigation, sheets, and fixed actions.
- Never communicate state by color alone; pair color with text or an icon.
- Use a maximum of one strong brand action per surface.
- Keep touch targets at least 44 px and provide accessible labels for icon-only controls.
- Product photography and partner logos keep their original colors; design tokens control their containers.
