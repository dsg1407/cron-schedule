import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'unit',
          globals: true,
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          globals: true,
          include: ['tests/integration/**/*.test.ts'],
          fileParallelism: false,
          testTimeout: 30000,
        },
      },
    ],
  },
})
