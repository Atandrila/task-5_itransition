import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "";

function App() {
  const [locale, setLocale] = useState("en-US");
  const [seed, setSeed] = useState("58933423");
  const [likes, setLikes] = useState(3.7);

  const [viewMode, setViewMode] = useState("table");

  const [tablePage, setTablePage] = useState(1);
  const [tableSongs, setTableSongs] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [galleryPage, setGalleryPage] = useState(1);
  const [gallerySongs, setGallerySongs] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [playingIndex, setPlayingIndex] = useState(null);

  const activeNodesRef = useRef([]);
  const stopTimeoutRef = useRef(null);
  const sentinelRef = useRef(null);
  const galleryLoadingRef = useRef(false);

  const tableLimit = 10;
  const galleryLimit = 12;

  const stopPlayback = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    activeNodesRef.current.forEach((node) => {
      try {
        node.dispose();
      } catch {
        // ignore dispose errors
      }
    });

    activeNodesRef.current = [];
    setPlayingIndex(null);
  }, []);

  const fetchSongsFromApi = useCallback(
    async (pageNumber, limitNumber) => {
      const params = new URLSearchParams({
        locale,
        seed,
        likes: String(likes),
        page: String(pageNumber),
        limit: String(limitNumber)
      });

      const response = await fetch(`${API_URL}/api/songs?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        return [];
      }

      return data.songs;
    },
    [locale, seed, likes]
  );

  const loadTableSongs = useCallback(async () => {
    try {
      setTableLoading(true);
      const songs = await fetchSongsFromApi(tablePage, tableLimit);
      setTableSongs(songs);
    } catch (error) {
      console.error("Failed to fetch table songs:", error);
    } finally {
      setTableLoading(false);
    }
  }, [fetchSongsFromApi, tablePage]);

  const resetGallery = useCallback(async () => {
    try {
      stopPlayback();
      setGalleryLoading(true);
      galleryLoadingRef.current = true;

      setGallerySongs([]);
      setGalleryPage(1);

      window.scrollTo({ top: 0, behavior: "smooth" });

      const songs = await fetchSongsFromApi(1, galleryLimit);
      setGallerySongs(songs);
      setGalleryPage(1);
    } catch (error) {
      console.error("Failed to reset gallery:", error);
    } finally {
      galleryLoadingRef.current = false;
      setGalleryLoading(false);
    }
  }, [fetchSongsFromApi, stopPlayback]);

  const loadMoreGallery = useCallback(async () => {
    if (viewMode !== "gallery") return;
    if (galleryLoadingRef.current) return;

    try {
      galleryLoadingRef.current = true;
      setGalleryLoading(true);

      const nextPage = galleryPage + 1;
      const newSongs = await fetchSongsFromApi(nextPage, galleryLimit);

      setGallerySongs((current) => [...current, ...newSongs]);
      setGalleryPage(nextPage);
    } catch (error) {
      console.error("Failed to load more gallery songs:", error);
    } finally {
      galleryLoadingRef.current = false;
      setGalleryLoading(false);
    }
  }, [fetchSongsFromApi, galleryPage, viewMode]);

  useEffect(() => {
    if (viewMode === "table") {
      loadTableSongs();
    }
  }, [viewMode, loadTableSongs]);

  useEffect(() => {
    if (viewMode === "gallery") {
      resetGallery();
    }
  }, [viewMode, locale, seed, likes, resetGallery]);

  useEffect(() => {
    if (viewMode !== "gallery") return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreGallery();
        }
      },
      {
        root: null,
        rootMargin: "300px",
        threshold: 0.1
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [viewMode, loadMoreGallery, gallerySongs.length]);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  async function playSong(song) {
    if (!song.music) return;

    if (playingIndex === song.index) {
      stopPlayback();
      return;
    }

    stopPlayback();

    await Tone.start();

    const music = song.music;
    const beatSeconds = 60 / music.tempo;
    const totalSeconds = music.bars * 4 * beatSeconds + 1;

    Tone.Transport.bpm.value = music.tempo;

    const melodySynth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.02,
        decay: 0.15,
        sustain: 0.35,
        release: 0.3
      }
    }).toDestination();

    const bassSynth = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.45,
        release: 0.35
      }
    }).toDestination();

    const chordSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.08,
        decay: 0.2,
        sustain: 0.4,
        release: 0.8
      }
    }).toDestination();

    const kick = new Tone.MembraneSynth().toDestination();

    const snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.001,
        decay: 0.18,
        sustain: 0
      }
    }).toDestination();

    const hihat = new Tone.MetalSynth({
      frequency: 220,
      envelope: {
        attack: 0.001,
        decay: 0.08,
        release: 0.01
      },
      harmonicity: 5.1,
      modulationIndex: 20,
      resonance: 3000,
      octaves: 1.5
    }).toDestination();

    activeNodesRef.current = [
      melodySynth,
      bassSynth,
      chordSynth,
      kick,
      snare,
      hihat
    ];

    music.chords.forEach((chord) => {
      Tone.Transport.schedule((time) => {
        chordSynth.triggerAttackRelease(
          chord.notes,
          chord.duration * beatSeconds,
          time,
          chord.velocity
        );
      }, chord.time * beatSeconds);
    });

    music.bass.forEach((note) => {
      Tone.Transport.schedule((time) => {
        bassSynth.triggerAttackRelease(
          note.note,
          note.duration * beatSeconds,
          time,
          note.velocity
        );
      }, note.time * beatSeconds);
    });

    music.melody.forEach((note) => {
      Tone.Transport.schedule((time) => {
        melodySynth.triggerAttackRelease(
          note.note,
          note.duration * beatSeconds,
          time,
          note.velocity
        );
      }, note.time * beatSeconds);
    });

    music.drums.forEach((drum) => {
      Tone.Transport.schedule((time) => {
        if (drum.type === "kick") {
          kick.triggerAttackRelease("C2", 0.1, time);
        }

        if (drum.type === "snare") {
          snare.triggerAttackRelease("16n", time);
        }

        if (drum.type === "hihat") {
          hihat.triggerAttackRelease("C6", "32n", time);
        }
      }, drum.time * beatSeconds);
    });

    Tone.Transport.start();
    setPlayingIndex(song.index);

    stopTimeoutRef.current = setTimeout(() => {
      stopPlayback();
    }, totalSeconds * 1000);
  }

  function resetTableState() {
    setTablePage(1);
    setExpandedIndex(null);
  }

  function handleLocaleChange(event) {
    stopPlayback();
    setLocale(event.target.value);
    resetTableState();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSeedChange(event) {
    stopPlayback();
    setSeed(event.target.value);
    resetTableState();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRandomSeed() {
    stopPlayback();
    const randomSeed = String(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
    setSeed(randomSeed);
    resetTableState();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLikesChange(event) {
    setLikes(Number(event.target.value));
    resetTableState();
  }

  function handleViewModeChange(mode) {
    stopPlayback();
    setViewMode(mode);
    setExpandedIndex(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleExpanded(index) {
    setExpandedIndex((current) => (current === index ? null : index));
  }

  function goPreviousPage() {
    stopPlayback();
    setTablePage((current) => Math.max(1, current - 1));
    setExpandedIndex(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goNextPage() {
    stopPlayback();
    setTablePage((current) => current + 1);
    setExpandedIndex(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderPlayButton(song) {
    return (
      <button
        type="button"
        className={playingIndex === song.index ? "play-button stop-button" : "play-button"}
        onClick={(event) => {
          event.stopPropagation();
          playSong(song);
        }}
      >
        {playingIndex === song.index ? "■ Stop preview" : "▶ Play preview"}
      </button>
    );
  }

  return (
    <main className="app">
      <section className="toolbar">
        <label className="control">
          <span>Language</span>
          <select value={locale} onChange={handleLocaleChange}>
            <option value="en-US">English (US)</option>
            <option value="de-DE">German (Germany)</option>
          </select>
        </label>

        <label className="control seed-control">
          <span>Seed</span>
          <div className="seed-row">
            <input
              value={seed}
              onChange={handleSeedChange}
              placeholder="Enter 64-bit seed"
            />
            <button type="button" onClick={handleRandomSeed}>
              Random
            </button>
          </div>
        </label>

        <label className="control likes-control">
          <span>Likes per song: {likes.toFixed(1)}</span>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={likes}
            onChange={handleLikesChange}
          />
        </label>

        <div className="mode-box">
          <span>Mode</span>
          <div className="mode-buttons">
            <button
              type="button"
              className={viewMode === "table" ? "mode-button active" : "mode-button"}
              onClick={() => handleViewModeChange("table")}
            >
              Table
            </button>

            <button
              type="button"
              className={viewMode === "gallery" ? "mode-button active" : "mode-button"}
              onClick={() => handleViewModeChange("gallery")}
            >
              Gallery
            </button>
          </div>
        </div>
      </section>

      <section className="view-header">
        <h1>Music Store Showcase</h1>
        <p>
          Fake songs are generated from locale, seed, page, and song index. No database is used.
        </p>
      </section>

      {viewMode === "table" && (
        <section className="table-card">
          {tableLoading && <div className="loading">Loading songs...</div>}

          <table>
            <thead>
              <tr>
                <th></th>
                <th>#</th>
                <th>Song</th>
                <th>Artist</th>
                <th>Album</th>
                <th>Genre</th>
                <th>Likes</th>
              </tr>
            </thead>

            <tbody>
              {tableSongs.map((song) => (
                <Fragment key={song.index}>
                  <tr
                    className={expandedIndex === song.index ? "selected-row" : ""}
                    onClick={() => toggleExpanded(song.index)}
                  >
                    <td className="expand-cell">
                      {expandedIndex === song.index ? "⌃" : "⌄"}
                    </td>
                    <td>{song.index}</td>
                    <td className="song-title">{song.title}</td>
                    <td>{song.artist}</td>
                    <td>{song.album}</td>
                    <td>{song.genre}</td>
                    <td>👍 {song.likes}</td>
                  </tr>

                  {expandedIndex === song.index && (
                    <tr className="details-row">
                      <td colSpan="7">
                        <div className="details">
                          <img
                            className="cover"
                            src={`${API_URL}${song.coverUrl}`}
                            alt={`${song.title} cover`}
                          />

                          <div className="details-info">
                            <h2>{song.title}</h2>

                            <p className="subtitle">
                              from <b>{song.album}</b> by <b>{song.artist}</b>
                            </p>

                            <p className="meta">
                              {song.genre} · {song.duration} · {song.likes} likes
                            </p>

                            {renderPlayButton(song)}

                            <h3>Review</h3>
                            <p>{song.review}</p>

                            <h3>Generated Music Info</h3>
                            <p>
                              Key: <b>{song.music?.root} {song.music?.mode}</b> · Tempo:{" "}
                              <b>{song.music?.tempo} BPM</b> · Length:{" "}
                              <b>{song.music?.bars} bars</b>
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button type="button" onClick={goPreviousPage} disabled={tablePage === 1}>
              Previous
            </button>

            <span>Page {tablePage}</span>

            <button type="button" onClick={goNextPage}>
              Next
            </button>
          </div>
        </section>
      )}

      {viewMode === "gallery" && (
        <section className="gallery-section">
          <div className="gallery-grid">
            {gallerySongs.map((song) => (
              <article className="gallery-card" key={song.index}>
                <img
                  className="gallery-cover"
                  src={`${API_URL}${song.coverUrl}`}
                  alt={`${song.title} cover`}
                />

                <div className="gallery-content">
                  <div className="gallery-index">#{song.index}</div>

                  <h2>{song.title}</h2>

                  <p className="gallery-artist">{song.artist}</p>

                  <p className="gallery-meta">
                    {song.album} · {song.genre}
                  </p>

                  <p className="gallery-likes">👍 {song.likes} likes</p>

                  {renderPlayButton(song)}

                  <p className="gallery-review">{song.review}</p>
                </div>
              </article>
            ))}
          </div>

          <div ref={sentinelRef} className="gallery-sentinel">
            {galleryLoading ? "Loading more songs..." : "Scroll for more songs"}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;