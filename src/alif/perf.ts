type NavWithPerfHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as NavWithPerfHints;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const small = window.matchMedia?.('(max-width: 820px), (max-height: 600px)').matches ?? Math.min(window.innerWidth, window.innerHeight) <= 768;
  const saveData = nav.connection?.saveData ?? false;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  return reduced || saveData || (coarse && (small || cores <= 4 || memory <= 4));
}
