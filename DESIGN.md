# Algan Design System

## Brand idea

Algan helps good food find a person instead of a bin. The interface should feel useful, optimistic and local: appetising photography does the selling, clear commerce information builds trust, and the smiling food-box mark keeps the mission human.

The product is a mobile-first Telegram Mini App. Too Good To Go is a category reference, not a visual template. Algan must not reuse its logo geometry, illustrations, layouts or exact colour relationships.

## Logo

The symbol is an open takeaway box with a smile cut from its front. The handle suggests something ready to carry. It must remain recognisable at 24 px.

- `public/algan-mark.svg`: standalone mark and favicon source.
- `public/algan-wordmark.svg`: custom lowercase wordmark.
- `public/algan-logo.svg`: pine horizontal lockup.
- `public/algan-logo-light.svg`: lime lockup for pine surfaces.
- Use the mark alone only when the product name is already visible or space is constrained.
- Never recolour parts independently, outline the logo, put it in a generic circle, or use a partner colour for it.

## Foundations and tokens

Tokens live in `app/globals.css` and are exposed through Tailwind v4 semantic utilities. New raw hex values are not allowed in product markup. `lib/design-tokens.ts` is the single runtime mirror for Telegram and browser APIs.

### Colour

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Pine | `brand` | `#0D4F45` | Identity and large brand surfaces |
| Emerald | `brand-hover` | `#17735F` | Primary actions and active controls |
| Lime | `brand-soft`, `highlight` | `#CBEF69` | Positive selection and small highlights |
| Coral | `accent` | `#FF7455` | Discount and urgency |
| Canvas | `canvas` | `#F6F4EE` | App background |
| Surface | `surface`, `panel` | `#FFFFFF` | Cards, sheets and controls |
| Ink | `ink` | `#132620` | Primary copy |
| Muted | `ink-muted` | `#4E635C` | Supporting copy |
| Border | `border` | `#DCE5E1` | Quiet structure |

Status colours have paired light surfaces and dark foregrounds. Never communicate stock, payment or validation state through colour alone.

### Typography

Onest Variable is bundled through `@fontsource-variable/onest` with Latin and Cyrillic Extended coverage.

- Display: 32/36, weight 800.
- Page title: 28/32, weight 800.
- Section title: 20/26, weight 800.
- Body: 15/22, weight 400–600.
- Supporting: 13/18.
- Caption: 12/16.
- Prices and quantities use weight 800, never decorative type.

### Layout

- 4 px spacing rhythm.
- Screen gutter: 20 px; compact mobile gutter: 16 px.
- Canonical screen, header, modal and sticky-footer primitives switch from 16 px below the `sm` breakpoint to 20 px inside the desktop phone shell. Feature screens must not recreate these gutters.
- Controls: 12 px radius; cards: 18 px; sheets: 28 px.
- Primary actions: 52 px high. Every interactive target is at least 44 × 44 px.
- Phone shell is fluid up to 460 px. Desktop presentation keeps the 780 px preview shell.
- Use one border and, only where needed, one quiet shadow. Avoid cards nested inside cards.

### Motion

- Fast 140 ms for control feedback.
- Medium 220 ms for dialogs and selected states.
- Slow 360 ms for photography and larger transitions.
- Use the shared standard easing and respect `prefers-reduced-motion`.

## Components

Canonical primitives live in `components/ui-kit.tsx`. Product screens compose them; domain cards may define layout but may not redefine controls, modal layers, typography or status treatments.

- **Actions:** `PrimaryButton`, `SecondaryButton`, `DangerButton`, `TertiaryButton`, `TextLinkButton`, `IconButton`, `PillButton`. `PrimaryButton` owns brand, highlight-on-brand and warning variants; feature code must not recolour it with utility conflicts or inline styles. Floating and selected favorite icon buttons use the corresponding `IconButton` tones.
- **Structure:** `PageSection`, `BrandHeader`, `TopAppBar`, `ScreenBody`, title primitives, `SurfaceCard`, `InsetSurface`.
- **Commerce:** `StatusBadge`, `QuantityControl`, `QuantityStepper`, `StickyActionFooter`, `CardActionButton`.
- **Rows and information:** `ListRow`, `LinkRow`, `DetailRow`, `NoticeCard`, `AccordionItem`, `MediaBadge`, `AvatarFrame`. List rows expose default and compact densities; media badges expose semantic sizes instead of feature-owned height/radius overrides.
- **Navigation and state:** `BottomNavigation`, `SegmentedControl`, `EmptyState`, `FullScreenFeedback`. Full-screen feedback uses brand for success, coral for recoverable payment failure and danger only for destructive or blocking failure.
- **Layers:** `DialogLayer`, `ModalBody`, `SheetHeader`, `MediaSheetHeader`, `ConfirmationDialog`, `ScrollArea`. Bottom sheets use content, medium or tall shell-relative heights. Never calculate their height from browser `dvh` inside the desktop phone shell. Confirmations may add one semantic icon and use warning for reversible replacement, danger for deletion.

Primary actions use emerald. Lime is for selected or positive supporting states and must not become a full-page background. Coral highlights discounts and urgency; destructive flows use danger tokens.

The product-specific `SURPRISE` badge uses a lime surface, deep-pine text and the open-box-with-spark icon in both compact card and standard detail variants. It must never reuse the coral discount treatment.

## Screen patterns

- Home and favorites use the same photo-first box card. The box image leads; venue logo/name, address, pickup window, stock, prices, discount and box-level favorite action remain visible without opening details.
- Box cards open the box sheet directly. There is no intermediate venue-details screen; venue identity, address and routing live inside the box experience.
- Sold-out boxes remain in catalogue order but use a muted grayscale media state, an explicit sold-out label and no interactive card or favorite action.
- Box details use a tall sheet with venue context, routing, a strong price hierarchy, two compact pickup/stock cells, exact or surprise composition, allergens and a persistent quantity/action footer that includes the selected total.
- Bottom navigation always follows the product flow: Home, Orders, Favorites, Profile. Profile is a dedicated tab and is not duplicated in the home header.
- Active orders prioritise pickup time, collection code and route. History prioritises contents, date and total.
- Order details always identify the venue, order number, status, date, purchased items and total. Only active orders expose QR, pickup code and route.
- Profile is available only from the fourth bottom-navigation tab; the home header contains no profile shortcut.
- Settings use an explicit segmented language choice; support starts with the direct contact action; long legal documents keep the sheet header fixed while their body scrolls.
- Empty, loading, success and failure states use the same friendly geometric language as the box mark.

## Accessibility and interaction

- Maintain WCAG AA contrast for body and supporting text on every canonical surface.
- Keep native button, link, heading, list and input semantics.
- Icon-only actions require an accessible label; selection uses `aria-current` or `aria-pressed`.
- Modal focus stays inside the top layer, Escape closes it, the background becomes inert, and previous focus is restored without scrolling.
- Preserve Telegram and operating-system safe-area insets in headers, navigation, sheets and sticky actions.
- Never truncate legal or transactional information. Catalogue cards may truncate only repeated names and addresses.
- RU and KK are equal first-class layouts. The document language follows the selected locale; KK remains the default.

## Governance

1. Add or change semantic foundations in `app/globals.css` before using them.
2. Extend an existing UI-kit primitive before copying its class recipe into a screen.
3. Add a focused UI-kit test for every new shared variant.
4. Keep product markup free of raw hex colours and feature-owned modal/backdrop recipes.
5. Verify 320, 390 and 460 px widths, both locales, reduced motion and keyboard focus before release.
6. Run `npm run typecheck`, `npm test` and `npm run build` for every design-system change.
