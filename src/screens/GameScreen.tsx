"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore, WRONG_ANSWER_PENALTY } from "../store/gameStore";
import { MiddleEarthMap } from "../components/MiddleEarthMap";
import type { Team } from "../types";

export function GameScreen() {
  const teams = useGameStore((s) => s.teams);
  const winningScore = useGameStore((s) => s.winningScore);
  const activeTeamIndex = useGameStore((s) => s.activeTeamIndex);
  const turnStage = useGameStore((s) => s.turnStage);

  const activeTeam = teams[activeTeamIndex];

  return (
    <main className="min-h-screen px-4 md:px-8 py-6 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-display tracking-[0.25em] text-bronze text-xs md:text-sm uppercase">
            Middle-earth Trivia
          </span>
          <SourceBadge />
        </div>
        <RestartControl />
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-2 gap-4">
        {teams.map((team, i) => (
          <ScorePill
            key={team.id}
            team={team}
            winningScore={winningScore}
            active={i === activeTeamIndex}
          />
        ))}
      </div>

      {/* The map */}
      <MiddleEarthMap teams={teams} winningScore={winningScore} />

      {/* Turn area */}
      <section className="panel-dark rounded-2xl p-6 md:p-8">
        <AnimatePresence mode="wait">
          {turnStage === "ready" && (
            <ReadyStage key="ready" activeTeam={activeTeam} />
          )}
          {turnStage === "answering" && <AnsweringStage key="answering" />}
          {turnStage === "revealed" && <RevealedStage key="revealed" />}
        </AnimatePresence>
      </section>
    </main>
  );
}

function stageMotion(children: React.ReactNode) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.div>
  );
}

function SourceBadge() {
  const source = useGameStore((s) => s.questionSource);
  const live = source === "opentdb";
  return (
    <span
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-bronze/50 px-2.5 py-0.5 text-[11px] tracking-wider text-parchment/60"
      title={
        live
          ? "Questions are coming live from the Open Trivia Database"
          : "Using the bundled question set (OpenTDB unavailable)"
      }
    >
      <span
        className={`w-2 h-2 rounded-full ${live ? "bg-green-400" : "bg-gold-bright"}`}
        aria-hidden
      />
      {live ? "Open Trivia DB" : "Bundled set"}
    </span>
  );
}

function RestartControl() {
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="btn-rune rounded-lg px-4 py-2 text-sm"
      >
        ↺ Restart
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 panel-dark rounded-lg px-3 py-2">
      <span className="text-parchment/80 text-sm hidden sm:inline">
        Reset the quest?
      </span>
      <button
        onClick={() => {
          startGame();
          setConfirming(false);
        }}
        className="btn-gold rounded-lg px-3 py-1.5 text-sm"
      >
        Restart
      </button>
      <button
        onClick={resetGame}
        className="btn-rune rounded-lg px-3 py-1.5 text-sm"
      >
        Quit to title
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="btn-rune rounded-lg px-3 py-1.5 text-sm"
      >
        Cancel
      </button>
    </div>
  );
}

function ScorePill({
  team,
  winningScore,
  active,
}: {
  team: Team;
  winningScore: number;
  active: boolean;
}) {
  const pct = Math.min(100, (team.score / winningScore) * 100);
  return (
    <div
      className={`panel-dark rounded-xl p-4 transition-all ${
        active ? "ring-2 ring-gold-bright scale-[1.02]" : "opacity-80"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-4 h-4 rounded-full shrink-0 border border-night"
            style={{ backgroundColor: team.color }}
          />
          <span className="font-display font-bold text-lg truncate">
            {team.name}
          </span>
          {active && (
            <span className="text-xs text-gold-bright font-display tracking-wider">
              ◆ TURN
            </span>
          )}
        </div>
        <span className="font-display text-2xl text-gilded shrink-0">
          {team.score}
          <span className="text-sm text-parchment/50">/{winningScore}</span>
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-night overflow-hidden border border-bronze/40">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: team.color }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </div>
    </div>
  );
}

function ReadyStage({ activeTeam }: { activeTeam: Team }) {
  const drawQuestion = useGameStore((s) => s.drawQuestion);
  return stageMotion(
    <div className="text-center">
      <p className="text-parchment/70 italic">Step forward,</p>
      <h2
        className="font-display font-bold text-3xl md:text-4xl my-2"
        style={{ color: activeTeam.color }}
      >
        {activeTeam.name}
      </h2>
      {activeTeam.members.length > 0 && (
        <p className="text-parchment/60 text-sm mb-4">
          {activeTeam.members.join(" · ")}
        </p>
      )}
      <button
        onClick={drawQuestion}
        className="btn-gold rounded-xl px-8 py-4 text-lg mt-4"
      >
        Reveal Question
      </button>
    </div>,
  );
}

function AnsweringStage() {
  const question = useGameStore((s) => s.getCurrentQuestion());
  const selectedChoiceIndex = useGameStore((s) => s.selectedChoiceIndex);
  const doublePoints = useGameStore((s) => s.doublePoints);
  const selectChoice = useGameStore((s) => s.selectChoice);
  const confirmAnswer = useGameStore((s) => s.confirmAnswer);

  if (!question) return null;
  const pts = question.points * (doublePoints ? 2 : 1);

  return stageMotion(
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <span className="font-display text-xs uppercase tracking-widest text-bronze">
          {question.category ?? "Lore"} · {question.difficulty}
        </span>
        <span className="font-display text-gold-bright">
          Worth {pts} pts
        </span>
      </div>

      {doublePoints && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4 text-center font-display font-bold tracking-widest text-ink bg-gradient-to-r from-gold-bright via-gold to-ember rounded-lg py-2 animate-ember"
        >
          ✦ DOUBLE POINTS ROUND ✦
        </motion.div>
      )}

      <h2 className="font-display text-2xl md:text-3xl text-center leading-snug mb-6">
        {question.prompt}
      </h2>

      <div className="grid sm:grid-cols-2 gap-3">
        {question.choices.map((choice, i) => {
          const selected = selectedChoiceIndex === i;
          return (
            <button
              key={i}
              onClick={() => selectChoice(i)}
              className={`text-left rounded-xl px-5 py-4 text-lg border transition-all ${
                selected
                  ? "bg-gold/25 border-gold-bright ring-2 ring-gold-bright"
                  : "bg-night-light border-bronze hover:border-gold"
              }`}
            >
              <span className="font-display text-gold-bright mr-2">
                {String.fromCharCode(65 + i)}.
              </span>
              {choice}
            </button>
          );
        })}
      </div>

      <p className="text-center text-parchment/50 text-sm mt-5">
        Moderator: tap the answer the team gave, then lock it in.
      </p>
      <div className="flex justify-center mt-4">
        <button
          onClick={confirmAnswer}
          disabled={selectedChoiceIndex === null}
          className="btn-gold rounded-xl px-8 py-3 text-lg"
        >
          Lock In Answer
        </button>
      </div>
    </div>,
  );
}

function RevealedStage() {
  const question = useGameStore((s) => s.getCurrentQuestion());
  const selectedChoiceIndex = useGameStore((s) => s.selectedChoiceIndex);
  const doublePoints = useGameStore((s) => s.doublePoints);
  const teams = useGameStore((s) => s.teams);
  const activeTeamIndex = useGameStore((s) => s.activeTeamIndex);
  const winnerId = useGameStore((s) => s.winnerId);
  const nextTurn = useGameStore((s) => s.nextTurn);

  if (!question) return null;

  const correct = selectedChoiceIndex === question.correctIndex;
  const gained = correct ? question.points * (doublePoints ? 2 : 1) : 0;
  const activeTeam = teams[activeTeamIndex];

  return stageMotion(
    <div>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {question.choices.map((choice, i) => {
          const isCorrect = i === question.correctIndex;
          const isWrongPick = i === selectedChoiceIndex && !correct;
          return (
            <div
              key={i}
              className={`rounded-xl px-5 py-4 text-lg border ${
                isCorrect
                  ? "bg-green-700/30 border-green-400"
                  : isWrongPick
                    ? "bg-red-800/30 border-red-400"
                    : "bg-night-light border-bronze/40 opacity-60"
              }`}
            >
              <span className="font-display text-gold-bright mr-2">
                {String.fromCharCode(65 + i)}.
              </span>
              {choice}
              {isCorrect && <span className="ml-2">✓</span>}
              {isWrongPick && <span className="ml-2">✗</span>}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <p
          className={`font-display text-3xl font-bold ${
            correct ? "text-green-400" : "text-red-400"
          }`}
        >
          {correct
            ? `Well met! +${gained} points`
            : `Driven back! −${WRONG_ANSWER_PENALTY} points`}
        </p>
        <p className="mt-1 text-parchment/80">
          {correct ? `${activeTeam.name} presses on with ` : `${activeTeam.name} falls back to `}
          <span className="text-gilded font-display">{activeTeam.score}</span>{" "}
          points.
        </p>
        {question.lore && (
          <p className="mt-4 max-w-2xl mx-auto text-parchment/70 italic">
            {question.lore}
          </p>
        )}

        <button
          onClick={nextTurn}
          className="btn-gold rounded-xl px-8 py-4 text-lg mt-6"
        >
          {winnerId ? "See the Victor" : "Next Team's Turn →"}
        </button>
      </div>
    </div>,
  );
}
