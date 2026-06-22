import { createRng } from "../utils/rng.js";

export function generateLikes({ seed, index, likes }) {
  const safeLikes = Math.max(0, Math.min(10, Number(likes) || 0));

  const base = Math.floor(safeLikes);
  const fraction = safeLikes - base;

  const rng = createRng("likes", seed, index, safeLikes);

  if (fraction === 0) {
    return base;
  }

  return rng() < fraction ? base + 1 : base;
}