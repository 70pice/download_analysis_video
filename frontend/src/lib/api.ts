export type JobSummary = {
  id: string;
  sourceUrl: string;
  status: string;
};

const DEFAULT_API_BASE_URL = process.env.VIDEO_ANALYSIS_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function fetchJobs(baseUrl = DEFAULT_API_BASE_URL): Promise<{ items: JobSummary[] }> {
  try {
    const response = await fetch(`${baseUrl}/api/v1/jobs`, { cache: "no-store" });
    if (!response.ok) {
      return { items: [] };
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.items)) {
      return { items: [] };
    }

    return { items: payload.items };
  } catch {
    return { items: [] };
  }
}

export async function createJob(
  sourceUrl: string,
  baseUrl = DEFAULT_API_BASE_URL,
): Promise<{ job: JobSummary }> {
  const response = await fetch(`${baseUrl}/api/v1/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source_url: sourceUrl }),
  });

  if (!response.ok) {
    throw new Error("Failed to create job");
  }

  return response.json();
}
