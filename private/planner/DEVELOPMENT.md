# Planner Pro Development Tracking

**This file is the source of truth for version history and development workflow.**
**Update this BEFORE each commit. Regenerated conversation summaries reference this.**

## Version Control Rules
- **Every commit bumps version**: Even small changes increment version (e.g., 2.1.48 → 2.1.49)
- **Version appears in**: 
  - `planner.js`: `const APP_VERSION = 'X.X.X';` (line ~1)
  - `index.html`: Both cache-bust URLs (`v=X.X.X` for CSS and JS)
  - `CHANGELOG.md`: New entry at top with date and changes
- **Git pattern**: Combine all file staging, removal, commit, and push on one line:
  ```powershell
  git add <files>; git commit -m "vX.X.X: <description>"; git push origin main
  ```
  - If removing files: `git rm <file>` before `git add`
  - If removing files: `git add <files>; git rm <removed-files>; git commit -m "vX.X.X: <description>"; git push origin main`

## Current Status
- **Last Committed Version**: 2.2.2
- **Last Commit**: "v2.2.2: Fix card sizing override and add dashboard reset"
- **Last Push**: ✅ Pushed to main
- **Current Working Version**: 2.2.3 (in progress)

## Version History (Most Recent First)

### v2.2.3 (In Progress)
**Status**: Code changes completed, CHANGELOG updated, **PENDING COMMIT**
**Changes**:
- Bar label layout fix: Long labels widen the label column inside the card (wide-labels class) so bars don't overlap text, without forcing the card to span 2 columns
**Files Modified**:
- `planner.js`: APP_VERSION updated to 2.2.3, renderBarGroup() adds/removes wide-labels class based on label length
- `planner.css`: Added .bar-group.wide-labels to widen label column
- `index.html`: Cache-bust versions updated to v=2.2.3
- `CHANGELOG.md`: v2.2.3 entry added
- `DEVELOPMENT.md`: Updated status tracking
**Git Command When Ready**:
```powershell
git add private/planner/planner.js private/planner/planner.css private/planner/index.html private/planner/CHANGELOG.md private/planner/DEVELOPMENT.md; git commit -m "v2.2.3: Fix bar label layout without forcing card span"; git push origin main
```

### v2.2.2 (Committed ✅)
- Fixed card sizing conflict: Manual card size preferences now override automatic wide-card expansion
- Added "Reset Dashboard Layout" button in Options modal

### v2.2.1 (Committed ✅)
- Fixed z-index stacking for card headers and menu buttons to prevent overlap

### v2.2.0 (Committed ✅)
- Dashboard card drag-and-drop reordering with visual feedback
- Card resize options: 1x Normal, 2x Wide, Full Width
- Layout persistence with localStorage

### v2.1.50 (Committed ✅)
- Fixed vertical bars chart container: Changed from fixed height to flexible min-height

### v2.1.49 (Committed ✅)
- Console logging for status updates: All setStatus() calls now output to F12 Console

### v2.1.48 (Committed ✅)
- Chart visualization types: Pie, Donut, Vertical Bars, Horizontal Bars
- Updated renderChart() function with SVG path calculations for circular charts
- Added DEVELOPMENT.md tracking file

### v2.1.47 (Committed ✅)
- Moved `saw-suggestions.csv` to `csv/` subdirectory
- Attempted symbol-based visuals (Line, Circle, Square) - later clarified by user to use actual chart types

### v2.1.46 (Committed ✅)
- Fixed UPDATE AVAILABLE badge overlap with version number (margin 8px → 12px)

### v2.1.45 (Committed ✅)
- Cleaned F12 console output (removed data dumps, kept informational headers)

### v2.1.44 (Committed ✅)
- Enlarged compass date range field and label
- Changed label from "Date:" to "Date Range:"

### v2.1.43 (Committed ✅)
- Removed verbose console logging for task metadata scanning

### v2.1.42 (Committed ✅)
- Styled compass date field (removed white outline, bolded text)

### v2.1.41 (Committed ✅)
- Added configurable update check interval in Options (60 second minimum)

### v2.1.40 (Committed ✅)
- Tightened vertical spacing in grouped views (assignee containers, nested buckets)

### v2.1.39 (Committed ✅)
- Removed hard-coded "SkibaTech" references, made company name configurable via config.json

### v2.1.38 (Committed ✅)
- Added Directory.Read.All to Azure API permissions
- Documented troubleshooting for assignee GUID display

### v2.1.29-2.1.37 (Committed ✅)
- Fixed assignee names showing as "Assigned" or GUIDs (root cause: missing Directory.Read.All admin consent)

## Next Steps Template
When resuming work:
1. Read this file to know current version and last commit
2. Increment version in planner.js and index.html cache-bust URLs
3. Make code changes
4. Update CHANGELOG.md with new version entry
5. Run git command from above, replacing vX.X.X and description as needed
6. Update this file's "Current Status" and "Version History" sections

## Key File Locations
- Main app: `private/planner/planner.js`
- Styling: `private/planner/planner.css`
- HTML: `private/planner/index.html`
- Config: `private/planner/config.json`
- Changelog: `private/planner/CHANGELOG.md`
- CSV data: `private/planner/csv/` (saw-suggestions.csv)
- Admin page: `private/planner/admin.html`

## Important Notes
- **Graph API**: Requires Directory.Read.All scope + admin consent in Azure for assignee name lookup
- **Company branding**: Controlled by `companyName` in config.json, used in updateBrandingFromConfig()
- **localStorage keys**: plannerDefaultView, plannerShowCompleted, plannerCompassPosition, plannerCompassVisible, plannerUpdateCheckInterval, plannerCardVisuals
- **Chart types**: CARD_VISUAL_OPTIONS array in planner.js defines available charts
