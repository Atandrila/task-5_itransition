import { createRng, pick, randomInt, chance } from "../utils/rng.js";

const KEYS = ["C", "D", "E", "F", "G", "A", "B"];

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const PROGRESSIONS = [
  [0, 5, 3, 4],
  [0, 4, 5, 3],
  [5, 3, 0, 4],
  [0, 3, 4, 0],
  [0, 5, 4, 3]
];

function noteFromMidi(midi) {
  const name = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

function scaleNoteToMidi(rootMidi, scale, degree, octaveOffset = 0) {
  const safeDegree = ((degree % scale.length) + scale.length) % scale.length;
  const octave = Math.floor(degree / scale.length) + octaveOffset;
  return rootMidi + scale[safeDegree] + octave * 12;
}

function rootToMidi(root) {
  const rootIndex = NOTE_NAMES.indexOf(root);
  return 60 + rootIndex;
}

function makeMelody(rng, rootMidi, scale, bars) {
  const melody = [];
  let currentDegree = randomInt(rng, 0, 6);

  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < 8; step++) {
      const time = bar * 4 + step * 0.5;

      if (chance(rng, 0.18)) {
        continue;
      }

      currentDegree += pick(rng, [-2, -1, 0, 1, 2]);
      currentDegree = Math.max(0, Math.min(13, currentDegree));

      const midi = scaleNoteToMidi(rootMidi, scale, currentDegree, 1);

      melody.push({
        note: noteFromMidi(midi),
        time,
        duration: chance(rng, 0.2) ? 1 : 0.5,
        velocity: Number((0.55 + rng() * 0.35).toFixed(2))
      });
    }
  }

  return melody;
}

function makeBass(rng, rootMidi, scale, progression, bars) {
  const bass = [];

  for (let bar = 0; bar < bars; bar++) {
    const degree = progression[bar % progression.length];
    const midi = scaleNoteToMidi(rootMidi, scale, degree, -1);

    bass.push({
      note: noteFromMidi(midi),
      time: bar * 4,
      duration: 2,
      velocity: Number((0.55 + rng() * 0.25).toFixed(2))
    });

    bass.push({
      note: noteFromMidi(midi),
      time: bar * 4 + 2,
      duration: 1.5,
      velocity: Number((0.45 + rng() * 0.25).toFixed(2))
    });
  }

  return bass;
}

function makeChords(rootMidi, scale, progression, bars) {
  const chords = [];

  for (let bar = 0; bar < bars; bar++) {
    const degree = progression[bar % progression.length];

    const root = scaleNoteToMidi(rootMidi, scale, degree, 0);
    const third = scaleNoteToMidi(rootMidi, scale, degree + 2, 0);
    const fifth = scaleNoteToMidi(rootMidi, scale, degree + 4, 0);

    chords.push({
      notes: [noteFromMidi(root), noteFromMidi(third), noteFromMidi(fifth)],
      time: bar * 4,
      duration: 3.6,
      velocity: 0.42
    });
  }

  return chords;
}

function makeDrums(rng, bars) {
  const drums = [];

  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      const time = bar * 4 + beat;

      drums.push({
        type: beat === 0 || beat === 2 ? "kick" : "snare",
        time,
        duration: 0.1
      });

      if (chance(rng, 0.85)) {
        drums.push({
          type: "hihat",
          time: time + 0.5,
          duration: 0.05
        });
      }
    }
  }

  return drums;
}

export function generateMusic({ seed, locale, index, genre }) {
  const rng = createRng("music", seed, locale, index, genre);

  const root = pick(rng, KEYS);
  const mode = chance(rng, 0.55) ? "major" : "minor";
  const scale = mode === "major" ? MAJOR_SCALE : MINOR_SCALE;
  const rootMidi = rootToMidi(root);

  const bars = randomInt(rng, 4, 8);
  const tempo = randomInt(rng, 82, 158);
  const progression = pick(rng, PROGRESSIONS);

  return {
    root,
    mode,
    tempo,
    bars,
    durationSeconds: Math.round((bars * 4 * 60) / tempo),
    progression,
    melody: makeMelody(rng, rootMidi, scale, bars),
    bass: makeBass(rng, rootMidi, scale, progression, bars),
    chords: makeChords(rootMidi, scale, progression, bars),
    drums: makeDrums(rng, bars)
  };
}