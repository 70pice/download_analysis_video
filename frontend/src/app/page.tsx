import { fetchJobs } from "@/lib/api";
import { JobsDashboard } from "@/components/jobs-dashboard";

export default async function HomePage() {
  const jobs = await fetchJobs();

  return <JobsDashboard initialJobs={jobs.items} />;
}
