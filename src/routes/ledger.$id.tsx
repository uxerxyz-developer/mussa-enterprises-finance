import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, PageHeader, PrintHeader } from "@/components/app/inputs";
import { EntryForm } from "@/components/app/EntryForm";
import { PinActionDialog } from "@/components/app/PinActionDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TypeBadge } from "@/components/app/EntriesTable";
import { accountTypeLabel, balanceClass, deleteItems, liveEntries, signedForAccount, useData, workerLifetime, workerMonth, METHODS, ENTRY_TYPES, fundName, type Data, type Entry, type EntryType } from "@/lib/db";
import { downloadFile, fmtDate, fmtPKR, fmtTime, toCSV, todayISO } from "@/lib/format";
import { amountNote, isBounced, payParts, type DetailPart } from "@/lib/ledger-display";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ledger/$id")({
  head: () => ({
    meta: [
      { title: "Party Ledger — Mussa Enterprises Cash Book" },
      { name: "description", content: "Date-wise party statement with debit, credit and running balance." },
      { property: "og:title", content: "Party Ledger — Mussa Enterprises Cash Book" },
      { property: "og:description", content: "Date-wise party statement with debit, credit and running balance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LedgerPage,
});

/* ---------- ledger display helpers (presentation only; no accounting logic) ---------- */
const bankNameOf = (d: Data, e: Entry) => (e.bankId ? fundName(d, e.bankId) : e.bank?.trim()) || "";
/** "Material · weight · rate" for trade entries; empty when none is stored. */
function tradeText(d: Data, e: Entry) {
  const mat = d.materials.find((m) => m.id === e.materialId)?.name;
  // Auto-generated particulars already carry "Billet 10.659 Ton @ Rs 148/kg": do not repeat it.
  if (mat && e.particulars && e.particulars.toLowerCase().includes(mat.toLowerCase()) && /@|\bton\b|\bkg\b/i.test(e.particulars)) return "";
  return [mat, e.weightKg ? `${e.weightKg.toLocaleString("en-IN")} kg` : "", e.rate ? `@ ${fmtPKR(e.rate)}/kg` : ""].filter(Boolean).join(" · ");
}
/** Particulars, except when they only repeat the type name ("Sale", "Receive Payment"...). */
function partText(e: Entry) {
  const p = e.particulars?.trim() ?? "";
  const m = ENTRY_TYPES[e.type];
  return [m.label, m.action].some((x) => x && x.toLowerCase() === p.toLowerCase()) ? "" : p;
}
/** Method line ("Cheque · Chq #123") and bank line. Never includes cheque status. */
function payInfo(d: Data, e: Entry) {
  if (!e.method || e.method === "cash") return { first: e.method ? METHODS[e.method] : "", bank: "" };
  const no = e.method === "cheque" ? e.chequeNo?.trim() : e.reference?.trim();
  return { first: `${METHODS[e.method]}${no ? (e.method === "cheque" ? ` #${no}` : ` · Ref ${no}`) : ""}`, bank: bankNameOf(d, e) };
}

/** On-screen only: cheque status stays inside the app and is never printed or put on vouchers. */
function ChequeBadge({ e }: { e: Entry }) {
  if (e.method !== "cheque") return null;
  const s = e.chequeStatus ?? "pending";
  return <span className={cn("inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase", s === "cleared" ? "bg-success-soft text-success" : s === "bounced" ? "bg-danger-soft text-destructive" : "bg-warning-soft text-warning")}>{s}</span>;
}

/** Detail pieces joined with " · "; struck-through or bold where the piece asks for it. */
function Parts({ parts }: { parts: DetailPart[] }) {
  return <>{parts.map((x, i) => <span key={i}>{i > 0 && " · "}{x.strike ? <s>{x.text}</s> : x.bold ? <b>{x.text}</b> : x.text}</span>)}</>;
}

function CardDetails({ d, e }: { d: Data; e: Entry }) {
  const trade = tradeText(d, e);
  const bank = bankNameOf(d, e);
  const cheque = e.method === "cheque";
  if (!trade && !e.remarks && !cheque) return null;
  return (
    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
      {e.remarks && <div>Remarks: {e.remarks}</div>}
      {trade && <div>{trade}</div>}
      {cheque && <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span>{[e.chequeNo?.trim() ? `Chq #${e.chequeNo.trim()}` : "Cheque", bank].filter(Boolean).join(" · ")}</span><ChequeBadge e={e} /></div>}
    </div>
  );
}

function LedgerPage() {
  const { id } = Route.useParams();
  const d = useData();
  const a = d.accounts.find((x) => x.id === id);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filter, setFilter] = useState<"all" | "received" | "issued">("all");
  const [pending, setPending] = useState<{ entry: Entry; action: "edit" | "delete" } | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [adding, setAdding] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { opening, rows, closing, dr, cr } = useMemo(() => {
    const all = liveEntries(d).filter((e) => e.accountId === id).sort((x, y) => x.date.localeCompare(y.date) || x.voucherNo - y.voucherNo);
    let bal = a?.openingBalance ?? 0;
    for (const e of all) if (from && e.date < from) bal += signedForAccount(e);
    const opening = bal;
    let dr = 0, cr = 0;
    const rows = all.filter((e) => (!from || e.date >= from) && (!to || e.date <= to)).map((e) => {
      const s = signedForAccount(e);
      bal += s;
      if (s > 0) dr += s; else cr -= s;
      return { e, debit: s > 0 ? s : 0, credit: s < 0 ? -s : 0, bal };
    });
    return { opening, rows, closing: bal, dr, cr };
  }, [d, id, a, from, to]);

  if (!a) return <div className="py-20 text-center text-muted-foreground">Account not found. <Link to="/accounts" className="text-primary hover:underline">Back to accounts</Link></div>;

  const choices: EntryType[] = a.type === "buyer" ? ["sale", "inward", "outward"] : a.type === "supplier" ? ["purchase", "outward", "inward"] : a.type === "worker" ? ["salary", "advance"] : ["inward", "outward", "sale", "purchase"];
  const balText = (b: number) => `${fmtPKR(Math.abs(b), false)} ${b > 0 ? "Dr" : b < 0 ? "Cr" : ""}`;
  const period = from || to ? `${fmtDate(from) || "Start"} to ${fmtDate(to) || fmtDate(todayISO())}` : "All dates";
  const received = rows.filter(({ e }) => !isBounced(e) && ENTRY_TYPES[e.type].flow === "in").reduce((total, { e }) => total + e.amount, 0);
  const issued = rows.filter(({ e }) => !isBounced(e) && ENTRY_TYPES[e.type].flow === "out").reduce((total, { e }) => total + e.amount, 0);
  const isWorker = a.type === "worker";
  const month = todayISO().slice(0, 7);
  // Same figures the dashboard and reports use. "This month" resets with the month; "so far" and the advance balance keep running.
  const wm = workerMonth(d, a.id, month);
  const life = workerLifetime(d, a.id);
  const { paidSalary, paidAdvance } = wm;
  const wageLeft = wm.remaining;
  const visible = rows.filter(({ e }) => filter === "all" || ENTRY_TYPES[e.type].flow === (filter === "received" ? "in" : "out")).slice().reverse();
  // Dr/Cr totals of the rows currently shown (equal to dr/cr when no filter is applied).
  const visDr = visible.reduce((t, r) => t + r.debit, 0);
  const visCr = visible.reduce((t, r) => t + r.credit, 0);

  const exportCSV = () => {
    const out: (string | number)[][] = [[`${a.name} (${a.code})`], ["Period", period], [], ["Date", "Voucher", "Type", "Particulars", "Method", "Debit", "Credit", "Balance"], ["", "", "", "Opening Balance", "", "", "", balText(opening)]];
    rows.forEach(({ e, debit, credit, bal }) => out.push([fmtDate(e.date), `V-${e.voucherNo}`, e.type, e.particulars, e.method ? METHODS[e.method] : "", debit || "", credit || "", balText(bal)]));
    out.push(["", "", "", "Closing Balance", "", dr, cr, balText(closing)]);
    downloadFile(`ledger-${a.code}.csv`, toCSV(out));
  };

  return (
    <div>
       
       <PageHeader
        title={a.name}
        subtitle={`${a.code} · ${accountTypeLabel(d, a.type)}${a.phone ? " · " + a.phone : ""}`}
        actions={<>
          <Button onClick={() => setAdding(true)}><Plus /> New Entry</Button>
          <Button variant="outline" onClick={exportCSV}><Download /> Excel</Button>
          <Button onClick={() => { const previous = document.title; document.title = `${a.name} Statement ${todayISO()}`; window.print(); setTimeout(() => { document.title = previous; }, 500); }}><Printer /> Print / PDF</Button>
        </>}
      />
      <PrintHeader title="Account Statement" sub={period} />
      <div className="print-only mb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 break-words text-sm">
            <div className="font-semibold">{a.name} <span className="num">({a.code})</span></div>
            {a.phone && <div>{a.phone}</div>}
            {a.address && <div>{a.address}</div>}
          </div>
          <div className="grid w-[55%] shrink-0 grid-cols-2 border text-xs">
            {([["Opening", balText(opening)], ["Total Debit", fmtPKR(Math.abs(dr), false)], ["Total Credit", fmtPKR(Math.abs(cr), false)], ["Closing", balText(closing)]] as const).map(([l, v], i) => (
              <div key={l} className={cn("px-2 py-1", i % 2 === 1 && "border-l", i > 1 && "border-t")}>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</div>
                <div className="num whitespace-nowrap text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Account Summary & Balance Card */}
      <div className="no-print mb-5 rounded-lg border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">{a.name}</h2>
            <span className="num text-sm text-muted-foreground">{a.code}</span>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs uppercase text-muted-foreground">Balance</div>
            <div className={cn("num text-xl font-semibold sm:text-2xl", closing >= 0 ? "text-success" : "text-destructive")}>
              {closing < 0 ? "−" : ""}{fmtPKR(Math.abs(closing))}
            </div>
            <div className="text-xs text-muted-foreground">
              {balanceClass(a, closing)}{closing > 0 ? " · Dr" : closing < 0 ? " · Cr" : ""}
            </div>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Type</dt>
          <dd>{accountTypeLabel(d, a.type)}</dd>
          {a.phone && <><dt className="text-muted-foreground">Contact</dt><dd className="select-text">{a.phone}</dd></>}
          {a.address && <><dt className="text-muted-foreground">Address</dt><dd>{a.address}</dd></>}
        </dl>
      </div>

      {/* 2. Worker Wages Breakdown (or Received/Issued Summary) */}
      {isWorker ? (
        <div className="no-print mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase text-muted-foreground">Fixed Wages / month</div>
            <div className="num mt-1 text-lg font-semibold">{a.fixedWages ? fmtPKR(a.fixedWages) : "Not set"}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase text-muted-foreground">Paid this month</div>
            <div className="num mt-1 text-lg font-semibold text-destructive">{fmtPKR(paidSalary + paidAdvance)}</div>
            <div className="num text-xs text-muted-foreground">Salary {fmtPKR(paidSalary)} · Advance {fmtPKR(paidAdvance)}</div>
          </div>
          {!!a.fixedWages && (
            <div className="col-span-2 rounded-lg border bg-card p-4">
              <div className="text-xs uppercase text-muted-foreground">{wageLeft >= 0 ? "Remaining to pay this month" : "Advance over wages"}</div>
              <div className={cn("num mt-1 text-xl font-semibold", wageLeft >= 0 ? "text-success" : "text-destructive")}>
                {fmtPKR(Math.abs(wageLeft))}
              </div>
            </div>
          )}
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase text-muted-foreground">Advance outstanding</div>
            <div className="num mt-1 text-lg font-semibold">{fmtPKR(life.outstanding)}</div>
            <div className="text-xs text-muted-foreground">Given and not yet adjusted (all months)</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase text-muted-foreground">Paid so far (all time)</div>
            <div className="num mt-1 text-lg font-semibold">{fmtPKR(life.salaryPaid + life.advanceGiven)}</div>
            <div className="num text-xs text-muted-foreground">Salary {fmtPKR(life.salaryPaid)} · Advance {fmtPKR(life.advanceGiven)}</div>
          </div>
        </div>
      ) : (
        <div className="no-print mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase text-muted-foreground">Received</div>
            <div className="num mt-1 text-lg font-semibold text-success">{fmtPKR(received)}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase text-muted-foreground">Issued</div>
            <div className="num mt-1 text-lg font-semibold text-destructive">{fmtPKR(issued)}</div>
          </div>
        </div>
      )}

      {/* 3. Date Filters + Cards vs Register Table View Toggle */}
      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        {(from || to) && <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>Clear</Button>}
        <div className="ml-auto flex gap-1 rounded-lg border bg-card p-1" role="group" aria-label="Ledger view">
          <Button size="sm" variant={viewMode === "cards" ? "default" : "ghost"} aria-pressed={viewMode === "cards"} onClick={() => setViewMode("cards")}>Cards View</Button>
          <Button size="sm" variant={viewMode === "table" ? "default" : "ghost"} aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")}>Register Table View</Button>
        </div>
      </div>

       {!isWorker && <div className="no-print mb-5 flex gap-2">
         {(["all", "received", "issued"] as const).map((key) => <Button key={key} className="rounded-full" variant={filter === key ? "default" : "outline"} onClick={() => setFilter(key)}>{key === "all" ? "All" : key === "received" ? "Received" : "Issued"}</Button>)}
       </div>}
       <h2 className="no-print mb-3 text-xs font-semibold uppercase text-muted-foreground">Transactions</h2>
       {viewMode === "cards" && <div className="no-print space-y-3">
         {visible.length === 0 && <p className="py-8 text-center text-muted-foreground">No transactions in this view</p>}
         {visible.map(({ e, bal }) => {
           const flow = ENTRY_TYPES[e.type].flow;
           return <div key={e.id} className={cn("rounded-lg border border-l-[5px] bg-card p-4 shadow-sm", flow === "in" ? "border-l-success" : flow === "out" ? "border-l-destructive" : "border-l-ledger")}>
             <div className="flex min-w-0 items-start justify-between gap-3">
               <div className="min-w-0"><div className="font-semibold">{isWorker ? ENTRY_TYPES[e.type].label : flow === "in" ? "Received" : flow === "out" ? "Issued" : ENTRY_TYPES[e.type].label}</div><div className="text-xs text-muted-foreground">{fmtDate(e.date)} · {fmtTime(e.createdAt)} · {e.method ? METHODS[e.method] : `V-${e.voucherNo}`}</div></div>
               <div className={cn("num shrink-0 text-right text-sm font-semibold sm:text-lg", isBounced(e) ? "text-destructive line-through" : flow === "in" ? "text-success" : flow === "out" ? "text-destructive" : "text-foreground")}>{isBounced(e) ? "" : flow === "in" ? "+ " : flow === "out" ? "− " : ""}{fmtPKR(e.amount)}</div>
             </div>
             {partText(e) && <p className="mt-2 text-sm text-muted-foreground">{partText(e)}</p>}
             <CardDetails d={d} e={e} />
             <div className="mt-3 flex items-center justify-between border-t pt-2"><span className="num select-text text-xs text-muted-foreground">V-{e.voucherNo} · Balance {balText(bal)}</span><div className="flex gap-1"><Button variant="ghost" size="icon" title="Edit · PIN required" aria-label={`Edit voucher V-${e.voucherNo}`} onClick={() => setPending({ entry: e, action: "edit" })}><Pencil /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete · PIN required" aria-label={`Delete voucher V-${e.voucherNo}`} onClick={() => setPending({ entry: e, action: "delete" })}><Trash2 /></Button></div></div>
           </div>;
         })}
       </div>}
       {viewMode === "table" && <div className="no-print">
         {filter !== "all" && <p className="mb-2 text-xs text-muted-foreground">Filtered view — balances are the full account running balances; Dr/Cr totals cover the filtered rows only.</p>}
         <div className="overflow-x-auto rounded-lg border bg-card">
           <table className="w-full min-w-[900px] text-sm">
             <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
               <tr>
                 <th className="px-3 py-2.5">Date</th>
                 <th className="px-3 py-2.5">Voucher</th>
                 <th className="px-3 py-2.5">Type &amp; Details</th>
                 <th className="px-3 py-2.5">Method / Chq</th>
                 <th className="px-3 py-2.5 text-right">Debit (Dr)</th>
                 <th className="px-3 py-2.5 text-right">Credit (Cr)</th>
                 <th className="px-3 py-2.5 text-right">Balance</th>
                 <th className="px-3 py-2.5 text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               {visible.length === 0 && <tr className="border-t"><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No transactions in this view</td></tr>}
               {visible.map(({ e, debit, credit, bal }) => {
                 const pi = payInfo(d, e);
                 const trade = tradeText(d, e);
                 const note = amountNote(e, fmtPKR(e.amount));
                 return (
                   <tr key={e.id} className="border-t align-top">
                     <td className="whitespace-nowrap px-3 py-2">{fmtDate(e.date)}</td>
                     <td className="num px-3 py-2 whitespace-nowrap"><Link to="/voucher/$id" params={{ id: e.id }} className="hover:text-primary">V-{e.voucherNo}</Link></td>
                     <td className="px-3 py-2">
                       <TypeBadge type={e.type} />
                       {partText(e) && <div className="mt-1">{partText(e)}</div>}
                       {trade && <div className="text-xs text-muted-foreground">{trade}</div>}
                       {e.remarks && <div className="text-xs text-muted-foreground">Remarks: {e.remarks}</div>}
                       {note.length > 0 && <div className={cn("text-xs", isBounced(e) ? "font-medium text-destructive" : "text-muted-foreground")}><Parts parts={note} /></div>}
                     </td>
                     <td className="px-3 py-2 text-xs">
                       <div>{pi.first || "—"}</div>
                       {pi.bank && <div className="text-muted-foreground">{pi.bank}</div>}
                       {e.method === "cheque" && <div className="mt-1"><ChequeBadge e={e} /></div>}
                     </td>
                     <td className="num px-3 py-2 text-right whitespace-nowrap">{debit ? debit.toLocaleString("en-IN") : ""}</td>
                     <td className="num px-3 py-2 text-right whitespace-nowrap">{credit ? credit.toLocaleString("en-IN") : ""}</td>
                     <td className={cn("num px-3 py-2 text-right font-medium whitespace-nowrap", bal >= 0 ? "text-success" : "text-destructive")}>{balText(bal)}</td>
                     <td className="px-3 py-1.5"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Edit · PIN required" aria-label={`Edit voucher V-${e.voucherNo}`} onClick={() => setPending({ entry: e, action: "edit" })}><Pencil /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete · PIN required" aria-label={`Delete voucher V-${e.voucherNo}`} onClick={() => setPending({ entry: e, action: "delete" })}><Trash2 /></Button></div></td>
                   </tr>
                 );
               })}
               <tr className="border-t bg-surface/50 font-medium">
                 <td colSpan={6} className="px-3 py-2">Opening Balance</td>
                 <td className="num px-3 py-2 text-right whitespace-nowrap">{balText(opening)}</td>
                 <td />
               </tr>
             </tbody>
             <tfoot>
               <tr className="border-t-2 bg-surface font-semibold">
                 <td colSpan={4} className="px-3 py-2">Closing Balance{filter !== "all" && <span className="ml-2 text-xs font-normal text-muted-foreground">(Dr/Cr totals: filtered rows)</span>}</td>
                 <td className="num px-3 py-2 text-right whitespace-nowrap">{visDr.toLocaleString("en-IN")}</td>
                 <td className="num px-3 py-2 text-right whitespace-nowrap">{visCr.toLocaleString("en-IN")}</td>
                 <td className={cn("num px-3 py-2 text-right whitespace-nowrap", closing >= 0 ? "text-success" : "text-destructive")}>{balText(closing)}</td>
                 <td />
               </tr>
             </tfoot>
           </table>
         </div>
       </div>}
       <div className="print-only statement-print rounded-lg border bg-card print-area">
        <table className="w-full table-fixed text-[11px]">
          <colgroup>
            <col style={{ width: "10.5%" }} />
            <col style={{ width: "7.5%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "32%" }} />
            <col style={{ width: "10.5%" }} />
            <col style={{ width: "10.5%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead className="bg-surface text-left uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5">Date</th>
              <th className="px-2 py-1.5">Vch #</th>
              <th className="px-2 py-1.5">Type</th>
              <th className="px-2 py-1.5">Particulars &amp; Details</th>
              <th className="px-2 py-1.5 text-right">Debit</th>
              <th className="px-2 py-1.5 text-right">Credit</th>
              <th className="px-2 py-1.5 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t bg-surface/50 font-medium">
              <td colSpan={6} className="px-2 py-1.5">Opening Balance</td>
              <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{balText(opening)}</td>
            </tr>
            {rows.map(({ e, debit, credit, bal }) => {
              const pay = payParts(e, { bank: bankNameOf(d, e), amount: fmtPKR(e.amount), method: e.method ? METHODS[e.method] : "" });
              const trade = tradeText(d, e);
              return (
                <tr key={e.id} className="border-t align-top">
                  <td className="px-2 py-1.5 whitespace-nowrap">{fmtDate(e.date)}</td>
                  <td className="num px-2 py-1.5 whitespace-nowrap"><Link to="/voucher/$id" params={{ id: e.id }} className="hover:text-primary">V-{e.voucherNo}</Link></td>
                  <td className="px-2 py-1.5 break-words">{ENTRY_TYPES[e.type].label}</td>
                  <td className="px-2 py-1.5 break-words">{partText(e)}{trade && <div>{trade}</div>}{pay.length > 0 && <div><Parts parts={pay} /></div>}{e.remarks && <div>Remarks: {e.remarks}</div>}</td>
                  <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{debit ? debit.toLocaleString("en-IN") : ""}</td>
                  <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{credit ? credit.toLocaleString("en-IN") : ""}</td>
                  <td className="num px-2 py-1.5 text-right font-medium whitespace-nowrap tabular-nums">{balText(bal)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-surface font-semibold">
              <td colSpan={4} className="px-2 py-1.5">Closing Balance</td>
              <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{dr.toLocaleString("en-IN")}</td>
              <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{cr.toLocaleString("en-IN")}</td>
              <td className="num px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{balText(closing)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="print-only mt-16">
        <div className="flex justify-between text-xs">
          <span className="w-44 border-t pt-1 text-center">Prepared By</span>
          <span className="w-44 border-t pt-1 text-center">Authorized Signature</span>
        </div>
      </div>
       <PinActionDialog action={pending?.action ?? null} onClose={() => setPending(null)} onVerified={(action) => {
         if (!pending) return;
         if (action === "edit") setEditing(pending.entry);
         else if (confirm(`Delete voucher V-${pending.entry.voucherNo}? You can restore it from the Recycle Bin.`)) { deleteItems("entry", [pending.entry.id]); toast.success("Moved to Recycle Bin"); }
         setPending(null);
       }} />
       <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>Edit Voucher V-{editing?.voucherNo}</DialogTitle></DialogHeader>{editing && <EntryForm key={editing.id} initial={editing} onSaved={() => setEditing(null)} />}</DialogContent></Dialog>
       <Dialog open={adding} onOpenChange={setAdding}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>New Entry · {a.name} ({a.code})</DialogTitle></DialogHeader>{adding && <EntryForm defaultType={choices[0] ?? "inward"} typeChoices={choices} defaultAccountId={a.id} onSaved={() => setAdding(false)} />}</DialogContent></Dialog>
    </div>
  );
}
