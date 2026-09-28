# Tower Game (Stack Up!) 🏗️

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Vercel-success?style=for-the-badge&logo=vercel)](https://tower-games.vercel.app/)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

> **Tower Game (Stack Up!)** is a high-precision 3D tower building game built with HTML5 Canvas and ES6 JavaScript. Created by **Ravi Solanki**.

### 🌐 Live Demo
Play the game directly in your browser:  
👉 **[https://tower-games.vercel.app/](https://tower-games.vercel.app/)**

---

## 🎮 Game Overview

Test your timing and reflexes! Drop swinging building blocks from a crane onto a steadily rising foundation. Stack them as high as you can to reach the sky!

### Features
- **Precision Stacking**: Drop blocks at the exact center to trigger **PERFECT!** landings and build combo multipliers.
- **Dynamic Sky & Atmosphere**: Watch the sky shift through dawn, day, twilight, and space gradients as your tower climbs higher into the clouds.
- **Dynamic Flights**: Spot planes, birds, and hot-air balloons soaring past your skyscraper.
- **In-Game HUD Controls**:
  - **Pause / Resume**: Dedicated pause button, or press `P` / `Escape`.
  - **Mute / Audio Toggle**: One-touch mute toggle, or press `M`.
  - **Quick Exit**: Instant return to the Main Menu with state reset.
- **Juice & Feel**: Screen impact shakes, squash & stretch, and floating combo notifications on successful drops.
- **Platform Ready**: Zero-dependency frontend that runs out of the box on web, mobile, Vercel, and CrazyGames.

---

## 🕹️ Controls & Rules

- **Lives**: You start with **3 HP** (hearts in the top right).
- **Block Drop**: If a block misses the building or topples over, you lose 1 heart. When all 3 hearts are lost, the game ends.
- **Scoring**:
  - **Normal Landing**: +25 points.
  - **Perfect Landing**: +50 points.
  - **Consecutive Perfects**: Additional +25 points per consecutive streak (e.g. 1st = 50, 2nd = 75, 3rd = 100...).
- **Controls**:
  - **Drop Block**: Left Click, Tap screen, or press `Space` / `Enter`.
  - **Pause**: Click Pause icon or press `P` / `Escape`.
  - **Mute**: Click Sound icon or press `M`.

---

## 🚀 Deployment (Vercel)

This repository is pre-configured for instant zero-configuration deployment on **Vercel**:

1. Fork or import this repository into your Vercel account.
2. Framework Preset: **Other** (Static Site).
3. Root Directory: `./`
4. Click **Deploy**!

The repository includes `vercel.json` with pre-configured caching headers and clean URLs.

---

## 💻 Local Development

### Prerequisites
- Node.js (v16+)
- npm

### Installation & Running Locally

```bash
# Install dependencies
npm install

# Start local server
npm start
```

Open your browser at `http://localhost:8082`.

### Production Build

```bash
npm run build
```

Generates the compiled bundle in `dist/main.js`.

---

## 🎨 Credits & License

- **Developer**: Created by **Ravi Solanki**
- **Assets**: Licensed under CC0 / Open Source. Prioritizing [Kenney Assets](https://kenney.nl/assets) for UI and game audio.
- **License**: [MIT License](LICENSE)
