"use client";

import React, { useState } from "react";
import { createJob, type JobSummary } from "../lib/api";

type JobsDashboardProps = {
  initialJobs: JobSummary[];
};

export function JobsDashboard({ initialJobs }: JobsDashboardProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [sourceUrl, setSourceUrl] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedSourceUrl = sourceUrl.trim();
    if (!trimmedSourceUrl) {
      return;
    }

    const response = await createJob(trimmedSourceUrl);
    setJobs((currentJobs) => [response.job, ...currentJobs]);
    setSourceUrl("");
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Split repo scaffold</p>
        <h1>Video Analysis Admin</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="source-url">Source URL</label>
          <input
            id="source-url"
            name="source-url"
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
          <button type="submit">Create Job</button>
        </form>
        <section>
          <h2>Recent Jobs</h2>
          <ul>
            {jobs.map((job) => (
              <li key={job.id}>
                <span>{job.sourceUrl}</span>
                <span>{job.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
