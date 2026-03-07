# Requirements

## Issue #28 - Startup Bundle Optimization

- **WHEN** the application first loads, **THE SYSTEM SHALL** avoid downloading Phaser and the full game engine in the initial startup bundle.  
  **Acceptance:** the Phaser runtime is loaded through a lazy boundary or deferred import path.
- **WHEN** the Phaser chunk is still large because of the engine dependency, **THE SYSTEM SHALL** isolate that weight from the critical startup path and document the resulting chunking strategy.  
  **Acceptance:** build output shows a materially smaller initial `index` bundle and any remaining warning is removed or explicitly justified in code/configuration.
- **WHEN** the game area is waiting for the deferred game engine, **THE SYSTEM SHALL** show a polished loading state instead of an empty canvas region.  
  **Acceptance:** the game panel renders a styled fallback with clear copy while the lazy chunk loads.
- **WHEN** the change is implemented, **THE SYSTEM SHALL** preserve gameplay behavior and pass validation.  
  **Acceptance:** `npm run lint`, `npm run typecheck`, `npm run test:run`, and `npm run build` all pass.
