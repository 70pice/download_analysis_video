import { afterEach, expect, test, vi } from "vitest";
import { fetchJobs } from "../lib/api";

afterEach(() => {
  vi.restoreAllMocks();
});

test("fetchJobs returns an empty list when the backend response is not ok", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn(),
    }),
  );

  await expect(fetchJobs("http://127.0.0.1:8000")).resolves.toEqual({ items: [] });
});

test("fetchJobs returns an empty list when the backend payload has no items array", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ job: {} }),
    }),
  );

  await expect(fetchJobs("http://127.0.0.1:8000")).resolves.toEqual({ items: [] });
});
