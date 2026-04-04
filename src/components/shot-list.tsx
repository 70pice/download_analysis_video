import React from "react";
import type { ProjectBundle } from "@/lib/contracts";

const formatSeconds = (milliseconds: number) => (milliseconds / 1000).toFixed(1);

type ShotListProps = {
  bundle: ProjectBundle | null;
};

export function ShotList({ bundle }: ShotListProps) {
  const shots = bundle?.shotUnderstanding?.shots ?? [];

  if (!shots.length) {
    return <div className="empty">Shot analysis will appear here after the pipeline runs.</div>;
  }

  return (
    <div className="shot-list">
      {shots.map((shot) => {
        const rawShot = bundle?.shots?.shots.find((item) => item.id === shot.id);

        return (
          <article className="shot-card" key={shot.id}>
            <header>
              <div>
                <strong>{shot.id}</strong>
                <div className="helper">
                  {formatSeconds(rawShot?.startMs ?? 0)}s - {formatSeconds(rawShot?.endMs ?? 0)}s
                </div>
              </div>
              <div className="chip">confidence {(shot.confidence * 100).toFixed(0)}%</div>
            </header>
            <p>{shot.summary}</p>
            <div className="helper">
              <strong>Scene:</strong> {shot.scene}
            </div>
            <div className="helper">
              <strong>Blocking:</strong> {shot.blocking}
            </div>
            <div className="helper">
              <strong>Camera:</strong> {shot.camera}
            </div>
            <div className="helper">
              <strong>Dialogue:</strong> {shot.dialogue}
            </div>
            <div className="chip-row">
              {shot.people.map((person) => (
                <span className="chip" key={person}>
                  {person}
                </span>
              ))}
              {shot.tags.map((tag) => (
                <span className="chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
