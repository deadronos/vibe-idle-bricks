import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/vibe-idle-bricks/',
  build: {
    // Phaser remains a large third-party dependency, but it now loads behind a
    // lazy boundary and no longer impacts the critical startup bundle. Keep it
    // split into its own async chunk and raise the warning threshold to match
    // that deferred-only cost.
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/phaser/')) {
            return 'phaser-engine';
          }

          if (id.includes('/src/game/') || id.includes('/src/components/PhaserGame.tsx')) {
            return 'game-engine';
          }
        },
      },
    },
  },
})
