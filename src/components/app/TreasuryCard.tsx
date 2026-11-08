import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, FileCheck2, Landmark, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { accountBalance, entryState, fundList, fundName, liveAccounts, liveEntries, updateEntry, useData, type ChequeStatus } from "@/lib/db";
import { fmtDate, fmtPKR, todayISO } from "@/lib/format";
import { haptic } from "@/lib/dashboard-layout";
import { cn } from "@/lib/utils";
import { activitySeries, shares } from "@/lib/treasury-series";
import { Bars, Ring, StatusDots, Trend } from "@/components/app/TreasuryViz";

type Panel = "cash" | "bank" | "receivable" | "payable" | "cheques";
const HIDE_KEY = "cashbook-treasury-hidden";

export function TreasuryCard({ editing, w }: { editing: boolean; w: number }) {
  const d = useData();
  const [hidden, setHidden] = useState(() => typeof window !== "undefined" && localStorage.getItem(HIDE_KEY) === "1");
  const [panel, setPanel] = useState<Panel>();
  const [tab, setTab] = useState<ChequeStatus>("pending");

  const s = useMemo(() => {
    const live = liveEntries(d);
    const today = todayISO();
    const funds = fundList(d);
    const all = funds.map((f) => ({
      id: f.id, name: f.name, bal: f.closing, pending: f.pending,
      inToday: f.rows.filter((r) => r.state === "cleared" && r.e.date === today && r.delta > 0).reduce((x, r) => x + r.delta, 0),
      outToday: f.rows.filter((r) => r.state === "cleared" && r.e.date === today && r.delta < 0).reduce((x, r) => x - r.delta, 0),
    }));
    const parties = liveAccounts(d).filter((a) => !a.equity).map((a) => ({ a, b: accountBalance(d, a.id) }));
    const receivables = parties.filter((p) => p.b > 0 && p.a.type !== "supplier" && p.a.type !== "worker").sort((x, y) => y.b - x.b);
    const payables = parties.filter((p) => p.b < 0 && p.a.type !== "buyer").map((p) => ({ ...p, b: -p.b })).sort((x, y) => y.b - x.b);
    const cheques = live.filter((e) => e.method === "cheque").sort((a, b) => b.date.localeCompare(a.date));
    const by = (st: ChequeStatus) => cheques.filter((e) => entryState(e) === st);
    return {
      cash: all[0]!, banks: all.slice(1),
      bankTotal: all.slice(1).reduce((x, f) => x + f.bal, 0),
      receivables, payables,
      recTotal: receivables.reduce((x, p) => x + p.b, 0), payTotal: payables.reduce((x, p) => x + p.b, 0),
      pending: by("pending"), cleared: by("cleared"), bounced: by("bounced"),
      // visuals only
      activity: activitySeries(funds.slice(1), today, 12),
      cashShare: shares([all[0]!.bal, all.slice(1).reduce((x, f) => x + f.bal, 0)]),
      recBars: receivables.slice(0, 6).map((p) => p.b),
      payParts: shares([...payables.slice(0, 3).map((p) => p.b), payables.slice(3).reduce((x, p) => x + p.b, 0)]),
    };
  }, [d]);

  const m = (v: number) => (hidden ? "Rs ••••••" : fmtPKR(v));
  const pendingAmt = s.pending.reduce((x, e) => x + e.amount, 0);
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation(); haptic(8);
    setHidden((h) => { localStorage.setItem(HIDE_KEY, h ? "0" : "1"); return !h; });
  };
  const open = (p: Panel) => (e: React.MouseEvent) => { e.stopPropagation(); if (editing) return; haptic(10); setPanel(p); };
  const accName = (id?: string) => d.accounts.find((a) => a.id === id)?.name ?? "—";

  const tiles: { id: Panel; label: string; value: number; icon: typeof Wallet; note?: string }[] = [
    { id: "bank", label: "Bank balance", value: s.bankTotal, icon: Landmark },
    { id: "receivable", label: "Receivables", value: s.recTotal, icon: ArrowDownLeft },
    { id: "payable", label: "Payables", value: s.payTotal, icon: ArrowUpRight },
    { id: "cheques", label: "Pending cheques", value: pendingAmt, icon: FileCheck2,
      note: `${s.pending.length} pending · ${s.cleared.length} cleared · ${s.bounced.length} bounced` },
  ];
  const payColors = ["var(--tre-pay)", "var(--tre-cash)", "var(--tre-bank)", "color-mix(in oklab, var(--treasury-foreground) 40%, transparent)"];
  const cashText = m(s.cash.bal);
  const cashPct = s.cashShare.length ? Math.round(s.cashShare[0]! * 100) : 0;
  void w;

  const Row = ({ l, sub, r, to }: { l: string; sub?: string; r: number; to?: { id: string } }) => (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <div className="min-w-0">
        {to ? <Link to="/ledger/$id" params={to} className="block truncate font-medium hover:underline" onClick={() => setPanel(undefined)}>{l}</Link> : <div className="truncate font-medium">{l}</div>}
        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
      </div>
      <span className="num shrink-0 font-semibold">{m(r)}</span>
    </div>
  );
  const Empty = ({ t }: { t: string }) => <p className="py-6 text-center text-sm text-muted-foreground">{t}</p>;
  const list = tab === "pending" ? s.pending : tab === "cleared" ? s.cleared : s.bounced;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-sm font-semibold text-treasury-foreground">Treasury Position</h2>
        <button aria-label={hidden ? "Show amounts" : "Hide amounts"} onClick={toggle} onPointerDown={(e) => e.stopPropagation()}
          className="rounded-full bg-treasury-foreground/10 p-2 text-treasury-foreground hover:bg-treasury-foreground/20">
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 grid-rows-[1.1fr_1fr_1fr] gap-2 overflow-hidden">
        <button type="button" onClick={open("cash")}
          className="tre-tile col-span-2 flex min-w-0 items-center justify-between gap-3 rounded-2xl px-4 py-2 text-left">
          <span className="flex min-w-0 flex-col justify-center">
            <span className="flex items-center gap-2 text-[13px] font-medium"><span className="tre-chip tre-chip-cash"><Wallet className="h-3.5 w-3.5" /></span> Cash in hand</span>
            <span className={cn("num mt-1 truncate font-semibold tracking-tight", cashText.length > 11 ? "text-xl" : "text-[22px]")}>{cashText}</span>
          </span>
          <Ring parts={s.cashShare} colors={["var(--tre-cash)", "var(--tre-bank)"]} masked={hidden} stroke={11} className="aspect-square h-[92%] max-h-28"
            label={hidden || !s.cashShare.length ? undefined : `Cash ${cashPct}% · Bank ${100 - cashPct}% of liquid funds`} />
        </button>
        {tiles.map((x) => (
          <button key={x.id} type="button" onClick={open(x.id)} className="tre-tile relative flex min-w-0 flex-col justify-center rounded-2xl px-3 py-2 text-left">
            <span className="flex items-start gap-2 pr-11 text-[12.5px] font-medium leading-tight"><span className={cn("tre-chip", `tre-chip-${x.id}`)}><x.icon className="h-3.5 w-3.5 shrink-0" /></span><span className="line-clamp-2 min-w-0 break-words pt-[3px]">{x.label}</span></span>
            {x.id === "bank" && <span className="absolute right-2 top-2"><Trend values={s.activity} masked={hidden} /></span>}
            {x.id === "receivable" && <span className="absolute right-2.5 top-2.5"><Bars values={s.recBars} masked={hidden} /></span>}
            {x.id === "cheques" && <span className="absolute right-2.5 top-3"><StatusDots pending={s.pending.length} cleared={s.cleared.length} bounced={s.bounced.length} /></span>}
            {x.id === "payable" && <Ring parts={s.payParts} colors={payColors} masked={hidden} stroke={12} className="absolute right-2.5 top-2 h-7 w-7" />}
            <span className="num mt-1.5 min-w-0 truncate text-[15px] font-semibold tracking-tight">{m(x.value)}</span>
            {x.note && <span className="mt-0.5 line-clamp-2 text-[10px] leading-tight opacity-75">{x.note}</span>}
          </button>
        ))}
      </div>

      <Dialog open={!!panel} onOpenChange={(o) => !o && setPanel(undefined)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
          {panel === "cash" && <>
            <DialogHeader><DialogTitle>Cash in hand</DialogTitle></DialogHeader>
            <div className="divide-y">
              <Row l="Current hard cash" r={s.cash.bal} />
              <Row l="Received today" r={s.cash.inToday} />
              <Row l="Paid today" r={s.cash.outToday} />
            </div>
            <Link to="/cashbook" onClick={() => setPanel(undefined)} className="text-sm font-semibold text-primary">Open Cash Book →</Link>
          </>}
          {panel === "bank" && <>
            <DialogHeader><DialogTitle>Bank balance · {m(s.bankTotal)}</DialogTitle></DialogHeader>
            {s.banks.length === 0 ? <Empty t="No bank accounts yet." /> : <div className="divide-y">
              {s.banks.map((b) => <Row key={b.id} l={b.name} sub={b.pending ? `Pending cheques ${m(b.pending)}` : "Cleared balance"} r={b.bal} />)}
            </div>}
            <Link to="/banks" onClick={() => setPanel(undefined)} className="text-sm font-semibold text-primary">Open Cash & Banks →</Link>
          </>}
          {(panel === "receivable" || panel === "payable") && (() => {
            const rows = panel === "receivable" ? s.receivables : s.payables;
            return <>
              <DialogHeader><DialogTitle>{panel === "receivable" ? "Receivables" : "Payables"} · {m(panel === "receivable" ? s.recTotal : s.payTotal)}</DialogTitle></DialogHeader>
              {rows.length === 0 ? <Empty t="No dues." /> : <div className="divide-y">
                {rows.map((p) => <Row key={p.a.id} l={p.a.name} sub={[p.a.code, p.a.phone].filter(Boolean).join(" · ")} r={p.b} to={{ id: p.a.id }} />)}
              </div>}
            </>;
          })()}
          {panel === "cheques" && <>
            <DialogHeader><DialogTitle>Cheques & clearing</DialogTitle></DialogHeader>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-xs font-semibold">
              {(["pending", "cleared", "bounced"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={cn("rounded-md px-2 py-1.5 capitalize", tab === t ? "bg-card shadow-sm" : "text-muted-foreground")}>
                  {t} ({s[t].length})
                </button>
              ))}
            </div>
            {list.length === 0 ? <Empty t={`No ${tab} cheques.`} /> : <div className="divide-y">
              {list.map((e) => (
                <div key={e.id} className="py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{accName(e.accountId)}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        Chq {e.chequeNo || "—"} · {e.bank || fundName(d, e.bankId ?? "")} · {fmtDate(e.date)} · {e.type === "inward" ? "Received" : "Issued"}
                      </div>
                    </div>
                    <span className="num shrink-0 font-semibold">{m(e.amount)}</span>
                  </div>
                  {tab === "pending" && <div className="mt-2 flex gap-2">
                    <button onClick={() => { haptic(10); updateEntry(e.id, { chequeStatus: "cleared" }); }} className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Mark cleared</button>
                    <button onClick={() => { haptic(10); updateEntry(e.id, { chequeStatus: "bounced" }); }} className="rounded-md border px-3 py-1 text-xs font-semibold text-destructive">Mark bounced</button>
                  </div>}
                </div>
              ))}
            </div>}
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
