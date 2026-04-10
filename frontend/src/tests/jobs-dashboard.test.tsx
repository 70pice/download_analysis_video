import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobsDashboard } from "../components/jobs-dashboard";
import * as api from "../lib/api";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    createJob: vi.fn(),
  };
});

test("renders url form and jobs heading", () => {
  render(<JobsDashboard initialJobs={[]} />);

  expect(screen.getByText(/video analysis admin/i)).toBeInTheDocument();
  expect(screen.getByText(/source url/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /create job/i })).toBeInTheDocument();
  expect(screen.getByText(/recent jobs/i)).toBeInTheDocument();
});

test("submits a new job and renders it in the list", async () => {
  const user = userEvent.setup();
  const createJobMock = vi.mocked(api.createJob);
  createJobMock.mockResolvedValue({
    job: {
      id: "job_123",
      sourceUrl: "https://example.com/video",
      status: "queued",
    },
  });

  render(<JobsDashboard initialJobs={[]} />);

  await user.type(screen.getByLabelText(/source url/i), "https://example.com/video");
  await user.click(screen.getByRole("button", { name: /create job/i }));

  expect(createJobMock).toHaveBeenCalledWith("https://example.com/video");
  expect(await screen.findByText("https://example.com/video")).toBeInTheDocument();
});
