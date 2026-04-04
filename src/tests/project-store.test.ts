import { beforeEach, describe, expect, it } from "vitest";
import {
  createProject,
  getCurrentProject,
  resetProjectData,
} from "@/lib/project-store";

describe("project store", () => {
  beforeEach(async () => {
    await resetProjectData();
  });

  it("creates and reloads the current project", async () => {
    const project = await createProject(
      "3.51 复制打开抖音，看看【一杯美式的作品】没有面包 谈什么爱情",
    );
    const reloaded = await getCurrentProject();

    expect(reloaded?.id).toBe(project.id);
    expect(reloaded?.sourceInput).toContain("复制打开抖音");
    expect(reloaded?.sourceUrl).toBeNull();
    expect(reloaded?.status).toBe("queued");
  });
});
