import "@testing-library/jest-dom/vitest";
import path from "node:path";

process.env.VIDEO_REVIEW_DATA_ROOT = path.join(
  process.cwd(),
  ".tmp",
  "vitest-data",
  process.env.VITEST_WORKER_ID ?? "main",
);
