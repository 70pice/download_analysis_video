import { beforeEach, describe, expect, it } from "vitest";
import { POST as createProject } from "@/app/api/project/route";
import { resetProjectData } from "@/lib/project-store";

describe("project api", () => {
  beforeEach(async () => {
    await resetProjectData();
  });

  it("creates a project from share text", async () => {
    const response = await createProject(
      new Request("http://localhost/api/project", {
        method: "POST",
        body: JSON.stringify({
          sourceInput:
            "3.51 复制打开抖音，看看【一杯美式的作品】没有面包 谈什么爱情 # 汽水心动预警好像真的存在",
        }),
      }),
    );

    expect(response.status).toBe(201);
  });
});
