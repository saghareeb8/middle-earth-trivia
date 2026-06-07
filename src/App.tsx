import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "./store/gameStore";
import { HomeScreen } from "./screens/HomeScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { GameScreen } from "./screens/GameScreen";
import { VictoryScreen } from "./screens/VictoryScreen";
import { MusicPlayer } from "./components/MusicPlayer";

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="min-h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="min-h-full"
        >
          {phase === "home" && <HomeScreen />}
          {phase === "setup" && <SetupScreen />}
          {phase === "playing" && <GameScreen />}
          {phase === "victory" && <VictoryScreen />}
        </motion.div>
      </AnimatePresence>

      <MusicPlayer />
    </div>
  );
}
