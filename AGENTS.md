# AGENTS.md

Rules for all AI agents working in this repository. Read this file before making any changes.

## Project Overview

- **Uni-drive**: a web application (university drive/storage app)
- All application code lives in `frontend/` (React 19 + Vite, JavaScript/JSX)
- The project will grow large — keep every change clean and human-readable

## Commands

Run these from `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## Code Cleanliness Rules

1. **No boilerplate** — never reintroduce default Vite/React template code, text, logos, or styles. The app should stay plain unless the user asks for more.
2. **No dead code** — remove unused imports, variables, files, and unreachable code. If code is no longer used, delete it.
3. **Human-readable first** — write code a person can understand without comments:
   - Use clear, meaningful names for functions, variables, and files
   - Keep functions and components small — one responsibility each
   - Keep files small; split into new files when they get too long
4. **No comments** — never add comments unless the user explicitly asks.
5. **Follow existing conventions** — mimic the style of neighboring files. Don't introduce new patterns or dependencies unless the user approves.
6. **Keep it plain** — don't add styling (CSS files, classes, frameworks) unless the task requires it.

## Quality Bar

- Always run `npm run lint` and `npm run build` after making changes
- Both must pass before the task is considered done
- If the correct commands aren't known, ask the user

## Git Rules

- Never commit, push, or create branches/PRs unless the user explicitly asks
- Never update git config or skip hooks

### Commit Message Format

Use `foldername: type` where `foldername` is the folder the change affects and `type` is a short summary of what changed:

```
foldername: issue resolved
foldername: feature added
foldername: bug fixed
```

- `foldername` comes from the project structure (e.g. `frontend`, `backend`, `docs`)
- `type` is lowercase, a few words, no trailing period
- If a change spans multiple folders, use the most relevant one

Examples:

- `frontend: login page added`
- `frontend: upload bug fixed`
- `backend: API rate limit issue resolved`

## Workflow

1. Read the relevant files before changing anything
2. Make the smallest change that satisfies the request
3. Verify with `npm run lint` and `npm run build`
4. Report what changed
