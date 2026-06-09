"use client";

import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// Background music. Two ways to supply it:
//   1. Paste a YouTube link  → plays via YouTube's official embedded player.
//   2. Leave it blank        → falls back to a local file at /music/theme.mp3.
//
// ⚠️ YouTube Terms of Service: the embedded player is kept VISIBLE on purpose.
// Hiding it to use audio-only background playback violates YouTube's ToS (and
// YouTube tends to pause hidden players). Ads may also play. Embedding is the
// sanctioned way to use YouTube content, so we don't redistribute any audio
// ourselves. If a video has embedding disabled by its uploader, pick another.
// ─────────────────────────────────────────────────────────────────────────

const LS_KEY = "me-trivia-music";
const LOCAL_FALLBACK = "/music/theme.mp3";

/** Accepts a raw video id or any common YouTube URL form; returns the id. */
function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s; // bare id
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    const v = u.searchParams.get("v");
    if (v) return v;
    const parts = u.pathname.split("/").filter(Boolean);
    const i = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "v");
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch {
    /* not a URL */
  }
  return null;
}

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState("");
  const [playing, setPlaying] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [localError, setLocalError] = useState(false);

  // Load saved link + volume.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.url === "string") {
          setUrl(p.url);
          setDraft(p.url);
        }
        if (typeof p.volume === "number") setVolume(p.volume);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist; keep local-audio volume in sync.
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ url, volume }));
    } catch {
      /* ignore */
    }
    if (audioRef.current) audioRef.current.volume = volume;
  }, [url, volume]);

  const videoId = parseYouTubeId(url);

  const playLocal = async () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.volume = volume;
      await a.play();
      setLocalError(false);
    } catch {
      setLocalError(true);
    }
  };

  const handlePlay = () => {
    setUrl(draft);
    setPlaying(true);
    setPanelOpen(false);
    if (!parseYouTubeId(draft)) {
      // Local fallback — play once state has settled.
      setTimeout(playLocal, 0);
    }
  };

  const handleStop = () => {
    setPlaying(false);
    audioRef.current?.pause();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Local fallback audio element (used only when no YouTube link). */}
      <audio
        ref={audioRef}
        src={LOCAL_FALLBACK}
        loop
        preload="none"
        onError={() => playing && !videoId && setLocalError(true)}
      />

      {/* YouTube player — kept visible (ToS) while playing. */}
      {playing && videoId && (
        <div className="panel-dark rounded-xl p-2 shadow-xl">
          <iframe
            title="Background music"
            width={260}
            height={146}
            className="rounded-md block"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&rel=0&modestbranding=1`}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          <div className="flex justify-between items-center mt-1.5 px-0.5">
            <span className="text-[11px] text-parchment/55">
              Keep this open for the music
            </span>
            <button
              onClick={handleStop}
              className="btn-rune rounded px-2.5 py-1 text-xs"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Local-file playback indicator. */}
      {playing && !videoId && (
        <div className="panel-dark rounded-xl p-3 shadow-xl flex items-center gap-3">
          <span className="text-sm">
            {localError ? "⚠ No local track found" : "♪ Playing theme"}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Music volume"
            className="w-20 h-1.5 cursor-pointer accent-[var(--color-gold)]"
          />
          <button
            onClick={handleStop}
            className="btn-rune rounded px-2.5 py-1 text-xs"
          >
            Stop
          </button>
        </div>
      )}

      {/* Settings panel (paste a link). */}
      {panelOpen && !playing && (
        <div className="panel-dark rounded-xl p-3 shadow-xl w-72">
          <label className="block text-sm text-gold-bright font-display mb-1.5">
            Background music
          </label>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePlay()}
            placeholder="Paste a YouTube link…"
            className="w-full rounded-lg bg-night-light border border-bronze px-2.5 py-1.5 text-sm text-parchment placeholder:text-parchment/40 focus:outline-none focus:border-gold-bright"
          />
          <p className="text-[11px] text-parchment/50 mt-1.5 leading-snug">
            Plays in a small visible player (YouTube may show ads). Leave blank
            to use a local file at <code>public/music/theme.mp3</code>.
          </p>
          <div className="flex justify-end gap-2 mt-2.5">
            <button
              onClick={() => setPanelOpen(false)}
              className="btn-rune rounded px-3 py-1 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handlePlay}
              className="btn-gold rounded px-4 py-1 text-xs"
            >
              Play
            </button>
          </div>
        </div>
      )}

      {/* Round toggle button when nothing is playing. */}
      {!playing && (
        <button
          onClick={() => setPanelOpen((o) => !o)}
          aria-label="Background music"
          title="Background music"
          className="btn-rune rounded-full w-11 h-11 flex items-center justify-center text-lg shadow-lg"
        >
          <span aria-hidden>🎵</span>
        </button>
      )}
    </div>
  );
}
