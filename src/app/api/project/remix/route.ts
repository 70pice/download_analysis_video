import { NextResponse } from "next/server";
import { z } from "zod";
import { remixPlanArtifactSchema } from "@/lib/contracts";
import {
  rerunRemixInputSchema,
  rerunRemixPlanForProject,
  saveRemixPlanForProject,
} from "@/lib/video-review-service";

const saveRemixSchema = z.object({
  projectId: z.string(),
  remixPlan: remixPlanArtifactSchema,
});

export async function PATCH(request: Request) {
  const payload = saveRemixSchema.parse(await request.json());
  const saved = await saveRemixPlanForProject(payload.projectId, payload.remixPlan);
  return NextResponse.json({ data: saved });
}

export async function POST(request: Request) {
  const payload = rerunRemixInputSchema.parse(await request.json());
  const bundle = await rerunRemixPlanForProject(payload.projectId).catch(() => null);
  if (!bundle) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ data: bundle });
}
