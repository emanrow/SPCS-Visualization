export default [
  {
    ignores: ['node_modules/**', 'dist/**']
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        requestAnimationFrame: 'readonly',
        fetch: 'readonly',
        // Library globals
        L: 'readonly', // Leaflet
        THREE: 'readonly', // Three.js - although we should import it properly
      },
    },
    rules: {
      'no-undef': 'error',
    }
  }
]; 