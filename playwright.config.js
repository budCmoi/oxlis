const { defineConfig } = require("@playwright/test");

const baseWebUrl = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100";
const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4100/api";

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: baseWebUrl,
    headless: true,
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run start --prefix apps/api",
      url: "http://127.0.0.1:4100/api/health",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        ...process.env,
        PORT: process.env.PORT || "4100",
        CLIENT_URL: process.env.CLIENT_URL || baseWebUrl,
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/oxlis",
        JWT_SECRET: process.env.JWT_SECRET || "change-me-now",
      },
    },
    {
      command: "npm run start --prefix apps/web -- --hostname 127.0.0.1 --port 3100",
      url: baseWebUrl,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: baseApiUrl,
      },
    },
  ],
});