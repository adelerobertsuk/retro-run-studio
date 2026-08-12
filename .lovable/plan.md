# 8-Bit Runner — Native App Shell

A mobile-first fitness + habit companion that turns run data into 8-bit arcade media. This first build delivers the full app with realistic mock data, plus real AI image rendering in the Media Lab. Backend and Strava sync come in a later pass.

## What gets built

**App container**
- Centered phone frame on desktop, full-bleed on mobile.
- Deep dark theme (#0F172A base) with emerald (#10B981) and indigo (#6366F1) accents, system font stack (SF/Inter). No pixelated fonts or low-res CSS on UI chrome — pixel art appears only inside media canvases and sprite art.
- Bottom tab bar: Home, Quest, Media Lab, Arcade. Profile icon top-right opens Settings.

**Home**
- Animated hero viewport: pixel runner sprite jogging over a parallax city skyline (CSS/canvas loop, HD container).
- Life Force meter (0–100%) that rises as habits and runs are logged.
- Arcade Token balance in the header.
- Quick check-in cards: Hydrate, Sleep, Recovery — tap to log, awards tokens + Life Force.

**Quest**
- Dark month calendar grid with glowing checkmarks on run days, current streak badge.
- Weekly distance goal bar ("12 / 15 Miles Completed") and a short recent-run list.

**Media Lab**
- Hero Video Studio: 9:16 vertical preview panel with a scripted 8-bit beat-'em-up sequence — pixel avatar, city background, Strava-style HUD (distance/pace/speed), boss encounter beat, and a "LEVEL COMPLETE" stat screen. Rendered as an animated in-app preview from mock run stats; user can upload a photo to seed the avatar.
- Photo Share Cards: horizontal Dazz-Cam-style rig selector — RPG Trading Card, VHS-84, Hawkins Poster, PUMA '88. Upload a selfie, pick a rig, and get a real AI-rendered 8-bit portrait streamed in with progressive preview, composited into an HD card with stats and an editable "Adventurer Notes" field.
- Export row: Save to Camera Roll (downloads the composed PNG), Share to TikTok / IG Reels (Web Share), Attach to Strava (stubbed until sync exists).

**Arcade**
- App Store–style card grid of unlockable camera rigs, card skins, and video effects, each with "Unlock for X Tokens" and owned/locked states tied to the token balance.

**Settings**
- Native iOS-style grouped list: Notifications, Strava Account Sync ("Powered by Strava"), AI Avatar Consent, Audio toggles, plus profile header.

## Technical notes
- TanStack Start routes: `/` (Home), `/quest`, `/media`, `/arcade`, `/settings`, each with its own head metadata. Shared shell (tab bar + header) in a layout.
- Design tokens added to `src/styles.css` (oklch) — no hardcoded color utilities in components.
- Mock state (tokens, life force, habits, streak, runs, unlocks) lives in a single client store persisted to localStorage, structured so it can be swapped for Cloud tables later without touching UI.
- Card rendering: a `POST /api/generate-image` server route proxies the Lovable AI Gateway with SSE streaming (blurred partial frames → sharp final); the card is composed in a canvas for HD export. This needs Lovable Cloud enabled for the AI key.
- Video studio is a deterministic animated preview (sprite layers + HUD over a 9:16 canvas), not an encoded file, in this pass.

## Not in this pass
Real Strava OAuth and run import, cross-device persistence, encoded MP4 export, and any reuse of the other project's tables — all deferred to the backend pass.
