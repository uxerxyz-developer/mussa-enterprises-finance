# CHANGELOG — Mussa Finance

Every delivery has a version number: it is in the zip name (`mussa-finance-v1.6.8.zip`), in this file, and inside the app under **Settings & Backup → App version**.
When something is wrong, tell me: **the version shown in Settings + the screen + what you did + a screenshot**. I will look only at the files listed for that version.

## v1.6.8 — New sign-in (6-digit PIN boxes or password), back-button behaviour, voice and display fixes (current)
- **Sign-in and account creation** (`AuthInput.tsx` new, `AppShell.tsx` Login, `settings.tsx`, `db.ts` auth): when the account is created or the PIN is reset the user picks **6-digit PIN** or **Password**. PIN is entered in six animated boxes (pop and a light vibration per digit); when the last digit is filled it signs in by itself, no OK button. Password uses a normal field with a show / hide eye and Enter. The choice is remembered and the next sign-in shows the matching form. A wrong PIN or password shakes, turns red, clears and vibrates (as in v1.6.6). An older PIN of 4 to 8 digits keeps the single field until the first successful sign-in; that records its length and the boxes are used from then on. Settings: "Change PIN or Password" with the same choice. `db.ts`: `auth.pinLength`, `setupAuth` and `changePassword` take the mode, new `rememberPinLength`; updating the recovery details no longer resets the mode. Nothing in accounting changed.
- **Back button**: the path bar (Back / Dashboard / page) is hidden on the Dashboard and works as before on every other page. The main menu and bottom bar now replace the current page instead of adding to the history, so Back no longer replays every page visited. On the Dashboard the first Back shows "Press back again to exit" and a second Back within 2 seconds leaves the app.
- **Bank balance line** (`treasury-series.ts` `dailySeries`, `TreasuryViz.tsx`): drawn from the combined bank balance of the last 30 days (carried forward on quiet days) sampled to 10 points, lightly smoothed; nothing about 30 days is written on the card.
- **Sidebar**: still two orbs, stronger (about 35%), the lower one moved to the lower middle, colours chosen per theme.
- **Assistant greeting**: the saved greeting now plays as one piece, starting a moment after the audio device wakes, and the microphone is opened as it ends (when the permission is already granted) so the phone's audio-mode switch no longer chops it up.
- **Assistant banks**: the bank names are given to the assistant at the start, common spoken forms (Alfalah, HBL, UBL, MCB, Meezan, Allied ...) are recognised, and an unclear name is repeated back with the closest banks.
- **Assistant settings sheet**: Save, Cancel and Reset to default buttons; changes stay in a draft until Save.
- Tests: `treasury-series.test.ts` gets a `dailySeries` test.
- Nothing in accounting, ledgers, vouchers or prints changed.
- `src/lib/version.ts`: 1.6.8.

## v1.6.7 — Voice assistant accuracy, Sileo notifications, Admin fixes
- **Voice: amounts and totals** (`voice-tools.ts`, `gemini-live.functions.ts`, `AppShell.tsx`): every money value in a tool answer now carries Pakistani-grouped text (`Rs 14,79,640`) and spoken words ("14 lakh 79 hazar 640 rupay"), added in one place for all tools (`withSpoken`). The old western grouping (`1,479,640`) is gone from the spoken summary, the draft card and the save toast. The assistant is told the units (hazar, lakh, crore, arab, dedh, dhai, sawa) and never to convert or add amounts itself. Amounts can be given in parts (`amount_crore`, `amount_lakh`, `amount_thousand`, `amount_rupees`, and `opening_*` for an opening balance) and the app sums them. The draft summary repeats the amount in words.
- **Voice: totals** : receivables, payables, cheques and cash reports now return a total computed by the app over all accounts (not only the first 15), the overview has a funds total, and grouped report lists skip bounced cheques. Balances carry `balance_side` words for the assistant only; no screen, ledger, voucher or print text changed.
- **Voice: banks**: the assistant can use the same built-in bank list as the entry form as well as banks already created; a bank never used before is created when the entry is saved, exactly like the form. The entry form's bank dropdown is now a plain list of bank names (no group headings).
- **Voice: new accounts**: it now asks for phone, address and the opening balance (and for a worker, wages and CNIC) unless the user skips, and it must ask whether an opening balance is payable (we owe) or receivable (they owe us). Payable is stored negative, like the account form. Previously the side was never asked, so a payable opening balance became an advance.
- **Voice: names and stability**: Urdu-script names are romanised before matching; known account names are given to the assistant at the start so it can confirm what it heard; the model's randomness is lowered (`temperature` 0.3) and it is told to keep one voice.
- **Voice settings** (`VoiceSettings.tsx`, `voice-settings.ts`, new `voice-preview.ts`): a Greeting message field (empty = standard greeting; changing it records the new greeting once and then plays it instantly), and a play button beside each voice to hear a sample (recorded on first use, instant afterwards).
- **Notifications**: all toasts (success, error, warning, info) go through a new wrapper `lib/toast.ts` and are shown by Sileo at the top-centre on phone and desktop (`components/ui/toaster.tsx`, `__root.tsx`). `package.json` gets `sileo`; run the install so `bun.lock` is updated. If a build fails on Sileo, only `lib/toast.ts` and `ui/toaster.tsx` need to change back.
- **Admin panel**: the bottom bar no longer hides just because a field is focused: it hides only while the on-screen keyboard is really open and is re-checked on every page change. The tab row scrolls instead of widening the page. The Danger Zone is now a button in the page header that opens a dialog (backup download and Reset entire app, with the same RESET + PIN protection).
- **Sidebar**: the "System & Administration" group is tinted (amber-red dot and title; Admin Panel amber-red, Settings & Backup blue-grey).
- Tests: `voice-tools.test.ts` updated and extended (banks, guided account creation, opening side, amounts, totals).
- Nothing in `db.ts`, accounting, ledgers, vouchers or prints changed.
- `src/lib/version.ts`: 1.6.7.

## v1.6.6 — App-like feel, richer sidebar, wrong-PIN feedback, in-app sounds
- **App-like feel** (`styles.css`, `__root.tsx`): no text selection, no tap flash, no long-press callouts, no pull-to-refresh, no double-tap zoom (pinch zoom stays), no browser context menu or image/link dragging, no text cursor over plain text. Still allowed: inside entry fields (select, copy/paste, right-click) and on items marked `select-text`: the voice transcript, voucher numbers and contact numbers.
- **Sidebar and mobile menu** (`styles.css`, `SidebarNav.tsx`, `AppShell.tsx`): the base colour of each palette now carries a soft vertical gradient plus two faint violet and sky tints (derived with `color-mix`, so every palette and both themes follow). The selected item uses its module colour (Heat, Sales, Purchases, Accounts, Expenses, Cash Book, Cash & Banks; the rest the brand violet): gradient pill, thin outline, coloured icon and a sliding side bar in the same colour. The glow is tight (about 8px, not 16-20px). Hover is a light tint. Group titles are brighter.
- **Wrong PIN feedback** (`field-error.ts`, login, PIN confirmation dialog, admin reset PIN): vibration, a short sideways shake, a red outline on the PIN field and an error sound; the login PIN clears for the next try.
- **Sounds** (new `lib/sounds.ts`, synthesised with Web Audio, no files): voice dock opens/closes and the mic button toggles (rising/falling chime), errors and invalid fields (low double beep), entry saved (soft tick), a cheque newly becoming due while the app is open (gentle ping). `Settings` has a Sounds switch (kept on this device).
- Nothing in `db.ts` or accounting changed.
- `src/lib/version.ts`: 1.6.6.

## v1.6.5 — Quick Actions colours, mic ring, Treasury tile layout
- **Quick Actions** (`styles.css`, `--qa-*` only): Issue Payment is back to its earlier crimson; Expense takes the orange-red Issue had in v1.6.3/1.6.4; Purchase is back on its real amber (hue about 68-70), richer than the pale yellow of v1.6.4 (the dark theme keeps the bigger own-colour share for Purchase and Expense).
- **Voice button ring**: smaller and sized to the visible mic circle (no empty gap), one unbroken full-colour ring that turns clockwise at one steady speed (6 s); the three fading arcs are gone. It still dims to about 45% while the dock is open. `AppShell.tsx` markup and the `.mic-*` block in `styles.css`.
- **Treasury small tiles** (`TreasuryCard.tsx`): icon, title and amount sit lower in the tile; graphics stay top-right; titles (including "Pending cheques") and the cheque note are a single line. The Receivables graphic now has 5 bars instead of 6 (`TreasuryViz.tsx` `Bars`).
- Nothing in `db.ts` or accounting changed.
- `src/lib/version.ts`: 1.6.5.

## v1.6.4 — Net payments in cash/bank, bounced cheques out of every total, Cheque Status, Treasury and mic polish
- **Net sale / net purchase now move the money** (`db.ts` `entryFunds`, new `isNetPaid`): with a payment method recorded, a net purchase takes the amount out of Cash in hand (cash) or the chosen bank (cheque/online), and a net sale brings it in. Cheque rules are the same as before: pending is listed separately, cleared changes the balance, bounced changes nothing. The party ledger, party balance, `signedForAccount` and credit entries are unchanged (a net trade still leaves Debit/Credit empty). A net entry with no payment method moves no money. Because balances are always derived from entries, this also applies to existing net entries that have a method.
- **Bounced cheques are not counted in any total** (new `notBounced` helper, `db.ts`): Reports type totals and worker salary/advance, Dashboard month totals and In/Out, the totals under the entries tables (Sales, Purchases and the other pages, Expenses), worker salary/advance paid (`workerMonth`, `workerLifetime`) and the voice assistant's reports. The rows themselves stay in lists with their BOUNCED mark.
- **Dashboard In/Out this month**: bounced removed, and net sale/purchase payments (with a method) included, so it agrees with the bank and cash balances.
- **Cheque Status card**: pending cheques on net sales/purchases are included (net sale = received, net purchase = issued), so it no longer says "up to date" while Treasury shows a pending cheque.
- **Treasury tiles**: graphics are back in the top-right corner; titles may wrap to two lines; the amount sits below at full width. Bank trend line is smoothed into a gentle wave and its arrow is an open line arrow set slightly apart from the line.
- **Voice button (top bar)**: the glowing orbs are replaced by a soft circulating ring of three colour arcs (red-magenta, yellow-green, cyan-blue) turning at different speeds and directions, with a faint glow; brighter shades in the dark theme, deeper in the light theme. When the assistant dock is open the ring dims to about 45%; when it closes it returns to full. The old pulse ring is removed. With "Reduce motion" the ring is still.
- Tests: `netsale.test.ts` updated for the new rule (cash, cheque, online, no method, credit, bounced helper).
- `src/lib/version.ts`: 1.6.4.

## v1.6.3 — Quick Actions colours, calmer splash, voice glow, Treasury polish
- **Quick Actions** (`styles.css`, `--qa-*` tokens only): Purchase = `#FFC145`, Expense = `#CC2A41` (both exactly as given; the dark theme gets a slightly brighter version of the same hue). Issue Payment moved to a vermilion (orange-red) so it no longer looks like Expense. In the dark theme only the Purchase and Expense tiles use a bigger share of their own colour (`.dark .qa-tile[data-qid=...]`), which stops them going brown. Every other colour is unchanged.
- **Loading splash**: 12 orbs reduced to 6 large soft orbs plus the glow behind the logo, sized in `vmax` so phone and desktop look alike (same colours as v1.6.2). `AppShell.tsx` renders 7 orb elements.
- **App icon**: the M on the maskable icon is slightly larger again (30% of the icon); the orbs are unchanged.
- **Voice assistant glow** (`GeminiLiveWorkspaceBar.css`, `.voice-aura`): richer colour, rises from the bottom only up to just above the dialog (`clamp(11rem, 30dvh, 16rem)`), travels less, and the mask and orb edges are smoother so no block shows.
- **Treasury Position**: the corner glow has separate colours per theme (soft pastel in light, brighter in dark; `--tre-orb-*`). Tile titles are 12.5px (hero 13px) with bigger icon chips (22px). In the four small tiles the graphic now sits beside the amount (it wraps under the amount when the tile is narrow) instead of the top-right corner. Donuts are thinner with rounded ends, a softer track and a faint glow; the proportions are unchanged. `TreasuryCard.tsx`, `TreasuryViz.tsx`.
- Nothing in `db.ts`, accounting, ledger, vouchers or `treasury-series` changed.
- `src/lib/version.ts`: 1.6.3.

## v1.6.2 — New launch screens: pastel orbs
- **System splash (Android, shown before the app opens)**: new icon artwork (`public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`): light periwinkle base with soft peach and blue orbs and a pale glow behind the clean M logo, edges fading into the base so no box edge shows. The M on the splash (maskable icon) is about 15% smaller; the other icons keep their logo size. `manifest.webmanifest`: only `background_color` changed to `#D8DBE8` to match. `theme_color` left as it was.
- **In-app loading splash** (`styles.css` `.splash*`, `AppShell.tsx` orb markup): the violet orb and the blue frost layer (the muddy tint) are gone. 12 soft orbs (peach, blue, one red at bottom-left, pale blue) are scattered at varied sizes over a light base, a few reach near the logo, with a pale glow behind it; they still drift slowly (off with "Reduce motion"). Text and loading line are dark navy for the light background. Logo and text sizes unchanged.
- Nothing in `db.ts`, accounting, ledger, vouchers or other screens changed. To see the new system splash/icon, uninstall the PWA and install it again (Android caches the old icon).
- `src/lib/version.ts`: 1.6.2.

## v1.6.1 — Fix: server-function calls no longer crash without Supabase variables
- `src/integrations/supabase/auth-attacher.ts`: `attachSupabaseAuth` now checks `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` first. If either is missing it simply returns `next()` (no session lookup, no error), so local-first server functions such as `getGeminiLiveConfig` keep working without a connected Supabase backend. With both set, behaviour is exactly as before.
- Nothing else changed (`start.ts`, `client.ts`, `db.ts` untouched).
- `src/lib/version.ts`: 1.6.1.

## v1.6.0 — Reports tiles, Quick Actions colours, bank dropdown scroll, theme-switch animation
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
