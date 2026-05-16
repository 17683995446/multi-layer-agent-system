import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    watch: {
      ignored: ['**/test-project/**', '**/node_modules/**', '**/.git/**']
    },
    fs: {
      allow: ['.']
    }
  },
  build: {
    sourcemap: 'hidden',
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths({
      ignoreConfigErrors: true,
      root: '.'
    })
  ],
  optimizeDeps: {
    exclude: [],
  }
})
