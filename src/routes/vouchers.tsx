import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { usePageSearch } from "@/lib/page-search";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/inputs";
import { toast } from "@/lib/toast";
import { chequeVault, draftEntries, liveEntries, postDraft, useData, ENTRY_TYPES, type EntryType } from "@/lib/db";
import { fmtDate, fmtPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vouchers")({
  head: () => ({
    meta: [
      { title: "Vouchers — Mussa Enterprises Cash Book" },
      { name: "description", content: "All sale, purchase, receipt and payment vouchers in one list." },
      { property: "og:title", content: "Vouchers — Mussa Enterprises Cash Book" },
      { property: "og:description", content: "All sale, purchase, receipt and payment vouchers in one list." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Vouchers,
});

const FILTERS: { key: "all" | EntryType; label: string }[] = [
  { key: "all", label: "All" }, { key: "sale", label: "Sales" }, { key: "purchase", label: "Purchases" },
  { key: "inward", label: "Received" }, { key: "outward", label: "Issued" },
];
const TYPES: EntryType[] = ["sale", "purchase", "inward", "outward"];
const PILL_TONES: Record<string, { on: string; off: string }> = {
  all: { on: "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground", off: "" },
  sale: { on: "border-sale bg-sale text-sale-foreground hover:bg-sale/90 hover:text-sale-foreground", off: "" },
  purchase: { on: "border-purchase bg-purchase text-purchase-foreground hover:bg-purchase/90 hover:text-purchase-foreground", off: "" },
  inward: { on: "border-success bg-success text-success-foreground hover:bg-success/90 hover:text-success-foreground", off: "" },
  outward: { on: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground", off: "" },
};
const BAR: Record<string, string> = { sale: "border-l-sale", purchase: "border-l-purchase", inward: "border-l-success", outward: "border-l-destructive" };

function Vouchers() {
  const d = useData();
  const [f, setF] = useState<"all" | "drafts" | "vault" | EntryType>("all");
  const q = usePageSearch();
  const drafts = useMemo(() => draftEntries(d).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [d]);
  const vault = useMemo(() => chequeVault(d).filter((c) => c.status !== "forwarded"), [d]);
  const list = useMemo(() => liveEntries(d).filter((e) => TYPES.includes(e.type)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [d]);
  const shown = (f === "drafts" ? drafts : list).filter((e) => (f === "all" || f === "drafts" || e.type === f) && (!q || `V-${e.voucherNo} ${e.particulars} ${d.accounts.find((a) => a.id === e.accountId)?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <PageHeader title="Vouchers" subtitle={`${list.length} vouchers`} />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((x) => {
          const tone = PILL_TONES[x.key] ?? { on: "", off: "" };
          const on = f === x.key;
          return <Button key={x.key} size="sm" variant="outline" className={cn("shrink-0 rounded-full border-2 font-semibold", on ? tone.on : tone.off)} onClick={() => setF(x.key)}>{x.label}</Button>;
        })}
        <Button size="sm" variant="outline" className={cn("shrink-0 rounded-full border-2 font-semibold border-dashed", f === "drafts" && "border-warning bg-warning text-warning-foreground hover:bg-warning/90")} onClick={() => setF("drafts")}>Drafts{drafts.length ? ` (${drafts.length})` : ""}</Button>
        <Button size="sm" variant="outline" className={cn("shrink-0 rounded-full border-2 font-semibold", f === "vault" && "border-primary bg-primary text-primary-foreground hover:bg-primary/90")} onClick={() => setF("vault")}>Cheques in Hand ({vault.filter((c) => c.status === "in_hand").length})</Button>
      </div>
      {f === "vault" && (
        <div className="space-y-2">
          <div className="rounded-lg border bg-card p-3 text-sm">Total in hand: <b className="num">{fmtPKR(vault.filter((c) => c.status === "in_hand").reduce((s, c) => s + c.amount, 0))}</b> <span className="text-xs text-muted-foreground">· not part of own bank balance</span></div>
          {vault.length === 0 && <p className="py-10 text-center text-muted-foreground">No third-party cheques in hand</p>}
          {vault.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
              <div className="min-w-0">
                <div className="truncate font-semibold">{c.bank}{c.chequeNo ? ` #${c.chequeNo}` : ""}</div>
                <div className="truncate text-xs text-muted-foreground">{fmtDate(c.date)} · from {d.accounts.find((a) => a.id === c.fromAccountId)?.name ?? "—"}{c.drawer ? ` · ${c.drawer}` : ""}</div>
              </div>
              <div className="shrink-0 text-right"><div className="num text-sm font-semibold">{fmtPKR(c.amount)}</div>{c.status === "held" && <span className="text-[10px] font-medium uppercase text-warning">Held in draft</span>}</div>
            </div>
          ))}
        </div>
      )}
      {f !== "vault" && <div className="space-y-2">
        {shown.length === 0 && <p className="py-10 text-center text-muted-foreground">No vouchers</p>}
        {shown.map((e) => {
          const flow = ENTRY_TYPES[e.type].flow;
          const party = d.accounts.find((a) => a.id === e.accountId)?.name;
          return (
            <Link key={e.id} to="/voucher/$id" params={{ id: e.id }} className={cn("flex items-center justify-between gap-3 rounded-lg border border-l-[5px] bg-card p-3 shadow-sm", BAR[e.type] ?? "border-l-primary")}>
              <div className="min-w-0">
                <div className="truncate font-semibold">{party ?? ENTRY_TYPES[e.type].label}</div>
                <div className="select-text truncate text-xs text-muted-foreground">V-{e.voucherNo} · {e.type === "inward" ? "Received" : e.type === "outward" ? "Issued" : ENTRY_TYPES[e.type].label} · {fmtDate(e.date)}</div>
              </div>
              {e.chequeStatus === "bounced"
                ? <div className="shrink-0 text-right"><div className="num text-sm font-semibold text-destructive line-through">{fmtPKR(e.amount)}</div><span className="inline-flex rounded bg-danger-soft px-1.5 py-0.5 text-[10px] font-medium uppercase text-destructive">Bounced</span></div>
                : e.draft
                ? <div className="flex shrink-0 items-center gap-2"><span className="num text-sm font-semibold">{fmtPKR(e.amount)}</span><Button size="sm" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); const r = postDraft(e.id); if (r.ok) toast.success(`V-${e.voucherNo} posted`); else toast.error(r.error); }}>Post Now</Button></div>
                : <div className={cn("num shrink-0 text-sm font-semibold", flow === "in" && "text-success", flow === "out" && "text-destructive", e.type === "sale" && "text-sale", e.type === "purchase" && "text-purchase")}>{fmtPKR(e.amount)}</div>}
            </Link>
          );
        })}
      </div>}
    </div>
  );
}
