import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 15_000,
  use: { baseURL: 'http://127.0.0.1:4173', headless: true },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/tests/harness/',
    reuseExistingServer: true,
  },
});
