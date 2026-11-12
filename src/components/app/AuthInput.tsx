import { useEffect, useRef, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { fieldError } from "@/lib/field-error";

/** PIN entry as a tight group of boxes: each digit pops in with a light vibration, and `onComplete` fires when the last box is filled. */
export function PinBoxes({ id, length, value, onChange, onComplete, autoFocus, disabled, reveal }: {
  id: string; length: number; value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; autoFocus?: boolean; disabled?: boolean; reveal?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  const set = (raw: string) => {
    const v = raw.replace(/\D/g, "").slice(0, length);
    if (v.length > value.length) { try { navigator.vibrate?.(8); } catch { /* unsupported */ } }
    onChange(v);
    if (v.length === length) onComplete?.(v);
  };
  return (
    <div id={id} className="pin-boxes relative mx-auto w-fit" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        aria-label="PIN"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        maxLength={length}
        value={value}
        disabled={disabled}
        onChange={(e) => set(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="pin-hidden absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
      />
      <div className="pin-row" aria-hidden="true">
        {Array.from({ length }, (_, i) => (
          <div key={i} className={cn("pin-box", i < value.length && "pin-box-filled", focused && i === Math.min(value.length, length - 1) && "pin-box-active")}>
            {i < value.length && (reveal ? <span className="pin-digit">{value[i]}</span> : <span className="pin-dot" />)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** "Show" / "Hide" switch that sits under a PIN or beside a password. */
export function RevealToggle({ shown, onToggle, label = "digits" }: { shown: boolean; onToggle: () => void; label?: string }) {
  return (
    <button type="button" onClick={onToggle} className="auth-eye mx-auto" aria-pressed={shown}>
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {shown ? `Hide ${label}` : `Show ${label}`}
    </button>
  );
}

/** Password field with a show / hide eye. */
export function PasswordField({ id, value, onChange, autoFocus, placeholder, variant }: { id: string; value: string; onChange: (v: string) => void; autoFocus?: boolean; placeholder?: string; variant?: "auth" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {variant === "auth" ? (
        <input id={id} autoFocus={autoFocus} type={show ? "text" : "password"} autoComplete="current-password" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="auth-input pr-12" />
      ) : (
        <Input id={id} autoFocus={autoFocus} type={show ? "text" : "password"} autoComplete="current-password" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="pr-10" />
      )}
      <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md opacity-70 hover:opacity-100">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** Two-way choice shown when a PIN or password is created or reset. */
export function AuthModeToggle({ value, onChange }: { value: "pin" | "password"; onChange: (m: "pin" | "password") => void }) {
  return (
    <div role="radiogroup" aria-label="Protect with" className="auth-toggle grid grid-cols-2 gap-1 rounded-xl p-1">
      {(["pin", "password"] as const).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={value === m} onClick={() => onChange(m)} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition", value === m ? "auth-toggle-on" : "opacity-70 hover:opacity-100")}>
          {m === "pin" ? "4-digit PIN" : "Password"}
        </button>
      ))}
    </div>
  );
}

/**
 * Creating a PIN the way a phone does it: first "Create a PIN", and as the last digit is typed the boxes clear and ask
 * "Confirm your PIN". If the two differ the boxes shake and start again. `onConfirmed` gets the PIN once both match ("" while not).
 */
export function PinCreate({ length = 4, onConfirmed, id = "pin-create" }: { length?: number; onConfirmed: (pin: string) => void; id?: string }) {
  const [stage, setStage] = useState<"create" | "confirm">("create");
  const [first, setFirst] = useState("");
  const [value, setValue] = useState("");
  const [reveal, setReveal] = useState(false);
  const [done, setDone] = useState(false);
  const complete = (v: string) => {
    if (stage === "create") { setFirst(v); window.setTimeout(() => { setStage("confirm"); setValue(""); }, 200); return; }
    if (v === first) { setDone(true); onConfirmed(v); return; }
    fieldError(id, "PINs didn't match, try again");
    window.setTimeout(() => { setStage("create"); setFirst(""); setValue(""); onConfirmed(""); }, 450);
  };
  const again = () => { setDone(false); setStage("create"); setFirst(""); setValue(""); onConfirmed(""); };
  return (
    <div className="space-y-3 text-center">
      <p className="auth-step-note">{done ? "PIN set" : stage === "create" ? "Create a PIN" : "Confirm your PIN"} <span className="opacity-60">· Step {done || stage === "confirm" ? 2 : 1} of 2</span></p>
      <div key={stage + String(done)} className="auth-slide-in">
        <PinBoxes id={id} length={length} value={done ? first : value} onChange={setValue} onComplete={complete} autoFocus disabled={done} reveal={reveal} />
      </div>
      <RevealToggle shown={reveal} onToggle={() => setReveal((s) => !s)} />
      {done && <button type="button" onClick={again} className="auth-link mx-auto"><Check className="h-4 w-4" /> PIN confirmed · change</button>}
    </div>
  );
}

/** Creating a password: the confirm field opens once the first one is long enough. `onConfirmed` gets it when both match ("" while not). */
export function PasswordCreate({ onConfirmed, minLength = 6 }: { onConfirmed: (pw: string) => void; minLength?: number }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const longEnough = a.length >= minLength;
  const same = longEnough && a === b;
  useEffect(() => { onConfirmed(same ? a : ""); }, [same, a]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-3">
      <PasswordField id="pw-create" variant="auth" value={a} onChange={setA} placeholder={`Create a password (at least ${minLength} characters)`} />
      {longEnough && (
        <div className="auth-expand space-y-1.5">
          <PasswordField id="pw-confirm" variant="auth" autoFocus value={b} onChange={setB} placeholder="Confirm your password" />
          {b && !same && <p className="auth-bad">Passwords do not match</p>}
          {same && <p className="auth-good"><Check className="mr-1 inline h-3.5 w-3.5" />Passwords match</p>}
        </div>
      )}
    </div>
  );
}
