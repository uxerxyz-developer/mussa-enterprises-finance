import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/app/inputs";
import { chequeVault, useData } from "@/lib/db";
import { fmtDate, fmtPKR } from "@/lib/format";

export const Route = createFileRoute("/cheques-in-hand")({
  head: () => ({
    meta: [
      { title: "Cheques in Hand — Mussa Enterprises Cash Book" },
      { name: "description", content: "Third-party cheques currently held, available to forward against a payment." },
      { property: "og:title", content: "Cheques in Hand — Mussa Enterprises Cash Book" },
      { property: "og:description", content: "Third-party cheques currently held, available to forward against a payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChequesInHand,
});

function ChequesInHand() {
  const d = useData();
  const vault = useMemo(() => chequeVault(d).filter((c) => c.status !== "forwarded"), [d]);
  const inHandTotal = vault.filter((c) => c.status === "in_hand").reduce((s, c) => s + c.amount, 0);
  return (
    <div>
      <PageHeader title="Cheques in Hand" subtitle={`${vault.filter((c) => c.status === "in_hand").length} available · ${fmtPKR(inHandTotal)}`} />
      <div className="mb-3 rounded-lg border bg-card p-3 text-sm">
        Total in hand: <b className="num">{fmtPKR(inHandTotal)}</b> <span className="text-xs text-muted-foreground">· posted to the party's account only, not part of your own bank or cash balance</span>
      </div>
      <div className="space-y-2">
        {vault.length === 0 && <p className="py-10 text-center text-muted-foreground">No cheques in hand right now.</p>}
        {vault.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
            <div className="min-w-0">
              <div className="truncate font-semibold">{c.bank}{c.chequeNo ? ` #${c.chequeNo}` : ""}</div>
              <div className="truncate text-xs text-muted-foreground">{fmtDate(c.date)} · from {d.accounts.find((a) => a.id === c.fromAccountId)?.name ?? "—"}{c.drawer ? ` · ${c.drawer}` : ""}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="num text-sm font-semibold">{fmtPKR(c.amount)}</div>
              {c.status === "held" && <span className="text-[10px] font-medium uppercase text-warning">Reserved (Draft)</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
