import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

/** Top-centre pill notifications that follow the app's light / dark theme (the `.dark` class on the page). */
export function Toaster() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const watch = new MutationObserver(sync);
    watch.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => watch.disconnect();
  }, []);
  return (
    <Sonner
      theme={dark ? "dark" : "light"}
      position="top-center"
      offset={14}
      visibleToasts={3}
      gap={10}
      toastOptions={{ classNames: { toast: "app-toast" } }}
    />
  );
}
