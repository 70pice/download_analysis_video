# Video Review Workstation

Single-project immersive review UI for turning a short-video URL into:

- transcript artifacts
- shot analysis
- storyboard summary
- editable remix plan

The current build uses deterministic mock providers so the end-to-end review flow is runnable without external media tooling. The artifact contracts are designed so real adapters for `yt-dlp`, `ffmpeg`, ASR, and multimodal models can replace the mock stage outputs later.

## Local Development

```bash
cmd /c npm.cmd install
cmd /c npm.cmd run dev
```

Open `http://localhost:3000`.

## MCP Server

This repo also exposes the current single-project pipeline as a local stdio MCP server named `video_download`.

Run it with:

```bash
cmd /c npm.cmd run mcp:video_download
```

Available MCP tools:

- `analyze_short_video`
  Input: `{ "source_input": "..." }`
  Runs the current pipeline and returns the full project bundle.
- `get_current_project_bundle`
  Returns the latest saved bundle from local artifacts.
- `save_remix_plan`
  Input: `{ "project_id": "...", "remix_plan": { ... } }`
  Saves an edited remix plan into `review/remix_plan.edited.json`.

Example Codex MCP config:

```json
{
  "mcpServers": {
    "video_download": {
      "command": "cmd",
      "args": ["/c", "npm.cmd", "run", "mcp:video_download"],
      "cwd": "D:\\AI创业挑战\\analyze_similar_video"
    }
  }
}
```

## Install On Another Computer

1. Install Node.js 20+.
2. Clone or copy this repository to the target machine.
3. Run:

```bash
cmd /c npm.cmd install
```

4. Add this block to that machine's `C:\\Users\\<YourUser>\\.codex\\config.toml`:

```toml
[mcp_servers.video_download]
command = "cmd"
args = ["/c", "npm.cmd", "run", "mcp:video_download"]
cwd = "D:\\path\\to\\analyze_similar_video"
```

5. Restart Codex or open a new Codex session.

If that machine also needs Douyin download fallback, make sure Chrome is installed and the user is logged into Douyin in that browser.

## Tests

```bash
cmd /c npm.cmd test -- --run
cmd /c npx.cmd tsc --noEmit
cmd /c npm.cmd run build
```

## Data Layout

Runtime artifacts are written under `data/projects/current/`:

- `project.json`
- `source/source.json`
- `derived/transcript.json`
- `derived/shots.json`
- `analysis/shot_understanding.json`
- `analysis/storyboard.json`
- `analysis/remix_plan.json`
- `review/remix_plan.edited.json`

## Current Limitations

- no real video download yet
- no real ASR or VLM provider yet
- no JiMeng CLI execution yet
- single active project only
