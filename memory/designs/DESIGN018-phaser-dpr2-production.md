# DESIGN018 — Phaser DPR-2 Production (Issue #56)

Date: 2026-11-27
Issue: #56
Branch: `feat/phaser-dpr2`

## EARS Requirements

- **EARS-1:** When the game mounts, the Phaser backing store shall equal the displayed CSS board size multiplied by `min(devicePixelRatio, 2)`.
- **EARS-2:** While DPR is greater than 1, the scene camera shall zoom by `backingWidth / 800` and center on the 800x500 logical board.
- **EARS-3:** When the player clicks or moves over the board, pointer input shall convert to logical 800x500 coordinates.
- **EARS-4:** When the game resizes, the simulation and background shall resize to the logical size, not the backing-store size.
- **EARS-5:** When DPR is 1, the game shall still render exactly one backing pixel per displayed CSS pixel.
- **EARS-6:** The DPR ratio shall be capped at 2 to bound fill cost on 3x/4x displays.

## Design

- `createGameConfig(pixelRatio)` builds a Phaser config whose scale width/height are the logical board times the ratio; the scene instance receives the same ratio and logical size.
- `PhaserGame` measures the container’s displayed board size, computes `pixelRatio = displayWidth × min(DPR, 2) / 800`, and creates the game.
- `GameScene` centers/zooms the camera by that ratio, keeps all simulation/background at 800x500, and uses `pointer.worldX/worldY`.
- On resize, `gameSize / pixelRatio` restores logical dimensions.
- The Canvas spike and Phaser DPR-2 comparison spike from DESIGN017 remain opt-in tools; normal production now uses the DPR-aware Phaser path.

## Validation

- At DPR 2 / 880x550 CSS: backing **1760x1100**, no page errors.
- At DPR 1 / 880x550 CSS: backing **880x550**.
- Full suite: 532 tests across 46 files; lint, typecheck, and production build pass.
- Screenshot at DPR 2 shows crisp tier numerals, grid, health bars, and gold/armored bricks.

## Performance

DESIGN017 measured the same 1760x1100 Phaser path at ~105–108 ms/frame in headless Chrome with 50 balls, versus ~84–87 ms for the old blurry 800x500 buffer. The extra cost is the 4.84× pixel fill; this is the expected tradeoff for crisp DPR-2 output. Real-device validation is still recommended.

## Risks / Limits

- DPR is read at mount and capped at 2; moving a window between monitors with different DPR requires a reload.
- The displayed board size is measured once at mount; a major layout change that changes the canvas CSS size may need a reload. Resize still keeps gameplay logical.
