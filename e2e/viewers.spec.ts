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

    await page.locator('.mosaic-tab[data-tab-id="workspace.diff"]').click();
    await expect(page.locator("text=3 files changed")).toHaveCount(2);

    await page
      .locator('.mosaic-sidebar[data-side="left"]')
      .locator("text=dashboard/src/components/AgentTraceViewer.tsx")
      .click();

    await expect(
      page.locator(
        '.mosaic-tab[data-tab-id="dashboard/src/components/AgentTraceViewer.tsx.diff"]',
      ),
    ).toHaveCount(1);

    await page.locator('.mosaic-tab[data-tab-id="codex-trace.jsonl"]').click();
    const editorContent = page.locator(".mosaic-editor-content").first();
    await expect(editorContent.getByText("Codex CLI")).toBeVisible();
    await expect(editorContent.getByText("tool calls")).toBeVisible();
    await expect(editorContent.getByText("DiffViewer.tsx")).toBeVisible();
  });
});

test.describe("Trace gallery", () => {
  test("all supported trace formats render in Storybook", async ({ page }) => {
    await page.goto(TRACE_GALLERY_URL);
    await page.waitForSelector("text=Codex CLI", { timeout: 10000 });

    for (const title of [
      "Codex CLI",
      "Claude Code",
      "OpenCode",
      "Gemini CLI",
      "mini-swe-agent (OpenAI style)",
      "mini-swe-agent (Anthropic style)",
    ]) {
      await expect(page.locator(`text=${title}`)).toHaveCount(2);
    }

    await expect(page.locator("text=Session Exit")).toHaveCount(2);
    await expect(page.locator("text=Thinking")).toHaveCount(5);
  });
});
