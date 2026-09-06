# Algan UI/UX Audit

## Scope

The audit covers onboarding, startup, home, map, favorites, active and past orders, profile, settings, help, legal information, store details, box details, cart, routing, successful payment and failed payment in Russian and Kazakh.

## Resolved discrepancies

| Area | Discrepancy | Unified result |
| --- | --- | --- |
| Screen layout | Product screens used 20, 24 and 28 px horizontal gutters | Top-level content uses `ScreenBody`/20 px; detail and modal content uses `page-wide`/24 px |
| Typography | Content headings were recreated with raw class lists | `PageTitle`, `ContentTitle` and `SectionTitle` own the hierarchy |
| Surfaces | Inset rows, notices and information cards repeated local border/background recipes | `InsetSurface`, `NoticeCard` and `DetailRow` own those recipes |
| Media | Store logos used several unrelated circle/border combinations | `MediaBadge` defines list, card and cover-logo presentation |
| Navigation affordance | Box cards recreated a one-off circular chevron | `DisclosureIndicator` is the shared affordance |
| Detail headers | Store details used a feature-local branded toolbar | `TopAppBar` is the canonical compact header |
| Confirmations | Cart replacement was custom and demo reset used `window.confirm` | Both use `ConfirmationDialog`; ordinary and destructive tones are explicit |
| Empty states | Empty cart rendered an empty description paragraph | Supporting copy is optional and absent content creates no layout gap |
| Modal behavior | Focus could leave a dialog; locking `body` or focusing a moving sheet could shift the mobile viewport | `DialogLayer` traps focus with `preventScroll`, preserves the viewport position and closes the top layer with Escape |
| Motion | Overlays appeared without a shared transition model | Sheet, centered and full-screen transitions use the same motion tokens and respect reduced-motion settings |
| Loading | Busy actions relied only on changed copy/disabled state | Payment and currency actions expose `aria-busy`; splash copy is localized |
| Localization | The document language stayed Russian while Kazakh is the default | Initial HTML language is `kk` and follows the selected locale at runtime |
| Content consistency | Link metadata described the product differently from onboarding | Metadata now uses the same neutral, offer-focused Kazakh positioning |
| Map semantics | The map label was attached to a generic element without a landmark role | OpenStreetMap is exposed as a labelled region |
| Scroll chrome | Mobile list screens could show browser scrollbars unlike Telegram | The canonical scrolling surface hides visual scrollbar chrome while preserving scrolling |
| Typography cascade | A global `font` shorthand overrode UI-kit size and weight utilities on buttons and inputs | Global form controls inherit only the font family; component typography tokens now apply as authored |
| Bottom navigation | Labels depended on the browser's inherited 16 px button font and could collide in Kazakh | Navigation owns a consistent 10 px label size that keeps complete RU/KK names visible |
| Sheet headers | Settings, documents, cart and detail sheets used different handle, title and close-button spacing | `SheetHeader` now owns the handle and both titled and close-only sheet variants |
| Box detail spacing | The close control visually crowded the product cover below a separate white header | The dedicated header is removed; the 44 × 44 px close control and contrasting handle sit intentionally over the media hero |
| Box detail hierarchy | The separate white header, large media and disconnected price/time blocks pushed useful product information below the fold | A 90% marketplace sheet now starts with a media hero, combines price and pickup time, keeps content visible and preserves a fixed quantity/action footer |
| Map touch targets | Leaflet zoom buttons exposed only a 30 × 30 px target, store markers were 42 × 42 px and attribution links were 9 px high | Zoom controls and store markers now use 44 × 44 px targets; attribution links keep a 24 px minimum |
| Secondary text contrast | Muted and subtle text tokens measured only 4.00:1 and 3.06:1 on the app surface | The secondary text scale now preserves hierarchy while maintaining at least 4.5:1 across canonical light surfaces |
| Text on brand surfaces | Profile and pickup-code supporting text at 65% white measured about 4.36:1 | Supporting text on brand surfaces now uses at least 70% white for AA contrast |
| Heading hierarchy | Profile started at `h2` and store cards skipped from the page heading to `h3` | Profile exposes one `h1`; store cards use the shared `CardTitle` at `h2` |
| Catalog localization | Kazakh UI still displayed Russian addresses, box names, contents and allergens | A typed catalog-localization layer now serves full KK copy with source-language fallback for backend compatibility |
| Demo identity | A profile created in Russian kept showing «Пользователь» after switching to Kazakh | Browser fallback identity now follows the active language on home, profile and avatar surfaces |
| Order dates | Some mobile WebViews rendered Kazakh dates as `2026 M08 28` | A deterministic Shymkent date formatter supplies complete RU/KK month names |
| Landmarks | The phone shell nested one `main` landmark inside another | The shell is structural; onboarding and application content each expose exactly one main landmark |
| Avatar styling | User avatars repeated a feature-local 48/64 px circle recipe | `AvatarFrame` owns both sizes, fallback color and typography |
| Modal gutters | The route picker used a narrower gutter than other sheets | All sheet bodies use `ModalBody` and the documented 24 px modal gutter |
| Notice semantics | Standalone informational cards skipped directly from `h1` to `h3` | `NoticeCard` keeps one visual recipe while choosing `h2` for standalone blocks and `h3` for nested notices |
| Compact-height sheets | Cart legal copy could be clipped on 568 px-high screens | Cart content uses the shared scroll area; its header remains fixed and every line stays reachable |
| Modal accessibility | Background screens remained discoverable to assistive technology behind `aria-modal` | `DialogLayer` now makes obscured siblings inert and restores their previous state for nested dialogs |
| Scroll behavior | Detail, help, legal and cart flows repeated different overflow recipes and exposed inconsistent scrollbar chrome | `ScrollArea` owns vertical scrolling, overscroll containment and hidden scrollbar chrome |
| Inline legal actions | Text links had a visual hit area below the 24 px compact-target minimum | `TextLinkButton` now guarantees a 24 px touch target without changing inline hierarchy |
| Interactive feedback | Several secondary UI-kit controls had pressed feedback but no pointer-hover state | Shared pills, rows, icon controls, accordions, segments and card actions now expose consistent hover feedback |
| Decorative media | Store and map-provider logos repeated adjacent visible labels to screen readers | Redundant logos now use empty alternative text while visible names remain the accessible label |
| Supporting copy | Help working hours were truncated on a 320 px-wide screen | Rows can opt into wrapped supporting copy; complete working hours remain visible at compact widths |
| Transaction transition | Closing store/cart layers while opening the successful-order screen could leave the app root inert | Dialog background locks are reference-counted, so replacing any number of nested sheets always restores interaction |

## Governance

- Foundations remain in `app/globals.css` and runtime-only platform colors remain in `lib/design-tokens.ts`.
- Shared React primitives remain in `components/ui-kit.tsx`; feature screens must compose them rather than duplicate recipes.
- `tests/design-system.test.ts` guards token ownership and forbidden local UI recipes.
- `tests/ui-kit.test.tsx` verifies visual variants, semantics, keyboard behavior, focus restoration and confirmation behavior.
- New UI patterns must first be expressed as a token or UI-kit primitive and then be adopted by product screens.
