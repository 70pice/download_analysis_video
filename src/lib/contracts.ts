import { z } from "zod";

export const stageStatusSchema = z.enum(["pending", "running", "complete", "failed"]);
export type StageStatus = z.infer<typeof stageStatusSchema>;

export const pipelineStageSchema = z.object({
  key: z.enum([
    "ingest",
    "transcribe",
    "detect_shots",
    "understand_shots",
    "build_storyboard",
    "generate_remix_plan",
  ]),
  label: z.string(),
  status: stageStatusSchema,
  error: z.string().nullable(),
  updatedAt: z.string(),
});
export type PipelineStage = z.infer<typeof pipelineStageSchema>;

export const projectStatusSchema = z.enum(["queued", "running", "complete", "failed"]);

export const projectRecordSchema = z.object({
  id: z.string(),
  sourceInput: z.string().min(1),
  sourceUrl: z.string().url().nullable(),
  status: projectStatusSchema,
  activeStage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  stages: z.array(pipelineStageSchema),
});
export type ProjectRecord = z.infer<typeof projectRecordSchema>;

export const transcriptSegmentSchema = z.object({
  startMs: z.number(),
  endMs: z.number(),
  text: z.string(),
});

export const transcriptArtifactSchema = z.object({
  language: z.string(),
  fullText: z.string(),
  segments: z.array(transcriptSegmentSchema),
});
export type TranscriptArtifact = z.infer<typeof transcriptArtifactSchema>;

export const shotSchema = z.object({
  id: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  keyframeLabel: z.string(),
});
export type Shot = z.infer<typeof shotSchema>;

export const shotsArtifactSchema = z.object({
  shots: z.array(shotSchema),
});
export type ShotsArtifact = z.infer<typeof shotsArtifactSchema>;

export const shotUnderstandingItemSchema = z.object({
  id: z.string(),
  summary: z.string(),
  people: z.array(z.string()),
  scene: z.string(),
  blocking: z.string(),
  camera: z.string(),
  dialogue: z.string(),
  tags: z.array(z.string()),
  confidence: z.number(),
});

export const shotUnderstandingArtifactSchema = z.object({
  shots: z.array(shotUnderstandingItemSchema),
});
export type ShotUnderstandingArtifact = z.infer<typeof shotUnderstandingArtifactSchema>;

export const storyboardArtifactSchema = z.object({
  theme: z.string(),
  narrativeArc: z.string(),
  visualMotifs: z.array(z.string()),
  audienceHook: z.string(),
});
export type StoryboardArtifact = z.infer<typeof storyboardArtifactSchema>;

export const remixSegmentSchema = z.object({
  id: z.string(),
  goal: z.string(),
  beats: z.array(z.string()),
  sourceShotIds: z.array(z.string()),
  scenePlan: z.string(),
  blockingPlan: z.string(),
  cameraPlan: z.string(),
  narration: z.string(),
  visualPrompt: z.string(),
  notes: z.string(),
});
export type RemixSegment = z.infer<typeof remixSegmentSchema>;

export const remixPlanArtifactSchema = z.object({
  title: z.string(),
  creativeIntent: z.string(),
  targetAudience: z.string(),
  segments: z.array(remixSegmentSchema),
  editedAt: z.string().optional(),
  editor: z.string().optional(),
});
export type RemixPlanArtifact = z.infer<typeof remixPlanArtifactSchema>;

export const sourceResolvedSchema = z.object({
  platform: z.enum(["douyin", "generic"]),
  url: z.string().nullable(),
  normalizedInput: z.string(),
  author: z.string().nullable(),
  title: z.string().nullable(),
  hashtags: z.array(z.string()),
  shareCode: z.string().nullable(),
});

export const downloadPlanSchema = z.object({
  status: z.enum(["ready", "unresolved", "missing_binary"]),
  canAttemptDownload: z.boolean(),
  reason: z.string().nullable(),
  candidateUrl: z.string().nullable(),
  executable: z.string().nullable(),
  outputFilename: z.string(),
});

export const downloadExecutionSchema = z.object({
  status: z.enum(["downloaded", "skipped", "failed"]),
  reason: z.string().nullable(),
  outputPath: z.string().nullable(),
});

export const sourceArtifactSchema = z.object({
  resolved: sourceResolvedSchema,
  downloadPlan: downloadPlanSchema,
  downloadExecution: downloadExecutionSchema,
  sourceInput: z.string(),
  sourceUrl: z.string(),
  platform: z.string(),
  suggestedTitle: z.string(),
  durationSeconds: z.number(),
});
export type SourceArtifact = z.infer<typeof sourceArtifactSchema>;

export const projectBundleSchema = z.object({
  project: projectRecordSchema,
  source: sourceArtifactSchema.nullable(),
  transcript: transcriptArtifactSchema.nullable(),
  shots: shotsArtifactSchema.nullable(),
  shotUnderstanding: shotUnderstandingArtifactSchema.nullable(),
  storyboard: storyboardArtifactSchema.nullable(),
  remixPlan: remixPlanArtifactSchema.nullable(),
  editedRemixPlan: remixPlanArtifactSchema.nullable(),
});
export type ProjectBundle = z.infer<typeof projectBundleSchema>;

export const createDefaultStages = (): PipelineStage[] => {
  const timestamp = new Date().toISOString();

  return [
    { key: "ingest", label: "Source ingest", status: "pending", error: null, updatedAt: timestamp },
    { key: "transcribe", label: "Transcript", status: "pending", error: null, updatedAt: timestamp },
    { key: "detect_shots", label: "Shot detection", status: "pending", error: null, updatedAt: timestamp },
    { key: "understand_shots", label: "Shot understanding", status: "pending", error: null, updatedAt: timestamp },
    { key: "build_storyboard", label: "Storyboard", status: "pending", error: null, updatedAt: timestamp },
    { key: "generate_remix_plan", label: "Remix plan", status: "pending", error: null, updatedAt: timestamp },
  ];
};
