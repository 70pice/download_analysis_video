# Video Review Workstation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable single-project web review workstation that ingests a video URL, generates persisted analysis artifacts through a staged pipeline, and lets the user edit the remix plan.

**Architecture:** Use a Next.js app-router application with route handlers for the backend, a filesystem-backed project store under `data/projects/current`, and pluggable mock providers for each pipeline stage. Keep all intermediate artifacts on disk so later real media and model adapters can replace the mock providers without changing the UI contract.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library, Zod, Node filesystem APIs

---

### Task 1: Scaffold The Web App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Write the failing package sanity test**

```ts
import { describe, expect, it } from "vitest";

describe("package manifest", () => {
  it("declares a web app and test scripts", async () => {
    const pkg = await import("../package.json");
    expect(pkg.default.scripts.dev).toBeDefined();
    expect(pkg.default.scripts.test).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npm.cmd test -- --run src/tests/package.test.ts`
Expected: FAIL because `package.json` and test setup do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create the package manifest, Next config, TypeScript config, Vitest config, and minimal app shell with a placeholder page.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npm.cmd test -- --run src/tests/package.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.ts vitest.config.ts src/app/layout.tsx src/app/page.tsx src/app/globals.css src/tests/package.test.ts
git commit -m "feat: scaffold review workstation app"
```

### Task 2: Build Project Store And Contracts

**Files:**
- Create: `src/lib/contracts.ts`
- Create: `src/lib/project-store.ts`
- Test: `src/tests/project-store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createProject, getCurrentProject } from "@/lib/project-store";

describe("project store", () => {
  it("creates and reloads the current project", async () => {
    const project = await createProject("https://example.com/video");
    const reloaded = await getCurrentProject();
    expect(reloaded?.id).toBe(project.id);
    expect(reloaded?.sourceUrl).toBe("https://example.com/video");
    expect(reloaded?.status).toBe("queued");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npm.cmd test -- --run src/tests/project-store.test.ts`
Expected: FAIL because the store functions do not exist.

- [ ] **Step 3: Write minimal implementation**

Define Zod-backed contracts plus filesystem helpers to create `data/projects/current/project.json` and reload it.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npm.cmd test -- --run src/tests/project-store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/contracts.ts src/lib/project-store.ts src/tests/project-store.test.ts
git commit -m "feat: add project persistence layer"
```

### Task 3: Implement Pipeline Engine With Mock Providers

**Files:**
- Create: `src/lib/mock-providers.ts`
- Create: `src/lib/pipeline.ts`
- Test: `src/tests/pipeline.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createProject, getProjectArtifact } from "@/lib/project-store";
import { runPipeline } from "@/lib/pipeline";

describe("pipeline", () => {
  it("writes all core artifacts", async () => {
    const project = await createProject("https://example.com/video");
    await runPipeline(project.id);
    expect(await getProjectArtifact(project.id, "derived/transcript.json")).toContain("segments");
    expect(await getProjectArtifact(project.id, "analysis/remix_plan.json")).toContain("creativeIntent");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npm.cmd test -- --run src/tests/pipeline.test.ts`
Expected: FAIL because the pipeline does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add deterministic mock providers and a stage runner that updates project status and writes every artifact file.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npm.cmd test -- --run src/tests/pipeline.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/mock-providers.ts src/lib/pipeline.ts src/tests/pipeline.test.ts
git commit -m "feat: add mock artifact pipeline"
```

### Task 4: Add API Routes

**Files:**
- Create: `src/app/api/project/route.ts`
- Create: `src/app/api/project/remix/route.ts`
- Test: `src/tests/api-routes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { POST as createProject } from "@/app/api/project/route";

describe("project api", () => {
  it("creates a project from a source url", async () => {
    const response = await createProject(
      new Request("http://localhost/api/project", {
        method: "POST",
        body: JSON.stringify({ sourceUrl: "https://example.com/video" }),
      }),
    );
    expect(response.status).toBe(201);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npm.cmd test -- --run src/tests/api-routes.test.ts`
Expected: FAIL because the route handlers do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement project creation, project fetch, remix save, and remix regeneration route handlers.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npm.cmd test -- --run src/tests/api-routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/project/route.ts src/app/api/project/remix/route.ts src/tests/api-routes.test.ts
git commit -m "feat: expose review workstation api routes"
```

### Task 5: Build The Immersive Review UI

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/review-workstation.tsx`
- Create: `src/components/source-form.tsx`
- Create: `src/components/shot-list.tsx`
- Create: `src/components/remix-editor.tsx`
- Create: `src/components/status-footer.tsx`
- Test: `src/tests/review-workstation.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewWorkstation } from "@/components/review-workstation";

describe("review workstation", () => {
  it("renders both analysis and remix sections", () => {
    render(<ReviewWorkstation initialProject={null} />);
    expect(screen.getByText(/source url/i)).toBeInTheDocument();
    expect(screen.getByText(/remix review/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npm.cmd test -- --run src/tests/review-workstation.test.tsx`
Expected: FAIL because the UI components do not exist.

- [ ] **Step 3: Write minimal implementation**

Create the single-page workstation UI with a top bar, left analysis pane, right remix editor, and footer artifact area. Wire save and regenerate actions to the API.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npm.cmd test -- --run src/tests/review-workstation.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/review-workstation.tsx src/components/source-form.tsx src/components/shot-list.tsx src/components/remix-editor.tsx src/components/status-footer.tsx src/tests/review-workstation.test.tsx
git commit -m "feat: add immersive remix review ui"
```

### Task 6: Verify End-To-End Behavior

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the failing documentation test**

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("readme", () => {
  it("documents local development commands", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(readme).toContain("npm run dev");
    expect(readme).toContain("npm test");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npm.cmd test -- --run src/tests/readme.test.ts`
Expected: FAIL because the README is missing.

- [ ] **Step 3: Write minimal implementation**

Document setup, dev commands, artifact folders, and the current mock-provider limitation.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npm.cmd test -- --run src/tests/readme.test.ts`
Expected: PASS

- [ ] **Step 5: Run full verification**

Run: `cmd /c npm.cmd test -- --run`
Expected: PASS across the full test suite.

- [ ] **Step 6: Commit**

```bash
git add README.md src/tests/readme.test.ts
git commit -m "docs: document local review workstation"
```
