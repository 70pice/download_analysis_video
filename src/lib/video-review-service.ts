import { z } from "zod";
import { runPipeline } from "@/lib/pipeline";
import {
  createProject,
  getCurrentProject,
  getCurrentProjectBundle,
  getProjectArtifact,
  saveArtifact,
  saveEditedRemixPlan,
  updateStage,
} from "@/lib/project-store";
import {
  remixPlanArtifactSchema,
  shotUnderstandingArtifactSchema,
  storyboardArtifactSchema,
  type ProjectBundle,
  type RemixPlanArtifact,
} from "@/lib/contracts";
import { createRemixPlan, ingestSource } from "@/lib/mock-providers";

export const analyzeShortVideo = async (sourceInput: string): Promise<ProjectBundle> => {
  const project = await createProject(sourceInput);
  await runPipeline(project.id);
  return getCurrentProjectBundleOrThrow();
};

export const getCurrentProjectBundleOrThrow = async (): Promise<ProjectBundle> => {
  const bundle = await getCurrentProjectBundle();
  if (!bundle) {
    throw new Error("No active project bundle is available.");
  }

  return bundle;
};

export const saveRemixPlanForProject = async (
  projectId: string,
  remixPlan: RemixPlanArtifact,
) => saveEditedRemixPlan(projectId, remixPlanArtifactSchema.parse(remixPlan));

export const rerunRemixPlanForProject = async (projectId: string): Promise<ProjectBundle> => {
  const project = await getCurrentProject();
  if (!project || project.id !== projectId) {
    throw new Error("Project not found");
  }

  await updateStage(project.id, "generate_remix_plan", "running");
  const source = await ingestSource(project.sourceInput, project.sourceUrl);
  const storyboard = storyboardArtifactSchema.parse(
    JSON.parse(await getProjectArtifact(project.id, "analysis/storyboard.json")),
  );
  const understanding = shotUnderstandingArtifactSchema.parse(
    JSON.parse(await getProjectArtifact(project.id, "analysis/shot_understanding.json")),
  );
  const remixPlan = await createRemixPlan(source, storyboard, understanding);

  await saveArtifact("analysis/remix_plan.json", remixPlan);
  await updateStage(project.id, "generate_remix_plan", "complete");

  return getCurrentProjectBundleOrThrow();
};

export const remixSaveInputSchema = z.object({
  projectId: z.string(),
  remixPlan: remixPlanArtifactSchema,
});

export const rerunRemixInputSchema = z.object({
  projectId: z.string(),
});
