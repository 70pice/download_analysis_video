import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createDefaultStages,
  projectBundleSchema,
  projectRecordSchema,
  remixPlanArtifactSchema,
  sourceArtifactSchema,
  shotUnderstandingArtifactSchema,
  shotsArtifactSchema,
  storyboardArtifactSchema,
  transcriptArtifactSchema,
  type ProjectBundle,
  type ProjectRecord,
  type RemixPlanArtifact,
} from "@/lib/contracts";

const getDataRoot = () => process.env.VIDEO_REVIEW_DATA_ROOT ?? path.join(process.cwd(), "data", "projects");
const getCurrentProjectRoot = () => path.join(getDataRoot(), "current");

const ensureDir = async (dirPath: string) => {
  await mkdir(dirPath, { recursive: true });
};

const writeJson = async (filePath: string, value: unknown) => {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
};

const readJson = async <T>(filePath: string, parser: { parse: (value: unknown) => T }) => {
  try {
    const raw = await readFile(filePath, "utf8");
    return parser.parse(JSON.parse(raw));
  } catch {
    return null;
  }
};

const projectFile = () => path.join(getCurrentProjectRoot(), "project.json");
const artifactFile = (relativePath: string) => path.join(getCurrentProjectRoot(), relativePath);

export const resetProjectData = async () => {
  await rm(getDataRoot(), { recursive: true, force: true });
};

const extractUrlFromSourceInput = (sourceInput: string) => {
  const match = sourceInput.match(/https?:\/\/[^\s]+/i);
  return match?.[0] ?? null;
};

export const createProject = async (sourceInput: string): Promise<ProjectRecord> => {
  await resetProjectData();

  const timestamp = new Date().toISOString();
  const project: ProjectRecord = {
    id: crypto.randomUUID(),
    sourceInput,
    sourceUrl: extractUrlFromSourceInput(sourceInput),
    status: "queued",
    activeStage: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    stages: createDefaultStages(),
  };

  await ensureDir(getCurrentProjectRoot());
  await writeJson(projectFile(), project);

  return project;
};

export const saveProject = async (project: ProjectRecord) => {
  project.updatedAt = new Date().toISOString();
  await writeJson(projectFile(), projectRecordSchema.parse(project));
};

export const getCurrentProject = async () => readJson(projectFile(), projectRecordSchema);

export const updateStage = async (
  projectId: string,
  stageKey: ProjectRecord["stages"][number]["key"],
  status: ProjectRecord["stages"][number]["status"],
  error: string | null = null,
) => {
  const project = await getCurrentProject();
  if (!project || project.id !== projectId) {
    throw new Error("Project not found");
  }

  const stage = project.stages.find((item) => item.key === stageKey);
  if (!stage) {
    throw new Error(`Unknown stage: ${stageKey}`);
  }

  stage.status = status;
  stage.error = error;
  stage.updatedAt = new Date().toISOString();
  project.activeStage = status === "running" ? stageKey : null;

  if (status === "failed") {
    project.status = "failed";
  } else if (project.stages.every((item) => item.status === "complete")) {
    project.status = "complete";
  } else if (project.stages.some((item) => item.status === "running")) {
    project.status = "running";
  }

  await saveProject(project);
  return project;
};

export const setProjectStatus = async (
  projectId: string,
  status: ProjectRecord["status"],
  activeStage: string | null,
) => {
  const project = await getCurrentProject();
  if (!project || project.id !== projectId) {
    throw new Error("Project not found");
  }

  project.status = status;
  project.activeStage = activeStage;
  await saveProject(project);
};

export const saveArtifact = async (relativePath: string, value: unknown) => {
  await writeJson(artifactFile(relativePath), value);
};

export const getProjectArtifact = async (_projectId: string, relativePath: string) => {
  return readFile(artifactFile(relativePath), "utf8");
};

export const saveEditedRemixPlan = async (projectId: string, remixPlan: RemixPlanArtifact) => {
  const payload = remixPlanArtifactSchema.parse({
    ...remixPlan,
    editor: "local-user",
    editedAt: new Date().toISOString(),
  });

  await saveArtifact("review/remix_plan.edited.json", payload);
  return payload;
};

export const getCurrentProjectBundle = async (): Promise<ProjectBundle | null> => {
  const project = await getCurrentProject();
  if (!project) {
    return null;
  }

  const transcript = await readJson(artifactFile("derived/transcript.json"), transcriptArtifactSchema);
  const source = await readJson(artifactFile("source/source.json"), sourceArtifactSchema);
  const shots = await readJson(artifactFile("derived/shots.json"), shotsArtifactSchema);
  const shotUnderstanding = await readJson(
    artifactFile("analysis/shot_understanding.json"),
    shotUnderstandingArtifactSchema,
  );
  const storyboard = await readJson(
    artifactFile("analysis/storyboard.json"),
    storyboardArtifactSchema,
  );
  const remixPlan = await readJson(artifactFile("analysis/remix_plan.json"), remixPlanArtifactSchema);
  const editedRemixPlan = await readJson(
    artifactFile("review/remix_plan.edited.json"),
    remixPlanArtifactSchema,
  );

  return projectBundleSchema.parse({
    project,
    source,
    transcript,
    shots,
    shotUnderstanding,
    storyboard,
    remixPlan,
    editedRemixPlan,
  });
};
