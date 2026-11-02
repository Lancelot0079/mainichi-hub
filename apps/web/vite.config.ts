import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * GitHub Pages cannot set response headers, so the policy ships as a meta tag. It is added only to
 * production builds because Vite's dev server needs inline scripts and a websocket.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.github.com http://127.0.0.1:8765",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join("; ");

const contentSecurityPolicy = (): Plugin => ({
  name: "content-security-policy",
  apply: "build",
  transformIndexHtml: () => [
    {
      tag: "meta",
      attrs: { "http-equiv": "Content-Security-Policy", content: CSP },
      injectTo: "head-prepend",
    },
  ],
});

export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  // Inlined assets become `data:` URLs, which the Content Security Policy blocks for fonts.
  build: { assetsInlineLimit: 0 },
  plugins: [
    react(),
    contentSecurityPolicy(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Mainichi Hub",
        short_name: "Mainichi",
        description: "Hub de estudio de japonés.",
        lang: "es",
        display: "standalone",
        background_color: "#F1F2EE",
        theme_color: "#2E4A7D",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      workbox: {
        // Font files are split by Unicode range, so they are cached as they get used.
        globPatterns: ["**/*.{js,css,html,svg,png}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: { cacheName: "fonts", expiration: { maxEntries: 300 } },
          },
        ],
      },
    }),
  ],
});
