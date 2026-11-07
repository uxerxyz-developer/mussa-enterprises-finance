import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  saveVoiceSettings, useVoiceSettings, VOICE_OPTIONS,
  type VoiceLang, type VoiceLength, type VoiceSettings,
} from "@/lib/voice-settings";

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn("rounded-lg border px-3 py-2 text-left text-sm transition-colors", value === o.value ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted/50")}
          >
            {o.label}
            {o.hint && <span className="block text-[11px] font-normal text-muted-foreground">{o.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The four basic voice choices; used both in the first-time setup card and the sidebar sheet. */
export function VoiceSettingsFields({ value, onChange }: { value: VoiceSettings; onChange: (v: VoiceSettings) => void }) {
  return (
    <div className="space-y-4">
      <Segmented label="Voice" value={value.voice} options={VOICE_OPTIONS} onChange={(voice) => onChange({ ...value, voice })} />
      <Segmented<VoiceLang> label="Language" value={value.language} onChange={(language) => onChange({ ...value, language })}
        options={[{ value: "mixed", label: "Mixed", hint: "Urdu + English" }, { value: "urdu", label: "Urdu" }, { value: "english", label: "English" }]} />
      <Segmented<VoiceLength> label="Replies" value={value.length} onChange={(length) => onChange({ ...value, length })}
        options={[{ value: "short", label: "Short" }, { value: "detailed", label: "Detailed" }]} />
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
