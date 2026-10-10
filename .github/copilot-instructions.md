# Copilot Instructions for skibatech.github.io

**⚠️ AI AGENTS: Read this file at the start of each session in this repo.**

## Project Context

This repo is the source of **skibatech.com**: a static HTML site (no framework, no build) served by GitHub Pages from the repo root of `main`.

- Root pages: `index.html`, `portfolio.html`, `skills.html`, `blog.html`, `contact.html`
- `blog/` holds blog posts; `assets/` holds images and other assets
- `portal/` holds the consignor portal pages, generated and pushed by the card-store pipeline; do not edit them by hand
- `_archived/` holds retired pages

## Planner Pro has moved

Planner Pro no longer lives in this repo. Its source is in its own private repo, **`skibatech/skibatech.plannerpro`**, and it is live at **https://plannerpro.skibatech.com** (Azure Static Web Apps). Make Planner Pro changes there, not here.

## Rules

- **This repo is public.** Never commit secrets, tokens, config with client IDs, or private data.
- Pushing to `main` publishes the site within minutes. Commit locally; a push needs the site owner's approval.
- Never force push.
- Keep pages static: no new external scripts, analytics, or form handlers without approval.
