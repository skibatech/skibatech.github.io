# Copilot Instructions for Planner Pro

**⚠️ AI AGENTS: Read this file at the start of each session when working on `private/planner/`**

This file contains critical rules, patterns, and workflows specific to the Planner Pro sub-project. Violations of the version control rules will cause your commits to be rejected.

---

## Project Context

This applies **ONLY to `private/planner/` subdirectory** within the skibatech.github.io GitHub Pages repository.

**Planner Pro** is a GitHub Pages-hosted Microsoft Graph API client for enhanced task management on top of Microsoft Planner. It provides a task dashboard, Weekly Compass planning tool, and goal tracking integrated with Microsoft To Do lists.

**Key Resources (all in `private/planner/`):**
- Main app: `index.html`, `js/planner.js`
- Configuration: `config.json` (tenant, clientId, planId, allowed users)
- Documentation: `DEVELOPMENT.md` (strict version control rules), `README.md` (setup guide)
- Live site: `https://skibatech.com/private/planner/` via GitHub Pages (static files only)

## Strict Version Control Requirements (private/planner/ only)

**EVERY commit to `private/planner/` MUST follow this pattern or it will be rejected:**

```powershell
cd private/planner/
git add <files>; git commit -m "vX.X.X: <description>"; git push origin main
```

### Version Locations (update all three in private/planner/):
1. **js/planner.js**: `const APP_VERSION = 'X.X.X';` (line ~2)
2. **index.html**: Cache-bust URLs: `href="css/planner.css?v=X.X.X"` and `src="js/planner.js?v=X.X.X"`
3. **CHANGELOG.md**: Add entry at top with date and changes
4. **DEVELOPMENT.md**: Update "Current Working Version" status and add entry to history

Always increment patch version (3.0.10 → 3.0.11) unless explicitly different. Even documentation-only fixes require a version bump.

⚠️ **Note**: Changes outside `private/planner/` are NOT subject to this versioning rule. Only Planner Pro changes require the strict pattern.

## Architecture & Component Map (private/planner/)

### Static Assets Structure (all paths relative to private/planner/)
```
index.html              (751 lines: main layout with modals, compass panel)
js/
  planner.js            (5900+ lines: core app, UI, API calls, auth via PKCE)
  admin-core.js         (admin portal for settings)
css/
  planner.css           (2000+ lines: responsive design, modals, grid editing)
csv/
  saw-suggestions.csv   (Sharpen the Saw renewal ideas)
  quotes.csv            (Weekly Compass motivational quotes)
config.json             (runtime config: clientId, planId, allowedTenants)
config.example.json     (template for config.json)
DEVELOPMENT.md          (version control rules & history)
README.md               (setup guide & feature docs)
CHANGELOG.md            (user-facing changelog)
```

### Data Flow & External Services

**Microsoft Graph API** (PKCE OAuth 2.0 flow):
- Tenant-based auth with account picker (`prompt=select_account`)
- Fetches Planner plan, buckets, tasks, categories
- Stores app data in **To Do lists** (not Planner):
  - `PlannerCompass_Data`: Weekly Compass entries
  - `PlannerGoals_Data`: Goal definitions & bucket mappings

**Local Storage**:
- `plannerAccessToken`, `tokenExpiration`: Auth tokens
- `theme`: Dark/light mode preference
- `planner*`: View preferences, compass visibility, column widths
- `compassBgColor`: Weekly Compass background color

## Critical Patterns & Gotchas

### 1. Microsoft Graph Concurrency Limits
- Planner API has 429 rate limiting; code batches writes and uses `mapWithConcurrency(tasks, async-fn, 3)` for detail fetches
- Hard refresh pre-fetches assets with cache-bust headers to avoid 429s on startup
- See `fetchGraph()` wrapper function for auto-retry logic

### 2. Cache Busting Strategy
- Every version bump updates `?v=X.X.X` query params on CSS/JS imports
- Browser won't load new script/styles until version changes
- Hard refresh includes `&bust=<timestamp>` AND version for guaranteed fresh assets

### 3. Modal Stacking (z-index)
- Task details modal (z-index: 1001) must appear above drill-down modal (z-index: 1000)
- Violation causes task modal to render behind list modal, breaking UX

### 4. Authentication & Tenant Verification
- OAuth authority is **`https://login.microsoftonline.com/<tenant>`**, not generic login.microsoftonline.com
- Post-auth, code checks email domain against `config.allowedTenants` array
- Fails silently if tenant not allowed—must check console for "Unauthorized tenant access attempt"

### 5. Compass & Goals Data Storage
- All app data persists to To Do, NOT Planner (Planner only stores tasks/buckets)
- Compass quote loads fresh each week; others (date range, SAW, roles) persist
- Goals stored as JSON in To Do task bodies, not Planner categories

## Common Development Tasks (private/planner/)

### Making Changes to private/planner/
1. Edit the feature (in `private/planner/` only)
2. **MUST bump version** in all 4 locations (see "Strict Version Control Requirements" section)
3. From root or `private/planner/`: `git add private/planner/<files>; git commit -m "vX.X.X: <description>"; git push origin main`
4. Version check auto-compares deployed vs local APP_VERSION; update badge triggers on mismatch

### Fixing UI/Modal Issues (private/planner/)
- Check CSS z-index layering in `private/planner/css/planner.css` (search `z-index:`)
- Modals are `.modal` (tasks detail) and `.drill-down-modal` (dashboard drill-down)
- Ensure parent `.show` classes and fixed positioning don't conflict

### Adding New Microsoft Graph API Calls (private/planner/)
- Use `fetchGraph()` wrapper in `js/planner.js` (auto-retries, logs 429s, honors concurrency)
- Document in comments which scope is required (Tasks.ReadWrite, Directory.Read.All, etc.)
- Test with low-permission accounts to expose missing scopes early

### Debugging Authentication (private/planner/)
- Check `private/planner/config.json`: `clientId`, `authority`, `allowedTenants`, `redirectUri`
- Browser console: `🔍 Verifying user tenant...` + result (true/false)
- If "Access denied" → check email domain in console: `⚠️ Unauthorized tenant access attempt: <email>`
- Clear localStorage: `localStorage.clear()` if token stuck in stale state

## File Reference Guide (private/planner/)

| File | Purpose | Key Functions |
|------|---------|---|
| index.html | Layout & modals | Task detail modal, drill-down modal, compass panel |
| js/planner.js | Core app logic | `login()`, `loadTasks()`, `renderTasks()`, `fetchGraph()`, `openTaskDetail()` |
| js/admin-core.js | Admin portal | Config UI, tenant management |
| css/planner.css | Styling | Modal stacking, grid columns, drill-down list styles |
| config.json | Runtime settings | clientId, planId, allowedTenants, admin groups |
| DEVELOPMENT.md | Version control rules | **READ BEFORE ANY COMMIT** |
| README.md | Setup & features | Azure app registration, plan ID, config guide |
| CHANGELOG.md | User-facing changes | Version history with dates |

## Quick Rollback Pattern

If a broken commit reaches main:
```powershell
git log --oneline -10  # Find stable commit hash
git reset --hard <hash>
git push origin main --force
```

Then immediately fix the issue and create a new proper commit following version rules.
