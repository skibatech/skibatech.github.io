# Planner Pro Version Control Workflow

**This document defines the version control rules and workflow for Planner Pro.**

## Version Control Rules

### Version Bumping
- **Every commit bumps version**: Even small changes increment version (e.g., 2.1.48 → 2.1.49)
- **Version appears in**: 
  - `planner.js`: `const APP_VERSION = 'X.X.X';` (line ~1)
  - `index.html`: Both cache-bust URLs (`v=X.X.X` for CSS and JS)
  - `CHANGELOG.md`: New entry at top with date and changes
  - `DEVELOPMENT.md`: New entry at top with date and changes

### Workflow (IMPORTANT - Single Commit Rule)

**Follow these steps in order:**

1. Make all code changes first
2. Update version in planner.js (APP_VERSION constant)
3. Update cache-bust versions in index.html (CSS and JS)
4. Update CHANGELOG.md with new version entry
5. Update DEVELOPMENT.md:
   - Update "Current Status" section with new version and commit message
   - Add new version history entry with Status: "✅ Committed and Pushed"
   - DO NOT include commit hash - it's redundant with git history
6. **Immediately commit and push** - Single commit only
7. **NEVER make a second commit** - All documentation updates happen before the commit

### Git Commands

**Standard commit pattern** - Combine all file staging, commit, and push on one line:
```powershell
git add <files>; git commit -m "vX.X.X: <description>"; git push origin main
```

**When removing files**:
```powershell
git add <files>; git rm <removed-files>; git commit -m "vX.X.X: <description>"; git push origin main
```

### Example Workflow

```powershell
# 1. Make code changes in planner.js, planner.css, etc.

# 2-5. Update all version references and documentation
# In DEVELOPMENT.md, set status to "✅ Committed and Pushed" (not "Ready to Commit")
# This saves time since we commit immediately after updating docs

# 6. Single commit with all changes
git add private/planner/js/planner.js private/planner/css/planner.css private/planner/index.html private/planner/CHANGELOG.md private/planner/DEVELOPMENT.md; git commit -m "v3.2.15: Add new feature"; git push origin main
```

## Next Steps Template

When resuming work:
1. Read DEVELOPMENT.md to know current version and last commit
2. Make code changes
3. Increment version in planner.js and index.html cache-bust URLs
4. Update CHANGELOG.md with new version entry
5. Update DEVELOPMENT.md with new version entry
6. Run git command pattern above
7. DEVELOPMENT.md "Current Status" automatically reflects the new version

## Key File Locations

- **Main app**: `private/planner/js/planner.js`
- **Styling**: `private/planner/css/planner.css`
- **HTML**: `private/planner/index.html`
- **Config**: `private/planner/config.json`
- **User changelog**: `private/planner/CHANGELOG.md`
- **Development tracking**: `private/planner/DEVELOPMENT.md`
- **Version control**: `private/planner/VERSION_CONTROL.md` (this file)
- **CSV data**: `private/planner/csv/` (saw-suggestions.csv, quotes.csv)
- **Admin page**: `private/planner/admin.html`
- **Admin logic**: `private/planner/js/admin-core.js`

## Important Technical Notes

- **Graph API**: Requires Directory.Read.All scope + admin consent in Azure for assignee name lookup
- **Company branding**: Controlled by `companyName` in config.json, used in updateBrandingFromConfig()
- **localStorage keys**: plannerDefaultView, plannerShowCompleted, plannerCompassPosition, plannerCompassVisible, plannerUpdateCheckInterval, plannerCardVisuals
- **Chart types**: CARD_VISUAL_OPTIONS array in planner.js defines available charts
- **Themes**: Stored in Planner plan details, theme names customizable in admin portal
- **Goals**: Stored as Planner tasks in "📊 Goals" bucket with JSON metadata in description
- **Weekly Compass**: Personal To Do tasks in "Weekly Compass" list, metadata in "PlannerCompass_Data"
