# Algan Design System

## Direction

Algan uses a warm, friendly food-rescue visual language: deep green for trust, coral for urgency, lime for positive confirmation, warm off-white surfaces, and rounded tactile controls. Mobile and Telegram Mini App layouts are the primary surfaces.

## Foundations and tokens

- Brand: `brand`, `brand-hover`, `brand-deep`, `brand-soft`, `brand-pale`, `highlight`.
- Accent and status: `accent`, `accent-strong`, `accent-soft`, `warning-*`, `danger-*`, `allergen-*`.
- Surfaces: `canvas`, `surface`, `panel`, `surface-muted`, `surface-soft`.
- Text: `ink`, `ink-secondary`, `ink-muted`, `ink-subtle`.
- Structure: `border`, `border-strong`, `rounded-control`, `rounded-card`, `rounded-sheet`, `rounded-shell`.
- Layout: `page` (20 px) and `page-wide` (24 px) horizontal gutters; safe-area additions remain explicit because they are supplied by Telegram/the operating system.
- Typography: `display`, `page-title`, and `section-title` encode size, weight, line height, and tracking as a unit.
- Elevation: `shadow-card`, `shadow-floating`, `shadow-shell`, `shadow-action`, `shadow-sheet`, `shadow-marker`, `shadow-control`.

Tokens are declared in `app/globals.css` through Tailwind v4 `@theme`. Components must use semantic utilities such as `bg-brand`, `text-ink-muted`, `border-border`, and `rounded-card`; new raw hex values are not allowed in application markup.

`lib/design-tokens.ts` is the only runtime color bridge. It mirrors CSS values for Telegram and browser metadata APIs that cannot consume CSS custom properties. Product code must not add another color source.

## Components

- The canonical React primitives live in `components/ui-kit.tsx`. Product screens compose these primitives instead of recreating their class lists.
- `PrimaryButton`, `SecondaryButton`, `DangerButton`: one action hierarchy with shared 44/56 px sizes, pressed, hover and disabled states.
- `TextLinkButton`: one inline legal/action link treatment.
- `PillButton`: compact text-and-icon control for language and similar toolbar actions.
- `TertiaryButton`: low-emphasis brand or destructive action with a 44 px touch target.
- `IconButton`: 44 × 44 px touch target with muted, dark, brand and accent variants; an accessible label is mandatory.
- `QuantityControl`: one add/stepper pattern with compact visuals and 44 px increment/decrement touch targets.
- `TextField`: shared label, required marker, border, focus ring and placeholder treatment.
- `ModalBody`, `ModalHeader` and `SheetHandle`: consistent safe-area spacing, navigation, close controls and sheet affordance.
- `DialogLayer`: shared modal backdrop, dismissal target, elevation and full-screen/sheet/center modes.
- `AccordionItem`: shared disclosure row for FAQ and future expandable content.
- `BottomNavigation` and `BottomNavigationItem`: canonical application navigation, active pill and label treatment.
- `FullScreenFeedback`: canonical success/error layout for transactional outcomes.
- `CardPressable`: shared keyboard-focus treatment for interactive regions inside clipped cards.
- `BrandHeader`, `PageSection`, `PageTitle`, `SectionTitle`: one hierarchy for screen chrome and headings.
- `ListRow`, `LinkRow`: shared button/link rows with icon container, optional supporting text, panel/soft surfaces and trailing action.
- `SegmentedControl`: shared two-state selector with pressed-state semantics.
- `EmptyState`: shared illustration container, title and supporting copy.
- `IconBadge`: shared contextual icon container for informational cards.
- `StatusBadge`: shared stock, discount, surprise and status treatment with semantic tones.
- `CardActionButton` and `StickyActionFooter`: shared actions attached to cards and fixed content surfaces.
- Cards: panel background, border token, `rounded-card`, card shadow only when separation from the surface is needed.
- Sheets and modals: surface background, `rounded-sheet` top corners, dimmed brand-deep overlay.
- Inputs: 52 px height, panel background, border token, brand focus ring.
- Primary, secondary and destructive page actions: 56 px height; compact embedded actions: 44 px height.
- Navigation: surface background, border token, brand-soft selected pill, muted inactive icons.

## Typography and spacing

- Font: self-hosted Inter Variable (`100–900`) with Cyrillic and Kazakh character support. The same bundled font files are used on every platform.
- Display title: 34 px via `text-display`.
- Page title: 30 px via `PageTitle` / `text-page-title`.
- Section title: 18 px via `SectionTitle` / `text-section-title`.
- Body: 14–15 px, line height 1.5–1.7.
- Supporting text: 11–13 px using `ink-muted` or `ink-subtle`.
- Use the 4 px spacing rhythm. Primary horizontal page padding is 20–24 px.

## Composition rules

- Top-level list screens use `PageSection`; branded identity screens use `BrandHeader`.
- Elevated content uses `SurfaceCard`; inset content uses `surface-soft` with `rounded-control`.
- Modal and bottom-sheet flows start with `DialogLayer`; nested implementations must not recreate a backdrop.
- Repeated state labels use `StatusBadge` and repeated card/footer actions use their UI-kit primitives.
- Domain components may own their internal layout, but may not redefine shared control, surface, typography, overlay, or status styles.

## Accessibility and interaction

- Preserve safe-area insets for Telegram headers, bottom navigation, sheets, and fixed actions.
- Never communicate state by color alone; pair color with text or an icon.
- Use a maximum of one strong brand action per surface.
- Keep touch targets at least 44 px and provide accessible labels for icon-only controls.
- Product photography and partner logos keep their original colors; design tokens control their containers.
- Use native button, link and input semantics. Selected controls expose `aria-pressed` or `aria-current`; modal surfaces expose dialog semantics.
- Motion respects `prefers-reduced-motion`.

## Governance

- Add or change a foundation in `app/globals.css` first, then expose it through `components/ui-kit.tsx`.
- Extend an existing primitive before copying its full class list into a feature screen.
- Every new primitive needs a focused test in `tests/ui-kit.test.tsx`.
- `tests/design-system.test.ts` enforces token ownership and guards against duplicated page-title, overlay, card-action and sticky-footer recipes.
