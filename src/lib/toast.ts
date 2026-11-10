/**
 * App notifications (success, error, warning, info, loading, promise) shown by Sonner at the top of the screen,
 * styled as pills that follow the app theme (see `.app-toast` in styles.css). Screens only use this wrapper.
 */
import { toast as sonner } from "sonner";

export interface ToastOptions {
  description?: string;
  duration?: number;
  id?: string | number;
  action?: { label: string; onClick: () => void };
}
const opts = (o?: ToastOptions) => ({
  ...(o?.description ? { description: o.description } : {}),
  ...(o?.duration ? { duration: o.duration } : {}),
  ...(o?.id !== undefined ? { id: o.id } : {}),
  ...(o?.action ? { action: { label: o.action.label, onClick: o.action.onClick } } : {}),
});

const base = (title: string, o?: ToastOptions) => sonner(title, opts(o));
export const toast = Object.assign(base, {
  success: (title: string, o?: ToastOptions) => sonner.success(title, opts(o)),
  error: (title: string, o?: ToastOptions) => sonner.error(title, opts(o)),
  warning: (title: string, o?: ToastOptions) => sonner.warning(title, opts(o)),
  info: (title: string, o?: ToastOptions) => sonner.info(title, opts(o)),
  message: (title: string, o?: ToastOptions) => sonner(title, opts(o)),
  loading: (title: string, o?: ToastOptions) => sonner.loading(title, opts(o)),
  promise: <T,>(p: Promise<T>, msgs: { loading: string; success: string | ((v: T) => string); error: string | ((e: unknown) => string) }) => sonner.promise(p, msgs),
  dismiss: (id?: string | number) => sonner.dismiss(id),
});
