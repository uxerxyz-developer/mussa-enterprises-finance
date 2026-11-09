import { Toaster as SileoToaster } from "sileo";

/** Top-centre notifications on phone and desktop. If the toasts ever look unstyled, add: import "sileo/styles.css"; */
export function Toaster() {
  return <SileoToaster position="top-center" />;
}
