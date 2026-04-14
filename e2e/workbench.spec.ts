import { test, expect, Page } from "@playwright/test";

const STORY_URL = "/iframe.html?id=workbench--full-workbench&viewMode=story";
const SPLIT_URL = "/iframe.html?id=workbench--pre-split-layout&viewMode=story";
const MANY_TABS_URL = "/iframe.html?id=workbench--many-tabs&viewMode=story";

async function waitForStory(page: Page) {
  await page.waitForSelector(".mosaic-workbench", { timeout: 10000 });
}

test.describe("Tab management", () => {
  test("clicking a tab activates it", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // Click on 'index.ts' tab
    const tab = page.locator('.mosaic-tab[data-tab-id="index.ts"]');
    await tab.click();
    await expect(tab).toHaveClass(/active/);
  });

  test("closing a tab removes it and activates MRU", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // First click index.ts to make it MRU after App.tsx
    await page.locator('.mosaic-tab[data-tab-id="index.ts"]').click();
    // Then go back to App.tsx
    await page.locator('.mosaic-tab[data-tab-id="App.tsx"]').click();

    // Close App.tsx
    const closeBtn = page.locator(
      '.mosaic-tab[data-tab-id="App.tsx"] .mosaic-tab-close'
    );
    await closeBtn.click();

    // App.tsx should be gone
    await expect(page.locator('.mosaic-tab[data-tab-id="App.tsx"]')).toHaveCount(0);

    // index.ts should now be active (MRU)
    await expect(
      page.locator('.mosaic-tab[data-tab-id="index.ts"]')
    ).toHaveClass(/active/);
  });

  test("Cmd+W closes the active tab", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // App.tsx is active
    await expect(
      page.locator('.mosaic-tab[data-tab-id="App.tsx"]')
    ).toHaveClass(/active/);

    await page.keyboard.press("Meta+w");

    // App.tsx should be gone
    await expect(page.locator('.mosaic-tab[data-tab-id="App.tsx"]')).toHaveCount(0);
  });

  test("opening a file from sidebar creates a tab", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // Click "server.py" in the file tree
    await page.locator("text=server.py").click();
    await expect(
      page.locator('.mosaic-tab[data-tab-id="server.py"]')
    ).toHaveCount(1);
  });
});

test.describe("Sash resize", () => {
  test("dragging a sash resizes panes", async ({ page }) => {
    await page.goto(SPLIT_URL);
    await waitForStory(page);

    const sash = page.locator(".mosaic-sash.horizontal").first();
    const box = await sash.boundingBox();
    if (!box) throw new Error("Sash not found");

    // Get the first split child's width before
    const firstChild = page.locator(".mosaic-split-child").first();
    const beforeBox = await firstChild.boundingBox();
    if (!beforeBox) throw new Error("Split child not found");
    const widthBefore = beforeBox.width;

    // Drag sash 100px to the right
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2, {
      steps: 10,
    });
    await page.mouse.up();

    const afterBox = await firstChild.boundingBox();
    if (!afterBox) throw new Error("Split child not found after resize");

    // Width should have increased (some delta is absorbed by min-size constraints)
    expect(afterBox.width).toBeGreaterThan(widthBefore);
  });
});

test.describe("Split editor", () => {
  test("split button creates a new split", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // Should start with 1 editor group
    await expect(page.locator(".mosaic-editor-group")).toHaveCount(1);

    // Click the split button
    await page.locator(".mosaic-tabbar-split-btn").click();

    // Should now have 2 editor groups
    await expect(page.locator(".mosaic-editor-group")).toHaveCount(2);
  });

  test("split button duplicates the active tab when only one tab is open", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    for (const tabId of [
      "index.ts",
      "workspace.diff",
      "dashboard/src/components/AgentTraceViewer.tsx.diff",
      "atif-gemini-cli-3.1-pro.trajectory.json",
      "codex-cli-gpt-5.4-xhigh.raw.jsonl",
    ]) {
      await page.locator(`.mosaic-tab[data-tab-id="${tabId}"] .mosaic-tab-close`).click();
    }

    await expect(page.locator(".mosaic-tab")).toHaveCount(1);
    await page.locator(".mosaic-tabbar-split-btn").click();

    await expect(page.locator(".mosaic-editor-group")).toHaveCount(2);
    await expect(page.locator('.mosaic-tab[data-tab-id="App.tsx"]')).toHaveCount(2);
  });
});

test.describe("Sidebar toggle", () => {
  test("Cmd+B toggles left sidebar", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // Sidebar should be visible initially
    await expect(page.locator(".mosaic-sidebar")).toHaveCount(2); // left + right

    // Press Cmd+B to hide left sidebar
    await page.keyboard.press("Meta+b");
    // Only right sidebar remains
    await expect(page.locator('.mosaic-sidebar[data-side="left"]')).toHaveCount(0);

    // Press again to restore
    await page.keyboard.press("Meta+b");
    await expect(page.locator('.mosaic-sidebar[data-side="left"]')).toHaveCount(1);
  });

  test("Cmd+I toggles right sidebar", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // Press Cmd+I to hide right sidebar
    await page.keyboard.press("Meta+i");
    await expect(page.locator('.mosaic-sidebar[data-side="right"]')).toHaveCount(0);

    // Press again to restore
    await page.keyboard.press("Meta+i");
    await expect(page.locator('.mosaic-sidebar[data-side="right"]')).toHaveCount(1);
  });

  test("toolbar buttons toggle sidebars", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // Click left sidebar toggle in toolbar
    const leftBtn = page.locator(".mosaic-toolbar-left .mosaic-toolbar-btn");
    await leftBtn.click();
    await expect(page.locator('.mosaic-sidebar[data-side="left"]')).toHaveCount(0);

    // Click again to restore
    await leftBtn.click();
    await expect(page.locator('.mosaic-sidebar[data-side="left"]')).toHaveCount(1);
  });

  test("sidebar restores to original width after snap-to-hide", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    const sidebar = page.locator(".mosaic-sidebar-container").first();
    const initialBox = await sidebar.boundingBox();
    if (!initialBox) throw new Error("Sidebar not found");
    const initialWidth = initialBox.width;

    // Toggle off and on via keyboard
    await page.keyboard.press("Meta+b");
    await page.keyboard.press("Meta+b");

    const restoredBox = await sidebar.boundingBox();
    if (!restoredBox) throw new Error("Sidebar not found after restore");

    // Width should be approximately the same (within 5px tolerance)
    expect(Math.abs(restoredBox.width - initialWidth)).toBeLessThan(5);
  });
});

test.describe("Tab scrolling", () => {
  test("many tabs show horizontal scrollbar", async ({ page }) => {
    await page.goto(MANY_TABS_URL);
    await waitForStory(page);

    const scrollContainer = page.locator(".mosaic-tabbar-scroll");
    const scrollWidth = await scrollContainer.evaluate(
      (el) => el.scrollWidth
    );
    const clientWidth = await scrollContainer.evaluate(
      (el) => el.clientWidth
    );

    // scrollWidth should be larger than visible width
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  });
});

test.describe("Bottom panel", () => {
  test("Cmd+` toggles bottom panel", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // Panel should be visible initially
    await expect(page.locator(".mosaic-panel")).toHaveCount(1);

    // Toggle off
    await page.keyboard.press("Meta+`");
    await expect(page.locator(".mosaic-panel")).toHaveCount(0);

    // Toggle on
    await page.keyboard.press("Meta+`");
    await expect(page.locator(".mosaic-panel")).toHaveCount(1);
  });

  test("panel tabs switch content", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // Click "Problems" tab in panel
    await page.locator(".mosaic-panel-tab", { hasText: "Problems" }).click();
    await expect(
      page.locator(".mosaic-panel-tab.active", { hasText: "Problems" })
    ).toHaveCount(1);
  });

  test("panel close button hides panel", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // The close button is the last action button in the panel header
    await page.locator(".mosaic-panel-action-btn").last().click();
    await expect(page.locator(".mosaic-panel")).toHaveCount(0);
  });
});

test.describe("Focused pane indicator", () => {
  test("focused group has .focused class on tabbar", async ({ page }) => {
    await page.goto(SPLIT_URL);
    await waitForStory(page);

    // The active group should have a focused tab bar
    await expect(page.locator(".mosaic-tabbar.focused")).toHaveCount(1);

    // Click on a different group
    const groups = page.locator(".mosaic-editor-group");
    const secondGroup = groups.nth(1);
    await secondGroup.click();

    // Still exactly one focused tabbar
    await expect(page.locator(".mosaic-tabbar.focused")).toHaveCount(1);
  });
});

test.describe("Panel reorder", () => {
  test("dragging a panel tab reorders it", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // Get panel tabs — should be Terminal, Problems, Output
    const panelTabs = page.locator(".mosaic-panel-tab");
    await expect(panelTabs).toHaveCount(3);

    const firstTab = panelTabs.nth(0);
    const tabBar = page.locator(".mosaic-panel-tabs");

    const firstBox = await firstTab.boundingBox();
    const tabBarBox = await tabBar.boundingBox();
    if (!firstBox || !tabBarBox) throw new Error("Panel tabs not found");

    // Drag first tab (Terminal) to the empty space at the end of the tab strip.
    // This hits the panel tab bar drop zone directly instead of relying on the last tab edge.
    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      tabBarBox.x + tabBarBox.width - 8,
      tabBarBox.y + tabBarBox.height / 2,
      { steps: 12 }
    );
    await page.mouse.up();

    // After reorder, "Terminal" should no longer be first
    const firstText = await panelTabs.nth(0).textContent();
    expect(firstText?.trim()).not.toBe("Terminal");
  });
});

test.describe("Panel state persists on toggle", () => {
  test("closing and reopening panel keeps active tab", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    // Switch to "Problems" tab
    await page.locator(".mosaic-panel-tab", { hasText: "Problems" }).click();
    await expect(
      page.locator(".mosaic-panel-tab.active", { hasText: "Problems" })
    ).toHaveCount(1);

    // Toggle panel off and on
    await page.keyboard.press("Meta+`");
    await expect(page.locator(".mosaic-panel")).toHaveCount(0);
    await page.keyboard.press("Meta+`");

    // Problems should still be active
    await expect(
      page.locator(".mosaic-panel-tab.active", { hasText: "Problems" })
    ).toHaveCount(1);
  });
});

test.describe("Sidebar sections", () => {
  test("clicking a section header collapses and expands its content", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    const explorerToggle = page
      .locator('.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section-header-drag-handle')
      .first();

    await expect(page.locator("text=server.py")).toHaveCount(1);
    await explorerToggle.click();
    await expect(page.locator("text=server.py")).toHaveCount(0);
    await explorerToggle.click();
    await expect(page.locator("text=server.py")).toHaveCount(1);
  });
});

test.describe("Cross-container drag", () => {
  test("dragging a panel tab to the top half of a sidebar section inserts above", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    const panelTabsBefore = await page.locator(".mosaic-panel-tab").count();
    const sidebarSectionsBefore = await page.locator(
      '.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section'
    ).count();
    const firstSectionText = await page
      .locator('.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section-header')
      .first()
      .textContent();

    // Drag the last panel tab onto the top edge of the first sidebar section
    const panelTab = page.locator(".mosaic-panel-tab").last();
    const firstSection = page
      .locator('.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section')
      .first();

    const srcBox = await panelTab.boundingBox();
    const dstBox = await firstSection.boundingBox();
    if (!srcBox || !dstBox) throw new Error("Elements not found");

    await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
    await page.mouse.down();
    // Drop on top quarter of the section = top half
    await page.mouse.move(dstBox.x + dstBox.width / 2, dstBox.y + 5, { steps: 10 });
    await page.mouse.up();

    // Panel should have one fewer tab
    await expect(page.locator(".mosaic-panel-tab")).toHaveCount(panelTabsBefore - 1);
    // Sidebar should have one more section
    await expect(
      page.locator('.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section')
    ).toHaveCount(sidebarSectionsBefore + 1);
    // The original first section should now be second (new one inserted above)
    const newSecondText = await page
      .locator('.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section-header')
      .nth(1)
      .textContent();
    expect(newSecondText?.trim()).toBe(firstSectionText?.trim());
  });

  test("dragging a panel tab to the bottom half of a sidebar section inserts below", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    const panelTabsBefore = await page.locator(".mosaic-panel-tab").count();
    const sidebarSectionsBefore = await page.locator(
      '.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section'
    ).count();
    const firstSectionText = await page
      .locator('.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section-header')
      .first()
      .textContent();

    const panelTab = page.locator(".mosaic-panel-tab").last();
    const firstSection = page
      .locator('.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section')
      .first();

    const srcBox = await panelTab.boundingBox();
    const dstBox = await firstSection.boundingBox();
    if (!srcBox || !dstBox) throw new Error("Elements not found");

    await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
    await page.mouse.down();
    // Drop on bottom of the section = bottom half
    await page.mouse.move(dstBox.x + dstBox.width / 2, dstBox.y + dstBox.height - 5, { steps: 10 });
    await page.mouse.up();

    await expect(page.locator(".mosaic-panel-tab")).toHaveCount(panelTabsBefore - 1);
    await expect(
      page.locator('.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section')
    ).toHaveCount(sidebarSectionsBefore + 1);
    // The first section should still be the same (new one inserted below)
    const stillFirstText = await page
      .locator('.mosaic-sidebar[data-side="left"] .mosaic-sidebar-section-header')
      .first()
      .textContent();
    expect(stillFirstText?.trim()).toBe(firstSectionText?.trim());
  });
});

test.describe("Drag tab to split", () => {
  test("dragging a tab to the right edge of content creates a horizontal split", async ({
    page,
  }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    await expect(page.locator(".mosaic-editor-group")).toHaveCount(1);

    // Drag index.ts tab to the right edge of the editor content
    const tab = page.locator('.mosaic-tab[data-tab-id="index.ts"]');
    const content = page.locator(".mosaic-editor-content");
    const tabBox = await tab.boundingBox();
    const contentBox = await content.boundingBox();
    if (!tabBox || !contentBox) throw new Error("Elements not found");

    // Drag from tab to right 10% of content
    await page.mouse.move(
      tabBox.x + tabBox.width / 2,
      tabBox.y + tabBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      contentBox.x + contentBox.width * 0.95,
      contentBox.y + contentBox.height / 2,
      { steps: 10 }
    );
    await page.mouse.up();

    // Should now have 2 editor groups
    await expect(page.locator(".mosaic-editor-group")).toHaveCount(2);
  });

  test("dragging a file from the explorer opens it in the editor", async ({ page }) => {
    await page.goto(STORY_URL);
    await waitForStory(page);

    const source = page.locator('[title="eval/runner/server.py"]').first().locator("..");
    const target = page.locator(".mosaic-editor-content").first();
    await source.dragTo(target);

    await expect(page.locator('.mosaic-tab[data-tab-id="server.py"]')).toHaveCount(1);
  });
});
