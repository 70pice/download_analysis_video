import { createHash } from "node:crypto";
import type { RemixPlanArtifact, ShotUnderstandingArtifact, ShotsArtifact, StoryboardArtifact, TranscriptArtifact } from "@/lib/contracts";
import { ensureYtDlpExecutable, executeDownload, planDownload, type DownloadPlan, type DownloadExecution } from "@/lib/download-adapter";
import { parseSourceInput } from "@/lib/source-input";

export type SourceArtifact = {
  resolved: ReturnType<typeof parseSourceInput>;
  downloadPlan: DownloadPlan;
  downloadExecution: DownloadExecution;
  sourceInput: string;
  sourceUrl: string;
  platform: string;
  suggestedTitle: string;
  durationSeconds: number;
};

const THEMES = [
  "urban hustle",
  "clean living ritual",
  "nostalgic daily slice",
  "high-energy transformation",
];

const HOOKS = [
  "start with the payoff frame first",
  "open on a surprising close-up",
  "lead with contrast before context",
  "drop the viewer into movement immediately",
];

const tokenize = (sourceUrl: string) => {
  try {
    const url = new URL(sourceUrl);
    return [url.hostname, ...url.pathname.split("/").filter(Boolean)];
  } catch {
    return sourceUrl.split(/[/?#=&._-]+/).filter(Boolean);
  }
};

const hashIndex = (seed: string, size: number) => {
  const hex = createHash("sha1").update(seed).digest("hex");
  return parseInt(hex.slice(0, 8), 16) % size;
};

export const ingestSource = async (sourceInput: string, sourceUrl: string | null): Promise<SourceArtifact> => {
  const resolved = parseSourceInput(sourceInput);
  const stableSource = sourceUrl ?? resolved.url ?? sourceInput;
  const tokens = tokenize(stableSource);
  const titleSeed = resolved.title ?? tokens.slice(-2).join(" ").replace(/\b\w/g, (value) => value.toUpperCase());
  const platform = resolved.platform === "douyin" ? "douyin" : sourceUrl ? new URL(sourceUrl).hostname : "share-text";
  const executable = await ensureYtDlpExecutable().catch(() => null);
  const downloadPlan = planDownload(
    resolved,
    { executable },
  );
  const downloadExecution = await executeDownload(downloadPlan);

  return {
    resolved,
    downloadPlan,
    downloadExecution,
    sourceInput,
    sourceUrl: sourceUrl ?? resolved.url ?? "",
    platform,
    suggestedTitle: titleSeed || "Short Video Reference",
    durationSeconds: 32 + hashIndex(stableSource, 24),
  };
};

export const createTranscript = async (source: SourceArtifact): Promise<TranscriptArtifact> => {
  const tokens = tokenize(source.sourceUrl).slice(-6);
  const phrases = [
    `Open on ${tokens[0] ?? "the hero detail"} with no setup.`,
    "Shift into the core action and show the environment reacting.",
    "Reveal the lifestyle payoff with a stronger visual contrast.",
    "Close on a reusable branded gesture or visual signature.",
  ];

  const segments = phrases.map((text, index) => ({
    startMs: index * 8000,
    endMs: (index + 1) * 8000,
    text,
  }));

  return {
    language: "en",
    fullText: phrases.join(" "),
    segments,
  };
};

export const detectShots = async (): Promise<ShotsArtifact> => ({
  shots: [
    { id: "shot-01", startMs: 0, endMs: 5000, keyframeLabel: "cold open detail" },
    { id: "shot-02", startMs: 5000, endMs: 12000, keyframeLabel: "main action reveal" },
    { id: "shot-03", startMs: 12000, endMs: 22000, keyframeLabel: "environment reaction" },
    { id: "shot-04", startMs: 22000, endMs: 32000, keyframeLabel: "payoff and loopable ending" },
  ],
});

export const understandShots = async (
  source: SourceArtifact,
  transcript: TranscriptArtifact,
  shots: ShotsArtifact,
): Promise<ShotUnderstandingArtifact> => {
  const theme = THEMES[hashIndex(source.sourceUrl, THEMES.length)];

  return {
    shots: shots.shots.map((shot, index) => ({
      id: shot.id,
      summary: `${shot.keyframeLabel} framed around ${theme}.`,
      people: index % 2 === 0 ? ["lead subject"] : ["lead subject", "supporting extra"],
      scene: index < 2 ? "interior lifestyle set" : "transition to wider environment",
      blocking:
        index === 0
          ? "subject enters frame from the edge and claims attention"
          : "subject moves forward while the environment echoes the beat",
      camera:
        index === 0
          ? "tight push-in with intentional suspense"
          : index === 1
            ? "match-cut into medium handheld"
            : index === 2
              ? "wider lateral drift"
              : "held hero ending with a soft settle",
      dialogue: transcript.segments[Math.min(index, transcript.segments.length - 1)]?.text ?? "",
      tags: [theme, index < 2 ? "hook" : "payoff", shot.keyframeLabel],
      confidence: 0.8 + index * 0.04,
    })),
  };
};

export const buildStoryboard = async (
  source: SourceArtifact,
  understanding: ShotUnderstandingArtifact,
): Promise<StoryboardArtifact> => {
  const theme = THEMES[hashIndex(source.sourceUrl, THEMES.length)];
  const hook = HOOKS[hashIndex(source.suggestedTitle, HOOKS.length)];

  return {
    theme,
    narrativeArc: `Hook -> reveal -> expansion -> payoff built around ${theme}.`,
    visualMotifs: understanding.shots.slice(0, 3).map((shot) => shot.camera),
    audienceHook: hook,
  };
};

export const createRemixPlan = async (
  source: SourceArtifact,
  storyboard: StoryboardArtifact,
  understanding: ShotUnderstandingArtifact,
): Promise<RemixPlanArtifact> => ({
  title: `${source.suggestedTitle} Remix Blueprint`,
  creativeIntent:
    "Rebuild the source as a punchier short with a stronger first three seconds and clearer emotional payoff.",
  targetAudience: "short-video viewers who reward immediate visual hooks",
  segments: [
    {
      id: "segment-a",
      goal: "Deliver the hook before any explanation.",
      beats: ["payoff tease", "visual question", "micro-suspense"],
      sourceShotIds: [understanding.shots[3]?.id ?? "shot-04", understanding.shots[0]?.id ?? "shot-01"],
      scenePlan: "Start with the strongest outcome frame, then snap back to the setup environment.",
      blockingPlan: "Hold the subject nearly still first, then trigger a sudden directional move.",
      cameraPlan: "Fast close detail followed by a sharper medium reveal.",
      narration: "Start where the viewer would expect the ending, then immediately ask how we got there.",
      visualPrompt: `cinematic short video, ${storyboard.theme}, tactile close-up, premium lighting, vertical 9:16`,
      notes: "Prioritize visual rhythm over exposition.",
    },
    {
      id: "segment-b",
      goal: "Build the world and make the action legible.",
      beats: ["context", "motion", "environment response"],
      sourceShotIds: [understanding.shots[1]?.id ?? "shot-02", understanding.shots[2]?.id ?? "shot-03"],
      scenePlan: "Expand into the full environment while preserving the original momentum.",
      blockingPlan: "Subject advances deeper into frame; background elements answer the motion.",
      cameraPlan: "Medium handheld into lateral movement for energy.",
      narration: "Clarify what is happening without slowing the cut pace.",
      visualPrompt: "dynamic vertical ad shot, environmental storytelling, crisp motion, warm editorial grade",
      notes: "Use one clean gesture to define the story logic.",
    },
    {
      id: "segment-c",
      goal: "Close on a memorable repeatable image.",
      beats: ["payoff", "brandable pose", "loopable end frame"],
      sourceShotIds: [understanding.shots[3]?.id ?? "shot-04"],
      scenePlan: "Return to the payoff with more control and a cleaner background.",
      blockingPlan: "Subject holds eye-line for half a beat before the final gesture.",
      cameraPlan: "Locked hero frame with a subtle settle.",
      narration: "Land on the emotional or aesthetic reward with no extra explanation.",
      visualPrompt: "hero vertical closing shot, elegant framing, precise gesture, satisfying ending frame",
      notes: "This segment should be reusable as the opening payoff in future variants.",
    },
  ],
});
