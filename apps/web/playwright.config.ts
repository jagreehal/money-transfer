import { defineConfig } from "@playwright/test"

const strictCI = process.env.GITHUB_ACTIONS === "true"

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: strictCI,
  retries: strictCI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
    video: "on",
  },
  reporter: [
    ["list"],
    [
      "executable-stories-playwright/reporter",
      {
        formats: ["markdown", "html"],
        outputDir: "docs",
        outputName: "e2e-stories",
        output: { mode: "aggregated" },
        markdown: {
          title: "Money Transfer E2E Stories",
          includeMetadata: false,
          includeStatusIcons: true,
          stepStyle: "bullets",
        },
        html: {
          title: "Money Transfer E2E Stories",
          darkMode: true,
        },
      },
    ],
  ],
})
