import React from "react";
import type { ProjectBundle } from "@/lib/contracts";

type StatusFooterProps = {
  bundle: ProjectBundle | null;
};

export function StatusFooter({ bundle }: StatusFooterProps) {
  const artifacts = [
    ["Transcript", bundle?.transcript ? "ready" : "pending"],
    ["Shots", bundle?.shots ? "ready" : "pending"],
    ["Shot Understanding", bundle?.shotUnderstanding ? "ready" : "pending"],
    ["Remix Plan", bundle?.remixPlan ? "ready" : "pending"],
  ];

  return (
    <section className="panel footer">
      <div>
        <p className="eyebrow">Pipeline State</p>
        <h3>Artifacts And Stage Progress</h3>
      </div>

      <div className="stage-list">
        {(bundle?.project.stages ?? []).map((stage) => (
          <div className="source-card" key={stage.key}>
            <strong>{stage.label}</strong>
            <div className="helper">
              {stage.status}
              {stage.error ? ` - ${stage.error}` : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="artifact-grid">
        {artifacts.map(([label, status]) => (
          <div key={label}>
            <strong>{label}</strong>
            <div className="helper">{status}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
