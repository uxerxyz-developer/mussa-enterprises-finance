/**
 * Theme switch as ONE browser View Transition, so colours, gradients and SVG graphics all change together.
 * Going to dark: the new theme spreads from the top down; going to light: from the bottom up, with a thin
 * lavender-to-sky glowing line on the edge. Where View Transitions are not available, or "Reduce motion" is on,
 * the change is simply applied (the older colour fade still runs where it did before).
 */
type VT = { ready: Promise<void>; finished: Promise<void> };
type VTDocument = Document & { startViewTransition?: (cb: () => void) => VT };

const MS = 700;
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export function switchThemeAnimated(toDark: boolean, apply: () => void): void {
  const doc = document as VTDocument;
  const root = document.documentElement;
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { apply(); return; }
  const down = toDark;
  const line = document.createElement("div");
  line.className = "theme-switch-line";
  line.setAttribute("aria-hidden", "true");
  root.setAttribute("data-vt", down ? "down" : "up");
  let t: VT;
  try {
    t = doc.startViewTransition(() => { apply(); document.body.appendChild(line); });
  } catch { root.removeAttribute("data-vt"); apply(); return; }
  const h = window.innerHeight;
  t.ready.then(() => {
    root.animate(
      { clipPath: down ? ["inset(0 0 100% 0)", "inset(0 0 0 0)"] : ["inset(100% 0 0 0)", "inset(0 0 0 0)"] },
      { duration: MS, easing: EASE, fill: "both", pseudoElement: "::view-transition-new(root)" },
    );
    root.animate(
      { transform: down ? ["translateY(0px)", `translateY(${h - 3}px)`] : [`translateY(${h - 3}px)`, "translateY(0px)"] },
      { duration: MS, easing: EASE, fill: "both", pseudoElement: "::view-transition-group(theme-line)" },
    );
  }).catch(() => { /* transition skipped: the theme is already applied */ });
  t.finished.catch(() => {}).then(() => { root.removeAttribute("data-vt"); line.remove(); });
}
