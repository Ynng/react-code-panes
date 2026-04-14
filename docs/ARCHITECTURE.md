# Architecture

`react-code-panes` is a workbench library, not a file-tree framework.

The core job of the library is:

- manage editor groups and split panes
- manage tab lifecycle and focus
- host custom views in sidebars and panels
- provide reusable viewer atoms
- provide generic drag/open mechanics

It should not assume that every consumer wants to model the world as files and folders.

## Current Direction

The library is intentionally using a simple React-first tab model:

```ts
type Tab = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactElement;
  isDirty?: boolean;
  isPinned?: boolean;
  isPreview?: boolean;
  closable?: boolean;
  labelColor?: string;
};
```

That is the main contract.

- `id` is the stable logical identity.
- `content` is the mounted React element for that tab.
- `activateOrOpenTab(groupId, tab)` reuses an existing open tab with the same `id` instead of opening a duplicate.
- Reopening the same `id` refreshes the existing tab metadata and content.
- Inactive tabs stay mounted while they remain open.

This is the right default for the library today because it matches how React apps actually compose UI.

## Why We Are Not Adding A Descriptor Layer Yet

A heavier `kind + payload + renderer registry` model is useful when you need things like:

- serialization and restore
- plugin/provider registration
- external document models
- multiple synchronized views of the same resource independent of React state

But that adds real complexity.

For `react-code-panes`, the simpler model is better until those needs become concrete.

Most consumers just want this:

1. render their own custom UI
2. turn an item into a tab
3. open or drag that tab into the workbench

That can be expressed directly with a tab factory.

## Tab Factories

A tab factory is just:

```ts
type TabFactory<T> = (item: T) => Tab;
```

Example:

```ts
const makeTraceTab: TabFactory<TraceSample> = (trace) => ({
  id: trace.id,
  title: trace.title,
  content: <AgentTraceViewer turns={trace.turns} label={trace.title} />,
});
```

This is the seam the library should optimize for.

- click behavior can call `activateOrOpenTab(activeGroupId, makeTab(item))`
- drag behavior can call `setDragTab(makeTab(item))`

That keeps domain semantics outside the reducer.

## Layers

### `core`

Owns layout, state, and tab mechanics.

Should include:

- `Workbench`
- `WorkbenchProvider`
- `useWorkbench`
- `useWorkbenchActions`
- `useActiveWorkbenchGroupId`
- split tree utilities
- drag/drop routing
- generic tab and group state
- sidebar and panel container state

This layer should stay domain-blind.

### `viewers`

Owns tab content renderers.

Examples:

- `MonacoCodeViewer`
- `MonacoDiffViewer`
- `UnifiedDiffPreview`
- `AgentTraceViewer`

These render content only.

They should not encode application semantics like “click means diff” or “drag means source file”.

### `presets`

Owns optional domain-specific composition patterns.

Examples:

- `CodeFileTree`
- `ChangedFilesList`
- source-control tab factories
- status-decoration helpers

This layer is optional. Consumers should be able to ignore it entirely and still build custom workbench UIs.

## What Stays Out Of Core

Do not add these to the reducer or core workbench state:

- source control status rules
- diff-opening semantics
- trace-specific logic
- path-based assumptions
- file-extension-driven behavior
- special reducer logic for one domain

Those belong in composition code.

## Custom UI Is First-Class

The main architectural goal is:

> custom UI opens custom tabs

That means all of these should feel natural:

- a real file tree
- a fake file tree
- a source control list
- a trace list
- a search result list
- a timeline
- a run queue
- a notebook outline
- a custom panel surface

The workbench should care about tabs and layout, not about whether the thing that opened the tab looked like a file.

## Split Behavior

Normal open behavior is single-instance by `id`.

Split behavior is the explicit exception.

When a user splits an editor group, the workbench intentionally creates another view of the active tab in a second group. That is a deliberate UI action, not a normal “open item” flow.

## Recommended Consumer Pattern

```tsx
function MyCustomList({ items }: { items: Item[] }) {
  const actions = useWorkbenchActions();
  const activeGroupId = useActiveWorkbenchGroupId();

  return (
    <div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            if (!activeGroupId) return;
            actions.activateOrOpenTab(activeGroupId, makeTab(item));
          }}
          onDragStart={() => setDragTab(makeTab(item))}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

That is the intended architecture today.

If the library later needs persistence, provider registries, or richer document/view separation, we can add that as a higher-order layer without breaking this simpler core model.
