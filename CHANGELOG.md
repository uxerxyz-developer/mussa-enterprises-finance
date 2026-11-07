# CHANGELOG — Mussa Finance

Every delivery has a version number: it is in the zip name (`mussa-finance-v1.6.0.zip`), in this file, and inside the app under **Settings & Backup → App version**.
When something is wrong, tell me: **the version shown in Settings + the screen + what you did + a screenshot**. I will look only at the files listed for that version.

## v1.6.0 — Reports tiles, Quick Actions colours, bank dropdown scroll, theme-switch animation (current)
- **Reports** (`routes/reports.tsx`): on a phone the 9 summary cards (Payment Received, Payment Issued, Sale, Purchase, Salary, Advance, Expense, Capital Introduced, Internal Transfer) sit in 2 columns; the last one (Internal Transfer) is full width. Tablet/desktop and print layouts are unchanged.
- **Quick Actions colours** (`styles.css`, `--qa-*` only): each button now uses its module's real colour: Receive Payment = green, Sale = ice blue (they were swapped), Issue Payment = deep crimson (was baby pink), Purchase = amber (unchanged), Expense = terracotta (darker and redder, clearly different from amber), Add Account and Heat unchanged. The same hue changes are applied in the dark theme (its brightness/dullness was not touched).
- **Bank dropdown scroll** (`components/app/inputs.tsx`, `NativeSelect`): the list inside the entry-form dialog now scrolls with finger/wheel (the dialog's scroll lock was swallowing it). Applies to every dropdown that uses `NativeSelect`.
- **Theme switch animation** (`lib/theme-transition.ts` new, `AppShell.tsx` toggle, `styles.css`, `lib/appearance.ts` one guard): the whole screen changes in one View Transition (~0.7 s): to dark the new theme spreads from top to bottom, to light from bottom to top, with a thin lavender-to-sky glowing line on the edge. Without browser support, or with "Reduce motion" on, the theme is applied directly (older colour fade as before).
- Nothing in `db.ts`, accounting, balances, ledger or vouchers changed.
- `src/lib/version.ts`: 1.6.0.

## v1.5.1 — Ledger: bounced cheque and net sale amounts, print table, vouchers pills
- **Cards View** (`routes/ledger.$id.tsx`): a bounced cheque's amount is red and struck through, with no "+" or "−" sign (it used to look like money received).
- **Received / Issued summary cards**: bounced cheques are no longer added (Received shows what really came in). This was in the original code too.
- **Print table**: the "Method / Chq" column is removed; its details now sit in Particulars & Details: Credit / Net / Advance Sale or Purchase, method with cheque or reference number, bank name. A bounced cheque reads "Cheque #78231 · Bank Alfalah · ~~Rs 2,50,720~~ · BOUNCED". Pending and Cleared are never printed. A **net sale / purchase** (which leaves the balance unchanged, so Debit and Credit are empty) now shows its amount, e.g. "Net Sale · Cash · Rs 38,66,252" (this was the missing amount of V-6). Columns re-divided (Date 10.5, Vch 7.5, Type 15, Particulars & Details 32, Debit 10.5, Credit 10.5, Balance 14 = 100%); the header is "Vch #" so it no longer runs into "Type".
- **Register Table View (screen)**: the Method column stays; under the details a bounced row shows its struck-through amount and BOUNCED, and a net sale shows "Net Sale · amount". Debit / Credit stay empty.
- Nothing in `db.ts` changed: Debit, Credit, running balance and totals are exactly as before. The new text is built only for display, from the existing fields (`src/lib/ledger-display.ts` + test).
- `routes/vouchers.tsx`: the unselected filter pills (Sales, Purchases, Received, Issued) are plain outline pills like "All"; the selected colours are unchanged. No other page has tinted unselected pills (Accounts and the ledger chips are already plain).
- `src/lib/version.ts`: 1.5.1.

## v1.5.0 — Quick Actions and Treasury restyled to match the reference images
- **Default dashboard layout** (`src/lib/dashboard-layout.ts`): Quick actions first, Treasury Position below it; the Quick actions card is 3 rows tall by default. Your saved layout is not touched; press **Reset** (edit bar) or **Reset to default** (drawer) on the Home screen to get the new default.
- **Quick Actions** (`QuickActionTile.tsx`, `styles.css`): tiles are solid blended gradients (lighter fill on the left, fuller fill on the right), not transparent, no glow. Every tile has the label on the left and a big icon on the right. A hero tile always uses the Issue-Payment style: two bands, fuller fill on top (label + icon) and lighter fill below ("Latest: ..."), no arrows. The style follows the position, so dragging a button into a hero place makes it a hero and dragging it out makes it a small tile. Light and dark themes have their own fill levels. Text contrast on all tiles >= 5.2:1, icons >= 3.6:1.
- **Treasury Position** (`TreasuryCard.tsx`, `TreasuryViz.tsx`, `treasury-series.ts`, `styles.css`): light base in the light theme and dark base in the dark theme; the only colour on the card is one orb at the top right (blue, green, amber). Tiles are plain glass (no tinted corners, nothing at the bottom left). Graphics sit at the top right of each tile like the reference: a wavy trend line with an arrow (Bank), six bars in different colours (Receivables), a small donut (Payables), three status dots (Pending cheques); Cash in hand has the big ring. The "30 days" caption is gone. Amounts hidden: graphics show no proportions.
- `src/lib/version.ts`: 1.5.0.

## v1.4.1 — Fix: ledger screen controls restored
- **What went wrong (my mistake, present in v1.1.0, v1.2.0, v1.3.0 and v1.4.0):** while rewriting the print header of `src/routes/ledger.$id.tsx` my edit replaced everything between the old print header and the old print tiles. That also deleted four on-screen parts: the party balance card (name, code, Balance, type/contact/address), the worker wages cards (or the Received/Issued cards), the From / To date filters with Clear, and the Cards View / Register Table View toggle. My type check could not see this (deleted UI is not a type error) and I only reviewed what I had added, not what I had removed. A reviewer (Lovable) found it.
- **Fix:** `src/routes/ledger.$id.tsx` — the four blocks are back, identical to the original code (checked token by token against v1.0.0), and the toggle sits in the date-filter row again. Everything else is kept: the 2x2 print summary box, fixed-width print table, `partText` / `tradeText`, cheque badge, table view.
- **Guard:** new `src/lib/__tests__/ledger-ui-guard.test.ts` fails if any of these controls disappear again (run against the broken v1.4.0 file it reports 9 missing markers). From now on every delivery is checked by listing every line removed from the previous version and justifying each one.
- `src/lib/version.ts`: 1.4.1.
- To apply only the fix in an existing project: replace the single file `src/routes/ledger.$id.tsx` (and optionally add the guard test).

## v1.4.0 — Bottom navigation redesign
- `src/components/app/AppShell.tsx` (changed): tab order is now Sales, Purchases, **Home (centre)**, Vouchers, Accounts; a short haptic on every tab tap (existing `haptic`). Nothing else in the shell changed.
- `src/styles.css` (changed, bottom-navigation section): light theme -> dark bar (follows the sidebar colour of the chosen palette), dark theme -> light bar; selected tab = lavender -> periwinkle -> sky gradient pill with soft glow (same gradient in both themes), dark icon/label on it. New tokens `--nav-bar`, `--nav-border`, `--nav-edge`, `--nav-g1/g2/g3`, `--nav-shine`; the old `--lens-bg` was removed. Contrast checked: label on pill 7.2-9.7:1, inactive icons 5.3-6.4:1.
- `src/lib/version.ts` (changed): 1.4.0.

## v1.3.0 — Treasury Position redesign
- `src/components/app/TreasuryCard.tsx` (changed): new glass tiles; Cash in hand with a cash-vs-bank ring; Bank balance with a 30-day sparkline; Receivables with top-party bars; Payables with a mini donut; Pending cheques with status dots. All numbers, the eye (hide) toggle, tile taps and the detail dialogs are unchanged. When amounts are hidden the graphics show no proportions.
- `src/components/app/TreasuryViz.tsx` (new): Ring, Spark, MiniBars, ChequeDots (plain SVG, no extra library).
- `src/lib/treasury-series.ts` (new) + test: 30-day bank balance series, shares, sparkline paths (read-only, uses existing ledger results).
- `src/styles.css` (changed): Treasury section rewritten with tokens only (new `--tre-cash/bank/recv/pay/chq`), mesh gradient, glass tiles, press effect, graphics shown only when the card is tall enough (otherwise the compact tiles with the text note), reduced-motion support.
- `src/lib/version.ts` (new) + `src/routes/settings.tsx` (changed): version label.
- `src/components/app/QuickActions.tsx` (changed): now uses the existing `haptic` from `dashboard-layout.ts`. The duplicate `haptics.ts` that v1.2.0 added was removed.

## v1.2.0 — Quick Actions
- New tiles (`QuickActionTile.tsx`), hero layout rule (`quick-layout.ts` + test), press effect, ripple, haptic on tap, "Latest:" line, `--qa-*` colour tokens, `DEFAULT_QUICK` = Receive, Issue, Sale, Purchase.
- Changed: `QuickActions.tsx`, `styles.css`.
- Had a duplicate `src/lib/haptics.ts` (removed in v1.3.0).

## v1.1.0 — Ledger, voucher and print
- `routes/ledger.$id.tsx`: Cards / Register Table toggle, new print header and fixed-width print table, cheque status only on screen.
- `routes/voucher.$id.tsx`: no cheque status, Cheque # / Bank table.
- `routes/cashbook.tsx`, `routes/bank.$id.tsx`, `routes/reports.tsx`: print tiles keep their columns.
- `styles.css`: A4 print fix for the ledger.

## v1.0.0 — Original source you uploaded.
