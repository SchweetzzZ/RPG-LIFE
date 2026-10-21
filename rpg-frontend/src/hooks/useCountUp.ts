import { useEffect, useState } from 'react';

/** Conta de 0 até `target` em `duration` ms (easeOut). Com movimento reduzido, mostra o valor final direto. */
export function useCountUp(target: number, duration = 900, delay = 0): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target === 0) {
      setValue(target);
      return;
    }
    let frame = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(target * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, duration, delay]);

  return value;
}
