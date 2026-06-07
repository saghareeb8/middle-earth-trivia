# Middle-earth Trivia

A Lord of the Rings trivia party game, built as an installable **Progressive Web App**.
Two teams race from **the Shire to Mount Doom** along a Middle-earth map — first to the
winning score claims victory.

> **v1 (this build):** single shared screen, designed for a TV via HDMI. A moderator
> runs the game; teams answer aloud and the moderator records each team's choice.

## Tech stack

| Concern        | Choice                              |
| -------------- | ----------------------------------- |
| Framework      | React + TypeScript                  |
| Build / dev    | Vite                                |
| Styling        | Tailwind CSS v4 (custom LOTR theme) |
| Animation      | Framer Motion (map markers, screens)|
| State          | Zustand                             |
| PWA / offline  | vite-plugin-pwa (Workbox)           |
| Hosting        | Netlify (static `dist/`)            |

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

## Deploy to Netlify

The repo includes `netlify.toml`, so no dashboard config is needed:

- **Build command:** `npm run build`
- **Publish directory:** `dist`

Connect the repo in Netlify (or `netlify deploy --prod` with the CLI) and it ships.
The SPA redirect rule is already set so refreshes resolve correctly.

## How a game flows

1. **Home** → *Begin the Quest*.
2. **Setup** → name both teams, add members, pick the score to win (default 100).
3. **Play** (turn-based):
   - It's a team's turn → *Reveal Question*.
   - A multiple-choice question appears. The moderator taps the answer the team gave,
     then *Locks In*.
   - Correct answers award points (and occasionally **double points**), advancing the
     team's marker along the map.
   - Play passes to the next team.
4. First team to the winning score → **Victory** screen.

## Editing the question bank

All questions live in [`src/data/questions.ts`](src/data/questions.ts) as a typed array.
Each entry has a difficulty (`easy` / `medium` / `hard`), point value, prompt, choices,
the correct index, and optional lore. Drop in your full LOTR set using the same shape.

Points per difficulty are set in `POINTS_BY_DIFFICULTY`; the random double-points chance
is `DOUBLE_POINTS_CHANCE` in [`src/store/gameStore.ts`](src/store/gameStore.ts).

## Architecture note — built to grow into multi-device

All game state lives in one Zustand store ([`src/store/gameStore.ts`](src/store/gameStore.ts))
as plain, serialisable data, mutated only through actions. This is deliberate: the planned
**hybrid mode** (players join a lobby via code/QR on their phones, while the moderator's
device drives the TV) can be added by mirroring this store to a realtime backend
(Firebase/Supabase) — pushing on each action and calling `hydrate()` on remote changes —
**without rewriting the game logic or UI**.
