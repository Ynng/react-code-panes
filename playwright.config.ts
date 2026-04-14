import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: "http://localhost:6006",
    headless: true,
  },
  webServer: {
    command: "npx storybook dev -p 6006 --no-open",
    port: 6006,
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
