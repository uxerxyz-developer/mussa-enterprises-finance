import { ArrowLeft } from "lucide-react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { liveAccounts, useData } from "@/lib/db";
import { parentOf, useTrail } from "@/lib/nav-trail";
import { cn } from "@/lib/utils";

/** Back button that follows the in-app trail (never past the Dashboard). Shared with the mobile menu. */
export function useGoBack() {
  const router = useRouter();
  const pathname = useLocation({ select: (l) => l.pathname });
  return () => router.history.replace(parentOf(pathname));
}

/** Small path line above the page: Back + "Dashboard / Sales / Ali Traders". */
export function PageTrailBar({ labels }: { labels: Record<string, string> }) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const trail = useTrail();
  const d = useData();
  const goBack = useGoBack();

  const labelFor = (p: string): string => {
    const nav = labels[p];
    if (nav) return nav;
    const [, kind, id] = p.split("/");
    if (kind === "ledger") return liveAccounts(d).find((a) => a.id === id)?.name ?? d.accounts.find((a) => a.id === id)?.name ?? "Ledger";
    if (kind === "voucher") { const e = d.entries.find((x) => x.id === id); return e ? `Voucher V-${e.voucherNo}` : "Voucher"; }
    if (kind === "bank") return d.banks.find((b) => b.id === id)?.name ?? "Bank";
    return "Page";
  };

  const paths = pathname === "/" ? [] : trail[trail.length - 1] === pathname ? trail : [...trail, pathname];
  const items = [{ to: "/", label: "Dashboard" }, ...paths.map((p) => ({ to: p, label: labelFor(p) }))];
  const hiddenMid = items.length > 3 ? items.length - 3 : 0;

  return (
    <nav aria-label="Page path" className="no-print -mt-1 mb-3 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
      {pathname !== "/" && (
        <Button variant="ghost" size="sm" className="-ml-2 h-8 shrink-0 px-2 text-xs" onClick={goBack}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
      )}
      <ol className="flex min-w-0 items-center gap-1">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          const hide = i > 0 && i <= hiddenMid;
          return (
            <li key={`${it.to}-${i}`} className={cn("flex min-w-0 items-center gap-1", hide && "max-sm:hidden")}>
              {i > 0 && <span aria-hidden className="text-border">/</span>}
              {i === 1 && hiddenMid > 0 && <span aria-hidden className="sm:hidden">…<span className="mx-1 text-border">/</span></span>}
              {last ? (
                <span aria-current="page" className="truncate font-medium text-foreground">{it.label}</span>
              ) : (
                <Link to={it.to} className="truncate hover:text-foreground hover:underline">{it.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
