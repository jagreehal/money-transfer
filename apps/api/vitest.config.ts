import { StoryReporter } from "executable-stories-vitest/reporter"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    reporters: [
      "default",
      new StoryReporter({
        formats: ["markdown", "html"],
        outputDir: "docs",
        outputName: "stories",
        output: { mode: "aggregated" },
        markdown: {
          title: "Money Transfer API Stories",
          includeMetadata: false,
          includeStatusIcons: true,
          stepStyle: "bullets",
          sortScenarios: "source"
        },
        html: {
          title: "Money Transfer API Stories",
          darkMode: true
        }
      })
    ]
  }
})
