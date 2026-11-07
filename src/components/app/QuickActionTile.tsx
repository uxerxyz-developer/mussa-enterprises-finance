import type { CSSProperties, PointerEventHandler } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TileVariant = "hero" | "tile" | "md" | "sm" | "xs";
export type TileRipple = { x: number; y: number; k: number } | null;

// Every tile: label on the left, big icon on the right. Hero tiles are split in two bands (more fill on top, less below).
const SIZE: Record<Exclude<TileVariant, "hero">, string> = {
  tile: "gap-2 px-3 text-[15px]",
  md: "gap-2 px-3 text-sm",
  sm: "gap-1.5 px-2.5 text-[13px]",
  xs: "gap-1.5 px-2 text-xs",
};
const ICON: Record<TileVariant, string> = { hero: "h-12 w-12", tile: "h-10 w-10", md: "h-8 w-8", sm: "h-6 w-6", xs: "h-5 w-5" };

type Props = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** CSS colour (a design-token variable) that tints the tile. */
  tone: string;
  variant: TileVariant;
  /** Full-width tile (hero). */
  span: boolean;
  latest?: string | undefined;
  ripple: TileRipple;
  pulse: boolean;
  lifted: boolean;
  target: boolean;
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onClick: () => void;
};

export function QuickTile({ id, label, icon: Icon, tone, variant, span, latest, ripple, pulse, lifted, target, onPointerDown, onClick }: Props) {
  const hero = variant === "hero";
  const split = hero && !!latest;
  const icon = (
    <span className="qa-icon relative grid shrink-0 place-items-center">
      <Icon className={ICON[variant]} strokeWidth={1.5} aria-hidden />
    </span>
  );
  const text = <span className={cn("min-w-0 text-left leading-tight", hero ? "truncate text-[17px]" : "line-clamp-2 text-balance")}>{label}</span>;
  return (
    <button type="button" data-qid={id} data-pulse={pulse} data-variant={variant} data-split={split} onPointerDown={onPointerDown} onClick={onClick} onContextMenu={(e) => e.preventDefault()}
      style={{ "--qa": tone, ...(span ? { gridColumn: "1 / -1" } : {}) } as CSSProperties}
      className={cn("qa-tile relative flex min-h-0 min-w-0 select-none overflow-hidden rounded-2xl font-semibold text-foreground [-webkit-touch-callout:none] [touch-action:manipulation]",
        hero ? "flex-col" : cn("items-center justify-between", SIZE[variant as Exclude<TileVariant, "hero">]),
        lifted && "scale-95 opacity-40", target && "scale-105 ring-2 ring-primary/50")}>
      {ripple && <span key={ripple.k} aria-hidden className="qa-ripple" style={{ left: ripple.x, top: ripple.y }} />}
      {hero ? (
        <>
          <span className={cn("relative flex items-center justify-between gap-3 px-4", split ? "h-[58%]" : "h-full")}>{text}{icon}</span>
          {split && <span className="relative flex min-h-0 flex-1 items-center px-4 text-[11px] font-medium text-muted-foreground"><span className="truncate">{latest}</span></span>}
        </>
      ) : (
        <>{text}{icon}</>
      )}
    </button>
  );
}
