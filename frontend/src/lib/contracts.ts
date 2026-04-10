import { z } from "zod";

export const stageStatusSchema = z.enum(["pending", "running", "complete", "failed"]);
export const jobStatusSchema = z.enum(["queued", "downloading", "processing", "completed", "failed"]);

export const stageRecordSchema = z.object({
  key: z.string(),
  label: z.string(),
  status: stageStatusSchema,
  error: z.string().nullable(),
  updatedAt: z.string(),
});

export const jobRecordSchema = z.object({
  id: z.string(),
  sourceUrl: z.string().url(),
  status: jobStatusSchema,
  activeStage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  stages: z.array(stageRecordSchema),
});

export const jobDetailResponseSchema = z.object({
  job: jobRecordSchema,
});

export type StageRecord = z.infer<typeof stageRecordSchema>;
export type JobRecord = z.infer<typeof jobRecordSchema>;
export type JobDetailResponse = z.infer<typeof jobDetailResponseSchema>;
