import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      ignoreConfigErrors: true,
      root: '.'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-project/',
        'dist/',
        '.eslintrc.cjs',
        'vite.config.ts',
        'vitest.config.ts',
        '*.config.ts',
        'tests/setup.ts',
      ],
    },
  },
})
