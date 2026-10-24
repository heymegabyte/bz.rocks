import { defineConfig } from '@playwright/test';

// System-Chrome E2E config — drives the locally-installed Google Chrome via
// channel:'chrome', which needs NO Playwright-managed browser download. This is
// the working local UI-test path on machines where `playwright install` can't
// finalize its pinned Chromium build (see memory reference_playwright-browser-broken).
// Run: npm run test:e2e:chrome  (or `playwright test --config=playwright.chrome.config.ts`).
// The default playwright.config.ts (bundled Chromium, 6 breakpoints) stays the CI path.
const PROD_URL = process.env.PROD_URL ?? 'https://bz.rocks';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 2 : 1,
  reporter: [['list']],
  timeout: 60000,
  expect: { timeout: 12000 },
  use: {
    baseURL: PROD_URL,
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    navigationTimeout: 45000,
    actionTimeout: 30000,
    serviceWorkers: 'block',
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] }
  },
  projects: [
    { name: 'chrome-390', use: { viewport: { width: 390, height: 844 } } },
    { name: 'chrome-1280', use: { viewport: { width: 1280, height: 800 } } }
  ]
});
