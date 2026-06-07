// Core domain types for the trivia game.
// NOTE: This shape is intentionally serialisable (plain data, no functions) so
// the whole game state can later be synced to Firebase/Supabase for the
// multi-device "hybrid" mode without reworking the model.

export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  difficulty: Difficulty;
  /** Base points awarded for a correct answer. */
  points: number;
  prompt: string;
  /** Multiple-choice options shown on screen. */
  choices: string[];
  /** Index into `choices` of the correct option. */
  correctIndex: number;
  /** Optional flavour shown after the answer is revealed. */
  lore?: string;
  /** Loose topical tag (e.g. "Hobbits", "Battles") for future filtering. */
  category?: string;
}

export interface Team {
  id: string;
  name: string;
  /** Player display names. */
  members: string[];
  score: number;
  /** Visual identity for the team's map marker. */
  color: string;
}

/** Which high-level screen the app is showing. */
export type Phase = "home" | "setup" | "playing" | "victory";

/** Per-turn lifecycle within the "playing" phase. */
export type TurnStage =
  | "ready" // showing whose turn it is, waiting to reveal the question
  | "answering" // question + choices visible, moderator picks the team's answer
  | "revealed"; // answer revealed, showing result before advancing

export interface GameState {
  phase: Phase;
  winningScore: number;
  teams: Team[];
  /** Index into `teams` whose turn it currently is. */
  activeTeamIndex: number;
  turnStage: TurnStage;
  /** id of the question currently in play, or null between turns. */
  currentQuestionId: string | null;
  /** The choice index the moderator selected for the active team, or null. */
  selectedChoiceIndex: number | null;
  /** Whether the current question is flagged for double points. */
  doublePoints: boolean;
  /** Ids of questions already used, to avoid repeats. */
  usedQuestionIds: string[];
  /** id of the winning team once the game is over. */
  winnerId: string | null;
}
