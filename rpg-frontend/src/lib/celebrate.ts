import confetti from 'canvas-confetti';

/** Cores dos tokens do tema (index.css): o confete fala a mesma língua do app. */
const COLORS = ['#e6b84d', '#93b64f', '#d27c5c', '#72a9b9', '#f1e7d3'];

/** Confete em quadradinhos (cara de pixel). `big` = subida de nível / resgate. */
export function celebrate(big = false) {
  const base = {
    shapes: ['square' as const],
    colors: COLORS,
    scalar: 0.9,
    ticks: 160,
    gravity: 1.1,
    disableForReducedMotion: true,
    zIndex: 90,
  };
  confetti({ ...base, particleCount: big ? 120 : 70, spread: big ? 100 : 70, startVelocity: big ? 45 : 35, origin: { y: 0.65 } });
  if (big) {
    window.setTimeout(() => {
      confetti({ ...base, particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.75 } });
      confetti({ ...base, particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.75 } });
    }, 220);
  }
}
