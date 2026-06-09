import type { Difficulty, Question } from "@/types";
import { POINTS_BY_DIFFICULTY } from "@/data/questions";

// ── Open Trivia Database (https://opentdb.com) ───────────────────────────
// Fetched server-side (from the /api/questions route) so we avoid CORS and
// keep the option of adding a key/caching later. OpenTDB rate-limits to ~1
// request / 5s per IP, so we pull a whole batch in a single call at game start.

interface OpenTdbResult {
  type: string;
  difficulty: Difficulty;
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTdbResponse {
  response_code: number; // 0 = ok, 1 = no results, 2 = bad param, 5 = rate-limited
  results: OpenTdbResult[];
}

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Fetch a batch of multiple-choice questions from OpenTDB and reshape them
 * into the app's `Question` type. Throws on any non-OK response so the caller
 * can fall back to the bundled bank.
 *
 * @param amount  how many to fetch (1–50)
 * @param category OpenTDB category id (default 9 = General Knowledge)
 */
export async function fetchOpenTdbQuestions(
  amount = 30,
  category = 9,
): Promise<Question[]> {
  const url =
    `https://opentdb.com/api.php?amount=${amount}` +
    `&category=${category}&type=multiple&encode=url3986`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`OpenTDB HTTP ${res.status}`);

  const data: OpenTdbResponse = await res.json();
  if (data.response_code !== 0 || !data.results?.length) {
    throw new Error(`OpenTDB response_code ${data.response_code}`);
  }

  return data.results.map((r, i): Question => {
    const correct = decode(r.correct_answer);
    const choices = shuffle([correct, ...r.incorrect_answers.map(decode)]);
    return {
      id: `otdb-${Date.now().toString(36)}-${i}`,
      difficulty: r.difficulty,
      points: POINTS_BY_DIFFICULTY[r.difficulty],
      prompt: decode(r.question),
      choices,
      correctIndex: choices.indexOf(correct),
      category: decode(r.category),
    };
  });
}
