# Active Context: Idle Bricks

## Current Work Focus

Memory Bank initialization completed. The project is in a functional MVP state with core gameplay working.

## Recent Changes

- Created Memory Bank structure with all core files
- Documented project architecture and patterns
- Established task tracking system
- Added GitHub Pages deployment workflow (`.github/workflows/deploy.yml`)
- Configured Vite base path for GitHub Pages deployment
- Implemented TASK003 balance pass (ball costs, tier cap 20, prestige scaling)

## Current State

The game is fully playable with:

- ✅ 6 ball types with unique behaviors
- ✅ Brick generation and tier progression (1-10)
- ✅ Shop for balls and upgrades
- ✅ Prestige system (10,000 bricks threshold)
- ✅ Auto-save every 30 seconds
- ✅ Offline earnings on return
- ✅ Responsive canvas sizing

## Next Steps

Potential areas for enhancement:

1. **Balance Tuning**: Adjust costs, damage, and progression curves
2. **Visual Polish**: Add particle effects, screen shake, sound effects
3. **New Features**: Achievements, statistics screen, more ball types
4. **Mobile Optimization**: Touch controls, UI scaling
5. **Accessibility**: Pause button, keyboard controls, colorblind modes

## Active Decisions

| Decision | Status | Notes |
|----------|--------|-------|
| State management | Resolved | Zustand with selectors |
| Large numbers | Resolved | break_infinity.js Decimal |
| Game engine | Resolved | Phaser 3 |
| Build tool | Resolved | Vite 7 |

## Known Considerations

- Phaser text objects are created/destroyed each frame for tier numbers (potential optimization)
- Explosive balls may cause performance issues with many simultaneous explosions
- Mobile touch events not explicitly handled (relies on Phaser defaults)
