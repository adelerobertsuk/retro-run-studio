# Pixel Run Studio

# Context
Build 8-Bit Runner: a modern, high-grade fitness and habit companion that transforms Strava workout data into viral 8-bit arcade gameplay videos, cinematic movie posters, and retro RPG trading cards[span_0](start_span)[span_0](end_span). 

*IMPORTANT:* Reuse the existing Supabase backend setup, database tables, and Strava API connection hooks from @8-Bit Runner Arcade , but build the UI shell using ultra-clean, modern native mobile components (Inter/San Francisco system fonts). Avoid applying global low-res 8-bit CSS or pink color overrides to the app framework.

---

## Core Features (Priority Order)

1. **NATIVE APP CONTAINER & UX:**
   - Deep dark-mode aesthetic with crisp typography, generous padding, and clean native tabs.
   - 4-Tab Navigation Bar: [Home], [Quest], [Media Lab], [Arcade].
   - Settings accessed via top-right profile icon.

2. **TAB 1: HOME DASHBOARD:**
   - High-definition viewport at the top displaying the user's custom 8-bit runner sprite jogging against an animated city skyline.
   - "Life Force" energy meter (0–100%) that tops up when logging habits/runs.
   - Token balance header showing earned Arcade Tokens.
   - Daily Quick Check-In cards for non-running habits (Hydrate, Sleep, Recovery).

3. **TAB 2: QUEST TRACKER (STRANGER THINGS VIBE):**
   - High-grade dark calendar grid tracking daily run streaks with glowing retro checkmarks.
   - Weekly distance goal progress bar (e.g., "12 / 15 Miles Completed").

4. **TAB 3: MEDIA LAB (HERO GENERATOR ENGINE):**
   - **Hero Video Studio (Vertical 9:16 Format):**
     - Upload/Sync photo/video to preview an 8-bit side-scrolling beat-'em-up video[span_1](start_span)[span_1](end_span).
     - Includes pixel avatars matching outfits, local environment backgrounds, Strava HUD overlay (Distance, Pace, Speed), boss encounters, and "LEVEL COMPLETE" fireworks stat screens[span_2](start_span)[span_2](end_span).
   - **Photo Share Cards (HD Camera Rig Carousel):**
     - Horizontal Dazz Cam-style camera selector: [RPG Trading Card], [VHS-84], [Hawkins Poster], [PUMA '88].
     - HD rendering of user selfie transformed into 8-bit character artwork with Strava stats and custom "Adventurer Notes[span_3](start_span)"[span_3](end_span).
   - **Export Actions:** "Save to Camera Roll", "Share to TikTok / IG Reels", "Attach to Strava".

5. **TAB 4: ARCADE STORE (TOKEN GALLERY):**
   - Modern App Store-style card grid displaying unlockable camera rigs, trading card skins, and video effects.
   - Clear "Unlock for X Tokens" action buttons.

6. **SETTINGS PAGE (NATIVE iOS STYLE):**
   - Clean, list-based settings page with native toggles for Notifications, Strava Account Sync ("Powered by Strava"), AI Avatar Consent, and Audio.

---

## Visual Style & Design
- **Theme:** Ultra-clean native mobile dark mode (`#0F172A` background) with subtle neon accents (`#10B981` emerald green & `#6366F1` indigo).
- **Typography:** Standard native system font (Inter/San Francisco) for all UI text, settings, and navigation. 
- **Media:** Full high-definition rendering for all cards, user photos, and video previews.

---

## Technical Constraints & Safe-Guards
- Do NOT apply global pixelated fonts or low-resolution CSS styling to native UI buttons, inputs, or settings lists.
- Video previews must default to vertical **9:16 aspect ratio** suitable for TikTok and Instagram Reels.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://retro-run-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5e4053d4-68b8-4fa8-a227-31c7752b8a2a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
