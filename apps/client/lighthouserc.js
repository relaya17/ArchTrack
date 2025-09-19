/**
 * Lighthouse CI Configuration
 * Construction Master App - Performance Testing
 */

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3227',
        'http://localhost:3227/dashboard',
        'http://localhost:3227/table',
        'http://localhost:3227/drawing',
      ],
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['error', { minScore: 0.9 }],

        // Performance metrics
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],

        // Resource optimization
        'unused-css-rules': ['warn', { maxLength: 0 }],
        'unused-javascript': ['warn', { maxLength: 0 }],
        'modern-image-formats': ['warn', { maxLength: 0 }],
        'uses-optimized-images': ['warn', { maxLength: 0 }],
        'uses-webp-images': ['warn', { maxLength: 0 }],

        // PWA requirements
        'service-worker': 'error',
        'works-offline': 'error',
        viewport: 'error',
        'apple-touch-icon': 'error',
        'maskable-icon': 'error',

        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        label: 'error',
        'link-name': 'error',
        'button-name': 'error',

        // SEO
        'document-title': 'error',
        'meta-description': 'error',
        canonical: 'error',
        'robots-txt': 'error',
        'structured-data': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      command: 'pnpm start',
      port: 3227,
    },
  },
};

