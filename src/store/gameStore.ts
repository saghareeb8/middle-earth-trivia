import { create } from "zustand";
import type { GameState, Question, Team } from "../types";
import { QUESTIONS } from "../data/questions";

// Chance (0..1) that a freshly drawn question is flagged for double points.
const DOUBLE_POINTS_CHANCE = 0.2;

// A wrong answer drives the team back one "step" on the road (points lost,
// floored at 0). Kept as a flat step so a stumble feels consistent regardless
// of the question's value.
export const WRONG_ANSWER_PENALTY = 10;

const TEAM_COLORS = ["var(--color-team-blue)", "var(--color-team-red)"];

let idCounter = 0;
const uid = () => `team-${Date.now().toString(36)}-${idCounter++}`;

function makeTeam(name: string, color: string): Team {
  return { id: uid(), name, members: [], score: 0, color };
}

// ── The store ─────────────────────────────────────────────────────────────
// All game state lives here as plain serialisable data. Actions are the only
// way it mutates. To add multi-device sync later, mirror this state to/from
// Firebase by (a) pushing on every action and (b) calling `hydrate()` on
// remote changes — no component code needs to change.

interface GameStore extends GameState {
  /** The active question bank. Loaded from OpenTDB at game start; falls back
   *  to the bundled set if the fetch fails (e.g. offline). */
  questionPool: Question[];

  // ── Setup actions ──
  /** Replace the active question bank (and reset which have been used). */
  setQuestions: (questions: Question[]) => void;
  setWinningScore: (score: number) => void;
  setTeamName: (teamIndex: number, name: string) => void;
  addMember: (teamIndex: number, name: string) => void;
  removeMember: (teamIndex: number, memberIndex: number) => void;
  goToSetup: () => void;
  startGame: () => void;

  // ── Turn actions ──
  drawQuestion: () => void;
  selectChoice: (choiceIndex: number) => void;
  confirmAnswer: () => void;
  nextTurn: () => void;

  // ── Lifecycle ──
  resetGame: () => void;
  newGameSameTeams: () => void;
  /** Replace state from an external source (e.g. a future sync adapter). */
  hydrate: (state: Partial<GameState>) => void;

  // ── Selectors / helpers ──
  getCurrentQuestion: () => Question | null;
}

function initialTeams(): Team[] {
  return [
    makeTeam("The Fellowship", TEAM_COLORS[0]),
    makeTeam("The Eagles", TEAM_COLORS[1]),
  ];
}

const initialState: GameState = {
  phase: "home",
  winningScore: 100,
  teams: initialTeams(),
  activeTeamIndex: 0,
  turnStage: "ready",
  currentQuestionId: null,
  selectedChoiceIndex: null,
  doublePoints: false,
  usedQuestionIds: [],
  winnerId: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // Start with the bundled bank; replaced once OpenTDB questions load.
  questionPool: QUESTIONS,

  setQuestions: (questions) =>
    set({
      questionPool: questions.length > 0 ? questions : QUESTIONS,
      usedQuestionIds: [],
    }),

  setWinningScore: (score) =>
    set({ winningScore: Math.max(10, Math.round(score)) }),

  setTeamName: (teamIndex, name) =>
    set((s) => ({
      teams: s.teams.map((t, i) => (i === teamIndex ? { ...t, name } : t)),
    })),

  addMember: (teamIndex, name) =>
    set((s) => {
      const clean = name.trim();
      if (!clean) return {};
      return {
        teams: s.teams.map((t, i) =>
          i === teamIndex ? { ...t, members: [...t.members, clean] } : t,
        ),
      };
    }),

  removeMember: (teamIndex, memberIndex) =>
    set((s) => ({
      teams: s.teams.map((t, i) =>
        i === teamIndex
          ? { ...t, members: t.members.filter((_, m) => m !== memberIndex) }
          : t,
      ),
    })),

  goToSetup: () => set({ phase: "setup" }),

  startGame: () =>
    set((s) => ({
      phase: "playing",
      teams: s.teams.map((t) => ({ ...t, score: 0 })),
      activeTeamIndex: 0,
      turnStage: "ready",
      currentQuestionId: null,
      selectedChoiceIndex: null,
      doublePoints: false,
      usedQuestionIds: [],
      winnerId: null,
    })),

  drawQuestion: () =>
    set((s) => {
      const bank = s.questionPool.length > 0 ? s.questionPool : QUESTIONS;
      const remaining = bank.filter((q) => !s.usedQuestionIds.includes(q.id));
      // If the bank is exhausted, recycle (keeps a long party going).
      const pool = remaining.length > 0 ? remaining : bank;
      const usedReset = remaining.length > 0 ? s.usedQuestionIds : [];
      const q = pool[Math.floor(Math.random() * pool.length)];
      return {
        currentQuestionId: q.id,
        usedQuestionIds: [...usedReset, q.id],
        selectedChoiceIndex: null,
        doublePoints: Math.random() < DOUBLE_POINTS_CHANCE,
        turnStage: "answering",
      };
    }),

  selectChoice: (choiceIndex) =>
    set((s) => (s.turnStage === "answering" ? { selectedChoiceIndex: choiceIndex } : {})),

  confirmAnswer: () =>
    set((s) => {
      const q = s.questionPool.find((x) => x.id === s.currentQuestionId);
      if (!q || s.selectedChoiceIndex === null) return {};

      const correct = s.selectedChoiceIndex === q.correctIndex;
      // Right: gain the question's value (doubled on a double-points round).
      // Wrong: driven back a step (lose a flat penalty, never below 0).
      const delta = correct
        ? q.points * (s.doublePoints ? 2 : 1)
        : -WRONG_ANSWER_PENALTY;

      const teams = s.teams.map((t, i) =>
        i === s.activeTeamIndex
          ? {
              ...t,
              score: Math.max(0, Math.min(t.score + delta, s.winningScore)),
            }
          : t,
      );

      const winner = teams.find((t) => t.score >= s.winningScore) ?? null;

      return {
        teams,
        turnStage: "revealed",
        winnerId: winner ? winner.id : null,
      };
    }),

  nextTurn: () =>
    set((s) => {
      // If someone already won, move to the victory screen instead.
      if (s.winnerId) return { phase: "victory" };
      return {
        activeTeamIndex: (s.activeTeamIndex + 1) % s.teams.length,
        turnStage: "ready",
        currentQuestionId: null,
        selectedChoiceIndex: null,
        doublePoints: false,
      };
    }),

  resetGame: () => set({ ...initialState, teams: initialTeams() }),

  newGameSameTeams: () =>
    set((s) => ({
      ...initialState,
      winningScore: s.winningScore,
      teams: s.teams.map((t) => ({ ...t, score: 0 })),
      phase: "setup",
    })),

  hydrate: (state) => set(state),

  getCurrentQuestion: () => {
    const { currentQuestionId, questionPool } = get();
    return currentQuestionId
      ? questionPool.find((q) => q.id === currentQuestionId) ?? null
      : null;
  },
}));
