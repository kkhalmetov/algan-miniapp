# Algan UI/UX Audit

## Scope

The audit covers onboarding, startup, home, favorites, active and past orders, profile, settings, help, legal information, box details, cart, routing, successful payment and failed payment in Russian and Kazakh. Responsive verification covers 320, 390 and 460 px mobile widths plus the 460 × 780 px desktop preview shell.

## Resolved discrepancies

| Area | Discrepancy | Unified result |
| --- | --- | --- |
| Screen layout | Product screens used unrelated horizontal gutters | Canonical screen, header, modal and sticky-footer primitives use 16 px below `sm` and 20 px inside the desktop phone shell |
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
| Scroll chrome | Mobile list screens could show browser scrollbars unlike Telegram | The canonical scrolling surface hides visual scrollbar chrome while preserving scrolling |
| Typography cascade | A global `font` shorthand overrode UI-kit size and weight utilities on buttons and inputs | Global form controls inherit only the font family; component typography tokens now apply as authored |
| Bottom navigation | Labels depended on the browser's inherited 16 px button font and could collide in Kazakh | Navigation owns a consistent 10 px label size that keeps complete RU/KK names visible |
| Sheet headers | Settings, documents, cart and detail sheets used different handle, title and close-button spacing | `SheetHeader` now owns the handle and both titled and close-only sheet variants |
| Box detail spacing | The close control visually crowded the product cover below a separate white header | The dedicated header is removed; the 44 × 44 px close control and contrasting handle sit intentionally over the media hero |
| Box detail hierarchy | The separate white header, large media and disconnected price/time blocks pushed useful product information below the fold | A 90% marketplace sheet now starts with a media hero, combines price and pickup time, keeps content visible and preserves a fixed quantity/action footer |
| Secondary text contrast | Muted and subtle text tokens measured only 4.00:1 and 3.06:1 on the app surface | The secondary text scale now preserves hierarchy while maintaining at least 4.5:1 across canonical light surfaces |
| Text on brand surfaces | Profile and pickup-code supporting text at 65% white measured about 4.36:1 | Supporting text on brand surfaces now uses at least 70% white for AA contrast |
| Heading hierarchy | Profile started at `h2` and store cards skipped from the page heading to `h3` | Profile exposes one `h1`; store cards use the shared `CardTitle` at `h2` |
| Catalog localization | Kazakh UI still displayed Russian addresses, box names, contents and allergens | A typed catalog-localization layer now serves full KK copy with source-language fallback for backend compatibility |
| Demo identity | A profile created in Russian kept showing «Пользователь» after switching to Kazakh | Browser fallback identity now follows the active language on home, profile and avatar surfaces |
| Order dates | Some mobile WebViews rendered Kazakh dates as `2026 M08 28` | A deterministic Shymkent date formatter supplies complete RU/KK month names |
| Landmarks | The phone shell nested one `main` landmark inside another | The shell is structural; onboarding and application content each expose exactly one main landmark |
| Avatar styling | User avatars repeated a feature-local 48/64 px circle recipe | `AvatarFrame` owns both sizes, fallback color and typography |
| Modal gutters | The route picker used a narrower gutter than other sheets | All sheet bodies use `ModalBody` and the canonical responsive 16/20 px gutter |
| Notice semantics | Standalone informational cards skipped directly from `h1` to `h3` | `NoticeCard` keeps one visual recipe while choosing `h2` for standalone blocks and `h3` for nested notices |
| Compact-height sheets | Cart legal copy could be clipped on 568 px-high screens | Cart content uses the shared scroll area; its header remains fixed and every line stays reachable |
| Modal accessibility | Background screens remained discoverable to assistive technology behind `aria-modal` | `DialogLayer` now makes obscured siblings inert and restores their previous state for nested dialogs |
| Scroll behavior | Detail, help, legal and cart flows repeated different overflow recipes and exposed inconsistent scrollbar chrome | `ScrollArea` owns vertical scrolling, overscroll containment and hidden scrollbar chrome |
| Inline legal actions | Text links had a visual hit area below the 24 px compact-target minimum | `TextLinkButton` now guarantees a 24 px touch target without changing inline hierarchy |
| Interactive feedback | Several secondary UI-kit controls had pressed feedback but no pointer-hover state | Shared pills, rows, icon controls, accordions, segments and card actions now expose consistent hover feedback |
| Decorative media | Store and map-provider logos repeated adjacent visible labels to screen readers | Redundant logos now use empty alternative text while visible names remain the accessible label |
| Supporting copy | Help working hours were truncated on a 320 px-wide screen | Rows can opt into wrapped supporting copy; complete working hours remain visible at compact widths |
| Transaction transition | Closing store/cart layers while opening the successful-order screen could leave the app root inert | Dialog background locks are reference-counted, so replacing any number of nested sheets always restores interaction |
| Tab navigation | The shared scrolling viewport retained its old offset when a user switched tabs, so a new screen could open below its title and controls | Every tab change resets the canonical application viewport to the top while preserving scrolling inside dialogs |
| Compact navigation | Long Kazakh labels touched or clipped at 320 px despite fitting at larger widths | Bottom-navigation typography now uses the documented compact 10 px label token; all four complete labels have measurable separation at 320 px |
| Modal dismissal | The full-screen backdrop was exposed as an extra keyboard and screen-reader close button outside the dialog panel | The backdrop remains pointer-dismissable but is removed from sequential focus and the accessibility tree; the visible 44 px close action remains canonical |
| In-modal navigation | Opening FAQ or a legal sub-view removed the triggering row and left keyboard focus on the document root | Shared sheet headers can focus a changed title; FAQ and legal views now announce and focus their new `h2` title without scrolling |
| Nested headings | Settings, legal groups, company details and order-detail sections reused `h2` beside the modal title | `SectionTitle` owns contextual `h2`/`h3` semantics; sections nested below a sheet title now use `h3` without changing their visual token |
| Box purchase summary | The persistent box action showed quantity and an action but omitted the selected total described by the commerce pattern | The action now presents the localized selected total and updates it with the quantity while retaining a concise accessible action name |
| Completed-order history | A completed-order details implementation existed but had no reachable action | History cards now use the shared attached action to open complete order details without exposing active-order pickup controls |
| Transactional copy | Cart and order item names were truncated even though transactional information must remain complete | Cart, order cards and order details wrap venue and item names while catalogue cards retain intentional truncation |
| Allergen semantics | Box allergens reused the destructive danger treatment despite having dedicated allergen tokens | The shared `NoticeCard` allergen tone now owns the border, surface, icon, heading and body treatment |
| Runtime locale | Changing the language updated visible copy and `html[lang]` but left the browser title in the default locale | The browser title follows RU/KK alongside the document language |
| Nested section type | Several sheet sections overrode the shared 20/26 section-title token with feature-level `text-base` utilities | All nested `h3` sections preserve the canonical `SectionTitle` typography |
| Long identity copy | A long Telegram display name could force the profile header wider than the mobile shell | The identity column can shrink safely, names wrap and the secondary username truncates without moving controls |
| Media badge variants | The catalogue photo logo overrode the shared badge border locally | `MediaBadge` now owns a semantic photo-floating tone while feature code controls only placement |
| Commerce numerals | Price and quantity emphasis was partly recreated with arbitrary typography | The hero price uses the shared commerce token and transactional numerals use tabular figures consistently |
| Route row sizing | Map-provider rows overrode the shared list-row minimum height | Natural content plus the canonical default row density now determines every provider row height |
| Compact information notice | The product-photo disclaimer recreated a local rounded notice recipe | The compact `NoticeCard` density now owns its surface, icon, spacing and type |
| Quantity badges | Known box contents used a feature-local quantity pill | The shared brand `StatusBadge` now presents item quantities consistently |
| Telegram viewport hydration | Telegram SDK writes viewport custom properties to `<html>` before React hydrates, producing a false-positive attribute mismatch | The root explicitly tolerates SDK-owned pre-hydration attributes while application markup remains strictly hydrated |

## Governance

- Foundations remain in `app/globals.css` and runtime-only platform colors remain in `lib/design-tokens.ts`.
- Shared React primitives remain in `components/ui-kit.tsx`; feature screens must compose them rather than duplicate recipes.
- `tests/design-system.test.ts` guards token ownership and forbidden local UI recipes.
- `tests/ui-kit.test.tsx` verifies visual variants, semantics, keyboard behavior, focus restoration and confirmation behavior.
- New UI patterns must first be expressed as a token or UI-kit primitive and then be adopted by product screens.
