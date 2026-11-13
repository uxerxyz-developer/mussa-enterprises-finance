import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/inputs";
import { toast } from "@/lib/toast";
import { draftEntries, postDraft, useData, ENTRY_TYPES } from "@/lib/db";
import { fmtDate, fmtPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/drafts")({
  head: () => ({
    meta: [
      { title: "Drafts — Mussa Enterprises Cash Book" },
      { name: "description", content: "Vouchers saved as drafts, pending posting to the ledgers." },
      { property: "og:title", content: "Drafts — Mussa Enterprises Cash Book" },
      { property: "og:description", content: "Vouchers saved as drafts, pending posting to the ledgers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Drafts,
});

const BAR: Record<string, string> = { sale: "border-l-sale", purchase: "border-l-purchase", inward: "border-l-success", outward: "border-l-destructive" };

function Drafts() {
  const d = useData();
  const drafts = useMemo(() => draftEntries(d).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [d]);
  const total = drafts.reduce((s, e) => s + e.amount, 0);
  return (
    <div>
      <PageHeader title="Drafts" subtitle={`${drafts.length} pending · ${fmtPKR(total)}`} />
      <div className="space-y-2">
        {drafts.length === 0 && <p className="py-10 text-center text-muted-foreground">No drafts right now.</p>}
        {drafts.map((e) => {
          const party = d.accounts.find((a) => a.id === e.accountId)?.name;
          return (
            <Link key={e.id} to="/voucher/$id" params={{ id: e.id }} className={cn("flex items-center justify-between gap-3 rounded-lg border border-l-[5px] border-dashed bg-card p-3 shadow-sm", BAR[e.type] ?? "border-l-primary")}>
              <div className="min-w-0">
                <div className="truncate font-semibold">{party ?? ENTRY_TYPES[e.type].label}</div>
                <div className="select-text truncate text-xs text-muted-foreground">V-{e.voucherNo} · {e.type === "inward" ? "Received" : e.type === "outward" ? "Issued" : ENTRY_TYPES[e.type].label} · {fmtDate(e.date)}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="num text-sm font-semibold">{fmtPKR(e.amount)}</span>
                <Button size="sm" onClick={(ev) => {
                  ev.preventDefault(); ev.stopPropagation();
                  const r = postDraft(e.id);
                  if (r.ok) toast.success(`V-${e.voucherNo} posted to ledgers`); else toast.error(r.error);
                }}>Post to Ledgers</Button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
