import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
export type NavGroup = { title: string; items: readonly NavItem[] };

const isActive = (to: string, pathname: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

/**
 * Collapsible category drawers. The category holding the current route opens on navigation;
 * the user can still expand/collapse any category manually. Collapsed links are `inert`
 * so they leave the tab order.
 */
export function NavAccordion({ groups, onNavigate, wrap }: { groups: readonly NavGroup[]; onNavigate?: () => void; wrap?: (link: ReactNode, key: string) => ReactNode }) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const activeTitle = groups.find((g) => g.items.some((n) => isActive(n.to, pathname)))?.title;
  // Every category starts collapsed. After the user navigates, the category of the new page opens.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const first = useRef(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ y: number; h: number } | null>(null);
  // The accent bar slides to the current page (only while that page's category is open).
  const measure = () => {
    const c = wrapRef.current;
    const a = c?.querySelector<HTMLElement>(".nav-item-active");
    if (!c || !a || a.closest<HTMLElement>(".nav-collapse")?.dataset["open"] !== "true") { setInd(null); return; }
    const cr = c.getBoundingClientRect(), ar = a.getBoundingClientRect();
    setInd({ y: ar.top - cr.top + ar.height * 0.22, h: ar.height * 0.56 });
  };
  useLayoutEffect(() => { measure(); }, [pathname, open]);
  useEffect(() => {
    const c = wrapRef.current;
    if (!c) return;
    c.addEventListener("transitionend", measure);
    window.addEventListener("resize", measure);
    return () => { c.removeEventListener("transitionend", measure); window.removeEventListener("resize", measure); };
  }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (activeTitle) setOpen((o) => (o[activeTitle] ? o : { [activeTitle]: true }));
  }, [activeTitle, pathname]);

  return (
    <div ref={wrapRef} className="relative space-y-0.5">
      <span aria-hidden className="nav-indicator" style={ind ? { transform: `translateY(${ind.y}px)`, height: ind.h, opacity: 1 } : { opacity: 0 }} />
      {groups.map((g, gi) => {
        const isOpen = !!open[g.title];
        const panelId = `nav-group-${gi}`;
        return (
          <div key={g.title} className="nav-group pb-0.5">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen((o) => (o[g.title] ? {} : { [g.title]: true }))}
              className="nav-group-head flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/80 hover:text-sidebar-foreground"
            >
              <span className="flex items-center gap-2">
                {g.title}
                {!isOpen && g.title === activeTitle && <span aria-label="Current section" className="h-1.5 w-1.5 rounded-full bg-sidebar-ring" />}
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>
            <div id={panelId} className="nav-collapse" data-open={isOpen} inert={!isOpen}>
              <div className="nav-collapse-inner">
                {g.items.map((n) => {
                  const link = (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={onNavigate}
                      activeOptions={{ exact: n.to === "/" }}
                      className="nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeProps={{ className: "nav-item-active bg-sidebar-accent font-medium text-sidebar-accent-foreground" }}
                    >
                      <n.icon className="h-[18px] w-[18px] shrink-0" /> {n.label}
                    </Link>
                  );
                  return wrap ? wrap(link, n.to) : link;
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
