/**
 * App notifications (success, error, warning, info) shown as Sileo toasts at the top of the screen.
 * Every screen calls this wrapper with the same API it used before (`toast.success("..", { action })`),
 * so the toast library can be replaced here without touching the screens.
 */
import { sileo } from "sileo";

export interface ToastOptions {
  description?: string;
  duration?: number;
  id?: string | number;
  action?: { label: string; onClick: () => void };
}
type Kind = "success" | "error" | "warning" | "info";

// Sileo's types are not available offline, so calls go through one loosely typed helper.
const show = (kind: Kind, title: string, o?: ToastOptions) => {
  const api = sileo as unknown as Record<Kind, (opts: Record<string, unknown>) => unknown>;
  return api[kind]({
    title,
    ...(o?.description ? { description: o.description } : {}),
    ...(o?.duration ? { duration: o.duration } : {}),
    ...(o?.id !== undefined ? { id: o.id } : {}),
    ...(o?.action ? { button: { title: o.action.label, onClick: o.action.onClick } } : {}),
  });
};

const base = (title: string, o?: ToastOptions) => show("info", title, o);
export const toast = Object.assign(base, {
  success: (title: string, o?: ToastOptions) => show("success", title, o),
  error: (title: string, o?: ToastOptions) => show("error", title, o),
  warning: (title: string, o?: ToastOptions) => show("warning", title, o),
  info: (title: string, o?: ToastOptions) => show("info", title, o),
  message: (title: string, o?: ToastOptions) => show("info", title, o),
});
