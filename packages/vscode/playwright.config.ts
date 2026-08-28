import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: 'test', testMatch: 'webview-smoke.spec.ts', use: { headless: true } });
