import { beforeEach, describe, expect, it } from "vitest";
import { resetProjectData } from "@/lib/project-store";
import {
  callVideoReviewTool,
  videoReviewToolDefinitions,
} from "@/mcp/video-review-mcp";

describe("video review mcp", () => {
  beforeEach(async () => {
    await resetProjectData();
  });

  it("registers the expected tools", () => {
    expect(videoReviewToolDefinitions.map((tool) => tool.name)).toEqual([
      "analyze_short_video",
      "get_current_project_bundle",
      "save_remix_plan",
    ]);
  });

  it("returns bundle text for analyze_short_video", async () => {
    const result = await callVideoReviewTool("analyze_short_video", {
      source_input:
        "3.51 复制打开抖音，看看【一杯美式的作品】没有面包 谈什么爱情 # 汽水心动预警好像真的存在...",
    });

    const firstContent = result.content[0];
    expect(firstContent?.type).toBe("text");
    if (!firstContent || firstContent.type !== "text") {
      throw new Error("Expected text content");
    }

    expect(firstContent.text).toContain("\"project\"");
  });
});
