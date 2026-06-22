import express from "express";
import { generateSongs, generateSong } from "../services/generator.service.js";
import { generateCoverSvg } from "../services/cover.service.js";

const router = express.Router();

router.get("/", (req, res) => {
  const locale = req.query.locale || "en-US";
  const seed = req.query.seed || "58933423";
  const likes = Number(req.query.likes ?? 0);
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  const songs = generateSongs({
    locale,
    seed,
    likes,
    page,
    limit
  });

  res.json({
    success: true,
    params: {
      locale,
      seed,
      likes,
      page,
      limit
    },
    songs
  });
});

router.get("/cover/:index", (req, res) => {
  const locale = req.query.locale || "en-US";
  const seed = req.query.seed || "58933423";
  const index = Number(req.params.index);

  if (!Number.isInteger(index) || index < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid song index"
    });
  }

  const song = generateSong({
    locale,
    seed,
    likes: 0,
    index
  });

  const svg = generateCoverSvg({
    seed,
    locale,
    index,
    title: song.title,
    artist: song.artist,
    album: song.album,
    genre: song.genre
  });

  res.setHeader("Content-Type", "image/svg+xml");
  res.send(svg);
});

router.get("/:index", (req, res) => {
  const locale = req.query.locale || "en-US";
  const seed = req.query.seed || "58933423";
  const likes = Number(req.query.likes ?? 0);
  const index = Number(req.params.index);

  if (!Number.isInteger(index) || index < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid song index"
    });
  }

  const song = generateSong({
    locale,
    seed,
    likes,
    index
  });

  res.json({
    success: true,
    song
  });
});

export default router;