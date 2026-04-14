import { expect, test, type Page } from "@playwright/test";

const WORKBENCH_URL = "/iframe.html?id=workbench--full-workbench&viewMode=story";
const TRACE_GALLERY_URL = "/iframe.html?id=agent-trace-viewer--trace-gallery&viewMode=story";

async function waitForWorkbench(page: Page) {
  await page.waitForSelector(".mosaic-workbench", { timeout: 10000 });
}

test.describe("Flagship workbench viewers", () => {
  test("diff list opens a Monaco diff tab and the preset trace tab renders", async ({ page }) => {
    await page.goto(WORKBENCH_URL);
    await waitForWorkbench(page);

    await page
      .locator('.mosaic-sidebar[data-side="left"]')
      .locator("text=dashboard/src/components/AgentTraceViewer.tsx")
      .click();

    await expect(
      page.locator(
        '.mosaic-tab[data-tab-id="dashboard/src/components/AgentTraceViewer.tsx.diff"]',
      ),
    ).toHaveCount(1);
    await expect(page.locator(".monaco-diff-editor")).toHaveCount(1);

    await page.locator('.mosaic-tab[data-tab-id="codex-cli-gpt-5.4-xhigh.raw.jsonl"]').click();
    const editorContent = page.locator(".mosaic-editor-content").first();
    await expect(editorContent.getByText("Codex CLI")).toBeVisible();
    await expect(editorContent.getByText("47 tool calls")).toBeVisible();
    await expect(editorContent.getByRole("button", { name: "Top" })).toBeVisible();
  });
});

test.describe("Trace gallery", () => {
  test("all supported trace formats render in Storybook", async ({ page }) => {
    await page.goto(TRACE_GALLERY_URL);
    await page.waitForSelector('.mosaic-tab[data-tab-id="codex-cli-gpt-5.4-xhigh.raw.jsonl"]', {
      timeout: 10000,
    });

    for (const [id, title] of [
      ["atif-gemini-cli-3.1-pro.trajectory.json", "ATIF trajectory"],
      ["codex-cli-gpt-5.4-xhigh.raw.jsonl", "Codex CLI"],
      ["claude-code-opus-4.6-max.raw.jsonl", "Claude Code"],
      ["opencode-gemini-3.1-pro.raw.json", "OpenCode"],
      ["gemini-cli-3.1-pro.raw.json", "Gemini CLI"],
      ["mini-swe-agent-gpt-5.4.raw.json", "mini-swe-agent"],
    ]) {
      const tab = page.locator(`.mosaic-tab[data-tab-id="${id}"]`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
      await expect(tab).toHaveClass(/active/);
      if (title !== "mini-swe-agent") {
        await expect(
          page.locator(".mosaic-editor-content").first().getByText(title, { exact: true }),
        ).toBeVisible();
      }
    }

    await page.locator('.mosaic-tab[data-tab-id="claude-code-opus-4.6-max.raw.jsonl"]').click();
    await expect(page.locator(".mosaic-editor-content").first().getByRole("button", { name: "Top" })).toBeVisible();

    await page.locator('.mosaic-tab[data-tab-id="mini-swe-agent-gpt-5.4.raw.json"]').click();
    await expect(page.locator(".mosaic-editor-content").first().getByText("29 tool calls")).toBeVisible();
  });
});
