# Middle-Earth Trivia

A Lord of the Rings trivia party game, built as an installable **Progressive Web App**.
Two teams race from **the Shire to Mount Doom** along a Middle-earth map — first to the
winning score claims victory. Wrong answers send a team back a step.

> **v1:** single shared screen, designed for a TV via HDMI. A moderator runs the game;
> teams answer aloud and the moderator records each team's choice. Built on a Next.js
> server runtime so a multi-device hybrid (lobby join via code/QR) can be added later.

## Tech stack

| Concern        | Choice                                       |
| -------------- | -------------------------------------------- |
| Framework      | Next.js 14 (App Router) + React 18 + TS      |
| Styling        | Tailwind CSS v4 (`@tailwindcss/postcss`)     |
| Fonts          | `next/font/google` (Cinzel, EB Garamond, Uncial Antiqua) |
| Animation      | Framer Motion (map markers, screen transitions) |
| State          | Zustand (single `gameStore`)                 |
| PWA / offline  | `@ducanh2912/next-pwa` (Workbox) + `manifest.webmanifest` |
| Audio          | Native `<audio>` + YouTube IFrame embed      |
| Hosting        | Vercel (zero-config) or Netlify (`@netlify/plugin-nextjs`) |

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (type-check + PWA service worker)
npm run start    # run the production build locally
```

## Project structure

```
src/
  app/
    layout.tsx     # root layout: fonts, metadata, <html>/<body>
    page.tsx       # "use client" phase switcher (home → setup → playing → victory)
    globals.css    # Tailwind import + Middle-earth theme tokens
  screens/         # HomeScreen, SetupScreen, GameScreen, VictoryScreen
  components/       # MiddleEarthMap (SVG), MusicPlayer
  store/gameStore.ts  # single source of truth (turns, scoring, step-back)
  data/questions.ts   # the trivia bank
  types.ts
public/             # icons, favicon, manifest, music/
```

## Deploy

### Vercel (recommended for Next.js)
Import the GitHub repo at vercel.com — it auto-detects Next.js, no config needed.

### Netlify
`netlify.toml` sets the build command; Netlify auto-installs `@netlify/plugin-nextjs`
to provide the Next.js server runtime. Connect the repo and deploy.

## Editing the question bank

All questions live in [`src/data/questions.ts`](src/data/questions.ts) as a typed array
(difficulty, points, prompt, choices, correct index, lore). Points per difficulty are in
`POINTS_BY_DIFFICULTY`; the random double-points chance and the wrong-answer step-back
penalty are constants in [`src/store/gameStore.ts`](src/store/gameStore.ts).

## Background music

Click the 🎵 control (bottom-right) and paste a **YouTube link** (plays via the official
embedded player, kept visible per YouTube's ToS), or leave it blank to use a local file at
`public/music/theme.mp3`. Do **not** ship the copyrighted official score — see
[`public/music/README.md`](public/music/README.md) for royalty-free sources.

## Architecture note — built to grow into multi-device

All game state lives in one Zustand store ([`src/store/gameStore.ts`](src/store/gameStore.ts))
as plain, serialisable data, mutated only through actions. The planned **hybrid mode**
(players join a lobby on their phones while the moderator's device drives the TV) can be
added with the Next.js server runtime — API routes / realtime — plus mirroring this store,
without rewriting the game logic or UI.
