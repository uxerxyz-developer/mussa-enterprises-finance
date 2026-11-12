import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { ArrowRight, Briefcase, CheckCircle2, ChevronLeft, KeyRound, Lock, Mail, ShieldCheck, Smartphone, User, type LucideIcon } from "lucide-react";
import { AuthModeToggle, PasswordCreate, PasswordField, PinBoxes, PinCreate, RevealToggle } from "./AuthInput";
import { changePassword, checkPw, getData, matchesRecovery, rememberPinLength, setupAuth } from "@/lib/db";
import { fieldError } from "@/lib/field-error";
import { toast } from "@/lib/toast";
import { whiteLogo } from "@/lib/logo-images";
import nexumLogo from "@/assets/nexum-systems.webp.asset.json";

/**
 * First-run account creation (three stacked cards) and the sign-in / lock screen.
 * A PIN is 4 digits for new accounts (an older PIN keeps its own length); a password is at least 6 characters.
 */
const norm = (s: string) => s.trim().toLowerCase();

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="auth-screen">
      <div aria-hidden="true" className="auth-orb auth-orb-1" />
      <div aria-hidden="true" className="auth-orb auth-orb-2" />
      <div className="auth-shell">
        <img src={whiteLogo} alt="Mussa Enterprises" className="auth-logo" />
        {children}
      </div>
      <div className="auth-credit"><span>Developed by</span><img src={nexumLogo.url} alt="nexum systems" /></div>
    </div>
  );
}

function IconField({ icon: Icon, label, hint, ...input }: { icon: LucideIcon; label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="auth-group">
      <span className="auth-label">{label}</span>
      <span className="auth-field"><Icon aria-hidden="true" /><input {...input} className="auth-input" /></span>
      {hint && <span className="auth-hint">{hint}</span>}
    </label>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}
function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.16-3.68 1.09-4.61 1.09zM15.53 3.83c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.45 2.34-1.27 3.71 1.34.1 2.72-.69 3.55-1.7z" />
    </svg>
  );
}

/* ---------------- first run: three stacked cards ---------------- */
function Setup({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState("Mussa Enterprises");
  const [username, setUsername] = useState("");
  const [recovery, setRecovery] = useState("");
  const [mode, setMode] = useState<"pin" | "password">("pin");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const state = (i: number) => (i === step ? "active" : i < step ? "dismissed" : i === step + 1 ? "upcoming" : "far-upcoming");

  const next1 = () => {
    if (!company.trim()) return void toast.error("Business name is required");
    if (!username.trim()) return void toast.error("Username is required");
    if (!recovery.trim()) return void toast.error("Recovery email or phone is required");
    setStep(1);
  };
  const finish = async () => {
    setBusy(true);
    const isEmail = recovery.includes("@");
    await setupAuth(username.trim(), secret, company.trim(), isEmail ? recovery.trim() : "", isEmail ? "" : recovery.trim(), mode);
    onDone();
  };
  const soon = (name: string) => toast.info(`${name} sign-in is coming soon`);

  return (
    <Frame>
      <div className="auth-stack">
        <section className={`auth-card ${state(0)}`} inert={step !== 0} aria-hidden={step !== 0}>
          <h1 className="auth-title">Welcome</h1>
          <p className="auth-sub">Create your business account. Everything is saved on this device only.</p>
          <div className="auth-body">
            <div className="auth-social">
              <button type="button" className="auth-social-btn" onClick={() => soon("Google")}><GoogleMark /> Google</button>
              <button type="button" className="auth-social-btn" onClick={() => soon("Apple")}><AppleMark /> Apple</button>
            </div>
            <div className="auth-divider"><span>or set up with your details</span></div>
            <IconField icon={Briefcase} label="Business name" value={company} onChange={(e) => setCompany(e.target.value.replace(/\b\p{L}/gu, (c) => c.toUpperCase()))} placeholder="e.g. Ahmad Steel" autoComplete="organization" />
            <IconField icon={User} label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" autoComplete="username" />
            <IconField icon={Mail} label="Recovery email or phone" value={recovery} onChange={(e) => setRecovery(e.target.value)} placeholder="name@mail.com or 0300 0000000" hint="Used only if you forget your PIN or password." autoComplete="email" />
            <button type="button" className="auth-btn" onClick={next1}>Next: Security Setup <ArrowRight size={18} /></button>
          </div>
        </section>

        <section className={`auth-card ${state(1)}`} inert={step !== 1} aria-hidden={step !== 1}>
          <button type="button" className="auth-back" onClick={() => setStep(0)}><ChevronLeft size={16} /> Back</button>
          <h1 className="auth-title">Security Lock</h1>
          <p className="auth-sub">You will unlock the app with this every time it opens.</p>
          <div className="auth-body">
            <AuthModeToggle value={mode} onChange={(m) => { setMode(m); setSecret(""); }} />
            {step === 1 && (mode === "pin" ? <PinCreate key="pin" length={4} onConfirmed={setSecret} /> : <PasswordCreate key="password" onConfirmed={setSecret} />)}
            <p className="auth-hint text-center">{mode === "pin" ? "Pick 4 digits you will remember, not a birth year." : "Mix letters and numbers; you can change it later in Settings."}</p>
            <button type="button" className="auth-btn" disabled={!secret} onClick={() => setStep(2)}>Review Details <ArrowRight size={18} /></button>
          </div>
        </section>

        <section className={`auth-card ${state(2)}`} inert={step !== 2} aria-hidden={step !== 2}>
          <button type="button" className="auth-back" onClick={() => { setSecret(""); setStep(1); }}><ChevronLeft size={16} /> Back</button>
          <h1 className="auth-title">Ready to Launch</h1>
          <p className="auth-sub">Check the details, then start. You can change them later in Settings.</p>
          <div className="auth-body">
            <div className="auth-summary">
              <div><span>Business</span><b>{company.trim()}</b></div>
              <div><span>Username</span><b>{username.trim()}</b></div>
              <div><span>Recovery</span><b>{recovery.trim()}</b></div>
              <div><span>Security lock</span><b>{mode === "pin" ? "4-digit PIN" : "Password"}</b></div>
              <div><span>Data stored</span><b>On this device only</b></div>
            </div>
            <button type="button" className="auth-btn" disabled={busy} onClick={() => void finish()}>Complete & Launch <CheckCircle2 size={18} /></button>
          </div>
        </section>
      </div>
      <div className="auth-dots" aria-hidden="true">{[0, 1, 2].map((i) => <span key={i} className={i === step ? "on" : ""} />)}</div>
    </Frame>
  );
}

/* ---------------- sign in / lock, and the forgotten-PIN reset ---------------- */
function SignIn({ requireUsername, onDone }: { requireUsername: boolean; onDone: () => void }) {
  const auth = getData().auth;
  const mode: "pin" | "password" = auth?.mode === "password" ? "password" : "pin";
  const len = auth?.pinLength;
  const legacy = mode === "pin" && !len;
  const cred = mode === "pin" ? "PIN" : "password";
  const [view, setView] = useState<"sign" | "verify" | "reset">("sign");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState("");
  const [rMode, setRMode] = useState<"pin" | "password">(mode);
  const [secret, setSecret] = useState("");

  const run = async (override?: string) => {
    const p = override ?? pw;
    if (requireUsername && !username.trim()) { toast.error("Enter your username"); setPw(""); return; }
    if (!p) { toast.error(`Enter your ${cred}`); return; }
    setBusy(true);
    if (await checkPw(p, requireUsername ? username : undefined)) {
      if (legacy && /^\d+$/.test(p)) rememberPinLength(p.length);
      onDone();
    } else { fieldError("login-pin", requireUsername ? `Wrong username or ${cred}` : `Wrong ${cred}`); setPw(""); }
    setBusy(false);
  };
  const verify = () => {
    const d = getData();
    if (d.auth && norm(username) === norm(d.auth.username) && matchesRecovery(recovery)) setView("reset");
    else fieldError("verify-user", "Username and registered email or phone do not match");
  };
  const reset = async () => {
    setBusy(true);
    await changePassword(secret, rMode);
    toast.success(`${rMode === "pin" ? "PIN" : "Password"} reset. You are signed in.`);
    setBusy(false);
    onDone();
  };

  return (
    <Frame>
      <section className="auth-card active auth-single">
        {view === "sign" && (
          <div key="sign" className="auth-slide-in">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">{requireUsername ? `Enter your username and ${cred}.` : `Enter your ${cred} to unlock.`}</p>
            <div className="auth-body">
              {requireUsername && <IconField icon={User} label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />}
              {mode === "pin" && !legacy ? (
                <div className="space-y-3">
                  <PinBoxes id="login-pin" length={len ?? 4} value={pw} onChange={setPw} autoFocus={!requireUsername} disabled={busy} reveal={reveal} onComplete={(v) => void run(v)} />
                  <RevealToggle shown={reveal} onToggle={() => setReveal((s) => !s)} />
                </div>
              ) : mode === "pin" ? (
                <div className="space-y-2">
                  <input id="login-pin" className="auth-input text-center tracking-[0.4em]" autoFocus={!requireUsername} type={reveal ? "text" : "password"} inputMode="numeric" value={pw} onChange={(e) => setPw(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="PIN" />
                  <RevealToggle shown={reveal} onToggle={() => setReveal((s) => !s)} />
                </div>
              ) : (
                <PasswordField id="login-pin" variant="auth" autoFocus={!requireUsername} value={pw} onChange={setPw} placeholder="Password" />
              )}
              {(mode === "password" || legacy || requireUsername) && (
                <button type="button" className="auth-btn" disabled={busy} onClick={() => void run()}>Unlock <Lock size={18} /></button>
              )}
              <button type="button" className="auth-link mx-auto" onClick={() => { setView("verify"); setPw(""); }}>Forgot {cred}?</button>
            </div>
          </div>
        )}

        {view === "verify" && (
          <div key="verify" className="auth-slide-in">
            <button type="button" className="auth-back" onClick={() => setView("sign")}><ChevronLeft size={16} /> Back to sign in</button>
            <h1 className="auth-title">Reset your lock</h1>
            <p className="auth-sub">Confirm your username and registered email or phone.</p>
            <div className="auth-body">
              <IconField id="verify-user" icon={User} label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
              <IconField icon={recovery.includes("@") || !recovery ? Mail : Smartphone} label="Recovery email or phone" value={recovery} onChange={(e) => setRecovery(e.target.value)} />
              <button type="button" className="auth-btn" onClick={verify}>Verify <ShieldCheck size={18} /></button>
            </div>
          </div>
        )}

        {view === "reset" && (
          <div key="reset" className="auth-slide-in">
            <button type="button" className="auth-back" onClick={() => setView("verify")}><ChevronLeft size={16} /> Back</button>
            <h1 className="auth-title">Set a new {rMode === "pin" ? "PIN" : "password"}</h1>
            <p className="auth-sub">Choose how you want to unlock the app from now on.</p>
            <div className="auth-body">
              <AuthModeToggle value={rMode} onChange={(m) => { setRMode(m); setSecret(""); }} />
              {rMode === "pin" ? <PinCreate key="rpin" length={4} onConfirmed={setSecret} id="reset-pin" /> : <PasswordCreate key="rpw" onConfirmed={setSecret} />}
              <button type="button" className="auth-btn" disabled={!secret || busy} onClick={() => void reset()}>Reset & Sign in <KeyRound size={18} /></button>
            </div>
          </div>
        )}
      </section>
    </Frame>
  );
}

export function AuthScreen({ firstRun, requireUsername, onDone }: { firstRun: boolean; requireUsername: boolean; onDone: () => void }) {
  return firstRun ? <Setup onDone={onDone} /> : <SignIn requireUsername={requireUsername} onDone={onDone} />;
}
