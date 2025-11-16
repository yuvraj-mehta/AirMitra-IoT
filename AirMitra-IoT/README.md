# AirMitra-IoT Dashboard

## Project info

> Progressive Web App for monitoring and controlling smart home sensors and devices (ESP32 + MQTT + Supabase + React).

## How can I edit this code?

There are several ways of editing your application.

## Features

- Real-time MQTT sensor streaming (temperature, humidity, motion, device states)
- Responsive dashboard UI (React + Tailwind + shadcn-ui)
- Supabase persistence & serverless edge functions
- Progressive Web App (installable, offline caching, standalone)
- Service Worker with stale-while-revalidate asset strategy
- Web App Manifest (`public/manifest.json`) for install prompts
- Fan-themed favicon & theming

## Getting Started (Local Development)

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Tech Stack

| Layer         | Tech                             |
| ------------- | -------------------------------- |
| Frontend      | React + TypeScript + Vite        |
| UI Components | shadcn-ui + Tailwind CSS         |
| State/Data    | React Query (planned)            |
| Backend       | Supabase (DB + Auth + Functions) |
| Messaging     | MQTT (ESP32 <-> Web)             |
| PWA           | Manifest + Service Worker        |

## PWA Details

- Manifest: `public/manifest.json`
- Service Worker: `public/sw.js`
- Registration: `src/main.tsx`
- Offline Assets: root, HTML, favicon, manifest cached on install

To test PWA installability:

1. Run `npm run dev`
2. Open in Chrome at `http://localhost:8080`
3. Open DevTools > Application > Manifest (verify) & Service Workers
4. Use "Install App" (Chrome omnibox) if available

## Deployment

Build and deploy as any static site:

```sh
npm run build
# Deploy dist/ to Netlify, Vercel, Cloudflare Pages, or static host
```

Ensure headers allow service worker (`service-worker-allowed` if nested) – here it's at root so no extra config.

## Future Enhancements

- Add push notifications for threshold alerts
- Add background sync for queued user commands offline
- Add advanced caching (Workbox / vite-plugin-pwa)
- Convert SVG favicon to multi-size PNG set for broader install surface

## License / Attribution

Internal project. All generated Lovable boilerplate removed and replaced with custom AirMitra-IoT implementation.
