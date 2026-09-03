# Contributing to HotelOS

Welcome to the **HotelOS** engineering team! We are glad to have you building with us.

This document establishes our team's engineering standards, branching strategy, Git workflows, and code review expectations. Following these guidelines ensures high code quality, smooth collaboration across our 5–6 developer team, minimal merge conflicts, and reliable, production-ready releases.

---

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Branch Strategy](#branch-strategy)
- [Development Workflow](#development-workflow)
- [How to Submit Code Changes](#how-to-submit-code-changes)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code Review Process](#code-review-process)
- [Commit Message Convention](#commit-message-convention)
- [Team Collaboration Guidelines](#team-collaboration-guidelines)
- [Best Practices](#best-practices)
- [End-to-End Example Workflow](#end-to-end-example-workflow)

---

## Introduction

### Purpose of this Document

This guide serves as the single source of truth for day-to-day development in our repository. Whether you are onboarding as a new team member or executing daily sprint tasks, these workflows keep our code predictable, secure, and maintainable.

### Team Collaboration Principles

- **Shared Ownership:** We write code together as a collective unit. Every team member takes pride in the stability, readability, and performance of the entire platform.
- **Transparent Communication:** Surface blockers, design trade-offs, and architectural concerns early. Proactive discussions prevent rework.
- **Continuous Feedback:** Constructive feedback in code reviews is our primary vehicle for mutual learning, mentorship, and collective engineering excellence.
- **Empathy & Respect:** Review the code, not the person. Maintain a supportive, respectful, and professional tone in all comments and discussions.

### Importance of Consistency & Code Reviews

Consistency reduces cognitive overhead. When file structures, naming conventions, commit logs, and PR descriptions follow unified patterns, any developer can step in, review, and maintain any part of the codebase without friction. Code reviews act as our first line of defense against bugs, security vulnerabilities, and unintended regressions.

---

## Getting Started

Follow these steps to set up your local development environment.

### Prerequisites

Make sure your local machine meets the following environment requirements:

- **Node.js**: `>= 24.15.0` (Verify with `node -v`)
- **pnpm**: `11.1.1` (Verify with `pnpm -v`. If needed, install via `npm install -g pnpm@11.1.1`)
- **Git**: `git --version`
- **MongoDB**: A running local instance (`mongodb://localhost:27017`) or a remote MongoDB Atlas connection URI.

---

### 1. Clone the Repository

Clone the project from GitHub and navigate into the repository root:

```bash
git clone https://github.com/Omniveratechnologies/HotelOs.git
cd hotel-os-project
```

### 2. Install Dependencies

Install all monorepo dependencies and initialize Git hooks:

```bash
pnpm install
```

> **Note:** We use `pnpm` workspaces with `turbo`. Running `pnpm install` at the root automatically installs dependencies across all apps and shared packages, and sets up Git commit hooks via `husky`.

### 3. Environment Setup

Copy example environment files to their active `.env` locations across the backend and frontend apps:

**On macOS / Linux / Git Bash:**

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontends
cp apps/super-admin/.env.example apps/super-admin/.env
cp apps/sub-admin/.env.example apps/sub-admin/.env
cp apps/receptionist/.env.example apps/receptionist/.env
cp apps/kitchen/.env.example apps/kitchen/.env
cp apps/guest/.env.example apps/guest/.env
```

**On Windows (PowerShell):**

```powershell
# Backend
Copy-Item apps/backend/.env.example apps/backend/.env

# Frontends
Copy-Item apps/super-admin/.env.example apps/super-admin/.env
Copy-Item apps/sub-admin/.env.example apps/sub-admin/.env
Copy-Item apps/receptionist/.env.example apps/receptionist/.env
Copy-Item apps/kitchen/.env.example apps/kitchen/.env
Copy-Item apps/guest/.env.example apps/guest/.env
```

Configure `apps/backend/.env` with your active database URI and authentication secrets:

- `MONGODB_URI`: e.g. `mongodb://localhost:27017/hotel-os`
- `JWT_SECRET`: A secure random secret string
- `PORT`: `5001`
- `CLIENT_URL`: `http://localhost:5173`

Frontend environment variables configure the API base URLs:

- `apps/super-admin`, `apps/sub-admin`, and `apps/receptionist`: `VITE_API_URL=http://localhost:5001` (consumed by `@hotelos/api`)
- `apps/kitchen`: `VITE_API_BASE_URL=http://localhost:5001/api`
- `apps/guest`: `VITE_API_URL=http://localhost:5001/api/v1`

> ⚠️ **Warning:** Never commit `.env` files with production or sensitive credentials to Git. Only commit updates to `.env.example`.

### 4. Seed Database (Initial Setup)

Seed the default platform `SUPER_ADMIN` account:

```bash
pnpm seed -F backend
```

### 5. Running the Project Locally

Start all backend services and frontend applications concurrently using Turborepo:

```bash
pnpm dev
```

The apps will spin up at the following local addresses:

| App              | Scope / Role                | Local URL               |
| :--------------- | :-------------------------- | :---------------------- |
| **Backend API**  | Express 5 REST API & DB     | `http://localhost:5001` |
| **Super Admin**  | Platform Operator Dashboard | `http://localhost:5173` |
| **Sub Admin**    | Hotel Admin Dashboard       | `http://localhost:5174` |
| **Receptionist** | Front-Desk Operations       | `http://localhost:5175` |
| **Kitchen**      | Kitchen Display System      | `http://localhost:5176` |
| **Guest**        | Guest Harmony Portal        | `http://localhost:5177` |

### 6. Verifying Your Setup

Verify your environment by checking the backend health endpoint and running the build and linter checks:

```bash
# 1. Verify backend health endpoint
curl http://localhost:5001/api/v1/health

# 2. Run codebase linter
pnpm lint

# 3. Verify build output
pnpm build
```

If all commands pass without errors, your environment is ready for development!

---

## Branch Strategy

Our repository enforces a structured 3-tier branching model designed for small, high-velocity agile teams.

```
         [ main ]                 <-- Production (Deployment source)
            ↑
       (Release PR)
            |
       [ developer ]              <-- Staging / Integration (Shared source of truth)
        ↑         ↑
   (Task PR)   (Task PR)
      |            |
  [ rahul ]   [ subham-duary ]    <-- Personal Developer Branches (Isolated workspaces)
```

### 1. `main` (Production)

- Contains battle-tested, release-ready production code.
- Deployed directly to the production environment.
- **Strictly Protected:** Direct commits and direct pushes are strictly prohibited. Code only enters `main` via reviewed and approved release Pull Requests originating from `developer`.

### 2. `developer` (Integration / Staging)

- The central collaboration and integration branch.
- All finished features, bug fixes, and improvements merge here first.
- Used for staging verification, integration testing, and team review.
- **Strictly Protected:** Direct commits and direct pushes are strictly prohibited. All changes must arrive via reviewed Pull Requests from personal branches.

### 3. Personal Developer Branches (Workspace)

- Named after each respective developer (e.g., `<your-branch-name>` such as `subham-duary`, `rahul`, `sourav`, `jinettashree`).
- Each developer works on **one assigned task or feature at a time** in their designated branch.
- Acts as your sandbox. You can push commits freely while working on your feature.
- Once the feature is complete and verified locally, you open a Pull Request targeting `developer`.

### Why Direct Commits Are Restricted

- **Prevents Accidental Breakages:** Keeps production and staging functional at all times.
- **Guarantees Code Reviews:** Ensures at least one peer validates logic, architecture, and security before code is integrated.
- **Ensures Passing Automated Checks:** Verifies that linting, formatting, and builds succeed before merging.
- **Maintains Clean History:** Avoids messy merge conflicts and unintended rollbacks.

---

## Development Workflow

Every developer follows an 11-step lifecycle for every assigned feature or ticket:

```
 1. Receive Assigned Task
 2. Sync Personal Branch with 'developer'
 3. Implement the Task
 4. Test Changes Locally
 5. Commit Changes
 6. Push to GitHub
 7. Create Pull Request (to 'developer')
 8. Address Review Comments
 9. Merge into 'developer'
10. Sync Personal Branch Again
11. Start Next Task
```

### Step 1: Receive Assigned Task

- Pick up your assigned card/ticket from the project board.
- Review task requirements, acceptance criteria, and API contracts.
- If any requirement is ambiguous, clarify with the team lead or product owner before writing code.

### Step 2: Sync Personal Branch with Latest `developer`

Before writing a single line of code, ensure your personal branch contains the latest changes from `origin/developer`:

```bash
# Switch to your personal branch
git checkout <your-branch-name>

# Fetch latest changes from remote
git fetch origin

# Merge upstream developer changes into your personal branch
git merge origin/developer
```

### Step 3: Implement the Task

- Focus **strictly** on the scope of the assigned task.
- Write clean, maintainable, and modular code.
- Do not modify unrelated files or reformat code outside your task's scope.

### Step 4: Test Changes Locally

Before committing, verify that your changes operate cleanly and don't break existing functionality:

```bash
# 1. Check code for linting issues
pnpm lint

# 2. Check code formatting
pnpm format:check

# 3. Ensure the monorepo builds cleanly
pnpm build

# 4. Perform manual end-to-end verification in the browser & API
```

### Step 5: Commit Changes

Commit your work incrementally using our standard [Commit Message Convention](#commit-message-convention):

```bash
git add apps/backend/src/modules/auth/
git commit -m "feat(auth): add login endpoint"
```

### Step 6: Push Changes

Push your commits to your remote personal branch on GitHub:

```bash
git push origin <your-branch-name>
```

### Step 7: Create a Pull Request

- Go to the GitHub repository.
- Open a new Pull Request.
- **Base branch:** `developer`
- **Compare branch:** your personal branch (e.g., `<your-branch-name>`)
- Fill out the [Pull Request Template](#pull-request-template) completely.
- Request a review from at least one teammate.

### Step 8: Address Review Comments

- Discuss feedback respectfully within the PR comments.
- If changes or fixes are requested, make the edits directly on your personal branch, commit, and push. GitHub will automatically update the PR:

```bash
# Make required fixes
git add .
git commit -m "fix(auth): correct token expiration validation"
git push origin <your-branch-name>
```

### Step 9: Merge into `developer`

- Once your PR receives the required approval and all checks pass, merge the PR into `developer` using the approved merge strategy (Squash and Merge or Merge Commit as determined by team policy).

### Step 10: Sync Personal Branch Again

Immediately after the PR is merged, sync your local personal branch with the newly merged `origin/developer`:

```bash
git fetch origin
git merge origin/developer
git push origin <your-branch-name>
```

### Step 11: Start Next Task

Your personal branch is now clean, up to date with integration, and ready for your next assigned ticket!

---

## How to Submit Code Changes

To keep pull requests clean and easy to review, always follow these rules:

1. **Always Sync First:** Never start a new task on an outdated branch. Always pull the latest `developer` before beginning.
2. **Keep Changes Focused:** A pull request should do one thing and do it well. Avoid bundling multiple tickets or refactors into one PR.
3. **Run Pre-Commit Verification:** Run `pnpm lint`, `pnpm format:check`, and `pnpm build` before pushing.
4. **Push Meaningful Commits:** Ensure every commit message is descriptive and follows the conventional commit syntax.
5. **Double-Check Your Diff:** Before hitting "Create Pull Request", review your own Git diff on GitHub to catch stray debug logs, commented-out code, or unintended file modifications.

### Example Quick-Reference Commands

```bash
# Status check
git status

# Review what you changed
git diff

# Stage specific files
git add <path/to/file>

# Commit with conventional message
git commit -m "feat(rooms): add room status toggle endpoint"

# Push to your remote personal branch
git push origin <your-branch-name>
```

---

## Pull Request Guidelines

### Key Rules

- **One Feature/Task per PR:** Do not bundle unrelated bug fixes or features into a single PR.
- **Clear PR Title:** Use Conventional Commit format for your PR title (e.g., `feat(receptionist): add guest check-in modal`).
- **Meaningful Description:** Explain _what_ changed, _why_ it changed, and _how_ to test it.
- **Testing Instructions:** Provide clear reproduction or testing steps so reviewers can verify your work.
- **Screenshots / Recordings:** For UI changes, attach before-and-after screenshots or a short GIF/video.
- **Small Diffs:** Aim for PRs under 300–400 lines of change whenever possible. Smaller PRs get reviewed faster and catch more bugs.

---

### Pull Request Template

Copy and paste the template below when opening your PR:

```markdown
## Description

<!-- Provide a clear, concise summary of the changes introduced in this PR. -->

## Ticket / Task Reference

<!-- Link the assigned task or issue ID (e.g., Closes #42 or PROJ-108). -->

## Type of Change

- [ ] 🚀 New feature (non-breaking change which adds functionality)
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] 🔄 Refactoring (code improvement with no behavior change)
- [ ] 📝 Documentation update
- [ ] 🔧 Configuration / Chore / Dependency update

## Affected Apps & Packages

- [ ] `apps/backend`
- [ ] `apps/super-admin`
- [ ] `apps/sub-admin`
- [ ] `apps/receptionist`
- [ ] `apps/kitchen`
- [ ] `apps/guest`
- [ ] `packages/api`
- [ ] `packages/styles`
- [ ] Root / Tooling / CI

## Checklist Before Requesting Review

- [ ] My personal branch is rebased/synced with the latest `developer`.
- [ ] Code follows project style guidelines and passes `pnpm lint`.
- [ ] Code passes formatting checks (`pnpm format:check`).
- [ ] Build succeeds across the monorepo (`pnpm build`).
- [ ] Removed all `console.log`, debugging breakpoints, and dead code.
- [ ] No sensitive credentials, keys, or `.env` files committed.
- [ ] Self-reviewed the file diff on GitHub.

## How Has This Been Tested?

<!-- Detail the exact steps a reviewer can follow to test your change. -->

1. Navigate to '...'
2. Click on '...'
3. Verify that '...'

## Screenshots / Video (if applicable)

<!-- Attach screenshots or Loom/GIF for UI modifications. -->
```

---

## Code Review Process

Code reviews are a constructive, collaborative checkpoint. They ensure that our codebase remains healthy, secure, and understandable to all engineers.

### What Reviewers Check

- **Functional Correctness:** Does the code satisfy the acceptance criteria? Are edge cases handled?
- **Architecture & Multi-Tenancy:** In HotelOS, tenant isolation is critical. Does the backend properly enforce hotel ownership (`req.user.hotelId`)? Frontend should never dictate tenant ownership.
- **Security & Auth:** Are routes protected by the appropriate role middlewares (`SUPER_ADMIN`, `SUB_ADMIN`, `RECEPTIONIST`, `KITCHEN`, `GUEST`)? Are inputs validated and sanitized?
- **Performance:** Are there unindexed database queries, unnecessary re-renders, or heavy dependencies added?
- **Readability & Maintainability:** Are variables and functions cleanly named? Is complex business logic commented?
- **Clean Diff:** Are there unintended white-space changes, stray console logs, or commented-out code blocks?

### How Feedback Should Be Handled

- **Be Open and Receptive:** Feedback is about the code, not your abilities. Take suggestions as opportunities to improve the product.
- **Respond to All Comments:** Acknowledge comments, explain trade-offs if you disagree, and resolve conversations once addressed.
- **Push Fixes Directly:** Push revisions to your personal branch. The PR will automatically reflect new commits.
- **Re-request Review:** Once you have addressed all comments, click the re-request review button or notify the reviewer in team chat.

### Approval Requirements

- **Minimum Approvals:** At least **1 approving review** from a team member is required before merging.
- **Checks Must Pass:** All automated CI checks (linting, build verification) must be green.
- **No Unresolved Conversations:** All review comments and change requests must be resolved.

### Merge Process

- All PRs target the **`developer`** branch.
- Merging into `developer` must be performed via GitHub's Pull Request interface once approved.
- Once merged, the author syncs their local personal branch with `origin/developer`.

---

## Commit Message Convention

We follow the **Conventional Commits** specification. Clear, structured commit messages make the Git log readable and allow automated changelog generation.

### Format

```text
<type>(<scope>): <short imperative description>

[optional body]

[optional footer(s)]
```

### Examples

```bash
feat(auth): add login endpoint
fix(users): resolve profile update bug
refactor(api): simplify validation logic
docs(contributing): update workflow guide
test(backend): add unit tests for booking controller
chore(deps): update vite to v6.0
```

### Allowed Types

| Type           | When to Use                                                  | Example                                           |
| :------------- | :----------------------------------------------------------- | :------------------------------------------------ |
| **`feat`**     | A brand-new feature or endpoint for users/consumers.         | `feat(rooms): add bulk room creation endpoint`    |
| **`fix`**      | A bug fix in production or staging code.                     | `fix(auth): handle expired JWT token gracefully`  |
| **`refactor`** | Code changes that neither fix a bug nor add a feature.       | `refactor(db): optimize reservation search query` |
| **`docs`**     | Documentation-only changes (README, CONTRIBUTING, API docs). | `docs(readme): add environment variables table`   |
| **`chore`**    | Maintenance, package updates, tooling, config changes.       | `chore(husky): update pre-commit linting hook`    |
| **`test`**     | Adding missing tests or correcting existing tests.           | `test(auth): add integration tests for login`     |

### Commit Rules

- Use the **imperative, present tense** in the summary: `"add feature"`, not `"added feature"` or `"adds feature"`.
- Keep the first line under **72 characters**.
- Do not end the subject line with a period (`.`).
- Use lowercase for type and scope.

---

## Team Collaboration Guidelines

Working effectively in a 5–6 developer team requires mutual discipline and proactive communication:

### 1. Communicate Blockers Early

- If you are stuck on a technical hurdle, architectural decision, or third-party dependency for more than 1–2 hours, reach out to the team in chat or daily standup. Never struggle in isolation.

### 2. Avoid Unrelated Changes

- Resist the temptation to fix minor typos or reformat unrelated files that are not part of your assigned task.
- Unrelated changes clutter diffs, make reviews difficult, and increase the risk of merge conflicts.
- If you spot an unrelated bug or cleanup opportunity, log a separate ticket or discuss it with the team.

### 3. Ask Before Modifying Shared Code

- Before making breaking changes to shared packages (like `packages/api`), database schemas, or common utilities used by other team members, post a message in the team chat.
- Align on breaking changes before opening a PR.

### 4. Keep Discussions Respectful

- Treat code reviews as technical discussions, not debates.
- Prefer phrasing like _"What do you think about using X here to avoid Y?"_ over _"This is wrong."_

### 5. Document Important Decisions

- If your PR introduces a new architecture pattern, new library, or changed an API contract, document it in the PR description and update relevant Markdown files or READMEs.

---

## Best Practices

- **Write Readable, Self-Documenting Code:** Choose clear variable and function names. Write comments to explain _why_ something is done, not _what_ is done (the code should show what is done).
- **Test Before Submitting:** Always run `pnpm lint` and `pnpm build` locally. If your change modifies UI, manually test across common screen sizes.
- **Remove Debugging Code:** Strip all `console.log`, `debugger`, commented-out legacy code blocks, and test mocks before committing.
- **Keep Changes Minimal & Modular:** Smaller functions with single responsibilities are easier to test, review, and debug.
- **Keep Dependencies Lean:** Check with the team before adding heavy third-party npm packages. Prefer native language and framework features where practical.
- **Update Documentation:** Whenever you add an environment variable, route, or command, update `.env.example` and the respective `README.md`.

---

## End-to-End Example Workflow

Below is a complete visual diagram and command-by-command walkthrough showing a developer completing an assigned task in their personal branch (`<your-branch-name>`) from start to finish.

### Workflow Diagram

```
       Task Assigned (e.g. Add Login Endpoint)
                         ↓
       Sync Branch (Fetch latest 'origin/developer')
                         ↓
       Develop (Implement changes in '<your-branch-name>' branch)
                         ↓
       Test (Run 'pnpm lint', 'pnpm build', manual verification)
                         ↓
       Commit (Conventional Commit: 'feat(auth): add login endpoint')
                         ↓
       Push (Push commits to 'origin/<your-branch-name>')
                         ↓
       Create PR (Target: 'developer' branch on GitHub)
                         ↓
       Review (Teammate reviews code, requests tweaks or approves)
                         ↓
       Merge (Merged into 'developer' branch on GitHub)
                         ↓
       Sync Branch (Pull newly merged 'developer' into '<your-branch-name>')
                         ↓
       Next Task (Ready for next ticket)
```

---

### Step-by-Step Terminal Walkthrough

#### 1. Sync personal branch before starting work

```bash
# Ensure you are on your personal branch
git checkout <your-branch-name>

# Fetch and merge latest staging changes
git fetch origin
git merge origin/developer
```

#### 2. Develop the feature

Implement your code across the assigned workspace (e.g., `apps/backend/src/modules/auth`).

#### 3. Test locally

```bash
# Verify code quality and build integrity
pnpm lint
pnpm format:check
pnpm build
```

#### 4. Stage and commit

```bash
git add apps/backend/src/modules/auth/ apps/backend/src/routes/
git commit -m "feat(auth): add login endpoint with jwt verification"
```

#### 5. Push to your remote personal branch

```bash
git push origin <your-branch-name>
```

#### 6. Open a Pull Request on GitHub

- **Base:** `developer` <-- **Compare:** `<your-branch-name>`
- Fill out the PR template with description, test steps, and checklist.
- Assign at least one reviewer.

#### 7. Address review comments (if any)

```bash
# Make required fixes
git add apps/backend/src/modules/auth/auth.service.ts
git commit -m "fix(auth): validate empty email payload"
git push origin <your-branch-name>
```

#### 8. Merge the PR

- Once approved and CI checks are green, merge the PR into `developer` via GitHub.

#### 9. Sync your personal branch for the next task

```bash
git fetch origin
git merge origin/developer
git push origin <your-branch-name>
```

Your personal branch is now clean and perfectly synchronized with `developer`. You are ready to tackle your next task!

---

Thank you for contributing to **HotelOS** and keeping our engineering standards high! 🚀
