import { defineConfig } from "astro/config";

/* Static output, no adapter. There is no server: the app is built once and
   runs off a phone's home screen with no signal, so every route prerenders and
   nothing is server-rendered.

   No React and no Tailwind on purpose — see the Deviations note in CLAUDE.md.
   The interactive parts are checkbox toggles and countdown timers, which plain
   bundled <script> handles without shipping a runtime, and styles.css is the
   hand-built design system this app already has. */
export default defineConfig({
  output: "static",
  /* Published on GitHub Pages at <user>.github.io/softail-service/, so every
     built asset path starts with the repo name. Astro doesn't support a
     relative base: "./" came out as "/./_astro/…", which only works at a domain
     root. Rename the repo and this must change with it.

     Sam's data lives in localStorage, which is per origin (the github.io
     address), so it doesn't carry over from a local copy — use Log → Settings
     and backup to move it. */
  base: "/softail-service",
  build: {
    inlineStylesheets: "never",
    format: "file",
  },
  devToolbar: { enabled: false },
  vite: {
    build: {
      /* The service worker precaches by filename. Hashes are what make that
         cache bust correctly, so keep them, but keep the names readable. */
      assetsInlineLimit: 0,
    },
  },
});
