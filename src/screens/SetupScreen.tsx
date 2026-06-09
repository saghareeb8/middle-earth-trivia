"use client";

import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import type { Team } from "../types";

const SCORE_PRESETS = [50, 100, 150, 200];

export function SetupScreen() {
  const teams = useGameStore((s) => s.teams);
  const winningScore = useGameStore((s) => s.winningScore);
  const setWinningScore = useGameStore((s) => s.setWinningScore);
  const setQuestions = useGameStore((s) => s.setQuestions);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);

  const [loading, setLoading] = useState(false);

  const canStart = teams.every((t) => t.name.trim().length > 0);

  // Pull a fresh batch of questions from OpenTDB (via our API route), then
  // begin. If anything fails, the store keeps the bundled bank as a fallback.
  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/questions?amount=30");
      const data = await res.json();
      if (Array.isArray(data.questions)) {
        const source = data.source === "opentdb" ? "opentdb" : "fallback";
        setQuestions(data.questions, source);
        console.info(
          `[questions] loaded ${data.questions.length} from "${source}"`,
          data.error ? `(upstream error: ${data.error})` : "",
        );
      }
    } catch (e) {
      // Couldn't even reach our API route (fully offline) — keep bundled set.
      setQuestions([], "bundled");
      console.warn("[questions] fetch failed; using bundled set", e);
    } finally {
      setLoading(false);
      startGame();
    }
  };

  return (
    <main className="min-h-screen px-4 md:px-8 py-10 max-w-6xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-gilded font-display font-bold text-3xl md:text-5xl">
          Gather Your Fellowships
        </h1>
        <p className="mt-3 text-parchment/70 italic">
          Name each team, add its members, and set the score that wins the day.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {teams.map((team, i) => (
          <TeamCard key={team.id} team={team} teamIndex={i} />
        ))}
      </div>

      {/* Winning score */}
      <section className="panel-dark rounded-2xl p-6 mt-6">
        <h2 className="font-display text-gold-bright text-xl mb-4">
          Score to Win
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {SCORE_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setWinningScore(preset)}
              className={`btn-rune rounded-lg px-5 py-2 ${
                winningScore === preset ? "ring-2 ring-gold-bright" : ""
              }`}
            >
              {preset}
            </button>
          ))}
          <label className="flex items-center gap-2 ml-2 text-parchment/80">
            <span className="text-sm">Custom</span>
            <input
              type="number"
              min={10}
              step={10}
              value={winningScore}
              onChange={(e) => setWinningScore(Number(e.target.value))}
              className="w-24 rounded-lg bg-night-light border border-bronze px-3 py-2 text-parchment focus:outline-none focus:border-gold-bright"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-10">
        <button
          onClick={resetGame}
          className="btn-rune rounded-xl px-6 py-3"
        >
          ← Back
        </button>
        <button
          onClick={handleStart}
          disabled={!canStart || loading}
          className="btn-gold rounded-xl px-10 py-4 text-xl"
        >
          {loading ? "Summoning questions…" : "Set Out on the Road"}
        </button>
      </div>
      {!canStart && (
        <p className="text-center text-ember/90 mt-3 text-sm">
          Both teams need a name before you can begin.
        </p>
      )}
    </main>
  );
}

function TeamCard({ team, teamIndex }: { team: Team; teamIndex: number }) {
  const setTeamName = useGameStore((s) => s.setTeamName);
  const addMember = useGameStore((s) => s.addMember);
  const removeMember = useGameStore((s) => s.removeMember);
  const [draft, setDraft] = useState("");

  const commitMember = () => {
    if (!draft.trim()) return;
    addMember(teamIndex, draft);
    setDraft("");
  };

  return (
    <section
      className="panel-parchment rounded-2xl p-6"
      style={{ borderColor: team.color }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          className="inline-block w-5 h-5 rounded-full border-2 border-ink"
          style={{ backgroundColor: team.color }}
          aria-hidden
        />
        <input
          value={team.name}
          onChange={(e) => setTeamName(teamIndex, e.target.value)}
          placeholder="Team name"
          className="flex-1 bg-transparent font-display text-2xl text-ink border-b border-bronze/50 focus:outline-none focus:border-bronze pb-1"
        />
      </div>

      <label className="block text-sm font-semibold text-ink/70 mb-2">
        Members
      </label>
      <div className="flex gap-2 mb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commitMember()}
          placeholder="Add a member…"
          className="flex-1 rounded-lg bg-white/40 border border-bronze/50 px-3 py-2 text-ink placeholder:text-ink/40 focus:outline-none focus:border-bronze"
        />
        <button
          onClick={commitMember}
          className="rounded-lg px-4 py-2 font-display font-semibold text-parchment bg-bark hover:bg-ink transition-colors"
        >
          Add
        </button>
      </div>

      {team.members.length === 0 ? (
        <p className="text-ink/40 italic text-sm">No members yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {team.members.map((m, mi) => (
            <li
              key={mi}
              className="flex items-center gap-2 rounded-full bg-white/50 border border-bronze/40 pl-3 pr-2 py-1 text-ink"
            >
              <span>{m}</span>
              <button
                onClick={() => removeMember(teamIndex, mi)}
                aria-label={`Remove ${m}`}
                className="w-5 h-5 rounded-full bg-bronze/30 hover:bg-ember hover:text-white text-ink/70 leading-none text-sm"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
