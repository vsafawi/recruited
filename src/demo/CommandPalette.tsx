// Stub — owned by workstream 3 (command palette). Wired into Shell.tsx already.
const EVENT = "recruited:palette";

/** Opens the palette from anywhere (the rail's search box calls this). */
export function openPalette() {
  window.dispatchEvent(new Event(EVENT));
}

export default function CommandPalette() {
  return null;
}
