import React from "react";
import { ReviewWorkstation } from "@/components/review-workstation";
import { getCurrentProjectBundle } from "@/lib/project-store";

export default async function HomePage() {
  const project = await getCurrentProjectBundle();

  return <ReviewWorkstation initialProject={project} />;
}
