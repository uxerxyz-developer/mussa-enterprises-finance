import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** PIN entry as separate boxes: each digit pops in with a light vibration, and `onComplete` fires when the last box is filled. */
export function PinBoxes({ id, length, value, onChange, onComplete, autoFocus, disabled }: {
  id: string; length: number; value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; autoFocus?: boolean; disabled?: boolean;
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
    <div id={id} className="pin-boxes relative" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        aria-label="PIN"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoCorrect="off"
        maxLength={length}
        value={value}
        disabled={disabled}
        onChange={(e) => set(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
      />
      <div className="flex justify-between gap-2" aria-hidden="true">
        {Array.from({ length }, (_, i) => {
          const isFilled = i < value.length;
          const isActive = focused && i === Math.min(value.length, length - 1);
          return (
            <div key={i} className={cn("pin-box", isFilled && "pin-box-filled", isActive && "pin-box-active")}>
              {isFilled && <span className="pin-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Password field with a show / hide eye. */
export function PasswordField({ id, value, onChange, autoFocus, placeholder }: {
  id: string; value: string; onChange: (v: string) => void; autoFocus?: boolean; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-field relative">
      <Input
        id={id}
        autoFocus={autoFocus}
        type={show ? "text" : "password"}
        autoComplete="current-password"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-11"
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        onClick={() => setShow((s) => !s)}
        className="password-toggle absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** Two-way choice shown when a PIN or password is created or reset. */
export function AuthModeToggle({ value, onChange }: { value: "pin" | "password"; onChange: (m: "pin" | "password") => void }) {
  return (
    <div role="radiogroup" aria-label="Protect with" className="auth-toggle relative grid grid-cols-2 p-1">
      <span
        aria-hidden="true"
        className={cn(
          "auth-toggle-indicator pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-[0.6rem] transition-transform duration-200 ease-out",
          value === "password" && "translate-x-full",
        )}
      />
      {(["pin", "password"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          onClick={() => onChange(m)}
          className={cn(
            "auth-toggle-option relative z-10 rounded-[0.6rem] px-3 py-2 text-sm font-medium transition-colors",
            value === m ? "auth-toggle-on" : "opacity-70 hover:opacity-100",
          )}
        >
          {m === "pin" ? "6-digit PIN" : "Password"}
        </button>
      ))}
    </div>
  );
}
