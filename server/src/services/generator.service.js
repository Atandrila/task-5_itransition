import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fakerEN_US, fakerDE } from "@faker-js/faker";
import { createRng, pick, chance, randomInt, hashToPositiveInt } from "../utils/rng.js";
import { generateLikes } from "./likes.service.js";
import { generateMusic } from "./music.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, "../../../data/locales");

const fakerMap = {
  "en-US": fakerEN_US,
  "de-DE": fakerDE
};

function loadLocaleData(locale) {
  const safeLocale = locale === "de-DE" ? "de-DE" : "en-US";
  const filePath = path.join(LOCALES_DIR, `${safeLocale}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");

  return {
    locale: safeLocale,
    data: JSON.parse(raw)
  };
}

function titleCase(text) {
  return String(text)
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toLocaleUpperCase() + word.slice(1);
    })
    .join(" ");
}

function makeWordBag(faker, rng, localeData) {
  return {
    adjective: titleCase(faker.word.adjective()),
    noun: titleCase(faker.word.noun()),
    verb: titleCase(faker.word.verb()),
    person: faker.person.firstName(),
    city: faker.location.city(),
    color: titleCase(faker.color.human()),
    number: String(randomInt(rng, 2, 99)),
    suffix: pick(rng, localeData.bandSuffixes)
  };
}

function fillTemplate(template, bag) {
  return template.replace(/\{(\w+)\}/g, (_, key) => bag[key] || "");
}

function generateArtist(faker, rng, localeData) {
  const useBandName = chance(rng, 0.55);

  if (!useBandName) {
    return faker.person.fullName();
  }

  const template = pick(rng, localeData.bandNameTemplates);
  const bag = makeWordBag(faker, rng, localeData);

  return fillTemplate(template, bag);
}

function generateTitle(faker, rng, localeData) {
  const template = pick(rng, localeData.songTitleTemplates);
  const bag = makeWordBag(faker, rng, localeData);

  return fillTemplate(template, bag);
}

function generateAlbum(faker, rng, localeData) {
  const isSingle = chance(rng, 0.28);

  if (isSingle) {
    return "Single";
  }

  const template = pick(rng, localeData.albumTitleTemplates);
  const bag = makeWordBag(faker, rng, localeData);

  return fillTemplate(template, bag);
}

function generateReview(rng, localeData, genre) {
  const template = pick(rng, localeData.reviewTemplates);
  return template.replaceAll("{genre}", genre);
}

function generateDuration(rng) {
  const minutes = randomInt(rng, 1, 4);
  const seconds = randomInt(rng, 0, 59);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function generateSong({ locale = "en-US", seed = "58933423", likes = 0, index }) {
  const { locale: safeLocale, data: localeData } = loadLocaleData(locale);
  const faker = fakerMap[safeLocale] || fakerEN_US;

  const coreSeed = `core|${safeLocale}|${seed}|${index}`;
  const rng = createRng(coreSeed);

  faker.seed(hashToPositiveInt(coreSeed));

  const title = generateTitle(faker, rng, localeData);
  const artist = generateArtist(faker, rng, localeData);
  const album = generateAlbum(faker, rng, localeData);
  const genre = pick(rng, localeData.genres);
  const duration = generateDuration(rng);
  const review = generateReview(rng, localeData, genre);

  const music = generateMusic({
    seed,
    locale: safeLocale,
    index,
    genre
  });

  return {
    index,
    title,
    artist,
    album,
    genre,
    likes: generateLikes({ seed, index, likes }),
    duration,
    review,
    coverUrl: `/api/songs/cover/${index}?locale=${encodeURIComponent(safeLocale)}&seed=${encodeURIComponent(seed)}`,
    music
  };
}

export function generateSongs({
  locale = "en-US",
  seed = "58933423",
  likes = 0,
  page = 1,
  limit = 10
}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));

  const startIndex = (safePage - 1) * safeLimit + 1;

  const songs = [];

  for (let i = 0; i < safeLimit; i++) {
    songs.push(
      generateSong({
        locale,
        seed,
        likes,
        index: startIndex + i
      })
    );
  }

  return songs;
}