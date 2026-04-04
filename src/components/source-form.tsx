"use client";

import React from "react";
import { FormEvent, useDeferredValue, useState } from "react";

type SourceFormProps = {
  busy: boolean;
  projectReady: boolean;
  onCreateProject: (sourceInput: string) => void;
  onRerunRemix: () => void;
  onExport: () => void;
};

export function SourceForm({
  busy,
  onCreateProject,
  onRerunRemix,
  onExport,
  projectReady,
}: SourceFormProps) {
  const [sourceInput, setSourceInput] = useState("");
  const deferredSourceInput = useDeferredValue(sourceInput);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deferredSourceInput) {
      return;
    }

    onCreateProject(deferredSourceInput);
  };

  return (
    <form className="source-form" onSubmit={handleSubmit}>
      <label>
        <span className="eyebrow">Source Link Or Share Text</span>
        <input
          aria-label="Source URL"
          className="input"
          disabled={busy}
          onChange={(event) => setSourceInput(event.target.value)}
          placeholder="Paste a video link or Douyin share text"
          value={sourceInput}
        />
      </label>
      <button className="btn primary" disabled={busy || !deferredSourceInput} type="submit">
        {busy ? "Running..." : "Start Analysis"}
      </button>
      <button
        className="btn ghost"
        disabled={busy || !projectReady}
        onClick={onRerunRemix}
        type="button"
      >
        Regenerate Remix
      </button>
      <button className="btn" disabled={!projectReady} onClick={onExport} type="button">
        Export JSON
      </button>
    </form>
  );
}
