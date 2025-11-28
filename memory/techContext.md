# Tech Context: Idle Bricks

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI components and state presentation |
| TypeScript | 5.9.3 | Type safety and developer experience |
| Vite | 7.2.4 | Build tool and dev server |
| Phaser | 3.90.0 | 2D game engine for canvas rendering |
| Zustand | 5.0.8 | State management with subscription support |
| break_infinity.js | 2.2.0 | Arbitrary precision numbers for idle game math |

### Development Tools

- ESLint 9.39.1 with TypeScript and React plugins
- Node.js (requires v18+)

## Project Structure

```text
src/
├── components/       # React UI components
│   ├── Footer.tsx
│   ├── PhaserGame.tsx
│   ├── Shop.tsx
│   └── Stats.tsx
├── game/            # Phaser game logic
│   └── GameScene.ts
├── store/           # Zustand state management
│   └── gameStore.ts
├── types/           # TypeScript interfaces and constants
│   └── game.ts
├── utils/           # Helper functions
│   └── helpers.ts
├── App.tsx          # Main application component
└── main.tsx         # Entry point
```

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Technical Constraints

1. **Browser Compatibility**: Must work in modern browsers (Chrome, Firefox, Safari, Edge)
2. **Performance**: Maintain 60fps with 50+ bricks and 10+ balls
3. **Number Precision**: Use Decimal for all game values to support arbitrarily large numbers
4. **State Sync**: Zustand store is source of truth; Phaser reads from it each frame
5. **localStorage**: Save data persists in browser storage (no backend)

## Dependencies Rationale

- **Phaser**: Industry-standard 2D game framework with excellent performance
- **Zustand**: Minimal boilerplate, works seamlessly with React and external systems
- **break_infinity.js**: Purpose-built for incremental games, handles numbers up to e9e15

## Configuration Files

- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript base configuration
- `tsconfig.app.json` - Application TypeScript settings
- `tsconfig.node.json` - Node/build tool TypeScript settings
- `eslint.config.js` - ESLint rules for code quality
