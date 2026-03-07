# [DESIGN006] - Startup Bundle Optimization

**Status:** Implemented  
**Created:** 2026-03-07  
**Author:** AI Agent

## 1. Overview

Issue #28 targets the oversized production startup bundle. The main culprit is the eager import chain from `App.tsx` to `PhaserGame.tsx` to `phaser` and the full game stack. The design introduces a React lazy boundary around the game surface so the UI shell loads first and the heavy engine loads asynchronously.

## 2. Requirements

- **WHEN** the application first paints, **THE SYSTEM SHALL** keep Phaser outside the critical startup bundle.  
  **Acceptance:** `App.tsx` loads the game canvas via `React.lazy` or equivalent deferred import.
- **WHEN** the game engine is still loading, **THE SYSTEM SHALL** present a polished placeholder state.  
  **Acceptance:** the game area shows a styled fallback message/spinner instead of a blank box.
- **WHEN** Vite builds the project, **THE SYSTEM SHALL** avoid the oversized startup bundle warning or explicitly justify any lazy-loaded engine chunk threshold.  
  **Acceptance:** the warning is removed or the threshold documents the deferred-engine rationale.
- **WHEN** the deferred loading path is added, **THE SYSTEM SHALL** preserve gameplay boot and the existing store-driven UI.  
  **Acceptance:** automated tests and production build continue to pass.

## 3. Architecture

```text
App shell
├── Stats / Shop / Footer / ToastProvider  # eager UI shell
└── Suspense boundary
    ├── Game loading fallback              # immediate visual placeholder
    └── Lazy PhaserGame component          # async imports Phaser + game config
```

## 4. Key Decisions

### 4.1 Split at the game surface

The lazy boundary belongs at `App.tsx` because the rest of the UI is lightweight and should remain interactive immediately.

### 4.2 Preserve UX with a styled fallback

A dedicated loading panel avoids layout shift and makes the deferred engine feel intentional rather than broken.

### 4.3 Keep chunk strategy explicit

If the Phaser async chunk remains large, Vite configuration should document why the warning threshold is adjusted after the startup path has been improved.

## 5. Risks & Mitigations

- **Risk:** Tests may fail because lazy components resolve asynchronously.  
  **Mitigation:** update tests to await the mocked game surface when needed.
- **Risk:** Phaser cleanup regressions after async initialization.  
  **Mitigation:** preserve the existing mount/destroy lifecycle inside `PhaserGame.tsx`.
- **Risk:** Warning remains after lazy-loading because Phaser is inherently large.  
  **Mitigation:** isolate the engine in its own async chunk and document/adjust the warning threshold only for that deferred chunk.

## 6. Validation

Validated on 2026-03-07 with:

- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

Observed build comparison:

- Before: `dist/assets/index-*.js` ≈ `1,459.55 kB` (`407.71 kB` gzip) with Vite warning
- After: `dist/assets/index-*.js` ≈ `202.92 kB` (`64.12 kB` gzip), plus deferred `game-engine` (`46.79 kB`) and `phaser-engine` (`1,208.02 kB`) async chunks with an explicit config justification
