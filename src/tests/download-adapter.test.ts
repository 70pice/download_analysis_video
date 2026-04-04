import { describe, expect, it } from "vitest";
import {
  buildDownloadArgs,
  extractDouyinVideoFromDetailResponse,
  executeDownload,
  extractDouyinVideoFromHtml,
  getManagedYtDlpPath,
  planDownload,
} from "@/lib/download-adapter";

describe("planDownload", () => {
  it("returns unresolved when no direct url is present", () => {
    const plan = planDownload({
      platform: "douyin",
      url: null,
      normalizedInput: "share text",
      author: "一杯美式",
      title: "没有面包 谈什么爱情",
      hashtags: [],
      shareCode: "A@t.eB LwS:/ 10/16",
    });

    expect(plan.status).toBe("unresolved");
    expect(plan.canAttemptDownload).toBe(false);
  });

  it("skips download execution when planning is unresolved", async () => {
    const result = await executeDownload({
      status: "unresolved",
      canAttemptDownload: false,
      reason: "No direct video URL was found in the share text.",
      candidateUrl: null,
      executable: null,
      outputFilename: "source.mp4",
    });

    expect(result.status).toBe("skipped");
    expect(result.outputPath).toBeNull();
  });

  it("uses a managed executable path on Windows", () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "win32" });

    try {
      expect(getManagedYtDlpPath()).toMatch(/tools[\\/]bin[\\/]yt-dlp\.exe$/);
    } finally {
      if (originalPlatform) {
        Object.defineProperty(process, "platform", originalPlatform);
      }
    }
  });

  it("adds cookies file when configured", () => {
    const args = buildDownloadArgs(
      {
        status: "ready",
        canAttemptDownload: true,
        reason: null,
        candidateUrl: "https://v.douyin.com/example/",
        executable: "yt-dlp",
        outputFilename: "source.mp4",
      },
      {
        outputDir: "D:/tmp",
        cookiesFile: "D:/cookies/douyin.txt",
      },
    );

    expect(args).toContain("--cookies");
    expect(args).toContain("D:/cookies/douyin.txt");
  });

  it("extracts the best playable video from Douyin render data", () => {
    const html = `
      <html>
        <body>
          <script id="RENDER_DATA" type="application/json">${encodeURIComponent(
            JSON.stringify({
              app: {
                videoDetail: {
                  awemeInfo: {
                    aweme_id: "7621023599083785498",
                    desc: "生活将我击倒在地 我却幸福的睡着了",
                    video: {
                      duration: 218920,
                      bit_rate: [
                        {
                          bit_rate: 1200,
                          gear_name: "540p",
                          play_addr: {
                            url_list: ["https://cdn.example.com/video-540.mp4"],
                            width: 1024,
                            height: 576,
                          },
                        },
                        {
                          bit_rate: 4300,
                          gear_name: "1080p",
                          play_addr: {
                            url_list: ["https://cdn.example.com/video-1080.mp4"],
                            width: 1920,
                            height: 1080,
                          },
                        },
                      ],
                    },
                  },
                },
              },
            }),
          )}</script>
        </body>
      </html>
    `;

    const result = extractDouyinVideoFromHtml(html, "7621023599083785498");

    expect(result).not.toBeNull();
    expect(result?.downloadUrl).toBe("https://cdn.example.com/video-1080.mp4");
    expect(result?.title).toContain("生活将我击倒在地");
    expect(result?.durationSeconds).toBeCloseTo(218.92, 2);
    expect(result?.awemeId).toBe("7621023599083785498");
  });

  it("extracts the best playable video from Douyin detail JSON", () => {
    const payload = JSON.stringify({
      aweme_detail: {
        aweme_id: "7621023599083785498",
        desc: "生活将我击倒在地 我却幸福的睡着了",
        duration: 218922,
        video: {
          bit_rate: [
            {
              bit_rate: 2800,
              play_addr: {
                width: 1024,
                height: 576,
                url_list: ["https://cdn.example.com/video-540.mp4"],
              },
            },
            {
              bit_rate: 4341,
              play_addr: {
                width: 1920,
                height: 1080,
                url_list: ["https://cdn.example.com/video-1080.mp4"],
              },
            },
          ],
        },
      },
    });

    const result = extractDouyinVideoFromDetailResponse(payload, "7621023599083785498");

    expect(result).not.toBeNull();
    expect(result?.downloadUrl).toBe("https://cdn.example.com/video-1080.mp4");
    expect(result?.width).toBe(1920);
    expect(result?.height).toBe(1080);
  });
});
