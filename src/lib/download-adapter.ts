import { spawn, spawnSync } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ParsedSourceInput } from "@/lib/source-input";

export type DownloadPlan = {
  status: "ready" | "unresolved" | "missing_binary";
  canAttemptDownload: boolean;
  reason: string | null;
  candidateUrl: string | null;
  executable: string | null;
  outputFilename: string;
};

export type DownloadExecution = {
  status: "downloaded" | "skipped" | "failed";
  reason: string | null;
  outputPath: string | null;
};

export type DouyinBrowserVideo = {
  awemeId: string;
  title: string;
  durationSeconds: number;
  downloadUrl: string;
  width: number | null;
  height: number | null;
  bitrate: number | null;
};

export const getManagedYtDlpPath = () =>
  path.join(
    process.cwd(),
    "tools",
    "bin",
    process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
  );

const getDefaultProjectSourceDir = () =>
  path.join(
    process.env.VIDEO_REVIEW_DATA_ROOT ?? path.join(process.cwd(), "data", "projects"),
    "current",
    "source",
  );

export const findYtDlpExecutable = () => {
  const command = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(command, ["yt-dlp"], { encoding: "utf8" });

  if (result.status !== 0) {
    return null;
  }

  const firstLine = result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine ?? null;
};

export const ensureYtDlpExecutable = async () => {
  const existing = findYtDlpExecutable();
  if (existing) {
    return existing;
  }

  const managedPath = getManagedYtDlpPath();
  try {
    await access(managedPath);
    return managedPath;
  } catch {
    await mkdir(path.dirname(managedPath), { recursive: true });
    const downloadUrl =
      process.platform === "win32"
        ? "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
        : "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download yt-dlp: HTTP ${response.status}`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    await import("node:fs/promises").then((fs) => fs.writeFile(managedPath, bytes));
    return managedPath;
  }
};

export const planDownload = (
  parsed: ParsedSourceInput,
  options: { executable?: string | null } = {},
): DownloadPlan => {
  const executable = options.executable ?? null;

  if (!parsed.url) {
    return {
      status: "unresolved",
      canAttemptDownload: false,
      reason: "No direct video URL was found in the share text.",
      candidateUrl: null,
      executable,
      outputFilename: "source.mp4",
    };
  }

  if (!executable) {
    return {
      status: "missing_binary",
      canAttemptDownload: false,
      reason: "yt-dlp is not available on this machine.",
      candidateUrl: parsed.url,
      executable: null,
      outputFilename: "source.mp4",
    };
  }

  return {
    status: "ready",
    canAttemptDownload: true,
    reason: null,
    candidateUrl: parsed.url,
    executable,
    outputFilename: "source.mp4",
  };
};

export const executeDownload = async (
  plan: DownloadPlan,
  options: { outputDir?: string; cookiesFile?: string | null } = {},
): Promise<DownloadExecution> => {
  if (!plan.canAttemptDownload || !plan.candidateUrl || !plan.executable) {
    return {
      status: "skipped",
      reason: plan.reason,
      outputPath: null,
    };
  }

  const outputDir = options.outputDir ?? getDefaultProjectSourceDir();
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, plan.outputFilename);
  const args = buildDownloadArgs(plan, {
    outputDir,
    cookiesFile: options.cookiesFile ?? process.env.YT_DLP_COOKIES_FILE ?? null,
  });

  const result = await new Promise<DownloadExecution>((resolve) => {
    const stderrChunks: string[] = [];
    const child = spawn(plan.executable!, args, { stdio: ["ignore", "ignore", "pipe"] });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderrChunks.push(chunk.toString());
    });

    child.on("error", (error) => {
      resolve({
        status: "failed",
        reason: error.message,
        outputPath: null,
      });
    });

    child.on("close", async (code) => {
      if (code === 0) {
        resolve({
          status: "downloaded",
          reason: null,
          outputPath,
        });
        return;
      }

      const candidateUrl = plan.candidateUrl;
      if (candidateUrl && isDouyinUrl(candidateUrl)) {
        const browserFallback = await executeDouyinBrowserDownload(candidateUrl, outputPath);
        if (browserFallback) {
          resolve(browserFallback);
          return;
        }
      }

      resolve({
        status: "failed",
        reason: summarizeYtDlpError(stderrChunks.join("\n"), code),
        outputPath: null,
      });
    });
  });

  return result;
};

export const buildDownloadArgs = (
  plan: DownloadPlan,
  options: { outputDir: string; cookiesFile?: string | null },
) => {
  const outputPath = path.join(options.outputDir, plan.outputFilename);
  const args = ["--no-playlist"];

  if (options.cookiesFile) {
    args.push("--cookies", options.cookiesFile);
  }

  args.push("-o", outputPath, plan.candidateUrl ?? "");
  return args;
};

const summarizeYtDlpError = (stderr: string, code: number | null) => {
  const lines = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const errorLine =
    [...lines].reverse().find((line) => line.startsWith("ERROR:")) ??
    [...lines].reverse().find((line) => line.startsWith("WARNING:")) ??
    `yt-dlp exited with code ${code}`;

  return errorLine;
};

const isDouyinUrl = (url: string) => {
  try {
    const { hostname } = new URL(url);
    return hostname.includes("douyin.com");
  } catch {
    return false;
  }
};

const normalizeMaybeEncodedJson = (value: string) => {
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return JSON.parse(value);
  }
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const extractRenderDataPayload = (html: string) => {
  const match = html.match(/<script[^>]+id="RENDER_DATA"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) {
    return null;
  }

  const raw = decodeHtmlEntities(match[1].trim());
  return normalizeMaybeEncodedJson(raw);
};

const readNested = (value: unknown, path: string[]) =>
  path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return null;
    }

    return (current as Record<string, unknown>)[key] ?? null;
  }, value);

const findAwemeInfo = (payload: unknown, awemeId?: string | null): Record<string, unknown> | null => {
  const candidates = [
    readNested(payload, ["app", "videoDetail", "awemeInfo"]),
    readNested(payload, ["app", "videoDetail", "aweme_detail"]),
    readNested(payload, ["app", "videoDetail"]),
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const record = candidate as Record<string, unknown>;
    const candidateId =
      typeof record.aweme_id === "string"
        ? record.aweme_id
        : typeof record.awemeId === "string"
          ? record.awemeId
          : null;

    if (!awemeId || !candidateId || candidateId === awemeId) {
      return record;
    }
  }

  return null;
};

const chooseBestBitRate = (bitRates: unknown[]) => {
  const normalized = bitRates
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const playAddr = item.play_addr;
      const urls =
        playAddr && typeof playAddr === "object" && Array.isArray((playAddr as Record<string, unknown>).url_list)
          ? ((playAddr as Record<string, unknown>).url_list as unknown[]).filter(
              (url): url is string => typeof url === "string" && url.startsWith("http"),
            )
          : [];

      return {
        bitrate: typeof item.bit_rate === "number" ? item.bit_rate : null,
        width:
          playAddr && typeof playAddr === "object" && typeof (playAddr as Record<string, unknown>).width === "number"
            ? ((playAddr as Record<string, unknown>).width as number)
            : null,
        height:
          playAddr && typeof playAddr === "object" && typeof (playAddr as Record<string, unknown>).height === "number"
            ? ((playAddr as Record<string, unknown>).height as number)
            : null,
        downloadUrl: urls[0] ?? null,
      };
    })
    .filter((item) => item.downloadUrl);

  normalized.sort((left, right) => (right.bitrate ?? 0) - (left.bitrate ?? 0));
  return normalized[0] ?? null;
};

const getAwemeIdFromUrl = (url: string) => {
  const match = url.match(/\/video\/(\d+)/);
  return match?.[1] ?? null;
};

export const extractDouyinVideoFromDetailResponse = (
  payloadText: string,
  awemeId?: string | null,
): DouyinBrowserVideo | null => {
  const payload = JSON.parse(payloadText) as Record<string, unknown>;
  const rawDetail = payload.aweme_detail;
  if (!rawDetail || typeof rawDetail !== "object") {
    return null;
  }

  const detail = rawDetail as Record<string, unknown>;
  const candidateId = typeof detail.aweme_id === "string" ? detail.aweme_id : null;
  if (awemeId && candidateId && candidateId !== awemeId) {
    return null;
  }

  const video = detail.video;
  if (!video || typeof video !== "object") {
    return null;
  }

  const bitRates = Array.isArray((video as Record<string, unknown>).bit_rate)
    ? ((video as Record<string, unknown>).bit_rate as unknown[])
    : [];
  const best = chooseBestBitRate(bitRates);
  if (!best?.downloadUrl) {
    return null;
  }

  return {
    awemeId: candidateId ?? awemeId ?? "",
    title: typeof detail.desc === "string" ? detail.desc : "Douyin video",
    durationSeconds: typeof detail.duration === "number" ? detail.duration / 1000 : 0,
    downloadUrl: best.downloadUrl,
    width: best.width,
    height: best.height,
    bitrate: best.bitrate,
  };
};

export const extractDouyinVideoFromHtml = (html: string, awemeId?: string | null): DouyinBrowserVideo | null => {
  const payload = extractRenderDataPayload(html);
  if (!payload) {
    return null;
  }

  const awemeInfo = findAwemeInfo(payload, awemeId);
  if (!awemeInfo) {
    return null;
  }

  const video = awemeInfo.video;
  if (!video || typeof video !== "object") {
    return null;
  }

  const bitRates = Array.isArray((video as Record<string, unknown>).bit_rate)
    ? ((video as Record<string, unknown>).bit_rate as unknown[])
    : [];
  const best = chooseBestBitRate(bitRates);
  if (!best?.downloadUrl) {
    return null;
  }

  const rawDuration = (video as Record<string, unknown>).duration;
  return {
    awemeId:
      typeof awemeInfo.aweme_id === "string"
        ? awemeInfo.aweme_id
        : typeof awemeInfo.awemeId === "string"
          ? awemeInfo.awemeId
          : awemeId ?? "",
    title: typeof awemeInfo.desc === "string" ? awemeInfo.desc : "Douyin video",
    durationSeconds: typeof rawDuration === "number" ? rawDuration / 1000 : 0,
    downloadUrl: best.downloadUrl,
    width: best.width,
    height: best.height,
    bitrate: best.bitrate,
  };
};

const fetchDouyinDetailFromBrowser = async (targetUrl: string, awemeId?: string | null) => {
  const debuggingPort = Number.parseInt(process.env.CHROME_DEBUGGING_PORT ?? "9223", 10);
  if (!Number.isFinite(debuggingPort)) {
    return null;
  }

  const version = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`).then((response) =>
    response.ok ? response.json() : null,
  );
  if (!version?.webSocketDebuggerUrl) {
    return null;
  }

  return new Promise<DouyinBrowserVideo | null>((resolve, reject) => {
    const socket = new WebSocket(version.webSocketDebuggerUrl as string);
    let sequence = 0;
    const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>();
    const requestIds: string[] = [];
    const send = (method: string, params: Record<string, unknown> = {}, sessionId?: string) =>
      new Promise<unknown>((innerResolve, innerReject) => {
        const id = ++sequence;
        pending.set(id, { resolve: innerResolve, reject: innerReject });
        socket.send(JSON.stringify(sessionId ? { id, sessionId, method, params } : { id, method, params }));
      });

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) {
        if (
          message.method === "Network.responseReceived" &&
          (message.params?.type === "XHR" || message.params?.type === "Fetch") &&
          typeof message.params?.requestId === "string" &&
          typeof message.params?.response?.mimeType === "string" &&
          message.params.response.mimeType.includes("json")
        ) {
          requestIds.push(message.params.requestId);
        }

        return;
      }

      const promise = pending.get(message.id)!;
      pending.delete(message.id);
      if (message.error) {
        promise.reject(new Error(message.error.message));
        return;
      }

      promise.resolve(message.result);
    };

    socket.onerror = (error) => reject(error);
    socket.onopen = async () => {
      try {
        const targets = (await send("Target.getTargets")) as { targetInfos: Array<Record<string, unknown>> };
        let page = targets.targetInfos.find(
          (target) => target.type === "page" && typeof target.url === "string" && String(target.url).includes("douyin.com"),
        );

        if (!page) {
          const created = (await send("Target.createTarget", { url: targetUrl })) as { targetId: string };
          page = { targetId: created.targetId };
        }

        const attached = (await send("Target.attachToTarget", {
          targetId: page.targetId,
          flatten: true,
        })) as { sessionId: string };

        await send("Page.enable", {}, attached.sessionId);
        await send("Network.enable", {}, attached.sessionId);
        await send("Page.navigate", { url: targetUrl }, attached.sessionId);
        await new Promise((done) => setTimeout(done, 8000));

        for (const requestId of requestIds.reverse()) {
          try {
            const body = (await send("Network.getResponseBody", { requestId }, attached.sessionId)) as {
              body: string;
              base64Encoded?: boolean;
            };
            const text = body.base64Encoded ? Buffer.from(body.body, "base64").toString("utf8") : body.body;
            const extracted = extractDouyinVideoFromDetailResponse(text, awemeId);
            if (extracted) {
              socket.close();
              resolve(extracted);
              return;
            }
          } catch {
            continue;
          }
        }

        const html = await fetchDouyinHtmlFromBrowser(targetUrl);
        socket.close();
        resolve(html ? extractDouyinVideoFromHtml(html, awemeId) : null);
      } catch (error) {
        socket.close();
        reject(error);
      }
    };
  });
};

const fetchDouyinHtmlFromBrowser = async (targetUrl: string) => {
  const debuggingPort = Number.parseInt(process.env.CHROME_DEBUGGING_PORT ?? "9223", 10);
  if (!Number.isFinite(debuggingPort)) {
    return null;
  }

  const version = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`).then((response) =>
    response.ok ? response.json() : null,
  );
  if (!version?.webSocketDebuggerUrl) {
    return null;
  }

  const html = await new Promise<string | null>((resolve, reject) => {
    const socket = new WebSocket(version.webSocketDebuggerUrl as string);
    let sequence = 0;
    const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>();
    let documentRequestId: string | null = null;
    const send = (method: string, params: Record<string, unknown> = {}, sessionId?: string) =>
      new Promise<unknown>((innerResolve, innerReject) => {
        const id = ++sequence;
        pending.set(id, { resolve: innerResolve, reject: innerReject });
        socket.send(JSON.stringify(sessionId ? { id, sessionId, method, params } : { id, method, params }));
      });

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) {
        if (
          message.method === "Network.responseReceived" &&
          typeof message.params?.type === "string" &&
          message.params.type === "Document" &&
          typeof message.params?.requestId === "string" &&
          typeof message.params?.response?.url === "string" &&
          message.params.response.url.includes("douyin.com/video/")
        ) {
          documentRequestId = message.params.requestId;
        }

        return;
      }

      const promise = pending.get(message.id)!;
      pending.delete(message.id);
      if (message.error) {
        promise.reject(new Error(message.error.message));
        return;
      }

      promise.resolve(message.result);
    };

    socket.onerror = (error) => reject(error);
    socket.onopen = async () => {
      try {
        const targets = (await send("Target.getTargets")) as { targetInfos: Array<Record<string, unknown>> };
        let page = targets.targetInfos.find(
          (target) => target.type === "page" && typeof target.url === "string" && String(target.url).includes("douyin.com"),
        );

        if (!page) {
          const created = (await send("Target.createTarget", { url: targetUrl })) as { targetId: string };
          page = { targetId: created.targetId };
        }

        const attached = (await send("Target.attachToTarget", {
          targetId: page.targetId,
          flatten: true,
        })) as { sessionId: string };

        await send("Page.enable", {}, attached.sessionId);
        await send("Network.enable", {}, attached.sessionId);
        await send("Page.navigate", { url: targetUrl }, attached.sessionId);
        await new Promise((done) => setTimeout(done, 8000));

        if (documentRequestId) {
          const body = (await send("Network.getResponseBody", { requestId: documentRequestId }, attached.sessionId)) as {
            body: string;
            base64Encoded?: boolean;
          };
          const htmlBody = body.base64Encoded ? Buffer.from(body.body, "base64").toString("utf8") : body.body;
          socket.close();
          resolve(htmlBody);
          return;
        }

        const evaluated = (await send(
          "Runtime.evaluate",
          {
            expression: "document.documentElement.outerHTML",
            returnByValue: true,
          },
          attached.sessionId,
        )) as { result?: { value?: string } };
        socket.close();
        resolve(evaluated.result?.value ?? null);
      } catch (error) {
        socket.close();
        reject(error);
      }
    };
  });

  return html;
};

const downloadFile = async (url: string, outputPath: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Browser fallback download failed: HTTP ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, bytes);
};

const executeDouyinBrowserDownload = async (
  candidateUrl: string,
  outputPath: string,
): Promise<DownloadExecution | null> => {
  const awemeId = getAwemeIdFromUrl(candidateUrl);
  const extracted =
    (await fetchDouyinDetailFromBrowser(candidateUrl, awemeId).catch(() => null)) ??
    (await fetchDouyinHtmlFromBrowser(candidateUrl)
      .then((html) => (html ? extractDouyinVideoFromHtml(html, awemeId) : null))
      .catch(() => null));

  if (!extracted?.downloadUrl) {
    return null;
  }

  try {
    await downloadFile(extracted.downloadUrl, outputPath);
    return {
      status: "downloaded",
      reason: null,
      outputPath,
    };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Browser fallback download failed.",
      outputPath: null,
    };
  }
};
