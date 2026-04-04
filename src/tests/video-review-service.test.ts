import { beforeEach, describe, expect, it } from "vitest";
import { createProject, resetProjectData } from "@/lib/project-store";
import {
  analyzeShortVideo,
  getCurrentProjectBundleOrThrow,
  saveRemixPlanForProject,
} from "@/lib/video-review-service";

describe("video review service", () => {
  beforeEach(async () => {
    await resetProjectData();
  });

  it("analyzes a source input into a complete project bundle", async () => {
    const bundle = await analyzeShortVideo(
      "3.51 复制打开抖音，看看【一杯美式的作品】没有面包 谈什么爱情 # 汽水心动预警好像真的存在...",
    );

    expect(bundle.project.status).toBe("complete");
    expect(bundle.source?.downloadPlan.status).toBe("unresolved");
    expect(bundle.remixPlan?.segments.length).toBeGreaterThan(0);
  });

  it("loads the current project bundle after analysis", async () => {
    await analyzeShortVideo(
      "3.51 复制打开抖音，看看【一杯美式的作品】没有面包 谈什么爱情 # 汽水心动预警好像真的存在...",
    );

    const bundle = await getCurrentProjectBundleOrThrow();
    expect(bundle.project.sourceInput).toContain("一杯美式");
  });

  it("saves an edited remix plan for the active project", async () => {
    const project = await createProject("https://v.douyin.com/example/");
    const saved = await saveRemixPlanForProject(project.id, {
      title: "Edited Plan",
      creativeIntent: "Make it sharper.",
      targetAudience: "short video audience",
      segments: [
        {
          id: "segment-a",
          goal: "Hook fast",
          beats: ["hook"],
          sourceShotIds: ["shot-01"],
          scenePlan: "Indoor setup",
          blockingPlan: "Subject turns into frame",
          cameraPlan: "Tight push-in",
          narration: "Open on the payoff",
          visualPrompt: "cinematic short video",
          notes: "Keep it crisp",
        },
      ],
    });

    expect(saved.editor).toBe("local-user");
    expect(saved.title).toBe("Edited Plan");
  });
});
