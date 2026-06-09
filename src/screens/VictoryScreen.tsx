"use client";

import { motion } from "framer-motion";
import { useGameStore } from "../store/gameStore";

export function VictoryScreen() {
  const teams = useGameStore((s) => s.teams);
  const winnerId = useGameStore((s) => s.winnerId);
  const newGameSameTeams = useGameStore((s) => s.newGameSameTeams);
  const resetGame = useGameStore((s) => s.resetGame);

  const winner = teams.find((t) => t.id === winnerId) ?? teams[0];
  const ranked = [...teams].sort((a, b) => b.score - a.score);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display tracking-[0.3em] text-bronze uppercase mb-3"
      >
        The Ring is destroyed
      </motion.p>

      <motion.h1
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        className="text-gilded font-display font-black text-5xl md:text-7xl"
        style={{ color: winner.color }}
      >
        {winner.name}
      </motion.h1>
      <p className="mt-4 text-2xl text-parchment/80 font-display">
        reaches Mount Doom victorious!
      </p>

      <div className="panel-dark rounded-2xl p-6 mt-10 w-full max-w-md">
        <h2 className="font-display text-gold-bright text-lg mb-4">
          Final Tally
        </h2>
        <ul className="space-y-3">
          {ranked.map((team, i) => (
            <li
              key={team.id}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="font-display text-bronze w-6">{i + 1}.</span>
                <span
                  className="w-4 h-4 rounded-full shrink-0 border border-night"
                  style={{ backgroundColor: team.color }}
                />
                <span className="font-display truncate">{team.name}</span>
              </span>
              <span className="font-display text-2xl text-gilded shrink-0">
                {team.score}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-10">
        <button
          onClick={newGameSameTeams}
          className="btn-gold rounded-xl px-8 py-4 text-lg"
        >
          Play Again — Same Teams
        </button>
        <button
          onClick={resetGame}
          className="btn-rune rounded-xl px-8 py-4 text-lg"
        >
          New Teams
        </button>
      </div>
    </main>
  );
}
