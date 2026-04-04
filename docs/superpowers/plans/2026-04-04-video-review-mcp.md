# Video Review MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the current short-video review pipeline as a local stdio MCP server that agents can call directly.

**Architecture:** Add a shared service layer over the current store and pipeline, then mount that layer into both the Next.js API routes and a new stdio MCP server. Keep the implementation single-project and file-backed so behavior stays aligned with the existing workstation.

**Tech Stack:** Next.js, TypeScript, Zod, Vitest, `@modelcontextprotocol/sdk`

---

### Task 1: Shared service layer

**Files:**
- Create: `src/lib/video-review-service.ts`
- Create: `src/tests/video-review-service.test.ts`
- Modify: `src/app/api/project/route.ts`
- Modify: `src/app/api/project/remix/route.ts`

- [ ] **Step 1: Write the failing service tests**
- [ ] **Step 2: Run the tests to verify failure**
- [ ] **Step 3: Implement minimal shared service functions**
- [ ] **Step 4: Repoint API routes to the service layer**
- [ ] **Step 5: Re-run service and route tests**

### Task 2: MCP server

**Files:**
- Create: `src/mcp/video-review-mcp.ts`
- Create: `src/tests/video-review-mcp.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing MCP smoke tests**
- [ ] **Step 2: Run the tests to verify failure**
- [ ] **Step 3: Add the MCP SDK dependency and stdio server**
- [ ] **Step 4: Register analyze/load/save tools against the shared service layer**
- [ ] **Step 5: Re-run MCP tests**

### Task 3: Docs and verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document how to run and connect the MCP server**
- [ ] **Step 2: Run `npm test -- --run`**
- [ ] **Step 3: Run `npx tsc --noEmit`**
- [ ] **Step 4: Run `npm run build`**
