# [DESIGN004] - Visual Polish & Game Juice

**Status:** Draft
**Created:** 2025-11-29
**Author:** AI Agent

## 1. Overview

This design focuses on elevating the visual quality of "Idle Bricks" through "Game Juice" (visual feedback) and UI polish. The goal is to make the game feel more responsive, satisfying, and professional without compromising performance.

## 2. Goals

-   **Enhance Feedback:** Provide clear visual cues for game events (damage, destruction, income).
-   **Improve Aesthetics:** Unify the UI with consistent iconography and typography.
-   **Add "Juice":** Implement particle effects, screen shake, and trails to make interactions feel impactful.
-   **Maintain Performance:** Ensure visual effects do not degrade framerate, especially with high object counts.

## 3. Scope

### 3.1. UI Enhancements (React)
-   **Iconography:** Replace text labels with `lucide-react` icons (Coins, Bricks, Damage, Speed, etc.).
-   **Typography:** Integrate a gaming-focused font (e.g., "Rajdhani" or "Press Start 2P") for headers and numbers.
-   **Animations:** Add "pulse" effects for affordable upgrades and smooth progress bars for prestige tracking.
-   **Modals:** Replace native alerts with styled React modals.

### 3.2. Game Effects (Phaser)
-   **Particle Systems:**
    -   **Brick Destruction:** Burst of colored debris matching the brick's tier color.
    -   **Ball Trails:** Motion trails for high-speed or special balls (Fast, Sniper).
-   **Screen Shake:** Subtle camera shake on heavy impacts (Explosive balls).
-   **Floating Text:** "Pop-up" numbers for damage dealt and coins earned.
-   **Optimization:** Efficient text rendering (already partially implemented) and object pooling for particles/text.

## 4. Technical Design

### 4.1. UI Architecture
-   **Icons:** Import specific icons from `lucide-react` to minimize bundle size.
    -   `CircleDollarSign` (Coins)
    -   `BrickWall` (Bricks)
    -   `Zap` (Speed)
    -   `Crosshair` (Sniper)
    -   `Bomb` (Explosive)
-   **Theming:** Define CSS variables for the new font family and use them in `App.css`.

### 4.2. Phaser Particle System
-   **Manager:** Use a single `Phaser.GameObjects.Particles.ParticleEmitterManager` (or `ParticleEmitter` in Phaser 3.60+) per texture type if possible, or simple graphics-based particles for performance.
-   **Implementation:**
    -   Create a `ParticleManager` class to handle emission events.
    -   Use `createEmitter` with configuration for speed, lifespan, and alpha fading.

### 4.3. Floating Text System
-   **Pooling:** Create a pool of `Phaser.GameObjects.Text` objects to avoid constant instantiation/garbage collection.
-   **Behavior:** Text spawns at event location, floats upward (`y -= speed`), and fades out (`alpha -= decay`).

### 4.4. Screen Shake
-   **Trigger:** `this.cameras.main.shake(duration, intensity)`
-   **Config:**
    -   Explosive: `duration: 100ms`, `intensity: 0.005`
    -   Heavy Hit: `duration: 50ms`, `intensity: 0.002`

## 5. Implementation Plan

1.  **UI Polish:**
    -   Install `lucide-react` (Done).
    -   Update `Shop.tsx`, `Stats.tsx`, `Footer.tsx` with icons.
    -   Add font to `index.html` and CSS.
2.  **Game Effects:**
    -   Implement `ParticleManager` in `GameScene`.
    -   Add trails to balls.
    -   Add screen shake on specific collision events.
3.  **Floating Text:**
    -   Implement `FloatingTextManager` with pooling.
    -   Hook into `damageBrick` and `addCoins` events.

## 6. Risks & Mitigations

-   **Performance:** Too many particles/text objects can lag the game.
    -   *Mitigation:* Hard limit on active particles/text. Use object pooling.
-   **Visual Clutter:** Too much feedback can obscure gameplay.
    -   *Mitigation:* Tune particle counts and text size. Make effects optional in settings if needed (future scope).
