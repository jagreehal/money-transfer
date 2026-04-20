import { defineConfig } from "wrangler-deploy";

export default defineConfig({
  version: 1,
  workers: ["apps/api"],
  stages: {
    production: { protected: true },
    staging: { protected: true },
    "pr-*": { protected: false, ttl: "7d" },
  },
  secrets: {
    "apps/api": ["POSTHOG_KEY", "SLACK_WEBHOOK_URL"],
  },
});
