# Active Context: Idle Bricks

## Current Work Focus

Memory Bank initialization completed. The project is in a functional MVP state with core gameplay working.

## Recent Changes

- Fixed TypeScript errors in `GameScene.ts`:
  - Removed unused `trailGraphics` property
  - Removed invalid `add: false` property from `make.graphics`
  - Fixed `BallTypeConfig` type errors by using `ball.type` instead of `config.type`
- Fixed test suite failures:
  - Updated `App.test.tsx` and `Shop.test.tsx` to match new Lucide icon usage
  - Verified all tests pass with `npm run test:run`
  - Verified typecheck and linting pass
- Implemented TASK004 Visual Polish:
  - Added `lucide-react` icons to UI
  - Integrated "Rajdhani" Google Font
  - Added particle effects, screen shake, and ball trails
  - Implemented floating text for damage/coins
  - Optimized text rendering in `GameScene.ts` (fixed performance bottleneck)
- Created Memory Bank structure with all core files
- Documented project architecture and patterns
- Established task tracking system
- Added GitHub Pages deployment workflow (`.github/workflows/deploy.yml`)
- Configured Vite base path for GitHub Pages deployment
- Implemented TASK003 balance pass (ball costs, tier cap 20, prestige scaling)

## Current State

The game is fully playable with:

- ✅ 6 ball types with unique behaviors
- ✅ Brick generation and tier progression (1-20)
- ✅ Shop for balls and upgrades
- ✅ Prestige system (scaling thresholds)
- ✅ Auto-save every 30 seconds
- ✅ Offline earnings on return
- ✅ Responsive canvas sizing
- ✅ Visual effects (particles, shake, trails)

## Next Steps

Potential areas for enhancement:

1. **Sound Effects**: Add audio feedback for hits, purchases, etc.
2. **New Features**: Achievements, statistics screen, more ball types
3. **Mobile Optimization**: Touch controls, UI scaling
4. **Accessibility**: Pause button, keyboard controls, colorblind modes

## Active Decisions

| Decision | Status | Notes |
|----------|--------|-------|
| State management | Resolved | Zustand with selectors |
| Large numbers | Resolved | break_infinity.js Decimal |
| Game engine | Resolved | Phaser 3 |
| Build tool | Resolved | Vite 7 |

## Known Considerations

- Explosive balls may cause performance issues with many simultaneous explosions (mitigated by particle pooling/limits)
- Mobile touch events not explicitly handled (relies on Phaser defaults)
