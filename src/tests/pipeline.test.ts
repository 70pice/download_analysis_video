import { beforeEach, describe, expect, it } from "vitest";
import {
  createProject,
  getProjectArtifact,
  resetProjectData,
} from "@/lib/project-store";
import { runPipeline } from "@/lib/pipeline";

describe("pipeline", () => {
  beforeEach(async () => {
    await resetProjectData();
  });

  it("writes all core artifacts", async () => {
    const project = await createProject(
      "3.51 复制打开抖音，看看【一杯美式的作品】没有面包 谈什么爱情 # 汽水心动预警好像真的存在",
    );

    await runPipeline(project.id);

    expect(await getProjectArtifact(project.id, "source/source.json")).toContain(
      "\"downloadPlan\"",
    );
    expect(await getProjectArtifact(project.id, "derived/transcript.json")).toContain(
      "segments",
    );
    expect(await getProjectArtifact(project.id, "analysis/remix_plan.json")).toContain(
      "creativeIntent",
    );
  });
});
