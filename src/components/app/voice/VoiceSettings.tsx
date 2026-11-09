import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { playVoiceSample } from "@/lib/voice-preview";
import { cn } from "@/lib/utils";
import {
  saveVoiceSettings, useVoiceSettings, VOICE_OPTIONS,
  type VoiceLang, type VoiceLength, type VoiceSettings,
} from "@/lib/voice-settings";

function Segmented<T extends string>({ label, value, options, onChange, onPreview, playing }: { label: string; value: T; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void; onPreview?: (v: T) => void; playing?: string | null }) {
  return (
    <div role="radiogroup" aria-label={label} className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((o) => (
          <div key={o.value} className="relative">
            <button
              type="button"
              role="radio"
              aria-checked={value === o.value}
              onClick={() => onChange(o.value)}
              className={cn("w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors", onPreview && "pr-10", value === o.value ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted/50")}
            >
              {o.label}
              {o.hint && <span className="block text-[11px] font-normal text-muted-foreground">{o.hint}</span>}
            </button>
            {onPreview && (
              <button type="button" aria-label={`Listen to ${o.label}`} title="Listen" onClick={() => onPreview(o.value)}
                className={cn("absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border bg-background text-xs", playing === o.value && "animate-pulse border-primary text-primary")}>
                {playing === o.value ? "…" : "▶"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The four basic voice choices; used both in the first-time setup card and the sidebar sheet. */
export function VoiceSettingsFields({ value, onChange }: { value: VoiceSettings; onChange: (v: VoiceSettings) => void }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const listen = (voice: string) => { setPlaying(voice); void playVoiceSample(voice).finally(() => setPlaying(null)); };
  return (
    <div className="space-y-4">
      <Segmented label="Voice" value={value.voice} options={VOICE_OPTIONS} onChange={(voice) => onChange({ ...value, voice })} onPreview={listen} playing={playing} />
      <Segmented<VoiceLang> label="Language" value={value.language} onChange={(language) => onChange({ ...value, language })}
        options={[{ value: "mixed", label: "Mixed", hint: "Urdu + English" }, { value: "urdu", label: "Urdu" }, { value: "english", label: "English" }]} />
      <Segmented<VoiceLength> label="Replies" value={value.length} onChange={(length) => onChange({ ...value, length })}
        options={[{ value: "short", label: "Short" }, { value: "detailed", label: "Detailed" }]} />
      <div className="space-y-1.5">
        <label htmlFor="voice-greeting" className="text-sm font-medium">Greeting message <span className="font-normal text-muted-foreground">(optional)</span></label>
        <Input id="voice-greeting" maxLength={140} value={value.greeting} onChange={(e) => onChange({ ...value, greeting: e.target.value })} placeholder="Ji boliye, main sun raha hoon! Kya entry karni hai?" />
        <p className="text-[11px] text-muted-foreground">Spoken when the assistant opens. The first time after a change it is recorded, then it plays instantly.</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="voice-autostart" className="text-sm font-medium">Start listening when opened</label>
        <Switch id="voice-autostart" checked={value.autoStart} onCheckedChange={(autoStart) => onChange({ ...value, autoStart })} />
      </div>
    </div>
  );
}

/** First-time card shown inside the voice dock. */
export function VoiceSetupCard({ onStart }: { onStart: (s: VoiceSettings) => void }) {
  const { settings } = useVoiceSettings();
  const [draft, setDraft] = useState<VoiceSettings>(settings);
  return (
    <div role="group" aria-label="Voice assistant setup" className="voice-panel animate-slide-up mb-3 max-h-[60vh] w-full overflow-y-auto rounded-2xl border p-4">
      <p className="mb-3 text-sm font-semibold">Set up your voice assistant</p>
      <VoiceSettingsFields value={draft} onChange={setDraft} />
      <Button type="button" className="mt-4 w-full" onClick={() => { saveVoiceSettings(draft); onStart(draft); }}>Save and start</Button>
    </div>
  );
}

/** Sidebar entry: change the same choices later. */
export function VoiceSettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { settings } = useVoiceSettings();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[22rem] max-w-[92vw] overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Voice Settings</SheetTitle>
          <SheetDescription>Applies the next time the assistant starts.</SheetDescription>
        </SheetHeader>
        <div className="mt-5"><VoiceSettingsFields value={settings} onChange={saveVoiceSettings} /></div>
      </SheetContent>
    </Sheet>
  );
}
