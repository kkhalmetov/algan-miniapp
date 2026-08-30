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
| Modal behavior | Focus could leave a dialog and the page could scroll behind it | `DialogLayer` traps focus, locks background scroll, restores focus and closes the top layer with Escape |
| Motion | Overlays appeared without a shared transition model | Sheet, centered and full-screen transitions use the same motion tokens and respect reduced-motion settings |
| Loading | Busy actions relied only on changed copy/disabled state | Payment and currency actions expose `aria-busy`; splash copy is localized |
| Localization | The document language stayed Russian while Kazakh is the default | Initial HTML language is `kk` and follows the selected locale at runtime |
| Content consistency | Link metadata described the product differently from onboarding | Metadata now uses the same neutral, offer-focused Kazakh positioning |
| Map semantics | The map label was attached to a generic element without a landmark role | OpenStreetMap is exposed as a labelled region |
| Scroll chrome | Mobile list screens could show browser scrollbars unlike Telegram | The canonical scrolling surface hides visual scrollbar chrome while preserving scrolling |

## Governance

- Foundations remain in `app/globals.css` and runtime-only platform colors remain in `lib/design-tokens.ts`.
- Shared React primitives remain in `components/ui-kit.tsx`; feature screens must compose them rather than duplicate recipes.
- `tests/design-system.test.ts` guards token ownership and forbidden local UI recipes.
- `tests/ui-kit.test.tsx` verifies visual variants, semantics, keyboard behavior, focus restoration and confirmation behavior.
- New UI patterns must first be expressed as a token or UI-kit primitive and then be adopted by product screens.
