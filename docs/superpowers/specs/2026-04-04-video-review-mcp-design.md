# Video Review MCP Design

## Goal

Expose the existing short-video review pipeline as a local MCP server so agent clients can trigger analysis, read the latest project bundle, and save edited remix plans without going through the web UI.

## Scope

This design keeps the current single-project constraint and reuses the existing repository logic. It does not add background jobs, multi-project storage, or new media analysis stages.

## Approach

We add a small shared service layer above the current project store and pipeline. Both the Next.js API routes and the new MCP server call that shared layer so the business behavior stays consistent in one place.

The MCP server uses stdio transport and exposes three tools:

1. `analyze_short_video`
   Accepts `source_input` and runs the existing pipeline end-to-end, returning the current project bundle.
2. `get_current_project_bundle`
   Returns the latest saved bundle for agent inspection.
3. `save_remix_plan`
   Accepts a validated remix plan and writes it as the edited remix artifact.

## Files

- Create `src/lib/video-review-service.ts`
  Shared orchestration for create/run/load/save operations.
- Create `src/mcp/video-review-mcp.ts`
  MCP server definition and stdio bootstrap.
- Create `src/tests/video-review-service.test.ts`
  Service-layer behavior tests.
- Create `src/tests/video-review-mcp.test.ts`
  MCP presentation and registration smoke tests.
- Modify `src/app/api/project/route.ts`
  Route should call the shared service layer.
- Modify `src/app/api/project/remix/route.ts`
  Route should call the shared service layer.
- Modify `package.json`
  Add MCP dependency and runnable scripts.
- Modify `README.md`
  Document how agents connect to the MCP server.

## Error Handling

- MCP tools should return structured text content with concise failure reasons when the pipeline throws.
- The shared service layer should keep the current persistence behavior and let validation errors surface cleanly.
- The MCP server should be read-write only within the current repo workspace and should not silently create alternate data roots.

## Verification

- Unit tests for analyze/load/save shared service functions.
- MCP smoke test for tool registration and response shaping.
- Full repo verification with `npm test -- --run`, `tsc --noEmit`, and `npm run build`.
