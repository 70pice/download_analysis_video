import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { remixPlanArtifactSchema } from "@/lib/contracts";
import {
  analyzeShortVideo,
  getCurrentProjectBundleOrThrow,
  saveRemixPlanForProject,
} from "@/lib/video-review-service";

const analyzeInputSchema = z.object({
  source_input: z.string().min(1),
});

const saveRemixInputSchema = z.object({
  project_id: z.string(),
  remix_plan: remixPlanArtifactSchema,
});

const toTextResult = (value: unknown): CallToolResult => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(value, null, 2),
    },
  ],
});

const toErrorResult = (error: unknown): CallToolResult => ({
  content: [
    {
      type: "text",
      text: error instanceof Error ? error.message : "Unknown MCP tool error",
    },
  ],
  isError: true,
});

export const videoReviewToolDefinitions = [
  {
    name: "analyze_short_video",
    description: "Run the short-video review pipeline for a source input and return the current project bundle.",
    inputSchema: analyzeInputSchema,
  },
  {
    name: "get_current_project_bundle",
    description: "Load the latest analyzed project bundle from the local workspace.",
  },
  {
    name: "save_remix_plan",
    description: "Save an edited remix plan for the active project.",
    inputSchema: saveRemixInputSchema,
  },
] as const;

export const callVideoReviewTool = async (
  name: (typeof videoReviewToolDefinitions)[number]["name"],
  args: unknown,
): Promise<CallToolResult> => {
  try {
    if (name === "analyze_short_video") {
      const payload = analyzeInputSchema.parse(args);
      return toTextResult(await analyzeShortVideo(payload.source_input));
    }

    if (name === "get_current_project_bundle") {
      return toTextResult(await getCurrentProjectBundleOrThrow());
    }

    if (name === "save_remix_plan") {
      const payload = saveRemixInputSchema.parse(args);
      return toTextResult(await saveRemixPlanForProject(payload.project_id, payload.remix_plan));
    }

    return toErrorResult(new Error(`Unknown tool: ${name}`));
  } catch (error) {
    return toErrorResult(error);
  }
};

export const createVideoReviewMcpServer = () => {
  const server = new McpServer({
    name: "video_download",
    version: "0.1.0",
  });

  server.registerTool(
    "analyze_short_video",
    {
      description: "Run the short-video review pipeline for a source input and return the current project bundle.",
      inputSchema: analyzeInputSchema.shape,
    },
    async (args) => callVideoReviewTool("analyze_short_video", args),
  );

  server.registerTool(
    "get_current_project_bundle",
    {
      description: "Load the latest analyzed project bundle from the local workspace.",
    },
    async () => callVideoReviewTool("get_current_project_bundle", {}),
  );

  server.registerTool(
    "save_remix_plan",
    {
      description: "Save an edited remix plan for the active project.",
      inputSchema: saveRemixInputSchema.shape,
    },
    async (args) => callVideoReviewTool("save_remix_plan", args),
  );

  return server;
};

export const startVideoReviewMcpServer = async () => {
  const server = createVideoReviewMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  void startVideoReviewMcpServer().catch((error) => {
    console.error("Failed to start video_download MCP server:", error);
    process.exit(1);
  });
}
