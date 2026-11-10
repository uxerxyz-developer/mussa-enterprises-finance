# INTEGRATION_DIFF.md — v1.6.8

Reference only: every change below is already applied inside this project; nothing has to be merged by hand. See CHANGELOG.md for the version history.
Compared with v1.0.0 (your original upload): 12 files changed, 10 new files. `src/lib/db.ts`, accounting math, voice files, transaction labels, Cheque Status, "This month" and `PrintHeader` are untouched.

## S. Sign-in, back button, greeting, bank line (v1.6.8)
- New `AuthInput.tsx`; `AppShell.tsx` (Login rewrite, Dashboard back guard, bank names to the assistant), `settings.tsx` (change PIN/password), `db.ts` (`pinLength`, `setupAuth`/`changePassword` mode, `rememberPinLength`, recovery update keeps mode), `styles.css` (PIN boxes, sign-in toggle, sidebar orbs).
- `PageTrailBar.tsx` (hidden on `/`), `SidebarNav.tsx` and the bottom bar links (`replace`).
- `useGeminiLive.ts` (`playGreetingOnce`, deferred microphone), `voice-tools.ts` (`BANK_ALIASES`), `voice-settings.ts` (banks in the instruction), `VoiceSettings.tsx` (Save / Cancel / Reset).
- `treasury-series.ts` (`dailySeries`), `TreasuryCard.tsx`, `TreasuryViz.tsx`; test `treasury-series.test.ts`.

## R. Voice accuracy, Sileo, Admin (v1.6.7)
- `voice-tools.ts` (money/words/parts helpers, `withSpoken`, `bankChoices`, guided account draft, report totals), `fuzzy.ts` (Urdu-script query), `gemini-live.functions.ts` (instruction + schema), `voice-settings.ts` (greeting field, names in instruction), `useGeminiLive.ts` (temperature), `AppShell.tsx` (dispatcher wrapper, bank creation on save, draft card, keyboard flag, imports).
- New: `voice-preview.ts`, `lib/toast.ts`, `components/ui/toaster.tsx`; `VoiceSettings.tsx` (preview buttons, greeting field); 17 files now import `toast` from `@/lib/toast`; `__root.tsx` uses the new Toaster; `package.json` (+ sileo).
- `EntryForm.tsx` bank dropdown (no group headings); `routes/admin.tsx` (Danger Zone button, scrollable tabs); `SidebarNav.tsx` + `styles.css` (System group colours).

## Q. App-like feel, sidebar, PIN feedback, sounds (v1.6.6)
- `styles.css`: new blocks at the end (app-like feel, shake and `input.field-error`, sidebar). `__root.tsx`: context-menu and drag handlers.
- `SidebarNav.tsx`: `ACCENT` map, indicator colour; `AppShell.tsx`: `side-surface` classes, login PIN id and `fieldError`, mic sounds, imports.
- `field-error.ts`, `PinActionDialog.tsx`, `routes/admin.tsx`: PIN field feedback. `lib/sounds.ts` (new); sound calls in `EntryForm.tsx` and `ChequeStatusCard.tsx`; Sounds switch in `routes/settings.tsx`.
- `select-text` added on the transcript (`GeminiLiveWorkspaceBar.tsx`), voucher numbers (`vouchers.tsx`, `ledger.$id.tsx`, `EntriesTable.tsx`, `inputs.tsx` PrintHeader) and contact numbers (`ledger.$id.tsx`, `accounts.tsx`).

## P. Quick Actions colours, mic ring, tile layout (v1.6.5)
- `styles.css`: `--qa-issue/purchase/expense` (light + dark) and the `.mic-*` ring block; `AppShell.tsx`: mic ring markup (one arc per set).
- `TreasuryCard.tsx`: tile alignment, one-line title and note; `TreasuryViz.tsx`: `Bars` 6 -> 5.

## O. Net payments, bounced totals, Cheque Status, Treasury, mic ring (v1.6.4)
- `db.ts`: `notBounced`, `isNetPaid` added; `entryFunds` handles net sale/purchase with a method; `workerMonth`/`workerLifetime` skip bounced.
- Totals now skip bounced in: `reports.tsx`, `index.tsx`, `EntriesTable.tsx`, `BusinessEntries.tsx`, `expenses.tsx`, `voice-tools.ts`.
- `ChequeStatusCard.tsx`: includes net trades. `TreasuryCard.tsx` (tile layout) and `TreasuryViz.tsx` (`softSeries`, line arrow).
- `AppShell.tsx` mic markup + `styles.css` mic ring block (replaces `.mic-mesh/.mic-blob`, removes the pulse ring). `__tests__/netsale.test.ts`.

## N. Colours, voice glow, Treasury polish (v1.6.3)
- `styles.css`: `--qa-purchase/expense/issue` (light + dark), one `.dark .qa-tile[data-qid]` rule, splash orb block (7 elements, vmax), `--tre-orb-*` tokens and the two `.treasury-surface` gradients, `.tre-chip` size, ring track.
- `GeminiLiveWorkspaceBar.css`: `.voice-aura` block and `aura-rise` keyframes only.
- `TreasuryCard.tsx`: tile sizes and layout; `TreasuryViz.tsx`: `Ring` only. `AppShell.tsx`: orb count 12 -> 7. `public/icon-maskable-512.png`.

## M. Launch screens (v1.6.2)
- `public/icon-*.png`, `apple-touch-icon.png`: regenerated artwork; `manifest.webmanifest`: `background_color` only.
- `styles.css`: `.splash` block rewritten (orbs as CSS classes, no frost); three small drift keyframes added (`orb-d/e/f`).
- `AppShell.tsx` `SplashScreen`: 3 orb divs + frost div replaced by one 12-orb map.

## L. Safe Supabase check in the auth attacher (v1.6.1)
- `auth-attacher.ts`: early `return next()` when `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` is missing; the rest of the function is unchanged.

## K. Reports tiles, Quick Actions colours, dropdown scroll, theme-switch animation (v1.6.0)
- `reports.tsx`: summary grid is 2 columns on phones (odd last card full width); `sm`+ and print classes unchanged.
- `styles.css`: only the `--qa-*` colour tokens (light and dark hues) plus a new View Transition block next to the `theme-fade` rules.
- `inputs.tsx`: `NativeSelect` list gets a ref that stops wheel/touch bubbling (scroll fix) and `touch-pan-y overscroll-contain`.
- `theme-transition.ts` (new), `AppShell.tsx` (`toggleTheme` + 2 imports), `appearance.ts` (one condition: no old fade while a View Transition runs).

## J. Ledger bounce / net-sale display, print table and vouchers pills (v1.5.1)
- `ledger.$id.tsx`: card amount for bounced cheques, Received/Issued cards without bounced cheques, print table without the Method column (details in Particulars & Details), register-table note under the details.
- `ledger-display.ts` (new, display only) + `ledger-display.test.ts`: `payParts`, `amountNote`, `isBounced`, `isNet`.
- `vouchers.tsx`: only the four `off:` pill styles were emptied; the `on:` styles are unchanged.

## I. Restyle of Quick Actions and Treasury (v1.5.0)
- `dashboard-layout.ts`: `DEFAULT_LAYOUT` order and the Quick actions height only (saved layouts are untouched).
- `QuickActionTile.tsx` (rewritten) and the Quick Actions CSS: gradient-filled tiles, two-band hero, label left / icon right.
- `TreasuryCard.tsx`, `TreasuryViz.tsx` (Ring, Trend, Bars, StatusDots), `treasury-series.ts` (activitySeries, smoothPath), Treasury CSS: light/dark base, top-right orb, top-right graphics. Dialogs, hide toggle, tile taps and all numbers are unchanged.
- `QuickActions.tsx`: only the grid's `overflow-hidden` class removed (so the tile shadows are visible).

## H. Ledger regression fix (v1.4.1)
- `ledger.$id.tsx`: restored the party balance card, worker wages / Received-Issued cards and the From/To date filters (identical to v1.0.0), plus the Cards View / Register Table View toggle in the filter row. In the diff below, the on-screen blocks appear as "removed" lines only because they were re-indented; the content is the original's.
- New `ledger-ui-guard.test.ts`: fails if these controls are ever deleted again.

## G. Bottom navigation (v1.4.0)
- `AppShell.tsx`: tab array reordered (Sales, Purchases, Home, Vouchers, Accounts) and `onClick={() => haptic(8)}` on each tab link; `haptic` is imported from `dashboard-layout.ts` (already existed). The sliding highlight is driven by the active tab's index, so the reorder needs no other change. Voice-dock/keyboard hiding, print hiding and desktop behaviour are untouched.
- `styles.css`: nav tokens (light theme dark bar, dark theme light bar), gradient pill with glow, bar border/shadow.

## F. Treasury Position (v1.3.0)
- `TreasuryCard.tsx`: visuals added next to the existing numbers; data comes from the same `fundList`, `accountBalance` and cheque lists already computed in the card (plus a 30-day bank series). Dialogs, eye toggle and tap behaviour unchanged.
- `TreasuryViz.tsx` (new), `treasury-series.ts` (new, tested), `styles.css` Treasury section (tokens only), `version.ts` (new) and the version line in `settings.tsx`.
- Small card (fewer than about 270px of grid height): the previous compact tiles with the text note. Taller card: ring, sparkline, bars, donut and dots.

## A. Quick Actions (v1.2.0, cleanup in v1.3.0)
- New `QuickActionTile.tsx`, `quick-layout.ts` (+ test). First two buttons are full-width heroes; an odd last button becomes a hero too; otherwise the compact grid. Press effect, ripple, haptic (the existing `haptic` from `dashboard-layout.ts`), "Latest: Rs … · Party" on heroes, `--qa-*` tokens, `DEFAULT_QUICK` = Receive, Issue, Sale, Purchase.

## B. Party Ledger (v1.1.0)
- Cards View / Register Table View (newest first, same filter), Opening row last, Closing + totals in `<tfoot>`.
- Print header: party name/phone/address left, 2x2 summary box right, monochrome; signatures fixed; fixed-width print table (10/7/11/24/14/10/10/14 = 100%); "Cheque #123456" with bank underneath; no cheque status in print; duplicate trade text and type-only particulars hidden.

## C. Voucher (v1.1.0)
- No "Cheque Status"; Cheque # / Bank table (Amount + Total when more than one cheque).

## D. Other statements (v1.1.0)
- `cashbook.tsx`, `bank.$id.tsx`, `reports.tsx`: tiles keep columns when printed; Business Summary tables in 2 columns.

## E. Print CSS (v1.1.0)
- `.statement-print, .print-area` overflow visible; `main:has(.statement-print)` no padding; fixed table layout.

## Verification
- Removed-line audit against the previous delivered version (v1.5.0): in `ledger.$id.tsx` only the two summary-card lines, the card amount line and the old print-table columns/headers/cells were removed; in `vouchers.tsx` only the four `off:` styles. Nothing else was removed.
- Type check of the edited and new files against the real `db.ts` and sibling modules (strict, exactOptionalPropertyTypes), no errors; a deliberately removed import is caught (TS2304). The raw output only contains "package not installed" and "implicit any" noise because `node_modules` is not available here.
- The helper was executed directly and gives the expected lines, e.g. "Cheque #78231 · Bank Alfalah · Rs 2,50,720 · BOUNCED" and "Net Sale · Cash · Rs 38,66,252". All 11 ledger guard markers are still present. The test files themselves could not be run here (no vitest).
- Not possible here (no bun, node_modules, network, browser): `bun run build`, vitest, a real print preview. Please run `bun run build`, print the Mughal Steel statement and check the Received card (it should show 45,50,000).

---

## Exact diffs

### src/routes/ledger.$id.tsx

```diff
--- a/src/routes/ledger.$id.tsx	2026-11-05 09:22:25.231218879 +0000
+++ b/src/routes/ledger.$id.tsx	2026-11-06 19:44:53.877018820 +0000
@@ -9,8 +9,9 @@
 import { PinActionDialog } from "@/components/app/PinActionDialog";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { TypeBadge } from "@/components/app/EntriesTable";
-import { accountTypeLabel, balanceClass, deleteItems, liveEntries, signedForAccount, useData, workerLifetime, workerMonth, METHODS, ENTRY_TYPES, type Entry, type EntryType } from "@/lib/db";
+import { accountTypeLabel, balanceClass, deleteItems, liveEntries, signedForAccount, useData, workerLifetime, workerMonth, METHODS, ENTRY_TYPES, fundName, type Data, type Entry, type EntryType } from "@/lib/db";
 import { downloadFile, fmtDate, fmtPKR, fmtTime, toCSV, todayISO } from "@/lib/format";
+import { amountNote, isBounced, payParts, type DetailPart } from "@/lib/ledger-display";
 import { cn } from "@/lib/utils";
 
 export const Route = createFileRoute("/ledger/$id")({
@@ -27,6 +28,54 @@
   component: LedgerPage,
 });
 
+/* ---------- ledger display helpers (presentation only; no accounting logic) ---------- */
+const bankNameOf = (d: Data, e: Entry) => (e.bankId ? fundName(d, e.bankId) : e.bank?.trim()) || "";
+/** "Material · weight · rate" for trade entries; empty when none is stored. */
+function tradeText(d: Data, e: Entry) {
+  const mat = d.materials.find((m) => m.id === e.materialId)?.name;
+  // Auto-generated particulars already carry "Billet 10.659 Ton @ Rs 148/kg": do not repeat it.
+  if (mat && e.particulars && e.particulars.toLowerCase().includes(mat.toLowerCase()) && /@|\bton\b|\bkg\b/i.test(e.particulars)) return "";
+  return [mat, e.weightKg ? `${e.weightKg.toLocaleString("en-IN")} kg` : "", e.rate ? `@ ${fmtPKR(e.rate)}/kg` : ""].filter(Boolean).join(" · ");
+}
+/** Particulars, except when they only repeat the type name ("Sale", "Receive Payment"...). */
+function partText(e: Entry) {
+  const p = e.particulars?.trim() ?? "";
+  const m = ENTRY_TYPES[e.type];
+  return [m.label, m.action].some((x) => x && x.toLowerCase() === p.toLowerCase()) ? "" : p;
+}
+/** Method line ("Cheque · Chq #123") and bank line. Never includes cheque status. */
+function payInfo(d: Data, e: Entry) {
+  if (!e.method || e.method === "cash") return { first: e.method ? METHODS[e.method] : "", bank: "" };
+  const no = e.method === "cheque" ? e.chequeNo?.trim() : e.reference?.trim();
+  return { first: `${METHODS[e.method]}${no ? (e.method === "cheque" ? ` #${no}` : ` · Ref ${no}`) : ""}`, bank: bankNameOf(d, e) };
+}
+
+/** On-screen only: cheque status stays inside the app and is never printed or put on vouchers. */
+function ChequeBadge({ e }: { e: Entry }) {
+  if (e.method !== "cheque") return null;
+  const s = e.chequeStatus ?? "pending";
+  return <span className={cn("inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase", s === "cleared" ? "bg-success-soft text-success" : s === "bounced" ? "bg-danger-soft text-destructive" : "bg-warning-soft text-warning")}>{s}</span>;
+}
+
+/** Detail pieces joined with " · "; struck-through or bold where the piece asks for it. */
+function Parts({ parts }: { parts: DetailPart[] }) {
+  return <>{parts.map((x, i) => <span key={i}>{i > 0 && " · "}{x.strike ? <s>{x.text}</s> : x.bold ? <b>{x.text}</b> : x.text}</span>)}</>;
+}
+
+function CardDetails({ d, e }: { d: Data; e: Entry }) {
+  const trade = tradeText(d, e);
+  const bank = bankNameOf(d, e);
+  const cheque = e.method === "cheque";
+  if (!trade && !e.remarks && !cheque) return null;
+  return (
+    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
+      {e.remarks && <div>Remarks: {e.remarks}</div>}
+      {trade && <div>{trade}</div>}
+      {cheque && <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span>{[e.chequeNo?.trim() ? `Chq #${e.chequeNo.trim()}` : "Cheque", bank].filter(Boolean).join(" · ")}</span><ChequeBadge e={e} /></div>}
+    </div>
+  );
+}
+
 function LedgerPage() {
   const { id } = Route.useParams();
   const d = useData();
@@ -37,6 +86,7 @@
   const [pending, setPending] = useState<{ entry: Entry; action: "edit" | "delete" } | null>(null);
   const [editing, setEditing] = useState<Entry | null>(null);
   const [adding, setAdding] = useState(false);
+  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
 
   const { opening, rows, closing, dr, cr } = useMemo(() => {
     const all = liveEntries(d).filter((e) => e.accountId === id).sort((x, y) => x.date.localeCompare(y.date) || x.voucherNo - y.voucherNo);
@@ -58,8 +108,8 @@
   const choices: EntryType[] = a.type === "buyer" ? ["sale", "inward", "outward"] : a.type === "supplier" ? ["purchase", "outward", "inward"] : a.type === "worker" ? ["salary", "advance"] : ["inward", "outward", "sale", "purchase"];
   const balText = (b: number) => `${fmtPKR(Math.abs(b), false)} ${b > 0 ? "Dr" : b < 0 ? "Cr" : ""}`;
   const period = from || to ? `${fmtDate(from) || "Start"} to ${fmtDate(to) || fmtDate(todayISO())}` : "All dates";
-  const received = rows.filter(({ e }) => ENTRY_TYPES[e.type].flow === "in").reduce((total, { e }) => total + e.amount, 0);
-  const issued = rows.filter(({ e }) => ENTRY_TYPES[e.type].flow === "out").reduce((total, { e }) => total + e.amount, 0);
+  const received = rows.filter(({ e }) => !isBounced(e) && ENTRY_TYPES[e.type].flow === "in").reduce((total, { e }) => total + e.amount, 0);
+  const issued = rows.filter(({ e }) => !isBounced(e) && ENTRY_TYPES[e.type].flow === "out").reduce((total, { e }) => total + e.amount, 0);
   const isWorker = a.type === "worker";
   const month = todayISO().slice(0, 7);
   // Same figures the dashboard and reports use. "This month" resets with the month; "so far" and the advance balance keep running.
@@ -68,6 +118,9 @@
   const { paidSalary, paidAdvance } = wm;
   const wageLeft = wm.remaining;
   const visible = rows.filter(({ e }) => filter === "all" || ENTRY_TYPES[e.type].flow === (filter === "received" ? "in" : "out")).slice().reverse();
+  // Dr/Cr totals of the rows currently shown (equal to dr/cr when no filter is applied).
+  const visDr = visible.reduce((t, r) => t + r.debit, 0);
+  const visCr = visible.reduce((t, r) => t + r.credit, 0);
 
   const exportCSV = () => {
     const out: (string | number)[][] = [[`${a.name} (${a.code})`], ["Period", period], [], ["Date", "Voucher", "Type", "Particulars", "Method", "Debit", "Credit", "Balance"], ["", "", "", "Opening Balance", "", "", "", balText(opening)]];
@@ -89,109 +142,244 @@
         </>}
       />
       <PrintHeader title="Account Statement" sub={period} />
-      <div className="print-only mb-3 text-sm">
-        <div className="font-semibold">{a.name} <span className="num">({a.code})</span></div>
-        {a.phone && <div>{a.phone}</div>}
-        {a.address && <div>{a.address}</div>}
+      <div className="print-only mb-3">
+        <div className="flex items-start justify-between gap-4">
+          <div className="min-w-0 flex-1 break-words text-sm">
+            <div className="font-semibold">{a.name} <span className="num">({a.code})</span></div>
+            {a.phone && <div>{a.phone}</div>}
+            {a.address && <div>{a.address}</div>}
+          </div>
+          <div className="grid w-[55%] shrink-0 grid-cols-2 border text-xs">
+            {([["Opening", balText(opening)], ["Total Debit", fmtPKR(Math.abs(dr), false)], ["Total Credit", fmtPKR(Math.abs(cr), false)], ["Closing", balText(closing)]] as const).map(([l, v], i) => (
+              <div key={l} className={cn("px-2 py-1", i % 2 === 1 && "border-l", i > 1 && "border-t")}>
+                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</div>
+                <div className="num whitespace-nowrap text-sm font-semibold">{v}</div>
+              </div>
+            ))}
+          </div>
+        </div>
       </div>
 
-       <div className="no-print mb-5 rounded-lg border bg-card p-5 sm:p-6">
-         <div className="flex flex-wrap items-start justify-between gap-4">
-           <div><h2 className="text-xl font-semibold sm:text-2xl">{a.name}</h2><span className="num text-sm text-muted-foreground">{a.code}</span></div>
-           <div className="text-left sm:text-right"><div className="text-xs uppercase text-muted-foreground">Balance</div><div className={cn("num text-xl font-semibold sm:text-2xl", closing >= 0 ? "text-success" : "text-destructive")}>{closing < 0 ? "−" : ""}{fmtPKR(Math.abs(closing))}</div><div className="text-xs text-muted-foreground">{balanceClass(a, closing)}{closing > 0 ? " · Dr" : closing < 0 ? " · Cr" : ""}</div></div>
-         </div>
-         <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 text-sm"><dt className="text-muted-foreground">Type</dt><dd>{accountTypeLabel(d, a.type)}</dd>{a.phone && <><dt className="text-muted-foreground">Contact</dt><dd>{a.phone}</dd></>}{a.address && <><dt className="text-muted-foreground">Address</dt><dd>{a.address}</dd></>}</dl>
-       </div>
-       {isWorker ? <div className="no-print mb-6 grid grid-cols-2 gap-3">
-         <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Fixed Wages / month</div><div className="num mt-1 text-lg font-semibold">{a.fixedWages ? fmtPKR(a.fixedWages) : "Not set"}</div></div>
-         <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Paid this month</div><div className="num mt-1 text-lg font-semibold text-destructive">{fmtPKR(paidSalary + paidAdvance)}</div><div className="num text-xs text-muted-foreground">Salary {fmtPKR(paidSalary)} · Advance {fmtPKR(paidAdvance)}</div></div>
-         {!!a.fixedWages && <div className="col-span-2 rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">{wageLeft >= 0 ? "Remaining to pay this month" : "Advance over wages"}</div><div className={cn("num mt-1 text-xl font-semibold", wageLeft >= 0 ? "text-success" : "text-destructive")}>{fmtPKR(Math.abs(wageLeft))}</div></div>}
-       <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Advance outstanding</div><div className="num mt-1 text-lg font-semibold">{fmtPKR(life.outstanding)}</div><div className="text-xs text-muted-foreground">Given and not yet adjusted (all months)</div></div>
-         <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Paid so far (all time)</div><div className="num mt-1 text-lg font-semibold">{fmtPKR(life.salaryPaid + life.advanceGiven)}</div><div className="num text-xs text-muted-foreground">Salary {fmtPKR(life.salaryPaid)} · Advance {fmtPKR(life.advanceGiven)}</div></div>
-       </div> : <div className="no-print mb-6 grid grid-cols-2 gap-3">
-         <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Received</div><div className="num mt-1 text-lg font-semibold text-success">{fmtPKR(received)}</div></div>
-         <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Issued</div><div className="num mt-1 text-lg font-semibold text-destructive">{fmtPKR(issued)}</div></div>
-       </div>}
-       <div className="no-print mb-4 flex flex-wrap items-end gap-3">
-        <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
-        <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
-        {(from || to) && <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>Clear</Button>}
+      {/* 1. Account Summary & Balance Card */}
+      <div className="no-print mb-5 rounded-lg border bg-card p-5 sm:p-6">
+        <div className="flex flex-wrap items-start justify-between gap-4">
+          <div>
+            <h2 className="text-xl font-semibold sm:text-2xl">{a.name}</h2>
+            <span className="num text-sm text-muted-foreground">{a.code}</span>
+          </div>
+          <div className="text-left sm:text-right">
+            <div className="text-xs uppercase text-muted-foreground">Balance</div>
+            <div className={cn("num text-xl font-semibold sm:text-2xl", closing >= 0 ? "text-success" : "text-destructive")}>
+              {closing < 0 ? "−" : ""}{fmtPKR(Math.abs(closing))}
+            </div>
+            <div className="text-xs text-muted-foreground">
+              {balanceClass(a, closing)}{closing > 0 ? " · Dr" : closing < 0 ? " · Cr" : ""}
+            </div>
+          </div>
+        </div>
+        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 text-sm">
+          <dt className="text-muted-foreground">Type</dt>
+          <dd>{accountTypeLabel(d, a.type)}</dd>
+          {a.phone && <><dt className="text-muted-foreground">Contact</dt><dd>{a.phone}</dd></>}
+          {a.address && <><dt className="text-muted-foreground">Address</dt><dd>{a.address}</dd></>}
+        </dl>
       </div>
 
-       <div className="print-only mb-4 grid gap-3 sm:grid-cols-4">
-        {[["Opening", opening], ["Total Debit", dr], ["Total Credit", -cr], ["Closing", closing]].map(([l, v]) => (
-          <div key={l as string} className="rounded-lg border bg-card p-3">
-            <div className="text-xs uppercase tracking-wide text-muted-foreground">{l}</div>
-            <div className={cn("num mt-1 text-lg font-semibold", (l === "Opening" || l === "Closing") && ((v as number) > 0 ? "text-success" : (v as number) < 0 ? "text-destructive" : ""))}>
-              {l === "Opening" || l === "Closing" ? balText(v as number) : fmtPKR(Math.abs(v as number), false)}
+      {/* 2. Worker Wages Breakdown (or Received/Issued Summary) */}
+      {isWorker ? (
+        <div className="no-print mb-6 grid grid-cols-2 gap-3">
+          <div className="rounded-lg border bg-card p-4">
+            <div className="text-xs uppercase text-muted-foreground">Fixed Wages / month</div>
+            <div className="num mt-1 text-lg font-semibold">{a.fixedWages ? fmtPKR(a.fixedWages) : "Not set"}</div>
+          </div>
+          <div className="rounded-lg border bg-card p-4">
+            <div className="text-xs uppercase text-muted-foreground">Paid this month</div>
+            <div className="num mt-1 text-lg font-semibold text-destructive">{fmtPKR(paidSalary + paidAdvance)}</div>
+            <div className="num text-xs text-muted-foreground">Salary {fmtPKR(paidSalary)} · Advance {fmtPKR(paidAdvance)}</div>
+          </div>
+          {!!a.fixedWages && (
+            <div className="col-span-2 rounded-lg border bg-card p-4">
+              <div className="text-xs uppercase text-muted-foreground">{wageLeft >= 0 ? "Remaining to pay this month" : "Advance over wages"}</div>
+              <div className={cn("num mt-1 text-xl font-semibold", wageLeft >= 0 ? "text-success" : "text-destructive")}>
+                {fmtPKR(Math.abs(wageLeft))}
+              </div>
             </div>
+          )}
+          <div className="rounded-lg border bg-card p-4">
+            <div className="text-xs uppercase text-muted-foreground">Advance outstanding</div>
+            <div className="num mt-1 text-lg font-semibold">{fmtPKR(life.outstanding)}</div>
+            <div className="text-xs text-muted-foreground">Given and not yet adjusted (all months)</div>
           </div>
-        ))}
+          <div className="rounded-lg border bg-card p-4">
+            <div className="text-xs uppercase text-muted-foreground">Paid so far (all time)</div>
+            <div className="num mt-1 text-lg font-semibold">{fmtPKR(life.salaryPaid + life.advanceGiven)}</div>
+            <div className="num text-xs text-muted-foreground">Salary {fmtPKR(life.salaryPaid)} · Advance {fmtPKR(life.advanceGiven)}</div>
+          </div>
+        </div>
+      ) : (
+        <div className="no-print mb-6 grid grid-cols-2 gap-3">
+          <div className="rounded-lg border bg-card p-4">
+            <div className="text-xs uppercase text-muted-foreground">Received</div>
+            <div className="num mt-1 text-lg font-semibold text-success">{fmtPKR(received)}</div>
+          </div>
+          <div className="rounded-lg border bg-card p-4">
+            <div className="text-xs uppercase text-muted-foreground">Issued</div>
+            <div className="num mt-1 text-lg font-semibold text-destructive">{fmtPKR(issued)}</div>
+          </div>
+        </div>
+      )}
+
+      {/* 3. Date Filters + Cards vs Register Table View Toggle */}
+      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
+        <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
+        <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
+        {(from || to) && <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>Clear</Button>}
+        <div className="ml-auto flex gap-1 rounded-lg border bg-card p-1" role="group" aria-label="Ledger view">
+          <Button size="sm" variant={viewMode === "cards" ? "default" : "ghost"} aria-pressed={viewMode === "cards"} onClick={() => setViewMode("cards")}>Cards View</Button>
+          <Button size="sm" variant={viewMode === "table" ? "default" : "ghost"} aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")}>Register Table View</Button>
+        </div>
       </div>
 
        {!isWorker && <div className="no-print mb-5 flex gap-2">
          {(["all", "received", "issued"] as const).map((key) => <Button key={key} className="rounded-full" variant={filter === key ? "default" : "outline"} onClick={() => setFilter(key)}>{key === "all" ? "All" : key === "received" ? "Received" : "Issued"}</Button>)}
        </div>}
        <h2 className="no-print mb-3 text-xs font-semibold uppercase text-muted-foreground">Transactions</h2>
-       <div className="no-print space-y-3">
+       {viewMode === "cards" && <div className="no-print space-y-3">
          {visible.length === 0 && <p className="py-8 text-center text-muted-foreground">No transactions in this view</p>}
          {visible.map(({ e, bal }) => {
            const flow = ENTRY_TYPES[e.type].flow;
            return <div key={e.id} className={cn("rounded-lg border border-l-[5px] bg-card p-4 shadow-sm", flow === "in" ? "border-l-success" : flow === "out" ? "border-l-destructive" : "border-l-ledger")}>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0"><div className="font-semibold">{isWorker ? ENTRY_TYPES[e.type].label : flow === "in" ? "Received" : flow === "out" ? "Issued" : ENTRY_TYPES[e.type].label}</div><div className="text-xs text-muted-foreground">{fmtDate(e.date)} · {fmtTime(e.createdAt)} · {e.method ? METHODS[e.method] : `V-${e.voucherNo}`}</div></div>
-               <div className={cn("num shrink-0 text-right text-sm font-semibold sm:text-lg", flow === "in" ? "text-success" : flow === "out" ? "text-destructive" : "text-foreground")}>{flow === "in" ? "+ " : flow === "out" ? "− " : ""}{fmtPKR(e.amount)}</div>
+               <div className={cn("num shrink-0 text-right text-sm font-semibold sm:text-lg", isBounced(e) ? "text-destructive line-through" : flow === "in" ? "text-success" : flow === "out" ? "text-destructive" : "text-foreground")}>{isBounced(e) ? "" : flow === "in" ? "+ " : flow === "out" ? "− " : ""}{fmtPKR(e.amount)}</div>
              </div>
-             {e.particulars && <p className="mt-2 text-sm text-muted-foreground">{e.particulars}</p>}
+             {partText(e) && <p className="mt-2 text-sm text-muted-foreground">{partText(e)}</p>}
+             <CardDetails d={d} e={e} />
              <div className="mt-3 flex items-center justify-between border-t pt-2"><span className="num text-xs text-muted-foreground">V-{e.voucherNo} · Balance {balText(bal)}</span><div className="flex gap-1"><Button variant="ghost" size="icon" title="Edit · PIN required" aria-label={`Edit voucher V-${e.voucherNo}`} onClick={() => setPending({ entry: e, action: "edit" })}><Pencil /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete · PIN required" aria-label={`Delete voucher V-${e.voucherNo}`} onClick={() => setPending({ entry: e, action: "delete" })}><Trash2 /></Button></div></div>
            </div>;
          })}
-       </div>
-       <div className="print-only statement-print overflow-x-auto rounded-lg border bg-card print-area">
-        <table className="w-full text-sm">
-          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
+       </div>}
+       {viewMode === "table" && <div className="no-print">
+         {filter !== "all" && <p className="mb-2 text-xs text-muted-foreground">Filtered view — balances are the full account running balances; Dr/Cr totals cover the filtered rows only.</p>}
+         <div className="overflow-x-auto rounded-lg border bg-card">
+           <table className="w-full min-w-[900px] text-sm">
+             <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
+               <tr>
+                 <th className="px-3 py-2.5">Date</th>
+                 <th className="px-3 py-2.5">Voucher</th>
+                 <th className="px-3 py-2.5">Type &amp; Details</th>
+                 <th className="px-3 py-2.5">Method / Chq</th>
+                 <th className="px-3 py-2.5 text-right">Debit (Dr)</th>
+                 <th className="px-3 py-2.5 text-right">Credit (Cr)</th>
+                 <th className="px-3 py-2.5 text-right">Balance</th>
+                 <th className="px-3 py-2.5 text-right">Actions</th>
+               </tr>
+             </thead>
+             <tbody>
+               {visible.length === 0 && <tr className="border-t"><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No transactions in this view</td></tr>}
+               {visible.map(({ e, debit, credit, bal }) => {
+                 const pi = payInfo(d, e);
+                 const trade = tradeText(d, e);
+                 const note = amountNote(e, fmtPKR(e.amount));
+                 return (
+                   <tr key={e.id} className="border-t align-top">
+                     <td className="whitespace-nowrap px-3 py-2">{fmtDate(e.date)}</td>
+                     <td className="num px-3 py-2 whitespace-nowrap"><Link to="/voucher/$id" params={{ id: e.id }} className="hover:text-primary">V-{e.voucherNo}</Link></td>
+                     <td className="px-3 py-2">
+                       <TypeBadge type={e.type} />
+                       {partText(e) && <div className="mt-1">{partText(e)}</div>}
+                       {trade && <div className="text-xs text-muted-foreground">{trade}</div>}
+                       {e.remarks && <div className="text-xs text-muted-foreground">Remarks: {e.remarks}</div>}
+                       {note.length > 0 && <div className={cn("text-xs", isBounced(e) ? "font-medium text-destructive" : "text-muted-foreground")}><Parts parts={note} /></div>}
+                     </td>
+                     <td className="px-3 py-2 text-xs">
+                       <div>{pi.first || "—"}</div>
+                       {pi.bank && <div className="text-muted-foreground">{pi.bank}</div>}
+                       {e.method === "cheque" && <div className="mt-1"><ChequeBadge e={e} /></div>}
+                     </td>
+                     <td className="num px-3 py-2 text-right whitespace-nowrap">{debit ? debit.toLocaleString("en-IN") : ""}</td>
+                     <td className="num px-3 py-2 text-right whitespace-nowrap">{credit ? credit.toLocaleString("en-IN") : ""}</td>
+                     <td className={cn("num px-3 py-2 text-right font-medium whitespace-nowrap", bal >= 0 ? "text-success" : "text-destructive")}>{balText(bal)}</td>
+                     <td className="px-3 py-1.5"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Edit · PIN required" aria-label={`Edit voucher V-${e.voucherNo}`} onClick={() => setPending({ entry: e, action: "edit" })}><Pencil /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete · PIN required" aria-label={`Delete voucher V-${e.voucherNo}`} onClick={() => setPending({ entry: e, action: "delete" })}><Trash2 /></Button></div></td>
+                   </tr>
+                 );
+               })}
+               <tr className="border-t bg-surface/50 font-medium">
+                 <td colSpan={6} className="px-3 py-2">Opening Balance</td>
+                 <td className="num px-3 py-2 text-right whitespace-nowrap">{balText(opening)}</td>
+                 <td />
+               </tr>
+             </tbody>
+             <tfoot>
+               <tr className="border-t-2 bg-surface font-semibold">
+                 <td colSpan={4} className="px-3 py-2">Closing Balance{filter !== "all" && <span className="ml-2 text-xs font-normal text-muted-foreground">(Dr/Cr totals: filtered rows)</span>}</td>
+                 <td className="num px-3 py-2 text-right whitespace-nowrap">{visDr.toLocaleString("en-IN")}</td>
+                 <td className="num px-3 py-2 text-right whitespace-nowrap">{visCr.toLocaleString("en-IN")}</td>
+                 <td className={cn("num px-3 py-2 text-right whitespace-nowrap", closing >= 0 ? "text-success" : "text-destructive")}>{balText(closing)}</td>
+                 <td />
+               </tr>
+             </tfoot>
+           </table>
+         </div>
+       </div>}
+       <div className="print-only statement-print rounded-lg border bg-card print-area">
+        <table className="w-full table-fixed text-[11px]">
+          <colgroup>
+            <col style={{ width: "10.5%" }} />
+            <col style={{ width: "7.5%" }} />
+            <col style={{ width: "15%" }} />
+            <col style={{ width: "32%" }} />
+            <col style={{ width: "10.5%" }} />
+            <col style={{ width: "10.5%" }} />
+            <col style={{ width: "14%" }} />
+          </colgroup>
+          <thead className="bg-surface text-left uppercase tracking-wide text-muted-foreground">
             <tr>
-              <th className="px-3 py-2.5">Date</th>
-              <th className="px-3 py-2.5">Voucher</th>
-              <th className="px-3 py-2.5">Type</th>
-              <th className="px-3 py-2.5">Particulars</th>
-              <th className="px-3 py-2.5">Method</th>
-              <th className="px-3 py-2.5 text-right">Debit</th>
-              <th className="px-3 py-2.5 text-right">Credit</th>
-              <th className="px-3 py-2.5 text-right">Balance</th>
+              <th className="px-2 py-1.5">Date</th>
+              <th className="px-2 py-1.5">Vch #</th>
+              <th className="px-2 py-1.5">Type</th>
+              <th className="px-2 py-1.5">Particulars &amp; Details</th>
+              <th className="px-2 py-1.5 text-right">Debit</th>
+              <th className="px-2 py-1.5 text-right">Credit</th>
+              <th className="px-2 py-1.5 text-right">Balance</th>
             </tr>
           </thead>
           <tbody>
             <tr className="border-t bg-surface/50 font-medium">
-              <td colSpan={7} className="px-3 py-2">Opening Balance</td>
-              <td className="num px-3 py-2 text-right">{balText(opening)}</td>
+              <td colSpan={6} className="px-2 py-1.5">Opening Balance</td>
+              <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{balText(opening)}</td>
             </tr>
-            {rows.map(({ e, debit, credit, bal }) => (
-              <tr key={e.id} className="border-t">
-                <td className="px-3 py-2 whitespace-nowrap">{fmtDate(e.date)}</td>
-                <td className="num px-3 py-2"><Link to="/voucher/$id" params={{ id: e.id }} className="hover:text-primary">V-{e.voucherNo}</Link></td>
-                <td className="px-3 py-2"><TypeBadge type={e.type} /></td>
-                <td className="px-3 py-2">{e.particulars}{e.chequeNo && <span className="text-xs text-muted-foreground"> · Chq #{e.chequeNo}</span>}</td>
-                <td className="px-3 py-2 text-xs">{e.method ? METHODS[e.method] : "—"}</td>
-                <td className="num px-3 py-2 text-right">{debit ? debit.toLocaleString("en-IN") : ""}</td>
-                <td className="num px-3 py-2 text-right">{credit ? credit.toLocaleString("en-IN") : ""}</td>
-                <td className="num px-3 py-2 text-right font-medium">{balText(bal)}</td>
-              </tr>
-            ))}
+            {rows.map(({ e, debit, credit, bal }) => {
+              const pay = payParts(e, { bank: bankNameOf(d, e), amount: fmtPKR(e.amount), method: e.method ? METHODS[e.method] : "" });
+              const trade = tradeText(d, e);
+              return (
+                <tr key={e.id} className="border-t align-top">
+                  <td className="px-2 py-1.5 whitespace-nowrap">{fmtDate(e.date)}</td>
+                  <td className="num px-2 py-1.5 whitespace-nowrap"><Link to="/voucher/$id" params={{ id: e.id }} className="hover:text-primary">V-{e.voucherNo}</Link></td>
+                  <td className="px-2 py-1.5 break-words">{ENTRY_TYPES[e.type].label}</td>
+                  <td className="px-2 py-1.5 break-words">{partText(e)}{trade && <div>{trade}</div>}{pay.length > 0 && <div><Parts parts={pay} /></div>}{e.remarks && <div>Remarks: {e.remarks}</div>}</td>
+                  <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{debit ? debit.toLocaleString("en-IN") : ""}</td>
+                  <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{credit ? credit.toLocaleString("en-IN") : ""}</td>
+                  <td className="num px-2 py-1.5 text-right font-medium whitespace-nowrap tabular-nums">{balText(bal)}</td>
+                </tr>
+              );
+            })}
           </tbody>
           <tfoot>
             <tr className="border-t-2 bg-surface font-semibold">
-              <td colSpan={5} className="px-3 py-2">Closing Balance</td>
-              <td className="num px-3 py-2 text-right">{dr.toLocaleString("en-IN")}</td>
-              <td className="num px-3 py-2 text-right">{cr.toLocaleString("en-IN")}</td>
-              <td className="num px-3 py-2 text-right">{balText(closing)}</td>
+              <td colSpan={4} className="px-2 py-1.5">Closing Balance</td>
+              <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{dr.toLocaleString("en-IN")}</td>
+              <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{cr.toLocaleString("en-IN")}</td>
+              <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{balText(closing)}</td>
             </tr>
           </tfoot>
         </table>
       </div>
-      <div className="print-only mt-16 flex justify-between text-xs">
-        <span className="border-t px-8 pt-1">Prepared By</span>
-        <span className="border-t px-8 pt-1">Authorized Signature</span>
+      <div className="print-only mt-16">
+        <div className="flex justify-between text-xs">
+          <span className="w-44 border-t pt-1 text-center">Prepared By</span>
+          <span className="w-44 border-t pt-1 text-center">Authorized Signature</span>
+        </div>
       </div>
        <PinActionDialog action={pending?.action ?? null} onClose={() => setPending(null)} onVerified={(action) => {
          if (!pending) return;
```

### src/routes/vouchers.tsx

```diff
--- a/src/routes/vouchers.tsx	2026-11-05 09:22:25.232155818 +0000
+++ b/src/routes/vouchers.tsx	2026-11-06 19:44:40.116290719 +0000
@@ -28,10 +28,10 @@
 const TYPES: EntryType[] = ["sale", "purchase", "inward", "outward"];
 const PILL_TONES: Record<string, { on: string; off: string }> = {
   all: { on: "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground", off: "" },
-  sale: { on: "border-sale bg-sale text-sale-foreground hover:bg-sale/90 hover:text-sale-foreground", off: "border-sale/40 bg-sale-soft text-sale hover:bg-sale/15 hover:text-sale" },
-  purchase: { on: "border-purchase bg-purchase text-purchase-foreground hover:bg-purchase/90 hover:text-purchase-foreground", off: "border-purchase/40 bg-purchase-soft text-purchase hover:bg-purchase/15 hover:text-purchase" },
-  inward: { on: "border-success bg-success text-success-foreground hover:bg-success/90 hover:text-success-foreground", off: "border-success/40 bg-success-soft text-success hover:bg-success/15 hover:text-success" },
-  outward: { on: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground", off: "border-destructive/40 bg-danger-soft text-destructive hover:bg-destructive/15 hover:text-destructive" },
+  sale: { on: "border-sale bg-sale text-sale-foreground hover:bg-sale/90 hover:text-sale-foreground", off: "" },
+  purchase: { on: "border-purchase bg-purchase text-purchase-foreground hover:bg-purchase/90 hover:text-purchase-foreground", off: "" },
+  inward: { on: "border-success bg-success text-success-foreground hover:bg-success/90 hover:text-success-foreground", off: "" },
+  outward: { on: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground", off: "" },
 };
 const BAR: Record<string, string> = { sale: "border-l-sale", purchase: "border-l-purchase", inward: "border-l-success", outward: "border-l-destructive" };
```

### src/components/app/AppShell.tsx

```diff
--- a/src/components/app/AppShell.tsx	2026-11-05 09:22:25.219112560 +0000
+++ b/src/components/app/AppShell.tsx	2026-11-05 22:37:29.972821477 +0000
@@ -32,7 +32,7 @@
 import { PageTrailBar } from "./PageTrailBar";
 import { syncTrail } from "@/lib/nav-trail";
 import { getVoiceSettings, useVoiceSettings, voiceGreeting, voiceInstruction } from "@/lib/voice-settings";
-import { dashboard, useDashboard } from "@/lib/dashboard-layout";
+import { dashboard, haptic, useDashboard } from "@/lib/dashboard-layout";
 
 const NAV_GROUPS = [
   { title: "Overview", items: [
@@ -286,9 +286,9 @@
       {/* Mobile bottom navigation: floating glass pill with a sliding "lens" under the active tab */}
       {(() => {
         const tabs = [
-          { to: "/", label: "Home", icon: LayoutDashboard },
           { to: "/sales", label: "Sales", icon: BadgeDollarSign },
           { to: "/purchases", label: "Purchases", icon: ShoppingCart },
+          { to: "/", label: "Home", icon: LayoutDashboard },
           { to: "/vouchers", label: "Vouchers", icon: FileText },
           { to: "/accounts", label: "Accounts", icon: Users },
         ];
@@ -298,7 +298,7 @@
             <div className="relative flex items-stretch">
               <span aria-hidden="true" className="mobile-lens" data-on={active >= 0} />
               {tabs.map((n, i) => (
-                <Link key={n.to} to={n.to} aria-current={i === active ? "page" : undefined} className={cn("mobile-tab", i === active && "is-active")}>
+                <Link key={n.to} to={n.to} onClick={() => haptic(8)} aria-current={i === active ? "page" : undefined} className={cn("mobile-tab", i === active && "is-active")}>
                   <n.icon className="mobile-tab-ic h-[22px] w-[22px]" strokeWidth={2.1} />
                   <span>{n.label}</span>
                 </Link>
```

### src/components/app/TreasuryCard.tsx

```diff
--- a/src/components/app/TreasuryCard.tsx	2026-11-05 09:22:25.221009455 +0000
+++ b/src/components/app/TreasuryCard.tsx	2026-11-06 08:09:30.465484152 +0000
@@ -6,6 +6,8 @@
 import { fmtDate, fmtPKR, todayISO } from "@/lib/format";
 import { haptic } from "@/lib/dashboard-layout";
 import { cn } from "@/lib/utils";
+import { activitySeries, shares } from "@/lib/treasury-series";
+import { Bars, Ring, StatusDots, Trend } from "@/components/app/TreasuryViz";
 
 type Panel = "cash" | "bank" | "receivable" | "payable" | "cheques";
 const HIDE_KEY = "cashbook-treasury-hidden";
@@ -19,7 +21,8 @@
   const s = useMemo(() => {
     const live = liveEntries(d);
     const today = todayISO();
-    const all = fundList(d).map((f) => ({
+    const funds = fundList(d);
+    const all = funds.map((f) => ({
       id: f.id, name: f.name, bal: f.closing, pending: f.pending,
       inToday: f.rows.filter((r) => r.state === "cleared" && r.e.date === today && r.delta > 0).reduce((x, r) => x + r.delta, 0),
       outToday: f.rows.filter((r) => r.state === "cleared" && r.e.date === today && r.delta < 0).reduce((x, r) => x - r.delta, 0),
@@ -35,6 +38,11 @@
       receivables, payables,
       recTotal: receivables.reduce((x, p) => x + p.b, 0), payTotal: payables.reduce((x, p) => x + p.b, 0),
       pending: by("pending"), cleared: by("cleared"), bounced: by("bounced"),
+      // visuals only
+      activity: activitySeries(funds.slice(1), today, 12),
+      cashShare: shares([all[0]!.bal, all.slice(1).reduce((x, f) => x + f.bal, 0)]),
+      recBars: receivables.slice(0, 6).map((p) => p.b),
+      payParts: shares([...payables.slice(0, 3).map((p) => p.b), payables.slice(3).reduce((x, p) => x + p.b, 0)]),
     };
   }, [d]);
 
@@ -47,13 +55,16 @@
   const open = (p: Panel) => (e: React.MouseEvent) => { e.stopPropagation(); if (editing) return; haptic(10); setPanel(p); };
   const accName = (id?: string) => d.accounts.find((a) => a.id === id)?.name ?? "—";
 
-  const tiles: { id: Panel; label: string; value: number; icon: typeof Wallet; tone: string; note?: string }[] = [
-    { id: "bank", label: "Bank balance", value: s.bankTotal, icon: Landmark, tone: "tre-tile" },
-    { id: "receivable", label: "Receivables", value: s.recTotal, icon: ArrowDownLeft, tone: "tre-tile" },
-    { id: "payable", label: "Payables", value: s.payTotal, icon: ArrowUpRight, tone: "tre-tile" },
-    { id: "cheques", label: "Pending cheques", value: pendingAmt, icon: FileCheck2, tone: "tre-tile",
+  const tiles: { id: Panel; label: string; value: number; icon: typeof Wallet; note?: string }[] = [
+    { id: "bank", label: "Bank balance", value: s.bankTotal, icon: Landmark },
+    { id: "receivable", label: "Receivables", value: s.recTotal, icon: ArrowDownLeft },
+    { id: "payable", label: "Payables", value: s.payTotal, icon: ArrowUpRight },
+    { id: "cheques", label: "Pending cheques", value: pendingAmt, icon: FileCheck2,
       note: `${s.pending.length} pending · ${s.cleared.length} cleared · ${s.bounced.length} bounced` },
   ];
+  const payColors = ["var(--tre-pay)", "var(--tre-cash)", "var(--tre-bank)", "color-mix(in oklab, var(--treasury-foreground) 40%, transparent)"];
+  const cashText = m(s.cash.bal);
+  const cashPct = s.cashShare.length ? Math.round(s.cashShare[0]! * 100) : 0;
   void w;
 
   const Row = ({ l, sub, r, to }: { l: string; sub?: string; r: number; to?: { id: string } }) => (
@@ -79,16 +90,23 @@
       </div>
       <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 grid-rows-[1.1fr_1fr_1fr] gap-2 overflow-hidden">
         <button type="button" onClick={open("cash")}
-          className="tre-tile col-span-2 flex min-w-0 flex-col justify-center rounded-xl px-3 py-2 text-left transition-transform active:scale-[0.98]">
-          <span className="flex items-center gap-1.5 text-xs font-medium opacity-90"><span className="tre-chip tre-chip-cash"><Wallet className="h-3 w-3" /></span> Cash in hand</span>
-          <span className="num mt-0.5 truncate text-2xl font-semibold tracking-tight">{m(s.cash.bal)}</span>
+          className="tre-tile col-span-2 flex min-w-0 items-center justify-between gap-3 rounded-2xl px-4 py-2 text-left">
+          <span className="flex min-w-0 flex-col justify-center">
+            <span className="flex items-center gap-1.5 text-xs font-medium"><span className="tre-chip tre-chip-cash"><Wallet className="h-2.5 w-2.5" /></span> Cash in hand</span>
+            <span className={cn("num mt-1 truncate font-semibold tracking-tight", cashText.length > 11 ? "text-xl" : "text-[22px]")}>{cashText}</span>
+          </span>
+          <Ring parts={s.cashShare} colors={["var(--tre-cash)", "var(--tre-bank)"]} masked={hidden} stroke={15} className="aspect-square h-[92%] max-h-28"
+            label={hidden || !s.cashShare.length ? undefined : `Cash ${cashPct}% · Bank ${100 - cashPct}% of liquid funds`} />
         </button>
         {tiles.map((x) => (
-          <button key={x.id} type="button" onClick={open(x.id)}
-            className={cn("flex min-w-0 flex-col justify-center rounded-xl px-3 py-2 text-left transition-transform active:scale-[0.97]", x.tone)}>
-            <span className="flex items-center gap-1.5 text-[11px] font-medium opacity-90"><span className={cn("tre-chip", `tre-chip-${x.id}`)}><x.icon className="h-3 w-3 shrink-0" /></span><span className="truncate">{x.label}</span></span>
-            <span className="num mt-0.5 truncate text-base font-semibold tracking-tight">{m(x.value)}</span>
-            {x.note && <span className="truncate text-[10px] opacity-80">{x.note}</span>}
+          <button key={x.id} type="button" onClick={open(x.id)} className="tre-tile relative flex min-w-0 flex-col justify-center rounded-2xl px-3 py-2 text-left">
+            <span className="flex items-center gap-1.5 pr-11 text-[11px] font-medium"><span className={cn("tre-chip", `tre-chip-${x.id}`)}><x.icon className="h-2.5 w-2.5 shrink-0" /></span><span className="truncate">{x.label}</span></span>
+            {x.id === "bank" && <span className="absolute right-2 top-2"><Trend values={s.activity} masked={hidden} /></span>}
+            {x.id === "receivable" && <span className="absolute right-2.5 top-2.5"><Bars values={s.recBars} masked={hidden} /></span>}
+            {x.id === "cheques" && <span className="absolute right-2.5 top-2.5"><StatusDots pending={s.pending.length} cleared={s.cleared.length} bounced={s.bounced.length} /></span>}
+            {x.id === "payable" && <Ring parts={s.payParts} colors={payColors} masked={hidden} stroke={22} className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2" />}
+            <span className={cn("num mt-1 truncate text-sm font-semibold tracking-tight", x.id === "payable" && "pr-10")}>{m(x.value)}</span>
+            {x.note && <span className="mt-0.5 line-clamp-2 text-[10px] leading-tight opacity-75">{x.note}</span>}
           </button>
         ))}
       </div>
```

### src/components/app/QuickActions.tsx

```diff
--- a/src/components/app/QuickActions.tsx	2026-11-05 09:22:25.220710648 +0000
+++ b/src/components/app/QuickActions.tsx	2026-11-06 04:22:26.235045219 +0000
@@ -1,24 +1,29 @@
-import { useEffect, useRef, useState } from "react";
+import { useEffect, useMemo, useRef, useState } from "react";
 import { moveToTarget } from "@/lib/quick-order";
 import { useNavigate } from "@tanstack/react-router";
-import { ArrowDownLeft, ArrowUpRight, BadgeDollarSign, Check, Flame, Plus, Receipt, ShoppingCart, Users, type LucideIcon } from "lucide-react";
-import type { EntryType } from "@/lib/db";
+import { BadgeDollarSign, Banknote, Check, Flame, HandCoins, Plus, Receipt, ShoppingCart, UserPlus, type LucideIcon } from "lucide-react";
+import { liveEntries, useData, type Entry, type EntryType } from "@/lib/db";
+import { fmtPKR } from "@/lib/format";
+import { haptic } from "@/lib/dashboard-layout";
+import { HERO_FR, quickKinds, quickMinHeight, quickRowWeights } from "@/lib/quick-layout";
+import { QuickTile } from "@/components/app/QuickActionTile";
 import { cn } from "@/lib/utils";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 
 export type QuickId = "sale" | "purchase" | "inward" | "outward" | "expense" | "heat" | "account";
-export const DEFAULT_QUICK: QuickId[] = ["sale", "purchase", "inward", "outward"];
+// The first two actions are shown as full-width hero buttons, so the payment actions lead by default.
+export const DEFAULT_QUICK: QuickId[] = ["inward", "outward", "sale", "purchase"];
 const KEY = "quick-actions-v1";
 const HOLD_MS = 360;
 
-const META: Record<QuickId, { label: string; icon: LucideIcon; text: string; line: string }> = {
-  sale: { label: "Sale", icon: BadgeDollarSign, text: "text-sale", line: "bg-sale" },
-  purchase: { label: "Purchase", icon: ShoppingCart, text: "text-purchase", line: "bg-purchase" },
-  inward: { label: "Receive Payment", icon: ArrowDownLeft, text: "text-received", line: "bg-received" },
-  outward: { label: "Issue Payment", icon: ArrowUpRight, text: "text-paid", line: "bg-paid" },
-  expense: { label: "Expense", icon: Receipt, text: "text-expense-card", line: "bg-expense-card" },
-  heat: { label: "Heat", icon: Flame, text: "text-entry-card", line: "bg-entry-card" },
-  account: { label: "Add Account", icon: Users, text: "text-account", line: "bg-account" },
+const META: Record<QuickId, { label: string; icon: LucideIcon; text: string; tone: string }> = {
+  sale: { label: "Sale", icon: BadgeDollarSign, text: "text-sale", tone: "var(--qa-sale)" },
+  purchase: { label: "Purchase", icon: ShoppingCart, text: "text-purchase", tone: "var(--qa-purchase)" },
+  inward: { label: "Receive Payment", icon: HandCoins, text: "text-received", tone: "var(--qa-receive)" },
+  outward: { label: "Issue Payment", icon: Banknote, text: "text-paid", tone: "var(--qa-issue)" },
+  expense: { label: "Expense", icon: Receipt, text: "text-expense-card", tone: "var(--qa-expense)" },
+  heat: { label: "Heat", icon: Flame, text: "text-entry-card", tone: "var(--qa-heat)" },
+  account: { label: "Add Account", icon: UserPlus, text: "text-account", tone: "var(--qa-account)" },
 };
 const ALL = Object.keys(META) as QuickId[];
 
@@ -54,6 +59,8 @@
   const [pulse, setPulse] = useState<QuickId | null>(null);
   const [over, setOver] = useState<QuickId | null>(null);
   const [box, setBox] = useState({ w: 0, h: 0 });
+  const d = useData();
+  const [rip, setRip] = useState<{ id: QuickId; x: number; y: number; k: number } | null>(null);
   const suppress = useRef(false);
   const rootRef = useRef<HTMLDivElement>(null);
   const gridRef = useRef<HTMLDivElement>(null);
@@ -68,6 +75,30 @@
   const save = (l: QuickId[]) => { setList(l); localStorage.setItem(KEY, JSON.stringify(l)); };
   void wide;
 
+  // Newest entry of each type, for the "Latest: ..." line on hero buttons (read-only).
+  const latest = useMemo(() => {
+    const m = new Map<string, Entry>();
+    for (const e of liveEntries(d)) {
+      const c = m.get(e.type);
+      if (!c || e.createdAt > c.createdAt) m.set(e.type, e);
+    }
+    return m;
+  }, [d]);
+  const latestText = (id: QuickId) => {
+    const e = latest.get(id);
+    if (!e) return id === "account" || id === "heat" ? undefined : "No entries yet";
+    const who = e.accountId ? d.accounts.find((a) => a.id === e.accountId)?.name : undefined;
+    return `Latest: ${fmtPKR(e.amount)}${who ? ` · ${who}` : ""}`;
+  };
+  // Touch ripple that starts exactly where the finger lands.
+  const startRipple = (e: React.PointerEvent<HTMLElement>, id: QuickId) => {
+    if (e.button !== 0) return;
+    const r = e.currentTarget.getBoundingClientRect();
+    const k = Date.now();
+    setRip({ id, x: e.clientX - r.left, y: e.clientY - r.top, k });
+    window.setTimeout(() => setRip((p) => (p && p.k === k ? null : p)), 650);
+  };
+
   const run = (id: QuickId) => {
     if (suppress.current) return;
     if (id === "account") openAccount();
@@ -128,6 +159,11 @@
   const rows = Math.max(1, Math.ceil(n / cols));
   const cellH = box.h > 0 ? (box.h - (rows - 1) * 8) / rows : 80;
   const size = cellH < 44 ? "xs" : cellH < 64 ? "sm" : "md";
+  // Hero layout (first two buttons full width, an odd last one too) when the card is big enough; otherwise the compact grid above.
+  const kinds = quickKinds(n);
+  const rowWeights = quickRowWeights(kinds);
+  const heroMode = n > 0 && box.w >= 220 && box.h >= quickMinHeight(kinds, 8);
+  const heroH = heroMode ? ((box.h - (rowWeights.length - 1) * 8) * HERO_FR) / rowWeights.reduce((t, w) => t + w, 0) : 0;
 
   return (
     <div ref={rootRef} className="flex min-h-0 flex-1 flex-col" onClick={(e) => e.stopPropagation()}>
@@ -160,19 +196,19 @@
           </PopoverContent>
         </Popover>
       </div>
-      <div ref={gridRef} className={cn("mt-2 grid min-h-0 flex-1 gap-2 overflow-hidden rounded-lg", drag && "outline-dashed outline-1 outline-border")}
-        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
-        {list.map((id) => {
+      <div ref={gridRef} className={cn("mt-2 grid min-h-0 flex-1 gap-2 rounded-lg", drag && "outline-dashed outline-1 outline-border")}
+        style={heroMode
+          ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gridTemplateRows: rowWeights.map((w) => `minmax(0, ${w}fr)`).join(" ") }
+          : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
+        {list.map((id, i) => {
           const m = META[id];
+          const hero = heroMode && kinds[i] === "hero";
           return (
-            <button key={id} data-qid={id} onPointerDown={(e) => onDown(e, id)} onClick={() => { run(id); setPulse(id); window.setTimeout(() => setPulse((p) => (p === id ? null : p)), 700); }} data-pulse={pulse === id} onContextMenu={(e) => e.preventDefault()}
-              className={cn("relative flex min-h-0 min-w-0 select-none items-center justify-center overflow-hidden rounded-lg border bg-card font-semibold text-foreground transition-transform active:scale-95 [-webkit-touch-callout:none]",
-                size === "md" ? "flex-col gap-1.5 px-2 pb-3.5 pt-2.5 text-sm" : size === "sm" ? "flex-col gap-1 px-1.5 pb-2.5 pt-1 text-xs" : "flex-row gap-1.5 px-1.5 pb-1.5 text-[11px]",
-                drag?.id === id && "scale-95 opacity-40", drag && over === id && "scale-105 border-primary ring-2 ring-primary/50")}>
-              <m.icon className={cn("shrink-0", m.text, size === "md" ? "h-6 w-6" : size === "sm" ? "h-[18px] w-[18px]" : "h-3.5 w-3.5")} strokeWidth={2.1} />
-              <span className="truncate">{m.label}</span>
-              <span className={cn("qa-line absolute left-1/2 -translate-x-1/2 rounded-full", m.line, size === "xs" ? "bottom-0.5 h-[3px]" : "bottom-1 h-[5px]")} />
-            </button>
+            <QuickTile key={id} id={id} label={m.label} icon={m.icon} tone={m.tone} variant={heroMode ? (hero ? "hero" : "tile") : size} span={hero}
+              latest={hero && heroH >= 64 ? latestText(id) : undefined}
+              ripple={rip?.id === id ? rip : null} pulse={pulse === id} lifted={drag?.id === id} target={!!drag && over === id}
+              onPointerDown={(e) => { startRipple(e, id); onDown(e, id); }}
+              onClick={() => { if (!suppress.current) haptic(12); run(id); setPulse(id); window.setTimeout(() => setPulse((p) => (p === id ? null : p)), 700); }} />
           );
         })}
       </div>
```

### src/lib/dashboard-layout.ts

```diff
--- a/src/lib/dashboard-layout.ts	2026-11-05 09:22:25.228305709 +0000
+++ b/src/lib/dashboard-layout.ts	2026-11-06 04:22:26.232796487 +0000
@@ -15,8 +15,7 @@
 
 export const DEFAULT_LAYOUT: WidgetLayout[] = [
   // Money and actions first, then a KPI strip, stock beside recent activity, production, and shortcuts last.
-  { id: "treasury", w: 2, h: 3 },
-  { id: "quick", w: 2, h: 2 }, { id: "cheques", w: 2, h: 1 },
+  { id: "quick", w: 2, h: 3 }, { id: "treasury", w: 2, h: 3 }, { id: "cheques", w: 2, h: 1 },
   { id: "monthly", w: 2, h: 1 }, { id: "vouchers", w: 1, h: 1 }, { id: "advances", w: 1, h: 1 },
   { id: "stock", w: 2, h: 2 }, { id: "activity", w: 2, h: 2 },
   { id: "heats", w: 4, h: 2 },
```

### src/routes/settings.tsx

```diff
--- a/src/routes/settings.tsx	2026-11-05 09:22:25.231819949 +0000
+++ b/src/routes/settings.tsx	2026-11-05 22:17:36.361823038 +0000
@@ -8,6 +8,7 @@
 import { CloudBackup } from "@/components/app/CloudBackup";
 import { changePassword, checkPw, exportJSON, getSnapshots, importJSON, restoreSnapshot, takeSnapshot, updateCompany, updateRecovery, useData, type Snapshot } from "@/lib/db";
 import { downloadFile, fmtDateTime, todayISO } from "@/lib/format";
+import { APP_VERSION } from "@/lib/version";
 
 export const Route = createFileRoute("/settings")({
   head: () => ({
@@ -37,6 +38,7 @@
   return (
     <div className="space-y-6">
       <PageHeader title="Settings & Backup" />
+      <p className="-mt-3 text-xs text-muted-foreground">App version <span className="num font-medium text-foreground">v{APP_VERSION}</span></p>
       <Link to="/opening" className="mb-4 flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm hover:border-primary/40"><span><span className="font-semibold">Opening Balances</span> — cash, banks, parties, stock, loans and opening capital</span><span className="text-primary">Open →</span></Link>
       <div className="grid gap-6 lg:grid-cols-2">
         <CloudBackup />
```

### src/routes/voucher.$id.tsx

```diff
--- a/src/routes/voucher.$id.tsx	2026-11-05 09:22:25.232034180 +0000
+++ b/src/routes/voucher.$id.tsx	2026-11-05 09:23:06.867252546 +0000
@@ -32,6 +32,42 @@
   );
 }
 
+/** Cheque / online payment details as a small table, so several cheques can be listed one per row later. */
+function PaymentTable({ numberLabel, rows }: { numberLabel: string; rows: { no: string; bank: string; amount: number }[] }) {
+  const multi = rows.length > 1;
+  const total = rows.reduce((t, r) => t + r.amount, 0);
+  return (
+    <div className="border-b py-2 text-sm">
+      <table className="w-full border text-left">
+        <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
+          <tr>
+            <th className="px-2 py-1.5 font-medium">{numberLabel}</th>
+            <th className="px-2 py-1.5 font-medium">Bank</th>
+            {multi && <th className="px-2 py-1.5 text-right font-medium">Amount</th>}
+          </tr>
+        </thead>
+        <tbody>
+          {rows.map((r, i) => (
+            <tr key={i} className="border-t">
+              <td className="num px-2 py-1.5 font-medium">{r.no || "—"}</td>
+              <td className="px-2 py-1.5 font-medium">{r.bank || "—"}</td>
+              {multi && <td className="num px-2 py-1.5 text-right font-medium">{fmtPKR(r.amount)}</td>}
+            </tr>
+          ))}
+        </tbody>
+        {multi && (
+          <tfoot>
+            <tr className="border-t-2 font-semibold">
+              <td colSpan={2} className="px-2 py-1.5">Total</td>
+              <td className="num px-2 py-1.5 text-right">{fmtPKR(total)}</td>
+            </tr>
+          </tfoot>
+        )}
+      </table>
+    </div>
+  );
+}
+
 function VoucherPage() {
   const { id } = Route.useParams();
   const d = useData();
@@ -43,6 +79,9 @@
   const previousBalance = a ? liveEntries(d).filter((x) => x.accountId === a.id && (x.date < e.date || (x.date === e.date && x.voucherNo < e.voucherNo))).reduce((balance, x) => balance + signedForAccount(x), a.openingBalance) : 0;
   const paymentNumber = e.method === "cheque" ? e.chequeNo : e.method === "online" ? e.reference : undefined;
   const bankDetails = e.type === "transfer" ? `${fundName(d, e.bankId ?? "cash")} → ${fundName(d, e.toBankId ?? "cash")}${e.reference ? ` — ${e.reference}` : ""}` : [e.bankId ? fundName(d, e.bankId) : e.bank?.trim(), paymentNumber?.trim()].filter(Boolean).join(" — ");
+  // One row per cheque / online payment (entries currently store a single one).
+  const payBank = (e.bankId ? fundName(d, e.bankId) : e.bank?.trim()) || "";
+  const payRows = e.type !== "transfer" && (payBank || paymentNumber?.trim()) ? [{ no: paymentNumber?.trim() ?? "", bank: payBank, amount: e.amount }] : [];
   const meta = ENTRY_TYPES[e.type];
   const title = meta.flow === "in" ? "Receipt Voucher" : meta.flow === "out" ? "Payment Voucher" : `${meta.label} Voucher`;
 
@@ -72,8 +111,7 @@
         <Row label={e.type === "purchase" ? "Purchase Type" : "Sale Type"} value={e.type === "sale" || e.type === "purchase" ? e.payMode === "advance" || e.payMode === "net" ? (e.type === "purchase" ? "Net Purchase" : "Net Sale") : (e.type === "purchase" ? "Credit Purchase" : "Credit Sale") : undefined} />
         <Row label="Remarks" value={e.remarks} />
         <Row label="Payment Method" value={e.method ? METHODS[e.method] : undefined} />
-        <Row label={e.type === "transfer" ? "Transfer" : "Bank"} value={bankDetails || undefined} />
-        <Row label="Cheque Status" value={e.method === "cheque" ? (e.chequeStatus ?? "pending").toUpperCase() : undefined} />
+        {e.type === "transfer" ? <Row label="Transfer" value={bankDetails || undefined} /> : payRows.length > 0 && <PaymentTable numberLabel={e.method === "cheque" ? "Cheque #" : "Ref #"} rows={payRows} />}
         {a && (() => {
           const eff = signedForAccount(e);
           const cur = previousBalance + eff;
```

### src/routes/cashbook.tsx

```diff
--- a/src/routes/cashbook.tsx	2026-11-05 09:22:25.230789352 +0000
+++ b/src/routes/cashbook.tsx	2026-11-05 10:28:42.636278735 +0000
@@ -91,9 +91,9 @@
         <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
         <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
       </div>
-      <div className="grid gap-3 sm:grid-cols-4">
+      <div className="grid gap-3 sm:grid-cols-4 print:grid-cols-4">
         {[["Opening", opening, ""], ["Total In", inT, "text-success"], ["Total Out", outT, "text-destructive"], ["Closing", opening + inT - outT, ""]].map(([l, v, c]) => (
-          <div key={l as string} className="rounded-lg border bg-card p-3"><div className="text-xs uppercase text-muted-foreground">{l}</div><div className={cn("num mt-1 text-lg font-semibold", c as string)}>{fmtPKR(v as number)}</div></div>
+          <div key={l as string} className="rounded-lg border bg-card p-3 print:p-2"><div className="text-xs uppercase text-muted-foreground">{l}</div><div className={cn("num mt-1 text-lg font-semibold print:text-sm", c as string)}>{fmtPKR(v as number)}</div></div>
         ))}
       </div>
       <EntriesTable entries={rows} emptyText="No cash movement in this period" />
```

### src/routes/bank.$id.tsx

```diff
--- a/src/routes/bank.$id.tsx	2026-11-05 09:22:25.230662985 +0000
+++ b/src/routes/bank.$id.tsx	2026-11-05 10:28:42.636496698 +0000
@@ -35,9 +35,9 @@
     <div className="space-y-5">
       <PageHeader title={name} subtitle="Statement · running balance counts cleared items only" actions={<Button onClick={() => window.print()}><Printer /> Print / PDF</Button>} />
       <PrintHeader title={`${name} Statement`} sub={from || to ? `${fmtDate(from) || "Start"} to ${fmtDate(to) || "Today"}` : "All dates"} />
-      <div className="grid gap-3 sm:grid-cols-3">
+      <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3">
         {[["Opening", l.opening], ["Closing (cleared)", l.closing], ["Pending cheques", l.pending]].map(([k, v]) => (
-          <div key={k as string} className="rounded-lg border bg-card p-3"><div className="text-xs uppercase text-muted-foreground">{k}</div><div className={cn("num mt-1 text-lg font-semibold", k === "Pending cheques" && "text-warning")}>{fmtPKR(v as number)}</div></div>
+          <div key={k as string} className="rounded-lg border bg-card p-3 print:p-2"><div className="text-xs uppercase text-muted-foreground">{k}</div><div className={cn("num mt-1 text-lg font-semibold print:text-sm", k === "Pending cheques" && "text-warning")}>{fmtPKR(v as number)}</div></div>
         ))}
       </div>
       <div className="no-print flex flex-wrap items-end gap-3">
```

### src/routes/reports.tsx

```diff
--- a/src/routes/reports.tsx	2026-11-05 09:22:25.231648089 +0000
+++ b/src/routes/reports.tsx	2026-11-05 10:28:42.636736327 +0000
@@ -72,15 +72,15 @@
         <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
         <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
       </div>
-      <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
+      <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7 print:grid-cols-4">
         {(Object.keys(ENTRY_TYPES) as EntryType[]).map((k) => (
-          <div key={k} className="rounded-lg border bg-card p-3">
+          <div key={k} className="rounded-lg border bg-card p-3 print:p-2">
             <div className="text-xs uppercase text-muted-foreground">{ENTRY_TYPES[k].label}</div>
             <div className="num mt-1 font-semibold">{fmtPKR(totals[k], false)}</div>
           </div>
         ))}
       </div>
-      <div className="grid gap-6 lg:grid-cols-2">
+      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-3">
         <Table title="Receivables (Dr)" rows={rec} tone="text-success" />
         <Table title="Payables (Cr)" rows={pay} tone="text-destructive" />
         <Table title="Supplier Advances (Dr)" rows={supAdv} tone="text-success" />
```

### src/styles.css

```diff
--- a/src/styles.css	2026-11-05 09:22:25.233255759 +0000
+++ b/src/styles.css	2026-11-06 08:10:12.339548026 +0000
@@ -161,7 +161,7 @@
   --input: oklch(0.85 0.005 247);
   --ring: oklch(0.45 0.015 190);
   --treasury: oklch(0.27 0.05 255);
-  --treasury-foreground: oklch(0.97 0.01 250);
+  --treasury-foreground: oklch(0.25 0.03 255);
   --tile-cash: oklch(0.5 0.09 160);
   --tile-bank: oklch(0.48 0.09 235);
   --tile-receivable: oklch(0.56 0.1 70);
@@ -216,6 +216,13 @@
   --expense-card-soft: oklch(0.97 0.04 60);
   --entry-card: oklch(0.53 0.1 215);
   --entry-card-soft: oklch(0.96 0.025 215);
+  --qa-receive: oklch(0.62 0.13 215);
+  --qa-issue: oklch(0.62 0.18 355);
+  --qa-sale: oklch(0.62 0.14 160);
+  --qa-purchase: oklch(0.64 0.14 72);
+  --qa-expense: oklch(0.65 0.16 45);
+  --qa-account: oklch(0.58 0.17 295);
+  --qa-heat: oklch(0.6 0.18 25);
   --admin-card: oklch(0.5 0.13 350);
   --admin-card-soft: oklch(0.96 0.03 350);
 }
@@ -264,6 +271,13 @@
   --expense-card-soft: oklch(0.28 0.045 48);
   --entry-card: oklch(0.72 0.09 215);
   --entry-card-soft: oklch(0.28 0.04 215);
+  --qa-receive: oklch(0.74 0.12 215);
+  --qa-issue: oklch(0.74 0.15 355);
+  --qa-sale: oklch(0.76 0.14 160);
+  --qa-purchase: oklch(0.8 0.14 78);
+  --qa-expense: oklch(0.76 0.14 45);
+  --qa-account: oklch(0.72 0.15 295);
+  --qa-heat: oklch(0.74 0.16 25);
   --admin-card: oklch(0.69 0.12 350);
   --admin-card-soft: oklch(0.27 0.045 350);
   --treasury: oklch(0.22 0.04 260);
@@ -376,6 +390,23 @@
   tr { page-break-inside: avoid; }
 }
 
+/* Party ledger statement: keep the whole table (incl. the Balance column) inside the A4 page. */
+@media print {
+  .statement-print,
+  .print-area {
+    overflow: visible !important;
+    width: 100% !important;
+    max-width: 100% !important;
+  }
+  main:has(.statement-print) {
+    padding: 0 !important;
+    margin: 0 !important;
+    max-width: none !important;
+  }
+  .statement-print table { table-layout: fixed; }
+  .statement-print .num { font-family: inherit; font-variant-numeric: tabular-nums; }
+}
+
 .logo-dark { display: none; }
 .dark .logo-light { display: none; }
 .dark .logo-dark { display: block; }
@@ -544,18 +575,36 @@
 }
 @media print { .sheet-corner { display: none !important; } }
 
-/* ---- Mobile bottom navigation: floating pill with a sliding highlight ---- */
-:root { --navtab: oklch(0.5 0.03 255); --navtab-active: oklch(0.42 0.17 258); --lens-bg: oklch(0.42 0.17 258 / 0.12); }
-.dark { --navtab: oklch(0.74 0.02 255); --navtab-active: oklch(0.9 0.07 250); --lens-bg: oklch(1 0 0 / 0.12); }
+/* ---- Mobile bottom navigation: floating pill with a sliding gradient highlight ----
+   Light theme -> dark bar (follows the sidebar colour of the chosen palette); dark theme -> light bar.
+   The selected tab uses the same lavender -> periwinkle -> sky gradient in both. */
+:root {
+  --nav-bar: var(--sidebar);
+  --nav-border: color-mix(in oklab, var(--sidebar-foreground) 16%, transparent);
+  --nav-edge: color-mix(in oklab, var(--sidebar-foreground) 14%, transparent);
+  --navtab: color-mix(in oklab, var(--sidebar-foreground) 74%, var(--sidebar));
+  --navtab-active: oklch(0.24 0.04 285);
+  --nav-g1: oklch(0.82 0.1 305); --nav-g2: oklch(0.8 0.11 280); --nav-g3: oklch(0.82 0.1 235);
+  --nav-shine: oklch(1 0 0 / 0.4);
+}
+.dark {
+  --nav-bar: oklch(0.95 0.012 270);
+  --nav-border: oklch(0.86 0.02 270);
+  --nav-edge: oklch(1 0 0 / 0.7);
+  --navtab: oklch(0.45 0.03 265);
+  --navtab-active: oklch(0.24 0.04 285);
+  --nav-g1: oklch(0.78 0.13 305); --nav-g2: oklch(0.75 0.14 280); --nav-g3: oklch(0.78 0.12 235);
+  --nav-shine: oklch(1 0 0 / 0.45);
+}
 .mobile-nav {
   bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
   padding: 0.3rem; border-radius: 1.75rem;
-  background: var(--card); border: 1px solid var(--border);
-  box-shadow: 0 10px 28px -10px oklch(0.2 0.03 258 / 0.35), 0 2px 6px oklch(0.2 0.03 258 / 0.12);
+  background: var(--nav-bar); border: 1px solid var(--nav-border);
+  box-shadow: 0 14px 30px -12px oklch(0.2 0.03 258 / 0.5), 0 2px 6px oklch(0.2 0.03 258 / 0.18), inset 0 1px 0 var(--nav-edge);
   transition: transform .32s cubic-bezier(.2,.8,.2,1), opacity .25s ease;
 }
 .mobile-lens {
-  position: absolute; top: 0; bottom: 0; left: 0; width: calc(100% / var(--n)); border-radius: 1.5rem; background: var(--lens-bg);
+  position: absolute; top: 0; bottom: 0; left: 0; width: calc(100% / var(--n)); border-radius: 1.5rem; background: linear-gradient(135deg, var(--nav-g1), var(--nav-g2) 55%, var(--nav-g3)); box-shadow: 0 8px 18px -8px color-mix(in oklab, var(--nav-g2) 80%, transparent), inset 0 1px 0 var(--nav-shine);
   transform: translateX(calc(var(--i) * 100%)); transition: transform .38s cubic-bezier(.34, 1.4, .64, 1), opacity .2s ease; pointer-events: none;
 }
 .mobile-lens[data-on="false"] { opacity: 0; }
@@ -940,20 +989,95 @@
 .nav-item-active { box-shadow: 0 0 calc(16px * var(--ap-glow-k, 1)) -4px color-mix(in oklab, var(--sidebar-ring) calc(30% * var(--ap-glow-k, 1)), transparent); }
 @media (prefers-reduced-motion: reduce) { .nav-group-head:hover { transform: none; } .nav-item:hover:not(:disabled) { transform: none; } }
 
-/* Quick actions: colour line is thicker, short at rest, and stretches across the button when pressed / clicked. */
-.qa-line { width: 38%; transition: width .3s cubic-bezier(.2,.8,.2,1); }
-button:active > .qa-line { width: calc(100% - 1.5rem); }
-button[data-pulse="true"] > .qa-line { animation: qa-expand .65s cubic-bezier(.2,.8,.2,1); }
-@keyframes qa-expand { 0% { width: 38%; } 40% { width: calc(100% - 1.5rem); } 100% { width: 38%; } }
-@media (prefers-reduced-motion: reduce) { .qa-line { transition: none; } button[data-pulse="true"] > .qa-line { animation: none; } }
-
-/* ---- Treasury card: modern gradient with translucent tiles and colour chips ---- */
-.treasury-surface { background: radial-gradient(120% 80% at 0 0, rgb(255 255 255 / 0.14), transparent 55%), linear-gradient(150deg, var(--tre-1), var(--tre-2)); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.16); }
-.tre-tile { background: rgb(255 255 255 / 0.08); border: 1px solid rgb(255 255 255 / 0.14); color: #F5F7FA; transition: background-color .15s ease, transform .15s ease; }
-.tre-tile:hover { background: rgb(255 255 255 / 0.13); }
-.tre-chip { display: inline-grid; place-items: center; width: 20px; height: 20px; flex-shrink: 0; border-radius: 7px; color: #0B1220; }
-.tre-chip-cash { background: #34D399; } .tre-chip-bank { background: #38BDF8; } .tre-chip-receivable { background: #FBBF24; }
-.tre-chip-payable { background: #FB7185; } .tre-chip-cheques { background: #A78BFA; }
+/* Quick actions: solid blended gradients (left lighter fill -> right fuller fill, never transparent).
+   Hero tiles are split in two bands: fuller fill on top, lighter below. All colours come from tokens. */
+:root { --qa-l: 34%; --qa-r: 64%; --qa-tl: 50%; --qa-tr: 72%; --qa-bl: 16%; --qa-br: 34%; --qa-rim: oklch(1 0 0 / 0.75); }
+.dark { --qa-l: 24%; --qa-r: 52%; --qa-tl: 34%; --qa-tr: 60%; --qa-bl: 14%; --qa-br: 30%; --qa-rim: oklch(1 0 0 / 0.2); }
+.qa-tile {
+  --qa: var(--primary);
+  isolation: isolate;
+  border: 1px solid color-mix(in oklab, var(--qa) 35%, var(--qa-rim));
+  background: linear-gradient(100deg, color-mix(in oklab, var(--qa) var(--qa-l), var(--card)), color-mix(in oklab, var(--qa) var(--qa-r), var(--card)));
+  box-shadow: inset 0 1px 0 var(--qa-rim), 0 10px 18px -12px color-mix(in oklab, var(--qa) 70%, transparent);
+  transition: scale .18s cubic-bezier(.34,1.56,.64,1), translate .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease, filter .18s ease;
+}
+.qa-tile[data-variant="hero"] { background: linear-gradient(100deg, color-mix(in oklab, var(--qa) var(--qa-bl), var(--card)), color-mix(in oklab, var(--qa) var(--qa-br), var(--card))); }
+.qa-tile[data-variant="hero"]::before {
+  content: ""; position: absolute; inset: 0 0 auto 0; height: 100%; z-index: -1; border-radius: inherit;
+  background: linear-gradient(100deg, color-mix(in oklab, var(--qa) var(--qa-tl), var(--card)), color-mix(in oklab, var(--qa) var(--qa-tr), var(--card)));
+}
+.qa-tile[data-variant="hero"][data-split="true"]::before {
+  height: 58%; border-radius: 1rem 1rem 1.25rem 1.25rem;
+  box-shadow: 0 1px 0 var(--qa-rim), 0 8px 12px -10px color-mix(in oklab, var(--foreground) 40%, transparent);
+}
+.qa-tile:active { scale: .96; translate: 0 1px; transition-duration: .06s; filter: saturate(1.1) brightness(.97); box-shadow: inset 0 3px 10px -3px color-mix(in oklab, var(--qa) 60%, transparent); }
+.qa-tile[data-pulse="true"] { animation: qa-pop .45s cubic-bezier(.34,1.56,.64,1); }
+@keyframes qa-pop { 0% { scale: .96; } 55% { scale: 1.03; } 100% { scale: 1; } }
+.qa-icon svg { color: color-mix(in oklab, var(--qa) 30%, var(--foreground)); filter: drop-shadow(0 2px 3px color-mix(in oklab, var(--qa) 35%, transparent)); transition: scale .18s cubic-bezier(.34,1.56,.64,1); }
+.qa-tile:active .qa-icon svg { scale: .92; }
+.qa-ripple { position: absolute; z-index: 0; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 9999px; pointer-events: none; background: radial-gradient(closest-side, color-mix(in oklab, var(--foreground) 22%, transparent), transparent); animation: qa-ripple .6s ease-out forwards; }
+@keyframes qa-ripple { from { transform: scale(1); opacity: .9; } to { transform: scale(30); opacity: 0; } }
+@media (prefers-reduced-motion: reduce) { .qa-tile, .qa-icon svg { transition: none; } .qa-tile[data-pulse="true"], .qa-ripple { animation: none; } .qa-ripple { display: none; } }
+
+/* ---- Treasury card: light base in the light theme, dark base in the dark theme; one colourful orb at the top right only ---- */
+:root {
+  --tre-cash: oklch(0.765 0.177 163);
+  --tre-bank: oklch(0.746 0.16 232);
+  --tre-recv: oklch(0.828 0.189 84);
+  --tre-pay: oklch(0.712 0.194 13);
+  --tre-chq: oklch(0.702 0.183 293);
+  --tre-chip-fg: oklch(0.2 0.03 260);
+  --tre-base-a: oklch(0.99 0.004 250);
+  --tre-base-b: oklch(0.955 0.014 250);
+  --tre-tile-bg: oklch(1 0 0 / 0.8);
+  --tre-tile-border: oklch(0.91 0.012 250);
+  --tre-tile-shadow: 0 8px 18px -12px oklch(0.4 0.06 255 / 0.35);
+  --tre-orb-a: 34%;
+  --tre-orb-b: 27%;
+}
+.dark {
+  --tre-tile-bg: color-mix(in oklab, var(--treasury-foreground) 8%, transparent);
+  --tre-tile-border: color-mix(in oklab, var(--treasury-foreground) 15%, transparent);
+  --tre-tile-shadow: none;
+  --tre-orb-a: 42%;
+  --tre-orb-b: 33%;
+}
+.treasury-surface {
+  color: var(--treasury-foreground);
+  background:
+    radial-gradient(46% 42% at 98% 6%, color-mix(in oklab, var(--tre-recv) var(--tre-orb-a), transparent), transparent 72%),
+    radial-gradient(52% 46% at 78% 18%, color-mix(in oklab, var(--tre-cash) var(--tre-orb-a), transparent), transparent 74%),
+    radial-gradient(52% 40% at 52% 8%, color-mix(in oklab, var(--tre-bank) var(--tre-orb-b), transparent), transparent 74%),
+    linear-gradient(180deg, var(--tre-base-a), var(--tre-base-b));
+  box-shadow: 0 0 0 1px var(--tre-tile-border), inset 0 1px 0 color-mix(in oklab, var(--treasury-foreground) 10%, transparent);
+}
+.dark .treasury-surface {
+  background:
+    radial-gradient(46% 42% at 98% 6%, color-mix(in oklab, var(--tre-recv) var(--tre-orb-a), transparent), transparent 72%),
+    radial-gradient(52% 46% at 78% 18%, color-mix(in oklab, var(--tre-cash) var(--tre-orb-a), transparent), transparent 74%),
+    radial-gradient(52% 40% at 52% 8%, color-mix(in oklab, var(--tre-bank) var(--tre-orb-b), transparent), transparent 74%),
+    linear-gradient(160deg, var(--tre-1), var(--tre-2));
+}
+.tre-tile {
+  position: relative; overflow: hidden; color: var(--treasury-foreground);
+  background: var(--tre-tile-bg); border: 1px solid var(--tre-tile-border); box-shadow: var(--tre-tile-shadow);
+  transition: scale .18s cubic-bezier(.34,1.56,.64,1), filter .15s ease;
+}
+.tre-tile:hover { filter: brightness(1.04); }
+.tre-tile:active { scale: .965; transition-duration: .06s; filter: brightness(.97); }
+.tre-chip { display: inline-grid; place-items: center; width: 16px; height: 16px; flex-shrink: 0; border-radius: 5px; color: var(--tre-chip-fg); }
+.tre-chip-cash { background: var(--tre-cash); } .tre-chip-bank { background: var(--tre-bank); } .tre-chip-receivable { background: var(--tre-recv); }
+.tre-chip-payable { background: var(--tre-pay); } .tre-chip-cheques { background: var(--tre-chq); }
+.tre-ring-track { stroke: color-mix(in oklab, var(--treasury-foreground) 14%, transparent); }
+.tre-ring-seg { animation: tre-ring-in .9s cubic-bezier(.2,.8,.2,1) backwards; }
+@keyframes tre-ring-in { from { stroke-dasharray: 0 100; } }
+.tre-draw { stroke-dasharray: 1; animation: tre-draw 1s ease-out backwards; }
+@keyframes tre-draw { from { stroke-dashoffset: 1; } }
+.tre-glow { filter: drop-shadow(0 0 3px color-mix(in oklab, var(--tre-cash) 55%, transparent)); }
+.tre-spark-mask { stroke: color-mix(in oklab, var(--treasury-foreground) 45%, transparent); }
+.tre-bar { width: 4px; border-radius: 2px; transform-origin: bottom; animation: tre-bar-in .6s cubic-bezier(.2,.8,.2,1) backwards; }
+@keyframes tre-bar-in { from { scale: 1 0; } }
+@media (prefers-reduced-motion: reduce) { .tre-tile { transition: none; } .tre-ring-seg, .tre-draw, .tre-bar { animation: none; } }
 
 /* ---- Motion: short, calm, transform/opacity only; all of it is switched off by the system "reduce motion" setting ---- */
 .page-enter { animation: page-in .2s cubic-bezier(.2,.8,.2,1) backwards; }
```

### src/lib/ledger-display.ts (new file)

```diff
--- /dev/null	2026-11-06 06:47:18.321164801 +0000
+++ b/src/lib/ledger-display.ts	2026-11-06 19:44:16.702475306 +0000
@@ -0,0 +1,36 @@
+/** Display-only helpers for the party ledger (no accounting logic: Debit / Credit / balance come from db.ts untouched). */
+import type { Entry } from "./db";
+
+export type DetailPart = { text: string; strike?: boolean; bold?: boolean };
+
+/** Same rule as signedForAccount in db.ts: a bounced cheque settles nothing. */
+export const isBounced = (e: Pick<Entry, "chequeStatus">) => e.chequeStatus === "bounced";
+const isTrade = (e: Pick<Entry, "type">) => e.type === "sale" || e.type === "purchase";
+/** Net sale / purchase: paid on the spot, so it leaves the party balance unchanged (Debit and Credit stay empty). */
+export const isNet = (e: Pick<Entry, "type" | "payMode">) => isTrade(e) && e.payMode === "net";
+const kind = (e: Pick<Entry, "type">) => (e.type === "purchase" ? "Purchase" : "Sale");
+
+/** Entries whose amount is in neither Debit nor Credit: shown as a note so the amount is never lost. */
+export function amountNote(e: Pick<Entry, "type" | "payMode" | "chequeStatus">, amount: string): DetailPart[] {
+  if (isBounced(e)) return [{ text: amount, strike: true }, { text: "BOUNCED", bold: true }];
+  if (isNet(e)) return [{ text: `Net ${kind(e)}` }, { text: amount }];
+  return [];
+}
+
+/**
+ * Payment line for the printed statement (replaces the old Method / Chq column).
+ * Credit / Net / Advance for trade entries, method with cheque or reference number, bank name, and for the two
+ * zero-effect cases the amount. Pending / Cleared are never mentioned; only BOUNCED is.
+ */
+export function payParts(e: Pick<Entry, "type" | "payMode" | "chequeStatus" | "method" | "chequeNo" | "reference">, o: { bank: string; amount: string; method: string }): DetailPart[] {
+  const parts: DetailPart[] = [];
+  if (isTrade(e) && e.payMode) parts.push({ text: `${e.payMode === "net" ? "Net" : e.payMode === "advance" ? "Advance" : "Credit"} ${kind(e)}` });
+  if (e.method) {
+    const no = e.method === "cheque" ? e.chequeNo?.trim() : e.method === "online" ? e.reference?.trim() : "";
+    parts.push({ text: e.method === "cheque" ? `Cheque${no ? ` #${no}` : ""}` : `${o.method}${no ? ` · Ref ${no}` : ""}` });
+    if (e.method !== "cash" && o.bank) parts.push({ text: o.bank });
+  }
+  if (isBounced(e)) parts.push({ text: o.amount, strike: true }, { text: "BOUNCED", bold: true });
+  else if (isNet(e)) parts.push({ text: o.amount });
+  return parts;
+}
```

### src/lib/__tests__/ledger-display.test.ts (new file)

```diff
--- /dev/null	2026-11-06 06:47:18.321164801 +0000
+++ b/src/lib/__tests__/ledger-display.test.ts	2026-11-06 19:44:16.703454704 +0000
@@ -0,0 +1,36 @@
+import { describe, it, expect } from "vitest";
+import { amountNote, isBounced, isNet, payParts } from "@/lib/ledger-display";
+
+const join = (p: { text: string }[]) => p.map((x) => x.text).join(" · ");
+
+describe("ledger display helpers", () => {
+  it("bounced cheque keeps its amount (struck) and says BOUNCED, without Pending / Cleared wording", () => {
+    const e = { type: "inward", method: "cheque", chequeNo: "78231", chequeStatus: "bounced" } as const;
+    const parts = payParts(e, { bank: "Bank Alfalah", amount: "Rs 2,50,720", method: "Cheque" });
+    expect(join(parts)).toBe("Cheque #78231 · Bank Alfalah · Rs 2,50,720 · BOUNCED");
+    expect(parts[2]).toEqual({ text: "Rs 2,50,720", strike: true });
+    expect(isBounced(e)).toBe(true);
+  });
+  it("cleared and pending cheques show number and bank only", () => {
+    for (const chequeStatus of ["cleared", "pending", undefined] as const) {
+      const parts = payParts({ type: "inward", method: "cheque", chequeNo: "9", chequeStatus }, { bank: "HBL", amount: "Rs 1", method: "Cheque" });
+      expect(join(parts)).toBe("Cheque #9 · HBL");
+    }
+  });
+  it("cash and online payments", () => {
+    expect(join(payParts({ type: "outward", method: "cash" }, { bank: "", amount: "Rs 1", method: "Cash" }))).toBe("Cash");
+    expect(join(payParts({ type: "outward", method: "online", reference: "R5" }, { bank: "Meezan", amount: "Rs 1", method: "Online Transfer" }))).toBe("Online Transfer · Ref R5 · Meezan");
+  });
+  it("net sale shows its amount, credit sale does not", () => {
+    const net = { type: "sale", payMode: "net", method: "cash" } as const;
+    expect(join(payParts(net, { bank: "", amount: "Rs 38,66,252", method: "Cash" }))).toBe("Net Sale · Cash · Rs 38,66,252");
+    expect(isNet(net)).toBe(true);
+    expect(join(payParts({ type: "purchase", payMode: "credit" }, { bank: "", amount: "Rs 5", method: "" }))).toBe("Credit Purchase");
+    expect(isNet({ type: "inward", payMode: "net" })).toBe(false);
+  });
+  it("amountNote only for zero-effect entries", () => {
+    expect(amountNote({ type: "sale", payMode: "credit" }, "Rs 5")).toEqual([]);
+    expect(join(amountNote({ type: "sale", payMode: "net" }, "Rs 7"))).toBe("Net Sale · Rs 7");
+    expect(join(amountNote({ type: "inward", chequeStatus: "bounced" }, "Rs 9"))).toBe("Rs 9 · BOUNCED");
+  });
+});
```

### src/components/app/TreasuryViz.tsx (new file)

```diff
--- /dev/null	2026-11-06 06:47:18.321164801 +0000
+++ b/src/components/app/TreasuryViz.tsx	2026-11-06 08:09:44.892237518 +0000
@@ -0,0 +1,87 @@
+import { useId, type ReactNode } from "react";
+import { smoothPath } from "@/lib/treasury-series";
+import { cn } from "@/lib/utils";
+
+/** Donut made of segments. `parts` are fractions (sum <= 1) and `colors` CSS colours; `masked` draws a neutral ring that shows no proportions. */
+export function Ring({ parts, colors, masked, className, stroke = 14, label, children }: { parts: number[]; colors: string[]; masked?: boolean | undefined; className?: string | undefined; stroke?: number | undefined; label?: string | undefined; children?: ReactNode }) {
+  const r = 50 - stroke / 2;
+  const gap = parts.length > 1 ? 0.012 : 0;
+  let acc = 0;
+  return (
+    <span role={label ? "img" : undefined} aria-label={label} title={label} className={cn("relative inline-grid shrink-0 place-items-center", className)}>
+      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
+        <circle cx="50" cy="50" r={r} fill="none" strokeWidth={stroke} className="tre-ring-track" />
+        {!masked && parts.map((p, i) => {
+          const seg = Math.max(0, p - gap) * 100;
+          const el = <circle key={i} cx="50" cy="50" r={r} fill="none" strokeWidth={stroke} strokeDasharray={`${seg} ${100 - seg}`} strokeDashoffset={-acc * 100} pathLength={100} className="tre-ring-seg" style={{ stroke: colors[i % colors.length] }} />;
+          acc += p;
+          return el;
+        })}
+      </svg>
+      {children}
+    </span>
+  );
+}
+
+/** Small wavy trend line with an arrow head (top right of the Bank tile). `masked` (amounts hidden) shows a flat dashed line only. */
+export function Trend({ values, masked }: { values: number[]; masked?: boolean | undefined }) {
+  const gid = `tre-t-${useId().replace(/:/g, "")}`;
+  const { d, end } = smoothPath(values, 38, 22, 3);
+  const up = values.length < 2 || values[values.length - 1]! >= values[0]!;
+  const tail = up ? "var(--tre-cash)" : "var(--tre-pay)";
+  const flat = masked || !d;
+  const tip = end ?? { x: 35, y: 11, angle: 0 };
+  return (
+    <svg width={44} height={22} viewBox="0 0 44 22" aria-hidden className="overflow-visible">
+      <defs>
+        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
+          <stop offset="0" style={{ stopColor: "var(--tre-bank)" }} />
+          <stop offset="1" style={{ stopColor: tail }} />
+        </linearGradient>
+      </defs>
+      {masked ? (
+        <path d="M3 11 L35 11" fill="none" strokeWidth={1.6} strokeDasharray="3 4" className="tre-spark-mask" />
+      ) : (
+        <>
+          <path d={flat ? "M3 11 L35 11" : d} fill="none" pathLength={1} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="tre-draw tre-glow" style={{ stroke: `url(#${gid})` }} />
+          <g transform={`translate(${tip.x} ${tip.y}) rotate(${tip.angle})`}><path d="M5 0 L-1 -3 L-1 3 Z" style={{ fill: tail }} className="tre-glow" /></g>
+        </>
+      )}
+    </svg>
+  );
+}
+
+const BAR_COLORS = [
+  "var(--tre-recv)",
+  "var(--tre-bank)",
+  "var(--tre-cash)",
+  "color-mix(in oklab, var(--tre-recv) 55%, var(--tre-pay))",
+  "var(--tre-chq)",
+  "color-mix(in oklab, var(--treasury-foreground) 45%, transparent)",
+];
+
+/** Six little bars in different colours (top right of the Receivables tile). Biggest party is the tallest; missing slots are faint stubs. */
+export function Bars({ values, masked }: { values: number[]; masked?: boolean | undefined }) {
+  const real = masked ? [] : [...values].sort((a, b) => b - a).slice(0, 6).reverse();
+  const max = Math.max(...real, 0);
+  const stubs = 6 - real.length;
+  return (
+    <span className="flex h-[22px] items-end gap-[3px]" aria-hidden>
+      {Array.from({ length: 6 }, (_, i) => {
+        const v = masked || i < stubs ? null : real[i - stubs]!;
+        return <span key={i} className={cn("tre-bar", v === null && "opacity-25")}
+          style={{ height: v === null || max <= 0 ? (masked ? "55%" : "16%") : `${Math.max(24, (v / max) * 100)}%`, background: BAR_COLORS[i], animationDelay: `${i * 50}ms` }} />;
+      })}
+    </span>
+  );
+}
+
+/** Pending / cleared / bounced as three small dots (top right of the Pending cheques tile). A dot fades when its count is zero. */
+export function StatusDots({ pending, cleared, bounced }: { pending: number; cleared: number; bounced: number }) {
+  const items = [["var(--tre-chq)", pending, "pending"], ["var(--tre-cash)", cleared, "cleared"], ["var(--tre-pay)", bounced, "bounced"]] as const;
+  return (
+    <span className="flex items-center gap-1" role="img" aria-label={items.map(([, n, l]) => `${n} ${l}`).join(", ")}>
+      {items.map(([c, n, l]) => <span key={l} className="h-2 w-2 rounded-full" style={{ background: c, opacity: n > 0 ? 1 : 0.3 }} />)}
+    </span>
+  );
+}
```

### src/lib/treasury-series.ts (new file)

```diff
--- /dev/null	2026-11-06 06:47:18.321164801 +0000
+++ b/src/lib/treasury-series.ts	2026-11-06 04:22:26.233689712 +0000
@@ -0,0 +1,65 @@
+/** Pure helpers for the Treasury Position visuals (read-only; no accounting logic lives here). */
+
+const pad = (x: number) => String(x).padStart(2, "0");
+const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
+
+/** The last `n` calendar days ending on `today` (YYYY-MM-DD), oldest first. */
+export function lastDays(n: number, today: string): string[] {
+  const [y, m, d] = today.split("-").map(Number);
+  const out: string[] = [];
+  for (let i = n - 1; i >= 0; i--) out.push(iso(new Date(y!, (m ?? 1) - 1, (d ?? 1) - i)));
+  return out;
+}
+
+type FundRows = { opening: number; rows: { e: { date: string }; bal: number }[] };
+
+/** End-of-day combined balance of the given funds for each day. Rows must be date-sorted (fundLedger already is). */
+export function balanceSeries(funds: FundRows[], days: string[]): number[] {
+  const ptr = funds.map(() => 0);
+  return days.map((day) =>
+    funds.reduce((sum, f, i) => {
+      let p = ptr[i]!;
+      while (p < f.rows.length && f.rows[p]!.e.date <= day) p++;
+      ptr[i] = p;
+      return sum + (p > 0 ? f.rows[p - 1]!.bal : f.opening);
+    }, 0),
+  );
+}
+
+/** Fractions (0..1) of the positive values; negatives count as zero. Empty when there is nothing positive. */
+export function shares(values: number[]): number[] {
+  const v = values.map((x) => Math.max(0, x));
+  const total = v.reduce((a, b) => a + b, 0);
+  return total > 0 ? v.map((x) => x / total) : [];
+}
+
+/** Combined balance of the funds after each day on which something changed it (opening balance first), last `max` points. */
+export function activitySeries(funds: FundRows[], today: string, max = 12): number[] {
+  const dates = [...new Set(funds.flatMap((f) => f.rows.map((r) => r.e.date)).filter((d) => d <= today))].sort();
+  const start = funds.reduce((t, f) => t + f.opening, 0);
+  const vals = [start, ...balanceSeries(funds, dates)];
+  const out = vals.filter((v, i) => i === 0 || v !== vals[i - 1]);
+  return out.slice(-max);
+}
+
+/** Smooth SVG line through the values inside a w x h box, plus the end point and its direction (degrees) for an arrow head. */
+export function smoothPath(values: number[], w: number, h: number, pad_ = 3): { d: string; end: { x: number; y: number; angle: number } | null } {
+  if (values.length < 2) return { d: "", end: null };
+  const min = Math.min(...values);
+  const span = Math.max(...values) - min;
+  const X = (i: number) => pad_ + (i * (w - 2 * pad_)) / (values.length - 1);
+  const Y = (v: number) => (span === 0 ? h / 2 : h - pad_ - ((v - min) / span) * (h - 2 * pad_));
+  const P = values.map((v, i) => ({ x: X(i), y: Y(v) }));
+  const cy = (y: number) => Math.min(h - pad_, Math.max(pad_, y));
+  const f = (n: number) => n.toFixed(1);
+  let d = `M${f(P[0]!.x)} ${f(P[0]!.y)}`;
+  let c2 = P[0]!;
+  for (let i = 0; i < P.length - 1; i++) {
+    const p0 = P[i - 1] ?? P[i]!, p1 = P[i]!, p2 = P[i + 1]!, p3 = P[i + 2] ?? P[i + 1]!;
+    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: cy(p1.y + (p2.y - p0.y) / 6) };
+    c2 = { x: p2.x - (p3.x - p1.x) / 6, y: cy(p2.y - (p3.y - p1.y) / 6) };
+    d += ` C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
+  }
+  const last = P[P.length - 1]!;
+  return { d, end: { x: last.x, y: last.y, angle: (Math.atan2(last.y - c2.y, last.x - c2.x) * 180) / Math.PI } };
+}
```

### src/lib/__tests__/treasury-series.test.ts (new file)

```diff
--- /dev/null	2026-11-06 06:47:18.321164801 +0000
+++ b/src/lib/__tests__/treasury-series.test.ts	2026-11-06 04:22:26.234056812 +0000
@@ -0,0 +1,44 @@
+import { describe, it, expect } from "vitest";
+import { activitySeries, balanceSeries, lastDays, shares, smoothPath } from "@/lib/treasury-series";
+
+describe("treasury visuals helpers", () => {
+  it("lastDays returns n consecutive days ending today, oldest first", () => {
+    expect(lastDays(3, "2026-11-06")).toEqual(["2026-11-04", "2026-11-05", "2026-11-06"]);
+    expect(lastDays(3, "2026-03-01")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
+    expect(lastDays(1, "2026-11-06")).toEqual(["2026-11-06"]);
+  });
+  it("balanceSeries uses opening before the first row and the running balance after", () => {
+    const fund = { opening: 100, rows: [{ e: { date: "2026-11-05" }, bal: 150 }, { e: { date: "2026-11-06" }, bal: 120 }] };
+    expect(balanceSeries([fund], ["2026-11-04", "2026-11-05", "2026-11-06"])).toEqual([100, 150, 120]);
+  });
+  it("balanceSeries adds several funds together", () => {
+    const a = { opening: 10, rows: [] };
+    const b = { opening: 5, rows: [{ e: { date: "2026-11-06" }, bal: 25 }] };
+    expect(balanceSeries([a, b], ["2026-11-05", "2026-11-06"])).toEqual([15, 35]);
+  });
+  it("shares ignores negatives and sums to 1", () => {
+    expect(shares([30, 10, -5])).toEqual([0.75, 0.25, 0]);
+    expect(shares([0, -1])).toEqual([]);
+    expect(shares([])).toEqual([]);
+  });
+  it("activitySeries starts at the opening balance and keeps only real changes", () => {
+    const f = { opening: 100, rows: [
+      { e: { date: "2026-11-01" }, bal: 100 },
+      { e: { date: "2026-11-02" }, bal: 150 },
+      { e: { date: "2026-11-03" }, bal: 150 },
+      { e: { date: "2026-11-04" }, bal: 90 },
+      { e: { date: "2026-12-01" }, bal: 500 },
+    ] };
+    expect(activitySeries([f], "2026-11-06")).toEqual([100, 150, 90]);
+    expect(activitySeries([f], "2026-11-06", 2)).toEqual([150, 90]);
+    expect(activitySeries([{ opening: 5, rows: [] }], "2026-11-06")).toEqual([5]);
+  });
+  it("smoothPath: too few points gives nothing, flat points right, rising points up", () => {
+    expect(smoothPath([1], 38, 22)).toEqual({ d: "", end: null });
+    const flat = smoothPath([5, 5, 5], 38, 22);
+    expect(flat.d.startsWith("M3.0 11.0 C")).toBe(true);
+    expect(flat.end).toEqual({ x: 35, y: 11, angle: 0 });
+    expect(smoothPath([1, 2, 3], 38, 22).end!.angle).toBeLessThan(0);
+    expect(smoothPath([3, 2, 1], 38, 22).end!.angle).toBeGreaterThan(0);
+  });
+});
```

### src/lib/version.ts (new file)

```diff
--- /dev/null	2026-11-06 06:47:18.321164801 +0000
+++ b/src/lib/version.ts	2026-11-06 19:44:40.125478288 +0000
@@ -0,0 +1,2 @@
+/** Shown in Settings & Backup so a problem can be reported against an exact version. See CHANGELOG.md. */
+export const APP_VERSION = "1.5.1";
```

### src/components/app/QuickActionTile.tsx (new file)

```diff
--- /dev/null	2026-11-06 06:47:18.321164801 +0000
+++ b/src/components/app/QuickActionTile.tsx	2026-11-06 08:08:36.262968437 +0000
@@ -0,0 +1,61 @@
+import type { CSSProperties, PointerEventHandler } from "react";
+import type { LucideIcon } from "lucide-react";
+import { cn } from "@/lib/utils";
+
+export type TileVariant = "hero" | "tile" | "md" | "sm" | "xs";
+export type TileRipple = { x: number; y: number; k: number } | null;
+
+// Every tile: label on the left, big icon on the right. Hero tiles are split in two bands (more fill on top, less below).
+const SIZE: Record<Exclude<TileVariant, "hero">, string> = {
+  tile: "gap-2 px-3 text-[15px]",
+  md: "gap-2 px-3 text-sm",
+  sm: "gap-1.5 px-2.5 text-[13px]",
+  xs: "gap-1.5 px-2 text-xs",
+};
+const ICON: Record<TileVariant, string> = { hero: "h-12 w-12", tile: "h-10 w-10", md: "h-8 w-8", sm: "h-6 w-6", xs: "h-5 w-5" };
+
+type Props = {
+  id: string;
+  label: string;
+  icon: LucideIcon;
+  /** CSS colour (a design-token variable) that tints the tile. */
+  tone: string;
+  variant: TileVariant;
+  /** Full-width tile (hero). */
+  span: boolean;
+  latest?: string | undefined;
+  ripple: TileRipple;
+  pulse: boolean;
+  lifted: boolean;
+  target: boolean;
+  onPointerDown: PointerEventHandler<HTMLButtonElement>;
+  onClick: () => void;
+};
+
+export function QuickTile({ id, label, icon: Icon, tone, variant, span, latest, ripple, pulse, lifted, target, onPointerDown, onClick }: Props) {
+  const hero = variant === "hero";
+  const split = hero && !!latest;
+  const icon = (
+    <span className="qa-icon relative grid shrink-0 place-items-center">
+      <Icon className={ICON[variant]} strokeWidth={1.5} aria-hidden />
+    </span>
+  );
+  const text = <span className={cn("min-w-0 text-left leading-tight", hero ? "truncate text-[17px]" : "line-clamp-2 text-balance")}>{label}</span>;
+  return (
+    <button type="button" data-qid={id} data-pulse={pulse} data-variant={variant} data-split={split} onPointerDown={onPointerDown} onClick={onClick} onContextMenu={(e) => e.preventDefault()}
+      style={{ "--qa": tone, ...(span ? { gridColumn: "1 / -1" } : {}) } as CSSProperties}
+      className={cn("qa-tile relative flex min-h-0 min-w-0 select-none overflow-hidden rounded-2xl font-semibold text-foreground [-webkit-touch-callout:none] [touch-action:manipulation]",
+        hero ? "flex-col" : cn("items-center justify-between", SIZE[variant as Exclude<TileVariant, "hero">]),
+        lifted && "scale-95 opacity-40", target && "scale-105 ring-2 ring-primary/50")}>
+      {ripple && <span key={ripple.k} aria-hidden className="qa-ripple" style={{ left: ripple.x, top: ripple.y }} />}
+      {hero ? (
+        <>
+          <span className={cn("relative flex items-center justify-between gap-3 px-4", split ? "h-[58%]" : "h-full")}>{text}{icon}</span>
+          {split && <span className="relative flex min-h-0 flex-1 items-center px-4 text-[11px] font-medium text-muted-foreground"><span className="truncate">{latest}</span></span>}
+        </>
+      ) : (
+        <>{text}{icon}</>
+      )}
+    </button>
+  );
+}
```

### src/lib/quick-layout.ts (new file)

```diff
--- /dev/null	2026-11-06 06:47:18.321164801 +0000
+++ b/src/lib/quick-layout.ts	2026-11-05 22:00:23.878883318 +0000
@@ -0,0 +1,31 @@
+/** Layout rules for the Quick Actions card (presentation only). */
+export type QuickKind = "hero" | "tile";
+
+/** Hero rows are a little taller than tile rows. */
+export const HERO_FR = 1.35;
+const HERO_MIN = 60;
+const TILE_MIN = 52;
+
+/** The first two actions are full-width heroes; if an odd tile would be left alone at the end, it becomes a hero too. */
+export function quickKinds(n: number): QuickKind[] {
+  const kinds: QuickKind[] = Array.from({ length: n }, (_, i) => (i < 2 ? "hero" : "tile"));
+  if (n > 2 && (n - 2) % 2 === 1) kinds[n - 1] = "hero";
+  return kinds;
+}
+
+/** One weight per grid row: every hero has its own row, tiles share a row in pairs. */
+export function quickRowWeights(kinds: QuickKind[]): number[] {
+  const weights: number[] = [];
+  for (let i = 0; i < kinds.length; i++) {
+    if (kinds[i] === "hero") weights.push(HERO_FR);
+    else { weights.push(1); i++; }
+  }
+  return weights;
+}
+
+/** Smallest grid height (px) at which the hero layout stays readable; below it the compact grid is used. */
+export function quickMinHeight(kinds: QuickKind[], gap: number): number {
+  const weights = quickRowWeights(kinds);
+  const rows = weights.reduce((t, w) => t + (w === HERO_FR ? HERO_MIN : TILE_MIN), 0);
+  return rows + Math.max(0, weights.length - 1) * gap;
+}
```

### src/lib/__tests__/quick-layout.test.ts (new file)

```diff
--- /dev/null	2026-11-06 06:47:18.321164801 +0000
+++ b/src/lib/__tests__/quick-layout.test.ts	2026-11-05 22:00:23.880144128 +0000
@@ -0,0 +1,31 @@
+import { describe, it, expect } from "vitest";
+import { quickKinds, quickMinHeight, quickRowWeights, HERO_FR } from "@/lib/quick-layout";
+
+describe("quick actions hero layout", () => {
+  it("first two are heroes, the rest are tiles", () => {
+    expect(quickKinds(4)).toEqual(["hero", "hero", "tile", "tile"]);
+    expect(quickKinds(6)).toEqual(["hero", "hero", "tile", "tile", "tile", "tile"]);
+  });
+  it("an odd leftover tile becomes a hero (last button)", () => {
+    expect(quickKinds(5)).toEqual(["hero", "hero", "tile", "tile", "hero"]);
+    expect(quickKinds(7)).toEqual(["hero", "hero", "tile", "tile", "tile", "tile", "hero"]);
+    expect(quickKinds(3)).toEqual(["hero", "hero", "hero"]);
+  });
+  it("one or two actions are all heroes", () => {
+    expect(quickKinds(1)).toEqual(["hero"]);
+    expect(quickKinds(2)).toEqual(["hero", "hero"]);
+  });
+  it("tiles always pair up, so every grid row is full", () => {
+    for (let n = 1; n <= 7; n++) {
+      const kinds = quickKinds(n);
+      const tiles = kinds.filter((k) => k === "tile").length;
+      expect(tiles % 2).toBe(0);
+      expect(quickRowWeights(kinds)).toHaveLength(kinds.filter((k) => k === "hero").length + tiles / 2);
+    }
+  });
+  it("row weights and minimum height", () => {
+    expect(quickRowWeights(quickKinds(4))).toEqual([HERO_FR, HERO_FR, 1]);
+    expect(quickMinHeight(quickKinds(4), 8)).toBe(60 + 60 + 52 + 16);
+    expect(quickMinHeight(quickKinds(6), 8)).toBeGreaterThan(quickMinHeight(quickKinds(4), 8));
+  });
+});
```

### src/lib/__tests__/ledger-ui-guard.test.ts (new file)

```diff
--- /dev/null	2026-11-06 06:47:18.321164801 +0000
+++ b/src/lib/__tests__/ledger-ui-guard.test.ts	2026-11-06 03:33:13.594083035 +0000
@@ -0,0 +1,23 @@
+import { describe, it, expect } from "vitest";
+import ledgerSource from "../../routes/ledger.$id.tsx?raw";
+
+// Guards against an accidental deletion of the ledger page's on-screen controls (this happened once, see CHANGELOG v1.4.1).
+const MARKERS: [string, string][] = [
+  ["party balance card", 'sm:text-2xl">{a.name}'],
+  ["account type / contact / address", "accountTypeLabel(d, a.type)"],
+  ["worker wages card", "Fixed Wages / month"],
+  ["worker advance outstanding", "Advance outstanding"],
+  ["received / issued cards", ">Received</div>"],
+  ["From date filter", 'label="From"'],
+  ["To date filter", 'label="To"'],
+  ["Clear dates button", ">Clear</Button>"],
+  ["Cards View toggle", "Cards View"],
+  ["Register Table View toggle", "Register Table View"],
+  ["transactions list", "Transactions</h2>"],
+];
+
+describe("ledger page keeps its on-screen controls", () => {
+  it.each(MARKERS)("%s", (_name, marker) => {
+    expect(ledgerSource).toContain(marker);
+  });
+});
```
