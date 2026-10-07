export function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Cancelled", "AbortError")); return; }
    const finish = () => { signal.removeEventListener("abort", abort); resolve(); };
    const timer = setTimeout(finish, ms);
    const abort = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); reject(new DOMException("Cancelled", "AbortError")); };
    signal.addEventListener("abort", abort, { once: true });
  });
}

export async function runCountdown(seconds: number, signal: AbortSignal, tick: (remaining: number) => void) {
  const deadline = performance.now() + seconds * 1000;
  let previous = -1;
  while (performance.now() < deadline) {
    signal.throwIfAborted();
    const remaining = Math.ceil((deadline - performance.now()) / 1000);
    if (remaining !== previous) { tick(remaining); previous = remaining; }
    await wait(Math.min(100, Math.max(1, deadline - (remaining - 1) * 1000 - performance.now())), signal);
  }
  signal.throwIfAborted(); tick(0);
}
