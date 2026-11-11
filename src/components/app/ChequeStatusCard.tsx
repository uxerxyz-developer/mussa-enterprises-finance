import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playSound } from "@/lib/sounds";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fundName, isNetPaid, liveEntries, updateEntry, useData, type ChequeStatus, type Entry } from "@/lib/db";
/** Money coming in: a received payment or a net sale. Everything else tracked here (issued payment, net purchase) is going out. */
const isIncoming = (e: Entry) => e.type === "inward" || e.type === "sale";
import { fmtDate, fmtPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Pending cheques start alerting once they stay unmarked longer than this. */
export const CHEQUE_GRACE_MS = 30 * 60 * 1000;

export const isChequeOverdue = (e: Pick<Entry, "createdAt">, now: number) => now - new Date(e.createdAt).getTime() >= CHEQUE_GRACE_MS;

function ago(iso: string, now: number) {
  const m = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ${m % 60} min`;
  return `${Math.floor(h / 24)} day${h >= 48 ? "s" : ""}`;
}

function Pulse({ tone }: { tone: "received" | "paid" }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", tone === "received" ? "bg-received" : "bg-paid")} />
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", tone === "received" ? "bg-received" : "bg-paid")} />
    </span>
  );
}

export function ChequeStatusCard({ hidden }: { hidden: boolean }) {
  const d = useData();
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ e: Entry; s: ChequeStatus } | null>(null);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  const pending = useMemo(
    () => liveEntries(d).filter((e) => e.method === "cheque" && (e.chequeStatus ?? "pending") === "pending" && (e.type === "inward" || e.type === "outward" || isNetPaid(e)))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [d],
  );
  const name = (id?: string) => d.accounts.find((a) => a.id === id)?.name;
  const money = (v: number) => (hidden ? "Rs ••••••" : fmtPKR(v));
  const rec = pending.filter(isIncoming);
  const iss = pending.filter((e) => !isIncoming(e));
  const overdue = pending.filter((e) => isChequeOverdue(e, now));
  const recLate = overdue.some(isIncoming);
  const issLate = overdue.some((e) => !isIncoming(e));
  // A soft ping when a cheque newly becomes due while the app is open.
  const lastLate = useRef(overdue.length);
  useEffect(() => { if (overdue.length > lastLate.current) playSound("remind"); lastLate.current = overdue.length; }, [overdue.length]);
  const sum = (l: Entry[]) => l.reduce((s, e) => s + fundAmount(e), 0);
  const ordered = [...overdue, ...pending.filter((e) => !isChequeOverdue(e, now))];

  const apply = () => {
    if (!confirm) return;
    updateEntry(confirm.e.id, { chequeStatus: confirm.s });
    setConfirm(null);
  };

  return (
    <>
      <button type="button" onClick={(ev) => { ev.stopPropagation(); setOpen(true); }} className="flex h-full w-full flex-col text-left">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-semibold text-muted-foreground">Cheque Status</span>
          {recLate && <Pulse tone="received" />}
          {issLate && <Pulse tone="paid" />}
        </div>
        {pending.length === 0 ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-received" /> All cheques are up to date</div>
        ) : (
          <>
            <div className="mt-1 text-sm font-semibold">
              {overdue.length ? `${overdue.length} cheque${overdue.length > 1 ? "s" : ""} need an update` : `${pending.length} pending`}
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-received"><ArrowDownLeft className="h-3.5 w-3.5" />Received {rec.length}</span><span className="num">{money(sum(rec))}</span></div>
              <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-paid"><ArrowUpRight className="h-3.5 w-3.5" />Issued {iss.length}</span><span className="num">{money(sum(iss))}</span></div>
            </div>
            <div className="mt-auto pt-1 text-[10px] text-muted-foreground">Oldest pending: {ago(pending[0]!.createdAt, now)}</div>
          </>
        )}
      </button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setConfirm(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{confirm ? (confirm.s === "cleared" ? "Mark cheque as Cleared?" : "Mark cheque as Bounced?") : "Cheque Status"}</DialogTitle>
            <DialogDescription>
              {confirm ? (confirm.s === "cleared" ? "The amount will count in the bank balance." : "The party balance will be restored; no money moves.") : "Pending cheques — mark them Cleared or Bounced."}
            </DialogDescription>
          </DialogHeader>
          {confirm ? (
            <div className="space-y-4">
              <dl className="divide-y rounded-lg border bg-surface text-sm">
                {([["Type", isIncoming(confirm.e) ? "Received cheque" : "Issued cheque"], ["Party", name(confirm.e.accountId) ?? "—"], ["Cheque #", confirm.e.chequeNo || "—"], ["Bank", confirm.e.bankId ? fundName(d, confirm.e.bankId) : "—"], ["Amount", fmtPKR(confirm.e.amount)]] as const).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
                ))}
              </dl>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirm(null)}>Back</Button>
                <Button variant={confirm.s === "cleared" ? "success" : "destructive"} onClick={apply}>{confirm.s === "cleared" ? "Confirm Cleared" : "Confirm Bounced"}</Button>
              </div>
            </div>
          ) : ordered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">All cheques are up to date.</p>
          ) : (
            <div className="space-y-2">
              {ordered.map((e) => {
                const r = isIncoming(e);
                const late = isChequeOverdue(e, now);
                return (
                  <div key={e.id} className={cn("rounded-lg border border-l-4 bg-card p-3", r ? "border-l-received" : "border-l-paid")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {r ? <ArrowDownLeft className="h-4 w-4 shrink-0 text-received" /> : <ArrowUpRight className="h-4 w-4 shrink-0 text-paid" />}
                          <span className="truncate">{name(e.accountId) ?? e.particulars}</span>
                          {late && <Pulse tone={r ? "received" : "paid"} />}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{r ? "Received" : "Issued"} · #{e.chequeNo || "—"} · {fmtDate(e.date)} · Pending {ago(e.createdAt, now)}</div>
                      </div>
                      <div className="num shrink-0 text-sm font-semibold">{fmtPKR(e.amount)}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                      <Button asChild size="sm" variant="ghost" className="mr-auto h-8 px-2 text-xs"><Link to="/voucher/$id" params={{ id: e.id }}><FileText className="h-3.5 w-3.5" /> Voucher</Link></Button>
                      <Button size="sm" variant="outline" className="h-8 border-paid/40 text-paid" onClick={() => setConfirm({ e, s: "bounced" })}>Bounce</Button>
                      <Button size="sm" variant="success" className="h-8" onClick={() => setConfirm({ e, s: "cleared" })}>Clear</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
