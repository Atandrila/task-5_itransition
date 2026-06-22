import seedrandom from "seedrandom";

export function createRng(...parts) {
  const seedText = parts.join("|");
  return seedrandom(seedText);
}

export function randomFloat(rng, min = 0, max = 1) {
  return min + rng() * (max - min);
}

export function randomInt(rng, min, max) {
  return Math.floor(randomFloat(rng, min, max + 1));
}

export function pick(rng, arr) {
  if (!arr || arr.length === 0) return "";
  return arr[randomInt(rng, 0, arr.length - 1)];
}

export function chance(rng, probability) {
  return rng() < probability;
}

export function hashToPositiveInt(text) {
  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}