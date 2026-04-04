"use client";

import React from "react";
import { useState, useTransition } from "react";
import type { ProjectBundle, RemixPlanArtifact } from "@/lib/contracts";
import { RemixEditor } from "@/components/remix-editor";
import { ShotList } from "@/components/shot-list";
import { SourceForm } from "@/components/source-form";
import { StatusFooter } from "@/components/status-footer";

type ReviewWorkstationProps = {
  initialProject: ProjectBundle | null;
};

const statusClassName = (status: string) => {
  if (status === "complete") return "status-pill complete";
  if (status === "running") return "status-pill running";
  if (status === "failed") return "status-pill failed";
  return "status-pill";
};

export function ReviewWorkstation({ initialProject }: ReviewWorkstationProps) {
  const [bundle, setBundle] = useState<ProjectBundle | null>(initialProject);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const effectiveRemix = bundle?.editedRemixPlan ?? bundle?.remixPlan ?? null;

  const refreshProject = async () => {
    const response = await fetch("/api/project", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load project");
    }

    const payload = (await response.json()) as { data: ProjectBundle | null };
    setBundle(payload.data);
  };

  const createProject = (sourceInput: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/project", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sourceInput }),
        });

        if (!response.ok) {
          throw new Error("Project creation failed");
        }

        const payload = (await response.json()) as { data: ProjectBundle };
        setBundle(payload.data);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unknown error");
      }
    });
  };

  const saveRemix = (remixPlan: RemixPlanArtifact) => {
    if (!bundle) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/project/remix", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectId: bundle.project.id, remixPlan }),
        });

        if (!response.ok) {
          throw new Error("Save failed");
        }

        await refreshProject();
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unknown error");
      }
    });
  };

  const rerunRemix = () => {
    if (!bundle) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/project/remix", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectId: bundle.project.id }),
        });

        if (!response.ok) {
          throw new Error("Regeneration failed");
        }

        await refreshProject();
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unknown error");
      }
    });
  };

  return (
    <main className="shell">
      <div className="stack">
        <section className="panel topbar">
          <div className="topbar-header">
            <div>
              <p className="eyebrow">Single-Project Review Mode</p>
              <h1 className="headline">Video Remix Review Deck</h1>
              <p className="subline">
                Feed a short-video URL into the pipeline, inspect the analysis on the left, and
                edit the creative remake plan on the right.
              </p>
            </div>
            <div className={statusClassName(bundle?.project.status ?? "queued")}>
              {bundle?.project.status ?? "ready"}
            </div>
          </div>

          <SourceForm
            busy={isPending}
            onCreateProject={createProject}
            onExport={() => window.open("/api/project?format=export", "_blank")}
            onRerunRemix={rerunRemix}
            projectReady={Boolean(bundle)}
          />

          {error ? <div className="helper">{error}</div> : null}
        </section>

        <section className="workspace">
          <section className="panel pane">
            <div className="source-card">
              <p className="eyebrow">Source Evidence</p>
              {bundle ? (
                <div className="stack">
                  <div>
                    <h2>{bundle.remixPlan?.title ?? "Current source project"}</h2>
                    <p className="subline">{bundle.project.sourceInput}</p>
                  </div>
                  <div className="meta-grid">
                    <div>
                      <strong>Resolved Source</strong>
                      <p className="helper">
                        {bundle.source?.resolved.author ?? "Unknown author"}
                        {bundle.source?.resolved.title ? ` · ${bundle.source.resolved.title}` : ""}
                      </p>
                    </div>
                    <div>
                      <strong>Download State</strong>
                      <p className="helper">
                        {bundle.source?.downloadExecution.status ?? "pending"}
                        {bundle.source?.downloadPlan.reason ? ` · ${bundle.source.downloadPlan.reason}` : ""}
                      </p>
                    </div>
                    <div>
                      <strong>Transcript</strong>
                      <p className="helper">{bundle.transcript?.fullText ?? "Waiting for artifact"}</p>
                    </div>
                    <div>
                      <strong>Storyboard Hook</strong>
                      <p className="helper">{bundle.storyboard?.audienceHook ?? "Waiting for artifact"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty">
                  Paste a source link above to generate a reviewable project.
                </div>
              )}
            </div>

            <div className="stack">
              <div>
                <p className="eyebrow">Shot Analysis</p>
                <h3>Left Pane Review</h3>
              </div>
              <ShotList bundle={bundle} />
            </div>
          </section>

          <section className="panel pane">
            <div>
              <p className="eyebrow">Remix Review</p>
              <h2>Creative Rewrite Workspace</h2>
              <p className="subline">
                This side is the editable handoff for the future generation engine.
              </p>
            </div>
            <RemixEditor remixPlan={effectiveRemix} onSave={saveRemix} busy={isPending} />
          </section>
        </section>

        <StatusFooter bundle={bundle} />
      </div>
    </main>
  );
}
