import type { Meta, StoryObj } from "@storybook/react";
import { AgentTraceViewer, parseAgentTrace } from "../index";
import { traceSamples } from "./exampleData";

const meta = {
  title: "Agent Trace Viewer",
  component: AgentTraceViewer,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AgentTraceViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

const galleryStyle = {
  minHeight: "100vh",
  padding: 24,
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 1))",
  color: "#e5e7eb",
};

export const TraceGallery: Story = {
  render: () => (
    <div style={galleryStyle}>
      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
        }}
      >
        {traceSamples.map((sample) => (
          <section
            key={sample.id}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(148, 163, 184, 0.14)",
              background: "#111827",
              boxShadow: "0 18px 48px rgba(2, 6, 23, 0.36)",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {sample.title}
            </div>
            <div style={{ height: 360 }}>
              <AgentTraceViewer turns={parseAgentTrace(sample.raw)} label={sample.title} />
            </div>
          </section>
        ))}
      </div>
    </div>
  ),
};
