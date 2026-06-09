import { useGameStore } from "../store/gameStore";

export function HomeScreen() {
  const goToSetup = useGameStore((s) => s.goToSetup);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-display tracking-[0.35em] text-bronze text-sm md:text-base uppercase mb-4">
        A Lord of the Rings Trivia Quest
      </p>
      <h1 className="text-gilded font-title text-5xl md:text-7xl leading-tight max-w-4xl">
        Middle-earth Trivia
      </h1>
      <p className="mt-6 max-w-xl text-lg md:text-xl text-parchment/80 italic">
        Two fellowships. One road from the Shire to Mount Doom. Answer wisely —
        the first to reach the fire claims victory.
      </p>

      <button
        onClick={goToSetup}
        className="btn-gold mt-12 rounded-xl px-10 py-4 text-xl"
      >
        Begin the Quest
      </button>

      <p className="mt-16 text-sm text-parchment/50 max-w-md">
        Best played on the big screen. A moderator runs the game; teams answer
        aloud and the moderator records their choice.
      </p>
    </main>
  );
}
