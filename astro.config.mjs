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
  /* Sam's data lives in localStorage, which is tied to the origin AND the path,
     so moving the app moves the saved log. Keep the built asset paths relative
     so the same dist/ works from a subdirectory as well as a domain root. */
  base: "./",
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
