# DESIGN001 - GitHub Pages Deployment Workflow

**Status:** Implemented  
**Created:** 2025-11-28  
**Related Task:** [TASK001](../tasks/TASK001-deploy-gh-pages.md)

## Overview

This design documents the GitHub Pages deployment workflow for the Idle Bricks game, enabling automated builds and deployments triggered by version tags.

## Requirements (EARS Format)

1. **REQ-001**: WHEN a version tag (`v*`) is pushed to the repository, THE SYSTEM SHALL build the Vite application and deploy it to GitHub Pages.
   - **Acceptance:** Push a tag like `v1.0.0` and verify the site is live at `https://<owner>.github.io/vibe-idle-bricks/`.

2. **REQ-002**: THE SYSTEM SHALL allow manual deployment via workflow dispatch.
   - **Acceptance:** Trigger workflow manually from GitHub Actions UI.

3. **REQ-003**: THE SYSTEM SHALL use the repository name as the base path for all assets.
   - **Acceptance:** All JS, CSS, and asset paths start with `/vibe-idle-bricks/`.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions Workflow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Trigger: push tag v* OR workflow_dispatch                       │
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────┐         │
│  │     BUILD JOB        │      │     DEPLOY JOB       │         │
│  │                      │      │                      │         │
│  │  1. Checkout code    │      │  1. Deploy to Pages  │         │
│  │  2. Setup Node 20    │─────▶│     (deploy-pages)   │         │
│  │  3. npm ci           │      │                      │         │
│  │  4. npm run build    │      │  Output: page_url    │         │
│  │  5. Upload artifact  │      │                      │         │
│  └──────────────────────┘      └──────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Vite Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/vibe-idle-bricks/',
})
```

**Purpose:** Sets the base URL for all generated assets so they resolve correctly when served from a subdirectory on GitHub Pages.

### 2. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

| Property | Value | Rationale |
|----------|-------|-----------|
| **Trigger** | `push: tags: v*` | Deploy only on explicit version releases |
| **Manual trigger** | `workflow_dispatch` | Allow hotfix deployments without tagging |
| **Node version** | 20 | LTS version, matches local development |
| **Concurrency** | `group: "pages"` with `cancel-in-progress: true` | Prevents overlapping deployments |

#### Permissions

```yaml
permissions:
  contents: read      # Read repository code
  pages: write        # Write to GitHub Pages
  id-token: write     # Required for OIDC token-based deployment
```

#### Jobs

1. **build**: Checks out code, installs dependencies, runs `npm run build`, uploads `./dist` as artifact
2. **deploy**: Downloads artifact and deploys to GitHub Pages using `actions/deploy-pages@v4`

## Actions Used

| Action | Version | Purpose |
|--------|---------|---------|
| `actions/checkout` | v4 | Clone repository |
| `actions/setup-node` | v4 | Install Node.js with npm cache |
| `actions/upload-pages-artifact` | v4 | Package dist folder for Pages |
| `actions/deploy-pages` | v4 | Deploy to GitHub Pages environment |

## Data Flow

```text
1. Developer pushes tag (e.g., git tag v1.0.0 && git push --tags)
                    │
                    ▼
2. GitHub detects tag push, triggers workflow
                    │
                    ▼
3. BUILD job: npm ci → npm run build → dist/ folder created
                    │
                    ▼
4. Upload artifact: dist/ packaged as GitHub Pages artifact
                    │
                    ▼
5. DEPLOY job: Artifact deployed to gh-pages environment
                    │
                    ▼
6. Site live at: https://<owner>.github.io/vibe-idle-bricks/
```

## Decisions & Trade-offs

### Decision 1: Tag-based deployment vs branch-based

**Choice:** Tag-based (`v*`)

**Rationale:**

- Prevents accidental deployments from every commit
- Creates clear release cadence
- Version tags serve as deployment audit trail

**Alternative considered:** Deploy on push to `main` — rejected due to risk of deploying incomplete features.

### Decision 2: Separate build and deploy jobs

**Choice:** Two-job pipeline

**Rationale:**

- Clear separation of concerns
- Deploy job can be re-run without rebuilding
- Follows GitHub's recommended pattern for Pages deployment

### Decision 3: Using modern Pages deployment

**Choice:** `actions/deploy-pages@v4` with artifact upload

**Rationale:**

- Official GitHub-supported method
- Uses OIDC for secure, token-less authentication
- No need to manage deploy keys or PATs

## Testing & Validation

| Test | Method | Result |
|------|--------|--------|
| Workflow syntax valid | Push workflow file | ✅ Passed |
| Build succeeds | Workflow run | ✅ Passed |
| Assets use correct base path | Inspect built HTML/JS | ✅ `/vibe-idle-bricks/` prefix |
| Manual dispatch works | GitHub Actions UI | ✅ Tested |

## Known Issues Resolved

### Issue: Build failure due to `global` not defined

**Error:** `ReferenceError: global is not defined` in `tests/setup.ts`

**Fix:** Replaced:

```typescript
global.ResizeObserver = ResizeObserver;
```

with:

```typescript
vi.stubGlobal('ResizeObserver', ResizeObserver);
```

**Reason:** Vite/Vitest runs in browser mode where `global` doesn't exist; `vi.stubGlobal` is the correct API.

## Future Improvements

- [ ] Add preview deployments for pull requests
- [ ] Add build status badge to README
- [ ] Consider adding Lighthouse CI for performance regression testing
