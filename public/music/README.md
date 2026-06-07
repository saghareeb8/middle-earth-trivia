# Background music

Drop your audio track(s) here and the in-app music button (bottom-right) will
play them on a loop.

## How to add a track

1. Put an audio file in this folder, e.g. `public/music/theme.mp3`
   (MP3 or OGG; MP3 has the widest browser support).
2. Make sure the filename matches an entry in `TRACKS` in
   [`src/components/MusicPlayer.tsx`](../../src/components/MusicPlayer.tsx).
   The default expects `theme.mp3`. To add more, uncomment / extend the list.
3. That's it — the player loops a single track, or cycles a playlist.

## ⚠️ Copyright — do NOT use the official soundtrack

The Lord of the Rings film score (Howard Shore) and the audiobook/film audio
are **copyrighted**. Shipping them on a public site is infringement and can get
the deployment taken down. Use music you have the rights to:

### Free / royalty-free "epic orchestral / fantasy" sources
- **Pixabay Music** — https://pixabay.com/music/ (free, no attribution required)
- **Incompetech (Kevin MacLeod)** — https://incompetech.com/music/ (CC-BY; credit the composer)
- **Free Music Archive** — https://freemusicarchive.org/ (filter by CC license)
- **YouTube Audio Library** — https://studio.youtube.com (Audio Library)
- **OpenGameArt** — https://opengameart.org/ (filter by CC0 / CC-BY)

Search terms that get the Middle-earth feel: *epic orchestral*, *fantasy
adventure*, *celtic orchestral*, *cinematic medieval*, *heroic strings*.

Whatever you pick, check the licence and keep attribution if the licence
requires it (a credit line in the app footer or this README is usually enough).
