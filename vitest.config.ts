import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',

    // Test file patterns
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Global test APIs (describe, it, expect, etc.)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/**/*.d.ts',
        'src/**/index.ts',
      ],
    },

    // Reporter options
    reporters: ['default'],

    // Type checking (optional, can be slow)
    typecheck: {
      enabled: false,
    },

    // Watch mode disabled by default (prevents hanging in CI/agent environments)
    watch: false,
    watchExclude: ['node_modules', 'dist'],

    // Pool options for better performance
    pool: 'forks',
  },
})
