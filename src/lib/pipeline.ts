import {
  buildStoryboard,
  createRemixPlan,
  createTranscript,
  detectShots,
  ingestSource,
  understandShots,
} from "@/lib/mock-providers";
import { saveArtifact, setProjectStatus, updateStage, getCurrentProject } from "@/lib/project-store";

export const runPipeline = async (projectId: string) => {
  const project = await getCurrentProject();

  if (!project || project.id !== projectId) {
    throw new Error("Project not found");
  }

  await setProjectStatus(projectId, "running", "ingest");

  try {
    await updateStage(projectId, "ingest", "running");
    const source = await ingestSource(project.sourceInput, project.sourceUrl);
    await saveArtifact("source/source.json", source);
    await updateStage(projectId, "ingest", "complete");

    await updateStage(projectId, "transcribe", "running");
    const transcript = await createTranscript(source);
    await saveArtifact("derived/transcript.json", transcript);
    await updateStage(projectId, "transcribe", "complete");

    await updateStage(projectId, "detect_shots", "running");
    const shots = await detectShots();
    await saveArtifact("derived/shots.json", shots);
    await updateStage(projectId, "detect_shots", "complete");

    await updateStage(projectId, "understand_shots", "running");
    const understanding = await understandShots(source, transcript, shots);
    await saveArtifact("analysis/shot_understanding.json", understanding);
    await updateStage(projectId, "understand_shots", "complete");

    await updateStage(projectId, "build_storyboard", "running");
    const storyboard = await buildStoryboard(source, understanding);
    await saveArtifact("analysis/storyboard.json", storyboard);
    await updateStage(projectId, "build_storyboard", "complete");

    await updateStage(projectId, "generate_remix_plan", "running");
    const remixPlan = await createRemixPlan(source, storyboard, understanding);
    await saveArtifact("analysis/remix_plan.json", remixPlan);
    await updateStage(projectId, "generate_remix_plan", "complete");

    await setProjectStatus(projectId, "complete", null);
  } catch (error) {
    await setProjectStatus(projectId, "failed", null);
    throw error;
  }
};
