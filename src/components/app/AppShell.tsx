import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GeminiLiveWorkspaceBar } from "./voice/GeminiLiveWorkspaceBar";
import { useGeminiLive, type PendingDraft } from "@/hooks/useGeminiLive";
import { accountBalanceTool, draftRows, entryPayload, findAccountTool, formSpecTool, lastTransactionTool, listTool, overviewTool, bankChoices, money, reportTool, searchEntriesTool, validateAccountDraft, validateEntryDraft, withSpoken, type AccountDraft, type EntryDraft } from "@/lib/voice-tools";
import { Link, Outlet, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/lib/toast";
import { PAGE_SEARCH, setPageSearch, usePageSearch } from "@/lib/page-search";
import {
  LayoutDashboard, ListOrdered, Users, BookOpen, Receipt, Wallet, ShieldCheck, Settings, LogOut, Search, Menu, Lock, Moon, Sun, ShoppingCart, BadgeDollarSign, HandCoins, RefreshCw, CloudUpload, Flame, Zap, Boxes, FileText, Pencil, Check, Mic, Palette, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AccountSearch } from "./inputs";
import { AuthScreen } from "./AuthScreen";
import { accountBalance, addAccount, addBank, addEntry, initials, type EntryType, changePassword, checkPw, ENTRY_TYPES, findDuplicate, getData, liveAccounts, liveBanks, loadData, searchAccounts, matchesRecovery, redo, rememberPinLength, setupAuth, takeSnapshot, undo, useData, useLoaded } from "@/lib/db";
import { norm, todayISO } from "@/lib/format";
import { Logo } from "@/components/app/Logo";
import { mussaMark, whiteLogo } from "@/lib/logo-images";
import loginBg from "@/assets/login-industrial.webp.asset.json";
import nexumLogo from "@/assets/nexum-systems.webp.asset.json";
import micLightIdle from "@/assets/mic-icon-v8-light-idle.png.asset.json";
import micDarkIdle from "@/assets/mic-icon-v8-dark-idle.png.asset.json";
import { backupToCloud, scheduleAutoBackup } from "@/lib/cloud";
import { checkForUpdate } from "@/lib/update";
import { supabase } from "@/integrations/supabase/client";
import { NavAccordion } from "./SidebarNav";
import { VoiceSetupCard, VoiceSettingsSheet } from "./voice/VoiceSettings";
import { AppearancePanel } from "./AppearancePanel";
import { WorkerPaymentFix } from "./WorkerPaymentFix";
import { applyAppearance } from "@/lib/appearance";
import { fieldError } from "@/lib/field-error";
import { playSound } from "@/lib/sounds";
import { switchThemeAnimated } from "@/lib/theme-transition";
import { flushSync } from "react-dom";
import { flashEntry } from "@/lib/row-flash";
import { PageTrailBar } from "./PageTrailBar";
import { syncTrail } from "@/lib/nav-trail";
import { getVoiceSettings, useVoiceSettings, voiceGreeting, voiceInstruction } from "@/lib/voice-settings";
import { dashboard, haptic, useDashboard } from "@/lib/dashboard-layout";

const NAV_GROUPS = [
  { title: "Overview", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/entries", label: "All Entries", icon: ListOrdered },
    { to: "/vouchers", label: "Vouchers", icon: FileText },
  ] },
  { title: "Operations & Plant", items: [
    { to: "/production", label: "Heat Production", icon: Flame },
    { to: "/stock", label: "Stock & Inventory", icon: Boxes },
    { to: "/electricity", label: "Electricity", icon: Zap },
  ] },
  { title: "Trading & Accounts", items: [
    { to: "/sales", label: "Sales", icon: BadgeDollarSign },
    { to: "/purchases", label: "Purchases", icon: ShoppingCart },
    { to: "/accounts", label: "Accounts & Parties", icon: Users },
    { to: "/expenses", label: "Expenses", icon: Receipt },
  ] },
  { title: "Treasury & Payroll", items: [
    { to: "/cashbook", label: "Cash Book", icon: Wallet },
    { to: "/banks", label: "Cash & Banks", icon: Wallet },
    { to: "/workers", label: "Workers & Wages", icon: Users },
    { to: "/loans", label: "Personal Loans", icon: HandCoins },
  ] },
  { title: "Reports & Financials", items: [
    { to: "/reports", label: "Financial Reports", icon: BookOpen },
    { to: "/opening", label: "Opening Balances", icon: BookOpen },
  ] },
  { title: "System & Administration", items: [
    { to: "/admin", label: "Admin Panel", icon: ShieldCheck },
    { to: "/settings", label: "Settings & Backup", icon: Settings },
  ] },
] as const;
const NAV = NAV_GROUPS.flatMap((g) => [...g.items]);

const SESSION = "cashbook-session";
const LOGGED_OUT = "cashbook-logged-out";

function isTextField(el: Element | null) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable;
}

function useShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      const active = document.activeElement;
      if (k === "s") {
        e.preventDefault();
        const form = (active?.closest("form") as HTMLFormElement | null) ?? (document.querySelector("form[data-entry-form]") as HTMLFormElement | null);
        form?.requestSubmit();
      } else if ((k === "z" && !e.shiftKey) && !isTextField(active)) {
        e.preventDefault();
        toast(undo() ? "Undone" : "Nothing to undo");
      } else if ((k === "y" || (k === "z" && e.shiftKey)) && !isTextField(active)) {
        e.preventDefault();
        toast(redo() ? "Redone" : "Nothing to redo");
      } else if (k === "f") {
        e.preventDefault();
        (document.getElementById("global-search") as HTMLInputElement | null)?.focus();
      } else if (k === "p") {
        e.preventDefault();
        window.print();
      } else if (k === "n") {
        e.preventDefault();
        navigate({ to: "/" }).then(() => setTimeout(() => document.getElementById("entry-account")?.focus() ?? document.getElementById("entry-amount")?.focus(), 50));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [navigate]);
}

function SplashScreen() {
  return (
    <div className="splash" role="status" aria-label="Loading Mussa Enterprises">
      {Array.from({ length: 7 }, (_, i) => <div key={i} aria-hidden="true" className={`splash-orb splash-orb-${i + 1}`} />)}
      <div className="splash-content">
        <img src={mussaMark} alt="" className="splash-mark" />
        <div className="splash-title">Mussa Enterprises</div>
        <div aria-hidden="true" className="splash-bar"><span /></div>
      </div>
    </div>
  );
}


export function AppShell() {
  const loaded = useLoaded();
  const d = useData();
  const [authed, setAuthed] = useState(false);
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    loadData();
    setAuthed(sessionStorage.getItem(SESSION) === "1");
    setDark(localStorage.getItem("cashbook-theme") === "dark");
  }, []);
  useEffect(() => {
    if (dark === null) return;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("cashbook-theme", dark ? "dark" : "light");
    applyAppearance(dark ? "dark" : "light");
  }, [dark]);
  const [minDone, setMinDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 1300);
    return () => clearTimeout(t);
  }, []);

  if (!loaded || !minDone) return <SplashScreen />;
  if (!d.auth || !authed) return <AuthScreen firstRun={!d.auth} requireUsername={localStorage.getItem(LOGGED_OUT) === "1"} onDone={() => { sessionStorage.setItem(SESSION, "1"); localStorage.removeItem(LOGGED_OUT); setAuthed(true); }} />;
  const toggleTheme = () => {
    const next = !(dark ?? false);
    switchThemeAnimated(next, () => {
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("cashbook-theme", next ? "dark" : "light");
      applyAppearance(next ? "dark" : "light");
      flushSync(() => setDark(next));
    });
  };
  return <Shell dark={dark ?? false} onToggleTheme={toggleTheme} onLogout={(full?: boolean) => { sessionStorage.removeItem(SESSION); if (full) localStorage.setItem(LOGGED_OUT, "1"); setAuthed(false); }} />;
}

function Shell({ onLogout, dark, onToggleTheme }: { onLogout: (full?: boolean) => void; dark: boolean; onToggleTheme: () => void }) {
  useShortcuts();
  const data = useData();
  useEffect(() => { scheduleAutoBackup(); }, [data]);
  useEffect(() => {
    takeSnapshot();
    const t = setInterval(takeSnapshot, 30 * 60 * 1000);
    const h = () => takeSnapshot();
    window.addEventListener("beforeunload", h);
    return () => { clearInterval(t); window.removeEventListener("beforeunload", h); };
  }, []);
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useLocation({ select: (l) => l.pathname });
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const trailLabels: Record<string, string> = Object.fromEntries(NAV.map((n) => [n.to, n.label]));
  useEffect(() => { syncTrail(pathname); }, [pathname]);
  // A freshly opened app (new browser session) always starts on the Dashboard, not on the page last visited.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("app_started") === "1") return;
      sessionStorage.setItem("app_started", "1");
    } catch { /* storage unavailable: keep the current page */ return; }
    if (window.location.pathname !== "/") router.history.replace("/");
  }, [router]);
  // Hide the floating bottom bar only while the on-screen keyboard is really open (a text field has focus AND the visible
  // area has shrunk), and re-check on every page change, so a focused field alone (for example the Admin PIN) never leaves it hidden.
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    const update = () => {
      const t = document.activeElement as HTMLElement | null;
      const field = !!t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
      const shrunk = vv ? vv.height < window.innerHeight - 120 : true;
      if (field && shrunk) root.dataset["kbd"] = "1"; else delete root.dataset["kbd"];
    };
    const later = () => { window.setTimeout(update, 60); };
    document.addEventListener("focusin", later); document.addEventListener("focusout", later);
    vv?.addEventListener("resize", update);
    update();
    return () => { document.removeEventListener("focusin", later); document.removeEventListener("focusout", later); vv?.removeEventListener("resize", update); delete root.dataset["kbd"]; };
  }, [pathname]);

  // The Dashboard is the end of the line: on it, Back asks once ("press again to exit") and a second Back within 2 seconds leaves the app.
  // A marker entry sits above the Dashboard in the history so the first Back stays inside the app.
  useEffect(() => {
    if (pathname !== "/") return;
    const marked = () => ((window.history.state ?? {}) as Record<string, unknown>)["__guard"] === true;
    const mark = () => {
      const s = (window.history.state ?? {}) as Record<string, unknown>;
      const idx = typeof s["__TSR_index"] === "number" ? s["__TSR_index"] + 1 : undefined;
      window.history.pushState({ ...s, ...(idx !== undefined ? { __TSR_index: idx } : {}), __guard: true }, "", window.location.href);
    };
    if (!marked()) mark();
    let armedUntil = 0;
    const onPop = () => {
      if (window.location.pathname !== "/" || marked()) return;
      if (Date.now() < armedUntil) { window.removeEventListener("popstate", onPop); window.history.back(); return; }
      armedUntil = Date.now() + 2000;
      toast("Press back again to exit");
      mark();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [pathname]);
  const { editing } = useDashboard();
  const onDashboard = pathname === "/";
  const canEditLayout = onDashboard || editing;
  useEffect(() => { setPageSearch(""); }, [pathname]);
  const pageHint = PAGE_SEARCH[pathname];
  const pageQ = usePageSearch();
  const searchBox = (
    <div className="flex w-full items-center gap-2 rounded-full border bg-background px-4 py-1">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      {pageHint ? (
        <>
          <Input id="global-search" value={pageQ} onChange={(e) => setPageSearch(e.target.value)} placeholder={pageHint} aria-label={pageHint} className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0" />
          {pageQ && <button type="button" aria-label="Clear search" onClick={() => setPageSearch("")} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </>
      ) : (
      <AccountSearch
        id="global-search"
        clearOnSelect
        className="w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:shadow-none [&_input]:focus-visible:ring-0"
        placeholder="Search accounts…  (Ctrl+F)"
        onSelect={(a) => navigate({ to: "/ledger/$id", params: { id: a.id } })}
      />
      )}
    </div>
  );
  const utilityBtn = "nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-40";
  const appearanceButton = (after?: () => void) => (
    <button type="button" onClick={() => { setAppearanceOpen(true); after?.(); }} className={utilityBtn}><Palette className="h-4 w-4 shrink-0" /> Appearance</button>
  );
  const voiceButton = (after?: () => void) => (
    <button type="button" onClick={() => { setVoiceOpen(true); after?.(); }} className={utilityBtn}><Mic className="h-4 w-4 shrink-0" /> Voice Settings</button>
  );
  const editButton = (after?: () => void) => (
    <button
      type="button"
      disabled={!canEditLayout}
      aria-pressed={editing}
      title={canEditLayout ? (editing ? "Done — lock layout" : "Edit dashboard layout (move & resize cards)") : "Available on the Dashboard"}
      onClick={() => { dashboard.setEditing(!editing); after?.(); }}
      className={cn(utilityBtn, editing && "nav-item-active bg-sidebar-accent font-medium text-sidebar-accent-foreground")}
    >
      {editing ? <Check className="h-4 w-4 shrink-0" /> : <Pencil className="h-4 w-4 shrink-0" />} {editing ? "Done editing" : "Edit Layout"}
    </button>
  );
  return (
    <div className="min-h-screen bg-background md:flex md:bg-sidebar">
      <VoiceSettingsSheet open={voiceOpen} onOpenChange={setVoiceOpen} />
      <WorkerPaymentFix />
      {appearanceOpen && <AppearancePanel onClose={() => setAppearanceOpen(false)} theme={dark ? "dark" : "light"} />}
      {/* Desktop sidebar (reference layout) */}
      <aside className="side-surface no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border"><UserBlock dark={dark} onToggleTheme={onToggleTheme} onLogout={onLogout} /></div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3"><NavAccordion groups={NAV_GROUPS} /></nav>
        <div className="space-y-2 border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/70">
          <div className="space-y-0.5 text-sidebar-foreground">{appearanceButton()}{voiceButton()}{editButton()}</div>
          <StatusChip />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        {/* Sheet corners: the page content looks like a rounded panel laid over the sidebar (desktop). */}
        <span aria-hidden className="sheet-corner sheet-corner-top no-print" />
        <span aria-hidden className="sheet-corner sheet-corner-bottom no-print" />
        <div className="no-print sticky top-0 z-30 border-b bg-card">
          <header className="flex items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <button aria-label="Menu" className="shrink-0 p-1.5 text-foreground md:hidden"><Menu className="h-5 w-5" /></button>
                </SheetTrigger>
                <SheetContent side="left" className="side-surface w-72 bg-sidebar p-0 text-sidebar-foreground">
                  <SheetHeader className="border-b border-sidebar-border p-0 text-left"><SheetTitle className="sr-only">Menu</SheetTitle><UserBlock dark={dark} onToggleTheme={onToggleTheme} onLogout={onLogout} /></SheetHeader>
                  <div className="space-y-1 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 5rem)" }}>
                    <NavAccordion groups={NAV_GROUPS} wrap={(link, key) => <SheetClose asChild key={key}>{link}</SheetClose>} />
                    <div className="my-2 border-t border-sidebar-border" />
                    <SheetClose asChild>{appearanceButton()}</SheetClose>
                    <SheetClose asChild>{voiceButton()}</SheetClose>
                    <SheetClose asChild>{editButton()}</SheetClose>
                    <SheetClose asChild>
                      <button onClick={() => checkForUpdate(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"><RefreshCw className="h-4 w-4" /> Check for updates</button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
              <Link to="/" className="min-w-0 md:hidden"><Logo className="h-auto w-32" /></Link>
              <Link to="/" className="hidden min-w-0 md:block"><Logo className="h-auto w-36" /></Link>
            </div>
            <div className="hidden w-full max-w-sm md:block">{searchBox}</div>
            <div className="flex items-center gap-1">
              <MicButton />
              <SyncButton />
              <button onClick={() => onLogout()} aria-label="Lock app" title="Lock app" className="p-2 text-muted-foreground hover:text-foreground md:hidden"><Lock className="h-5 w-5" /></button>
              <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="Toggle theme" title="Toggle theme" className="text-muted-foreground hover:text-foreground md:hidden">{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
            </div>
          </header>
          <div className="px-4 pb-2 md:hidden">{searchBox}</div>
        </div>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-28 sm:p-6 md:pb-6">
          <PageTrailBar labels={trailLabels} />
          <div key={pathname} className="page-enter"><Outlet /></div>
        </main>
      </div>

      {/* Mobile bottom navigation: floating glass pill with a sliding "lens" under the active tab */}
      {(() => {
        const tabs = [
          { to: "/sales", label: "Sales", icon: BadgeDollarSign },
          { to: "/purchases", label: "Purchases", icon: ShoppingCart },
          { to: "/", label: "Home", icon: LayoutDashboard },
          { to: "/vouchers", label: "Vouchers", icon: FileText },
          { to: "/accounts", label: "Accounts", icon: Users },
        ];
        const active = tabs.findIndex((t) => (t.to === "/" ? pathname === "/" : pathname.startsWith(t.to)));
        return (
          <nav aria-label="Main navigation" className="mobile-nav no-print fixed inset-x-3 z-30 md:hidden" style={{ "--i": Math.max(active, 0), "--n": tabs.length } as CSSProperties}>
            <div className="relative flex items-stretch">
              <span aria-hidden="true" className="mobile-lens" data-on={active >= 0} />
              {tabs.map((n, i) => (
                <Link key={n.to} to={n.to} replace onClick={() => haptic(8)} aria-current={i === active ? "page" : undefined} className={cn("mobile-tab", i === active && "is-active")}>
                  <n.icon className="mobile-tab-ic h-[22px] w-[22px]" strokeWidth={2.1} />
                  <span>{n.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        );
      })()}
    </div>
  );
}

/** Online/offline state of the device. */
function useOnline() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const u = () => setOn(navigator.onLine);
    u();
    window.addEventListener("online", u); window.addEventListener("offline", u);
    return () => { window.removeEventListener("online", u); window.removeEventListener("offline", u); };
  }, []);
  return on;
}

function StatusChip() {
  const on = useOnline();
  return (
    <div role="status" className="inline-flex items-center gap-2 rounded-full bg-sidebar-accent px-3 py-1.5 text-sidebar-accent-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-metric-cash" : "bg-warning")} /> {on ? "Online" : "Offline"}
    </div>
  );
}

/** Signed-in user with quick theme / lock / log-out actions (sidebar and mobile menu). */
function UserBlock({ dark, onToggleTheme, onLogout }: { dark: boolean; onToggleTheme: () => void; onLogout: (full?: boolean) => void }) {
  const data = useData();
  const name = data.auth?.username || "User";
  const iconBtn = "rounded-lg p-1.5 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">{initials(name)}</span>
      <div className="min-w-0 text-left">
        <p className="truncate text-sm font-medium text-sidebar-foreground">{name}</p>
        <p className="text-[11px] text-sidebar-foreground/60">Signed in</p>
      </div>
      <div className="flex shrink-0 items-center">
        <button onClick={onToggleTheme} aria-label="Toggle theme" title="Toggle theme" className={iconBtn}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        <button onClick={() => onLogout()} aria-label="Lock app" title="Lock app" className={iconBtn}><Lock className="h-4 w-4" /></button>
        <button onClick={() => onLogout(true)} aria-label="Log out" title="Log out" className={iconBtn}><LogOut className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

/** Pakistani-style short words for an amount: 150000 → "1.5 lakh", 25000 → "25 hazar". */
function amountWords(n: number) {
  const f = (v: number) => String(Math.round(v * 100) / 100);
  if (n >= 1e7) return `${f(n / 1e7)} crore`;
  if (n >= 1e5) return `${f(n / 1e5)} lakh`;
  if (n >= 1e3) return `${f(n / 1e3)} hazar`;
  return "";
}

/** Screens the voice assistant may open, mapped to real app routes. */
const VOICE_ROUTES = {
  dashboard: "/", sales: "/sales", purchases: "/purchases", vouchers: "/vouchers", accounts: "/accounts",
  cashbook: "/cashbook", banks: "/banks", expenses: "/expenses", reports: "/reports",
} as const;

type ToolOut = Record<string, unknown>;

/** Header voice mic: toggles the bottom live assistant dock and runs the assistant's tools against the app's data. */
function MicButton() {
  const [open, setOpen] = useState(false);
  const [resumeAsk, setResumeAsk] = useState(false);
  const draftAtRef = useRef(0);
  const resumeContextRef = useRef<string | null>(null);
  const toolRef = useRef<(name: string, args: Record<string, unknown>) => Promise<ToolOut> | ToolOut>(() => ({ status: "not_ready" }));
  const voice = useVoiceSettings();
  const navigate = useNavigate();
  const gemini = useGeminiLive({
    getSessionConfig: () => {
      const v = getVoiceSettings().settings;
      const ctx = resumeContextRef.current;
      resumeContextRef.current = null;
      return { voice: v.voice, extraInstruction: voiceInstruction(v, todayISO(), liveAccounts(getData()).filter((x) => !x.equity).map((x) => x.name), bankChoices(getData()).map((b) => b.name)), greeting: ctx ? null : voiceGreeting(v), greetingKey: `${v.voice}|${v.language}|${v.greeting.trim()}`, initialContext: ctx };
    },
    onToolCall: (name, args) => toolRef.current(name, args),
  });
  const { stopSession, startSession, setCurrentDraft, currentDraft, isConnected, clearHistory, sendContext } = gemini;
  const pendingRef = useRef<PendingDraft | null>(null);
  pendingRef.current = currentDraft;
  useEffect(() => { if (currentDraft) draftAtRef.current = Date.now(); }, [currentDraft]);
  // The bottom navigation bar steps aside while the voice dock is open.
  useEffect(() => {
    const el = document.documentElement;
    if (open) el.dataset["voiceOpen"] = "1"; else delete el.dataset["voiceOpen"];
    return () => { delete el.dataset["voiceOpen"]; };
  }, [open]);
  const showSetup = open && !voice.configured;

  /** Save what is waiting (entry or account). Used by the Confirm button and by the assistant's confirm_pending tool. */
  const savePending = (opts: { force: boolean; interactive: boolean }): ToolOut => {
    const p = pendingRef.current;
    if (!p) return { status: "nothing_pending" };
    const d = getData();
    try {
      if (p.kind === "account") {
        const x = p.draft;
        const acc = addAccount({ name: x.name, type: x.type, phone: x.phone, address: x.address, openingBalance: x.openingBalance, ...(x.fixedWages !== undefined ? { fixedWages: x.fixedWages } : {}), ...(x.idCard ? { idCard: x.idCard } : {}) });
        toast.success(`Account created: ${acc.name}`);
        setCurrentDraft(null);
        return { status: "created", account: acc.name, instruction: "Tell the user the account is created and continue with their entry." };
      }
      const x = p.draft;
      const dup = findDuplicate(d, { accountId: x.accountId, amount: x.amount, date: x.date, type: x.type });
      if (dup && !opts.force) {
        if (!opts.interactive) return { status: "possible_duplicate", voucher: dup.voucherNo, instruction: "A similar entry (same account, amount and date) already exists. Tell the user and ask if they still want to save; if yes call confirm_pending with force true." };
        if (!confirm(`A similar entry (V-${dup.voucherNo}) already exists for the same account, amount and date. Save anyway?`)) return { status: "cancelled" };
      }
      // A bank picked from the built-in list that was never used before is created now, the same way the entry form does it.
      if (x.method && x.method !== "cash" && x.bankName && !x.bankId) {
        const have = liveBanks(getData()).find((b) => b.name.toLowerCase() === x.bankName!.toLowerCase());
        x.bankId = (have ?? addBank({ name: x.bankName, openingBalance: 0 })).id;
      }
      const e = addEntry(entryPayload(x));
      flashEntry(e.id);
      toast.success(`Voucher V-${e.voucherNo} saved${x.accountName ? `: ${x.accountName}` : ""}, ${money(x.amount)}`, {
        action: { label: "Undo", onClick: () => { toast(undo() ? "Undone" : "Nothing to undo"); } },
      });
      setCurrentDraft(null);
      clearHistory();
      if (opts.interactive) sendContext("ENTRY_SAVED");
      return { status: "saved", voucher_no: e.voucherNo, instruction: "Tell the user it is saved and give the voucher number. Be ready for a fresh entry." };
    } catch (err) {
      toast.error("Save karte waqt error aaya.");
      return { status: "error", message: err instanceof Error ? err.message : String(err) };
    }
  };

  /** Every tool the assistant can call. Lookups read the live data; drafts are validated by the same rules as the entry form. */
  const runTool = (name: string, args: Record<string, unknown>): ToolOut => {
    const d = getData();
    const today = todayISO();
    const text = (k: string) => (typeof args[k] === "string" ? (args[k] as string) : "");
    switch (name) {
      case "record_transaction_draft": {
        const r = validateEntryDraft(d, args, today);
        if (r["ok"] !== true) return r;
        const summary = String(r["summary"]);
        setCurrentDraft({ kind: "entry", draft: r["draft"] as EntryDraft, summary });
        return { status: "draft_ready", summary, instruction: "Read this summary aloud and ask the user to confirm. Call confirm_pending only after a clear yes." };
      }
      case "create_account": {
        const r = validateAccountDraft(d, args);
        if (r["ok"] !== true) return r;
        const summary = String(r["summary"]);
        setCurrentDraft({ kind: "account", draft: r["draft"] as AccountDraft, summary });
        return { status: "draft_ready", summary, instruction: "Read this aloud and ask the user to confirm. Call confirm_pending only after a clear yes." };
      }
      case "confirm_pending": return savePending({ force: args["force"] === true, interactive: false });
      case "cancel_pending": setCurrentDraft(null); return { status: "cancelled" };
      case "find_account": { const t = text("entry_type"); return findAccountTool(d, text("name"), t ? (t as EntryType) : undefined); }
      case "list_banks": return listTool(d, "banks");
      case "list_materials": return listTool(d, "materials");
      case "list_categories": return listTool(d, "categories");
      case "last_transaction": return lastTransactionTool(d, args);
      case "search_entries": return searchEntriesTool(d, args, today);
      case "account_balance": return accountBalanceTool(d, args);
      case "get_overview": return overviewTool(d, today);
      case "get_report": return reportTool(d, args, today);
      case "get_form_spec": return formSpecTool(args);
      case "navigate_app": { const to = VOICE_ROUTES[text("screen") as keyof typeof VOICE_ROUTES]; if (!to) return { status: "unknown_screen" }; navigate({ to }); return { status: "opened", screen: text("screen") }; }
      default: return { status: "unknown_tool", name };
    }
  };
  // Every money field in an answer also carries its Pakistani-grouped text and spoken words, so the assistant never converts digits itself.
  toolRef.current = (name, args) => withSpoken(runTool(name, args));

  // Closing ends the session and clears the conversation, but an unfinished draft is kept for 10 minutes.
  const close = () => { stopSession(); setResumeAsk(false); setOpen(false); playSound("micOff"); };
  const toggle = () => { if (showSetup) return; if (isConnected) { stopSession(); playSound("micOff"); } else { playSound("micOn"); void startSession(); } };
  const openDock = () => {
    setOpen(true);
    playSound("micOn");
    if (!voice.configured) return;
    const fresh = !!currentDraft && Date.now() - draftAtRef.current < 600_000;
    if (currentDraft && !fresh) setCurrentDraft(null);
    if (fresh) { setResumeAsk(true); return; }
    if (voice.settings.autoStart) void startSession();
  };
  const continueDraft = () => {
    if (currentDraft) resumeContextRef.current = `CONTEXT: an unfinished draft from earlier is already on screen: ${currentDraft.summary}. The user may correct it or confirm it.`;
    setResumeAsk(false);
    void startSession();
  };
  const discardDraft = () => { setCurrentDraft(null); setResumeAsk(false); if (voice.settings.autoStart) void startSession(); };

  /** What the draft card shows. */
  const draftView = (p: PendingDraft) => {
    if (p.kind === "account") {
      const x = p.draft;
      const rows: Array<[string, string]> = [["Name", x.name], ["Type", x.typeLabel]];
      if (x.phone) rows.push(["Phone", x.phone]);
      if (x.address) rows.push(["Address", x.address]);
      if (x.openingBalance) rows.push(["Opening balance", `${money(Math.abs(x.openingBalance))} ${x.openingSide === "payable" ? "payable (we owe)" : "receivable (they owe us)"}`]);
      if (x.fixedWages) rows.push(["Monthly wages", money(x.fixedWages)]);
      return { title: "New Account", type: "New account", rows };
    }
    const x = p.draft;
    const dup = findDuplicate(getData(), { accountId: x.accountId, amount: x.amount, date: x.date, type: x.type });
    const words = amountWords(x.amount);
    return { title: "Transaction Draft", type: ENTRY_TYPES[x.type].label, rows: draftRows(x), ...(words ? { amountWords: words } : {}), ...(dup ? { duplicateOf: `V-${dup.voucherNo}` } : {}) };
  };

  return (
    <>
      <button type="button" data-voice-trigger aria-label="Voice assistant" title="Voice assistant" aria-pressed={open} data-open={open ? "true" : "false"} onClick={() => (open ? close() : openDock())} className={isConnected ? "mic-btn mic-btn-active" : "mic-btn"}>
        <span className="mic-mesh" aria-hidden="true">
          <span className="mic-ringset"><span className="mic-arc" /></span>
          <span className="mic-glowset"><span className="mic-ringset"><span className="mic-arc" /></span></span>
        </span>
        <span className="mic-art" aria-hidden="true">
          <img src={micLightIdle.url} alt="" className="mic-image mic-image-light" />
          <img src={micDarkIdle.url} alt="" className="mic-image mic-image-dark" />
        </span>
      </button>
      <GeminiLiveWorkspaceBar isOpen={open} onClose={close} isRecording={gemini.isRecording} isSpeaking={gemini.isSpeaking}
        liveTranscript={gemini.liveTranscript} chatHistory={gemini.chatHistory}
        currentDraft={currentDraft && !resumeAsk ? draftView(currentDraft) : null} error={gemini.error} isConnected={isConnected}
        onConfirmDraft={() => { savePending({ force: false, interactive: true }); }} onCancelDraft={() => setCurrentDraft(null)} onToggleRecord={toggle} onRetry={() => { void startSession(); }}
        audioStream={gemini.mediaStream} status={gemini.status}
        setupSlot={showSetup ? <VoiceSetupCard onStart={() => { void startSession(); }} /> : undefined}
        resume={resumeAsk && currentDraft ? { summary: currentDraft.summary, onContinue: continueDraft, onDiscard: discardDraft } : null} />
    </>
  );
}

/** Header Backup & Sync: one tap uploads to the cloud copy; opens settings when not signed in. */
function SyncButton() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { toast("Sign in to Cloud Backup to sync"); navigate({ to: "/settings" }); return; }
    if (!navigator.onLine) { toast.error("You are offline — backup will run when back online"); return; }
    setBusy(true);
    try { await backupToCloud(); toast.success("Backed up & synced"); } catch { toast.error("Backup failed, try again"); }
    setBusy(false);
  };
  return <button onClick={run} disabled={busy} aria-label="Backup & sync" title="Backup & sync" className="p-2 text-muted-foreground hover:text-foreground">{busy ? <RefreshCw className="h-5 w-5 animate-spin" /> : <CloudUpload className="h-5 w-5" />}</button>;
}
