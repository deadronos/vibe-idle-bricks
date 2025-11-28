# System Patterns: Idle Bricks

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                       React App                             │
│  ┌──────────┐  ┌───────────┐  ┌────────┐  ┌───────────┐   │
│  │  Stats   │  │   Shop    │  │ Footer │  │ PhaserGame│   │
│  └────┬─────┘  └─────┬─────┘  └────────┘  └─────┬─────┘   │
│       │              │                          │          │
│       └──────────────┼──────────────────────────┘          │
│                      │                                      │
│                      ▼                                      │
│              ┌───────────────┐                             │
│              │  Zustand Store │◄────────────────┐          │
│              │  (gameStore)   │                 │          │
│              └───────┬───────┘                 │          │
│                      │                          │          │
│                      ▼                          │          │
│              ┌───────────────┐                 │          │
│              │  Phaser Game  │─────────────────┘          │
│              │  (GameScene)  │ reads state, updates balls │
│              └───────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Centralized State (Single Source of Truth)

All game state lives in the Zustand store. Phaser reads from the store each frame and writes back updated positions.

```typescript
// Reading state in Phaser
const store = useGameStore.getState();
const balls = store.balls;

// Writing state from Phaser
useGameStore.setState({ balls: updatedBalls });
```

### 2. Immutable State Updates

State is never mutated directly. All updates create new objects/arrays.

```typescript
set({
  coins: state.coins.sub(cost),
  balls: [...state.balls, newBall],
});
```

### 3. Decimal Arithmetic for All Values

All numeric game values use `break_infinity.js` Decimal to handle large numbers.

```typescript
const newCoins = state.coins.add(amount.mul(prestigeBonus));
```

### 4. Configuration-Driven Ball Types

Ball behaviors are defined in a config object, making it easy to add new types.

```typescript
export const BALL_TYPES: Record<BallType, BallTypeConfig> = {
  basic: { speed: 3, damage: 1, pierce: false, ... },
  plasma: { speed: 4, damage: 2, pierce: true, ... },
};
```

### 5. Graphics Pooling

Phaser graphics objects are cached by ID and reused to avoid garbage collection.

```typescript
private ballGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
```

## Component Relationships

| Component | Responsibility | State Access |
|-----------|---------------|--------------|
| `App.tsx` | Layout container | None |
| `Stats.tsx` | Display coins, bricks broken, ball count | Read-only subscribe |
| `Shop.tsx` | Ball/upgrade purchases, prestige | Read + actions |
| `PhaserGame.tsx` | Mount Phaser canvas | None |
| `GameScene.ts` | Physics, collision, rendering | Read + write |
| `gameStore.ts` | All game state and logic | N/A (is the store) |

## Data Flow

1. **User Action** (Shop): Calls store action (e.g., `buyBall`)
2. **Store Update**: State changes, cost recalculated
3. **React Subscription**: Stats/Shop components re-render
4. **Phaser Read**: Next frame reads new balls from store
5. **Game Update**: Ball physics calculated, brick collisions detected
6. **Store Write**: Updated positions + brick destruction written back
7. **Repeat**: Continuous 60fps loop

## Save/Load Pattern

```typescript
// Save: Serialize Decimals to strings
const saveData = {
  coins: state.coins.toString(),
  balls: state.balls.map(b => b.type),
  timestamp: Date.now(),
};
localStorage.setItem('idleBricksSave', JSON.stringify(saveData));

// Load: Parse strings back to Decimals
const saveData = JSON.parse(localStorage.getItem('idleBricksSave'));
set({ coins: new Decimal(saveData.coins) });
```

## Collision Detection

Simple AABB (Axis-Aligned Bounding Box) collision with circle-to-rectangle test:

```typescript
ballCollidesWithBrick(ball, brick) {
  const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
  const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
  const dist = Math.hypot(ball.x - closestX, ball.y - closestY);
  return dist < ballRadius;
}
```

## Tier System

| Tier | Health | Value | Color |
|------|--------|-------|-------|
| 1 | 3 | 1 | Green |
| 2 | 6 | 2 | Blue |
| 3 | 9 | 3 | Yellow |
| ... | tier × 3 | tier | See getTierColor() |
| 10 | 30 | 10 | Amber |
