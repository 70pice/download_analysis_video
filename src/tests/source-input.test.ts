import { describe, expect, it } from "vitest";
import { parseSourceInput } from "@/lib/source-input";

describe("parseSourceInput", () => {
  it("extracts douyin share metadata from plain share text", () => {
    const parsed = parseSourceInput(
      "3.51 复制打开抖音，看看【一杯美式的作品】没有面包 谈什么爱情 # 汽水心动预警好像真的存在... 没有面包 谈什么爱情 #汽水心动预警好像真的存在 #汽水音乐APP@汽水音乐APP - 抖音 A@t.eB LwS:/ 10/16",
    );

    expect(parsed.platform).toBe("douyin");
    expect(parsed.url).toBeNull();
    expect(parsed.author).toBe("一杯美式");
    expect(parsed.title).toContain("没有面包");
    expect(parsed.hashtags).toContain("汽水音乐APP");
    expect(parsed.shareCode).toContain("A@t.eB");
  });
});

