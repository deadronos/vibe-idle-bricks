# DESIGN009 — Accessibility and onboarding batch (#72, #73, #74)

## Scope

Make the board's only manual interaction discoverable, give the canvas a name
and instructions, and make the existing reduced-motion setting honest.

## Decisions

- **Hint placement**: a native `<details>` under the canvas, whose summary is
  always visible: "Click a brick to chip it · How to play". Putting it in the
  board column (a new `.board-column` wrapper) keeps it attached to the board
  and lets the shop keep its own height. Native `<details>` gives keyboard
  toggling and screen-reader expansion for free.
- **Canvas semantics**: the Phaser canvas is decorative for AT (`role="img"`,
  aria-label "Brick game board") and the wrapper is a labelled `group`;
  `aria-describedby` points at the details element so the instructions are
  reachable without opening it visually.
- **Hover affordance**: `pointermove` hit-tests bricks through the existing
  spatial grid; the canvas cursor becomes `pointer` only over a brick. Click
  handling reuses the same `findBrickAt()` so hover and click cannot disagree.
- **Reduced motion**: the setting already suppressed particles and shake;
  floating text still drifted upward and the label claimed "trails" (which do
  not exist). The label now says "particles, shake, floating text" and popups
  stop drifting while still fading when reduced motion is on.
- **Short landscape**: the hint stays, at 0.7rem; the board and shop already
  share the viewport at 100dvh, so it costs ~18px of board height.

## Layout

`.board-column` is `flex: 1 1 600px` on desktop, `width: 100%; flex: 0 0 auto`
on mobile, and `flex: 1; height: 100%` in short landscape. The mobile width is
required because `main` uses `align-items: flex-start`, so a column without an
explicit width shrink-wraps to the canvas's intrinsic 800px.

## Tests

- `tests/components/HowToPlay.test.tsx`: summary advertises click damage,
  panel is collapsed by default and lists Space/Esc and the prestige goal.
- `tests/game/GameEffects.test.ts`: popups stay still with reduced motion and
  drift otherwise.
