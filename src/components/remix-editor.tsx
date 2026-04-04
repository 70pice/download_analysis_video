"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { RemixPlanArtifact } from "@/lib/contracts";

type RemixEditorProps = {
  remixPlan: RemixPlanArtifact | null;
  onSave: (remixPlan: RemixPlanArtifact) => void;
  busy: boolean;
};

export function RemixEditor({ remixPlan, onSave, busy }: RemixEditorProps) {
  const [draft, setDraft] = useState<RemixPlanArtifact | null>(remixPlan);

  useEffect(() => {
    setDraft(remixPlan);
  }, [remixPlan]);

  if (!draft) {
    return <div className="empty">Remix plan will appear here once generation completes.</div>;
  }

  return (
    <div className="segment-list">
      <div className="source-card">
        <label>
          <span className="eyebrow">Creative Intent</span>
          <textarea
            className="textarea"
            value={draft.creativeIntent}
            onChange={(event) =>
              setDraft({
                ...draft,
                creativeIntent: event.target.value,
              })
            }
          />
        </label>
        <label>
          <span className="eyebrow">Target Audience</span>
          <input
            className="input"
            value={draft.targetAudience}
            onChange={(event) =>
              setDraft({
                ...draft,
                targetAudience: event.target.value,
              })
            }
          />
        </label>
      </div>

      {draft.segments.map((segment, index) => (
        <article className="segment-card" key={segment.id}>
          <header>
            <div>
              <h3>
                Segment {index + 1}: {segment.goal}
              </h3>
              <div className="reference-row">
                {segment.sourceShotIds.map((shotId) => (
                  <span className="chip" key={shotId}>
                    {shotId}
                  </span>
                ))}
              </div>
            </div>
          </header>

          {[
            ["Goal", "goal"],
            ["Scene Plan", "scenePlan"],
            ["Blocking Plan", "blockingPlan"],
            ["Camera Plan", "cameraPlan"],
            ["Narration", "narration"],
            ["Visual Prompt", "visualPrompt"],
          ].map(([label, key]) => (
            <label key={key}>
              <span className="eyebrow">{label}</span>
              <textarea
                className="textarea"
                value={segment[key as keyof typeof segment] as string}
                onChange={(event) => {
                  const segments = [...draft.segments];
                  segments[index] = { ...segment, [key]: event.target.value };
                  setDraft({ ...draft, segments });
                }}
              />
            </label>
          ))}
        </article>
      ))}

      <button className="btn primary" disabled={busy} onClick={() => onSave(draft)} type="button">
        Save Remix Review
      </button>
    </div>
  );
}
