import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// Background music player.
//
// IMPORTANT — copyright: do NOT ship the official Howard Shore LOTR score in a
// published app. Drop your own licensed or royalty-free "epic orchestral"
// track(s) into  public/music/  and list them below (filenames must match).
// See public/music/README.md for legal, free sources.
//
// The player loops the playlist, persists the volume, and respects browser
// autoplay rules (sound only starts from the user's click on the control).
// If no audio file is present it stays silent and shows a hint on hover.
// ─────────────────────────────────────────────────────────────────────────

interface Track {
  src: string;
  title: string;
}

const TRACKS: Track[] = [
  { src: "/music/theme.mp3", title: "Theme of Middle-earth" },
  // { src: "/music/battle.mp3", title: "The Riders of Rohan" },
];

const LS_KEY = "me-trivia-music";

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [index, setIndex] = useState(0);
  const [unavailable, setUnavailable] = useState(false);

  // Load persisted volume.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.volume === "number") setVolume(p.volume);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist volume; apply it live.
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ volume }));
    } catch {
      /* ignore */
    }
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // When the track changes while playing, continue with the new one.
  useEffect(() => {
    const a = audioRef.current;
    if (a && enabled) a.play().catch(() => setUnavailable(true));
  }, [index, enabled]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (enabled) {
      a.pause();
      setEnabled(false);
      return;
    }
    try {
      a.volume = volume;
      await a.play();
      setEnabled(true);
      setUnavailable(false);
    } catch {
      // Missing file or blocked — surface a gentle hint.
      setUnavailable(true);
    }
  };

  // Advance through the playlist (single track just loops itself).
  const handleEnded = () => {
    if (TRACKS.length > 1) setIndex((i) => (i + 1) % TRACKS.length);
    else audioRef.current?.play().catch(() => {});
  };

  if (TRACKS.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <audio
        ref={audioRef}
        src={TRACKS[index].src}
        loop={TRACKS.length === 1}
        onEnded={handleEnded}
        onError={() => enabled && setUnavailable(true)}
        preload="none"
      />

      {enabled && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Music volume"
          className="w-24 h-1.5 cursor-pointer accent-[var(--color-gold)]"
        />
      )}

      <button
        onClick={toggle}
        aria-label={enabled ? "Mute music" : "Play music"}
        title={
          unavailable
            ? "No track found — add one to public/music/ (see README)"
            : enabled
              ? "Mute music"
              : "Play music"
        }
        className="btn-rune rounded-full w-11 h-11 flex items-center justify-center text-xl leading-none shadow-lg"
      >
        <span aria-hidden>{enabled ? "🔊" : unavailable ? "🚫" : "🔈"}</span>
      </button>
    </div>
  );
}
