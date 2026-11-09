import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { convertWorkerOutwardToAdvance, undo, useData, workerOutwardEntries } from "@/lib/db";
import { fmtDate, fmtPKR } from "@/lib/format";

/**
 * One-time clean-up: payments to workers that were recorded as "Issue Payment" belong under Advance.
 * Converting changes only the entry type; balances, cash and bank stay exactly the same. Asked once per session until done.
 */
export function WorkerPaymentFix() {
  const d = useData();
  const list = useMemo(() => workerOutwardEntries(d), [d]);
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem("worker_fix_hidden") === "1"; } catch { return false; } });
  if (!list.length || hidden) return null;
  const close = () => { try { sessionStorage.setItem("worker_fix_hidden", "1"); } catch { /* ignore */ } setHidden(true); };
  const name = (id?: string) => d.accounts.find((a) => a.id === id)?.name ?? "—";
  return (
    <Dialog open onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payments to workers recorded as Issue Payment</DialogTitle>
          <DialogDescription>
            {list.length} {list.length === 1 ? "entry was" : "entries were"} paid to a worker through Issue Payment, so the worker ledger shows them as receivable. Convert them to Advance? Balances, cash and bank do not change.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-y-auto rounded-md border text-sm">
          <table className="w-full">
            <thead className="bg-surface text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Worker</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-t"><td className="px-3 py-2">{fmtDate(e.date)}</td><td className="px-3 py-2">{name(e.accountId)}</td><td className="num px-3 py-2 text-right">{fmtPKR(e.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>Not now</Button>
          <Button onClick={() => { const n = convertWorkerOutwardToAdvance(); close(); toast.success(`${n} ${n === 1 ? "entry" : "entries"} converted to Advance`, { action: { label: "Undo", onClick: () => { undo(); } } }); }}>Convert to Advance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
