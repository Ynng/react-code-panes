import { defineConfig } from "vite";

export default defineConfig({
  server: {
    watch: {
      // Only watch src/ and .storybook/ — ignore everything else
      // to avoid ENOSPC from sibling projects in the parent dir
      ignored: ["!**/src/**", "!**/.storybook/**", "**/node_modules/**"],
    },
  },
});
