# ⚡ Whack-a-Mole

A fast-paced browser game with a Cyber/Arcade aesthetic, combo system, power-ups, and progressive difficulty — built with vanilla HTML, CSS, and JavaScript.

![Game Preview](https://img.shields.io/badge/status-playable-brightgreen)

## How to Play

1. Click **Start Game** — a 3-2-1-GO countdown begins
2. **Whack moles** as they pop out of holes by clicking/tapping them
3. Build **combos** by hitting consecutive moles without missing
4. Collect **power-ups** that appear randomly for bonus effects
5. Survive 30 seconds and aim for the highest score!

## Features

### 🔥 Combo System
| Combo | Points per Hit |
|-------|---------------|
| x1–x2 | 1 point |
| x3–x4 | 2 points |
| x5+   | 3 points |

Missing a mole (clicking an empty hole or letting one escape) resets your combo.

### ⚡ Power-Ups
Power-ups spawn every 6–10 seconds and last 5 seconds each:

- **⏸️ Freeze** — Pauses the countdown timer
- **⭐ Double** — All points are doubled
- **🐌 Slow** — Moles appear slower and stay visible longer

### 📈 Difficulty Curve
- Mole speed increases over time (800ms → 400ms minimum)
- Visible time decreases (1200ms → 500ms minimum)
- Creates urgency as the round progresses

### 🎮 Juice & Feedback
- Screen shake on hits (scales with combo)
- Particle bursts on successful whacks
- Haptic vibration on mobile devices
- Score float animations
- Neon HUD with real-time combo/timer warnings

### 🏆 High Score
Best score persists in `localStorage` across sessions.

## Tech Stack

- **HTML5** — Semantic markup with accessibility attributes
- **CSS3** — Custom properties, glassmorphism, `@media (prefers-reduced-motion)`, `100dvh`
- **JavaScript** — Vanilla ES2022, no dependencies at runtime
- **Fonts** — Orbitron (display) + Space Mono (body) via Google Fonts
- **Testing** — Jest + jsdom
- **CI/CD** — GitHub Actions (lint + deploy to GitHub Pages)

## Run Locally

```bash
# Clone the repo
git clone https://github.com/tcmucr/whack-a-mole.git
cd whack-a-mole

# Open in browser (no build step needed)
start index.html        # Windows
open index.html         # macOS
xdg-open index.html    # Linux
```

Or use any local server:

```bash
npx serve .
```

## Run Tests

```bash
# Install dev dependencies
npm install

# Run the test suite
npm test
```

Tests cover score calculation, combo multipliers, timer countdown, power-up activation/deactivation, difficulty scaling, and edge cases (empty clicks, double-clicks, game-over state).

## Project Structure

```
├── index.html          # Game markup
├── style.css           # Cyber/Arcade theme with design tokens
├── script.js           # Game logic (IIFE, strict mode)
├── script.test.js      # Jest test suite (34 tests)
├── jest.config.js      # Jest configuration
├── package.json        # Dependencies & scripts
└── .github/
    └── workflows/
        └── ci.yml      # Lint + test + deploy pipeline
```

## License

ISC
