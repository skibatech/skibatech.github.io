# Planner Pro Development Tracking

**This file is the source of truth for version history and development workflow.**
**Update this BEFORE each commit. Regenerated conversation summaries reference this.**

## Version Control Rules
- **Every commit bumps version**: Even small changes increment version (e.g., 2.1.48 → 2.1.49)
- **Version appears in**: 
  - `planner.js`: `const APP_VERSION = 'X.X.X';` (line ~1)
  - `index.html`: Both cache-bust URLs (`v=X.X.X` for CSS and JS)
  - `CHANGELOG.md`: New entry at top with date and changes
  - `DEVELOPMENT.md`: New entry at top with date and changes
- **Before committing**: Make sure to update CHANGELOG.md and DEVELOPMENT.md as needed
- **Git pattern**: Combine all file staging, removal, commit, and push on one line:
  ```powershell
  git add <files>; git commit -m "vX.X.X: <description>"; git push origin main
  ```
  - If removing files: `git rm <file>` before `git add`
  - If removing files: `git add <files>; git rm <removed-files>; git commit -m "vX.X.X: <description>"; git push origin main`

## Current Status
**Last Committed Version**: 3.2.9
**Last Commit**: "v3.2.9: Add sortable columns to Goals table"
**Last Push**: ✅ Pushed to main
**Current Working Version**: 3.2.9 (stable)

## Version History (Most Recent First)

### v3.2.9 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `b6dd62e`
**Changes**:
- Added column sorting functionality to Goals table
- All columns sortable: Goal Name, Target Date, Buckets, Tasks, Progress
- Click column header to sort, click again to reverse direction
- Visual indicators (↑↓) show active sort column and direction
- Added hover effects to sortable headers
- Maintains sort state across table re-renders
- Default sort: Target Date ascending (closest deadline first)

### v3.2.8 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `dacdbe8`
**Changes**:
- Converted Goals view from card grid layout to table/list format
- Added structured columns: color, name+description, target date, bucket count, task count, progress bar, actions
- Goals sorted by target date (closest deadline first), then alphabetically
- Added days remaining calculation with overdue highlighting in red
- Task counts properly exclude Goals bucket tasks to avoid confusion
- New CSS styling for table rows, hover effects, and responsive layout
- Improves scanability and makes it easier to compare goals at a glance

### v3.2.7 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Fixed issue where Goals bucket tasks appeared in "Unassigned" group on initial load
- Enhanced getFilteredTasks() to check both goalsBucketRealId and bucket name
- Added fallback to filter by GOALS_BUCKET_NAME constant when ID not yet set
- Prevents goals tasks from leaking into task views during initialization

### v3.2.6 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Fixed calendar icon visibility in dark mode for date inputs
- Added CSS for ::-webkit-calendar-picker-indicator pseudo-element
- Applied filter: invert(1) for dark mode to make black icon visible
- Light mode uses filter: invert(0) (no change)

### v3.2.5 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Added cursor: pointer to goal target date input
- Confirmed date picker already functional (uses HTML5 native date input)

### v3.2.4 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Fixed timezone issue where goal dates shifted by one day
- Changed from local midnight (T00:00:00) to UTC noon (T12:00:00Z)
- Using noon prevents date boundary issues across all timezones
- Example: selecting 12/31/2026 now correctly saves as 12/31/2026 regardless of user timezone

### v3.2.3 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Fixed Goals bucket appearing in task views
- Updated applyFilters() to filter out goalsBucketRealId from bucketsToRender
- Goals bucket now only visible in Goals tab, not in task lists

### v3.2.2 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Fixed 412 Precondition Failed errors by fetching task details first before PATCH
- Applied fix to both goal creation and mapping task creation
- Fixed goal date not saving: now converts date to/from ISO format properly
- Renamed BUCKET_GOAL_MAPPINGS to "[System] Bucket-Goal Mappings"
- System task marked as complete (percentComplete: 100) to be less visible
- Updated loadGoalsData to filter out [System] tasks from goals list
- Updated mapping task finder to check for both old and new names

### v3.2.1 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Fixed goals storage approach - now uses Planner bucket instead of plan details
- Created "📊 Goals" bucket to store goal tasks
- Added GOALS_BUCKET_ID and GOALS_BUCKET_NAME constants
- Added goalsBucketRealId variable to track bucket ID
- Updated getFilteredTasks() to exclude goals bucket from normal views
- Implemented ensureGoalsBucket() to create bucket if missing
- Rewrote loadGoalsData() to read from bucket tasks
- Rewrote saveGoal() to create/update Planner tasks
- Rewrote deleteGoal() to delete Planner tasks
- Added saveBucketGoalMappings() to store mappings in special task
- Goals stored as: task title = goal name, task description = JSON metadata
- Resolves API error from v3.2.0 (sharedWith field has restricted schema)

### v3.2.0 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- MAJOR CHANGE: Migrated goals storage from Microsoft To Do to Planner plan details
- Goals now stored in plan's sharedWith.goalsData field (shared across team)
- Removed goalsListId variable and To Do list initialization
- Updated loadGoalsData() to read from plan details API
- Updated saveGoal() to write to plan details
- Updated deleteGoal() to update plan details
- Updated saveBucketGoalMapping() to use plan details
- Added saveGoalsToPlanner() helper function
- Goals now visible to all team members with plan access

### v3.1.6 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Fixed missing default sort in renderGroup function
- Weekly Compass now sorts alphabetically in all view modes and grouping options
- Previous fix only applied to renderByBucket, now applies to renderGroup as well

### v3.1.5 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Added default alphabetical sort by title for Weekly Compass bucket
- Tasks now appear in alphabetical order by role name (Brother, Father, Friend, etc.)
- Sort uses full "Role: Task" title format

### v3.1.4 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Added logging to list all task titles found in PlannerCompass_Data
- Helps debug why duplicates aren't being detected

### v3.1.3 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- loadCompassData now ignores old-format COMPASS_ROLE entries (ones with rocks property)
- Added console logging to debug save process
- Prevents old format from being re-loaded and mixed with new format

### v3.1.2 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Changed role metadata save to delete ALL old COMPASS_ROLE_X tasks first, then create fresh ones
- Fixes issue where duplicate role entries accumulated in PlannerCompass_Data

### v3.1.1 (2026-01-02)
**Status**: ✅ Committed & Pushed  
**Commit**: `TBD`
**Changes**:
- Added better initialization checks in saveCompassData
- Improved error messages for debugging

### v3.1.0 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- MAJOR REFACTOR: Weekly Compass now uses real Microsoft To Do tasks
- Created "Weekly Compass" To Do list for rocks (actual tasks)
- PlannerCompass_Data stores metadata only (roles, quote, date range, sharpen saw)
- Tasks have format "Role: Task" with proper due dates and completion
- Works natively in To Do mobile app
- Keeps personal compass data separate from team Planner

### v3.0.31 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `TBD`
**Changes**:
- Fixed saveCompassData to update existing tasks instead of create+delete (prevents duplicates)
- Only deletes extra COMPASS_ROLE_X tasks when roles are removed

### v3.0.30 (2026-01-02)
**Status**: ✅ Ready to commit
**Changes**:
- Changed compass task display format from "Task (Role)" to "Role: Task" (e.g., "Father: Send devotionals")

### v3.0.29 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `87762e0`
**Changes**:
- Fixed compass task rendering to display actual start and due dates instead of hardcoded "--"
- Removed debug logging from date parsing

### v3.0.28 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `6dbc70f`
**Changes**:
- Added live countdown timer for 429 rate limit errors (updates every 100ms)
- Applied countdown to both fetchGraph retry logic and edit queue processing

### v3.0.27 (Debug)
**Status**: Debug version (not documented in CHANGELOG)
**Changes**:
- Added console logging for date range parsing

### v3.0.26 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `10c6f38`
**Changes**:
- Weekly Compass tasks now set startDateTime and dueDateTime based on date range (first date = start, last date = due)
- Dates automatically update when date range changes

### v3.0.25 (2026-01-02)
**Status**: ✅ Committed & Pushed
**Commit**: `8883edd`
**Changes**:
- Removed "+ Add task" buttons from all bucket and group views (renderByBucket, renderSingleView, renderNestedView, inline theme/goal rendering)

### v3.0.24 (In Progress)
**Status**: In progress
**Changes**:
- Fixed progressive loading: single fetch, client-side split (Graph API doesn't support $filter on tasks endpoint)
- Process incomplete details first → render → process completed details 100ms later
- Status message shows accurate incomplete task count during detail load

### v3.0.23 (Committed 2026-01-01)
**Status**: Committed
**Changes**:
- Increased dark-mode contrast for compass/theme badges so Weekly Compass items remain legible
**Files Modified**:
- `css/planner.css`: Dark-mode label badges use darker background and lighter text/border
- `js/planner.js`: APP_VERSION = 3.0.18
- `index.html`: Cache-bust updated to v=3.0.18
- `CHANGELOG.md`: Added v3.0.18 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.17 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Removed stray pre-initialization compass refresh calls that triggered `compassData` ReferenceErrors on the sign-in page
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.17; removed early refresh calls
- `index.html`: Cache-bust updated to v=3.0.17
- `CHANGELOG.md`: Added v3.0.17 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.16 (Completed)
**Status**: Completed (unreleased)
**Changes**:
- Block sign-in when `authority` or `clientId` are missing; reload config and default to the Microsoft common authority to prevent broken authorize URLs/404s
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.16; auth guard with common authority fallback
- `index.html`: Cache-bust updated to v=3.0.16
- `CHANGELOG.md`: Added v3.0.16 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.15 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Guard compass refresh so it doesn’t run before compassData is initialized (fixes sign-in page error)
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.15; guard in refreshCompassTasksFromData
- `index.html`: Cache-bust updated to v=3.0.15
- `CHANGELOG.md`: Added v3.0.15 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.14 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Weekly Compass uses the standard bucket table layout (arrow orientation/columns) while suppressing goals/add-task controls
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.14; compass bucket renders with standard bucket UI
- `index.html`: Cache-bust updated to v=3.0.14
- `CHANGELOG.md`: Added v3.0.14 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.11 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Fixed task details modal z-index so it appears above drill-down modal
**Files Modified**:
- `css/planner.css`: Modal z-index increased from 1000 to 1001
- `js/planner.js`: APP_VERSION = 3.0.11
- `index.html`: Cache-bust updated to v=3.0.11
- `CHANGELOG.md`: Added v3.0.11 entry
- `DEVELOPMENT.md`: Updated current status and history

### v3.0.10 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Updated Key File Locations to reflect css/ and js/ asset paths after folder moves
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.10
- `index.html`: Cache-bust references updated to v=3.0.10
- `CHANGELOG.md`: Added v3.0.10 entry
- `DEVELOPMENT.md`: Current status, version history, and Key File Locations updated

### v3.0.9 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Fixed version-check and hard refresh to use js/ and css/ asset paths after folder move
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.9; version-check fetches js/planner.js and preloads js/css assets
- `index.html`: Cache-bust references updated to v=3.0.9
- `CHANGELOG.md`: Added v3.0.9 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.8 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Finalize asset move by aligning version/cache-bust with admin-core.js relocation
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.8
- `index.html`: Cache-bust references updated to v=3.0.8
- `admin.html`: Script reference points to js/admin-core.js
- `CHANGELOG.md`: Added v3.0.8 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.7 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Moved admin-core.js into the js/ folder alongside planner.js; updated references and cache-busts
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.7
- `index.html`: Cache-bust references updated to v=3.0.7
- `admin.html`: Script reference updated to js/admin-core.js
- `CHANGELOG.md`: Added v3.0.7 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.6 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Moved planner assets into `css/` and `js/` folders; updated all HTML references and cache-busts
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.6
- `index.html`: References updated to css/planner.css and js/planner.js with v=3.0.6
- `admin.html`: Stylesheet reference updated to css/planner.css
- `CHANGELOG.md`: Added v3.0.6 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.5 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Weekly Compass title text is now explicitly bold for emphasis
**Files Modified**:
- `planner.css`: Added font-weight to .compass-title
- `planner.js`: APP_VERSION = 3.0.5
- `index.html`: Cache-bust references updated to v=3.0.5
- `CHANGELOG.md`: Added v3.0.5 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.4 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Tightened spacing and alignment for the bucket goals (🎯) icon and let it inherit text color for themed headers
**Files Modified**:
- `planner.js`: APP_VERSION = 3.0.4; bucket goals button now uses CSS class
- `planner.css`: Added .bucket-goals-btn styling for spacing/alignment and inherited color
- `index.html`: Cache-bust references updated to v=3.0.4
- `CHANGELOG.md`: Added v3.0.4 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.3 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Fixed dark-mode modal inputs using theme colors so text stays readable (e.g., Assign Goals to Bucket)
**Files Modified**:
- `planner.css`: Themed .task-input background, text, placeholder, and focus border for dark mode readability
- `planner.js`: APP_VERSION = 3.0.3
- `index.html`: Cache-bust references updated to v=3.0.3
- `CHANGELOG.md`: Added v3.0.3 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.1 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Fixed goal creation so new goals submit via Graph POST (no placeholder IDs that caused PATCH failures)
**Files Modified**:
- `planner.js`: APP_VERSION = 3.0.1; saveGoalModal keeps new goal IDs null so saveGoal creates tasks instead of patching
- `index.html`: Cache-bust references updated to v=3.0.1
- `CHANGELOG.md`: Added v3.0.1 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.0 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Goals feature: Strategic planning with Goals → Buckets (Epics) → Tasks hierarchy
- Goals tab with goal cards showing progress, target dates, associated buckets/tasks
- Goal CRUD: Create, edit, delete goals with name, description, color, target date
- Bucket-to-goals mapping: Buckets can belong to multiple goals
- "By Goal" view and "Group by Goal" options
- Goal badges on task cards (inherited from bucket assignments)
- Goals stored in Microsoft To Do List "PlannerGoals_Data"
- Real-time progress tracking per goal
**Files Modified**:
- `planner.js`: APP_VERSION = 3.0.0, Goals data layer (initializeGoals, loadGoalsData, saveGoal, deleteGoal, saveBucketGoalMapping, getGoalsForBucket, getGoalById), Goals UI (renderGoalsView, showGoalModal, closeGoalModal, saveGoalModal, editGoal, confirmDeleteGoal, deleteGoalAndRefresh, showBucketGoalsModal, closeBucketGoalsModal, saveBucketGoalsModal), updated switchTab for goals, added goal view/grouping logic, goal badges in renderTask, goal button in bucket headers
- `index.html`: Added Goals tab button, Goals view container, Goal modal, Bucket Goals modal, added "By Goal" to View and Group By dropdowns, cache-bust v=3.0.0
- `planner.css`: Added Goals view styles (goals-wrapper, goals-header, goals-grid, goal-card, goal-badge, etc.)
- `CHANGELOG.md`: v3.0.0 entry added
- `DEVELOPMENT.md`: Updated status tracking

### v2.2.7 (Committed ✅)
- Hide header when unauthenticated for cleaner login experience
- Added CSS rule: `body.unauthenticated .header { display: none !important; }`
### v2.2.6 (Committed ✅)
**Status**: Committed and pushed
**Changes**:
- Advanced: System settings (update check interval)
- Updated switchOptionsTab() to use data-tab attribute
**Files Modified**:
- `planner.js`: APP_VERSION updated to 2.2.6, switchOptionsTab() uses data-tab
- `index.html`: Split Options into 3 tabs with navigation, cache-bust versions updated to v=2.2.6
- `CHANGELOG.md`: v2.2.6 entry added
- `DEVELOPMENT.md`: Updated status tracking
**Git Command When Ready**:
```powershell
git add private/planner/planner.js private/planner/index.html private/planner/CHANGELOG.md private/planner/DEVELOPMENT.md; git commit -m "v2.2.6: Reorganize Options modal into 3 tabs"; git push origin main
```

### v2.2.5 (Committed ✅)
- Moved motivational quotes from code into csv/quotes.csv and load dynamically via loadQuotes()

### v2.2.4 (Committed ✅)
- Housekeeping: Synced development tracking and tidied config.json formatting; version bump to 2.2.4

### v2.2.3 (Committed ✅)
- Bar label layout fix: Long labels widen the label column inside the card (wide-labels class) so bars don't overlap text, without forcing the card to span 2 columns

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
- Main app: `private/planner/js/planner.js`
- Styling: `private/planner/css/planner.css`
- HTML: `private/planner/index.html`
- Config: `private/planner/config.json`
- Changelog: `private/planner/CHANGELOG.md`
- CSV data: `private/planner/csv/` (saw-suggestions.csv)
- Admin page: `private/planner/admin.html`
- Admin logic: `private/planner/js/admin-core.js`

## Important Notes
- **Graph API**: Requires Directory.Read.All scope + admin consent in Azure for assignee name lookup
- **Company branding**: Controlled by `companyName` in config.json, used in updateBrandingFromConfig()
- **localStorage keys**: plannerDefaultView, plannerShowCompleted, plannerCompassPosition, plannerCompassVisible, plannerUpdateCheckInterval, plannerCardVisuals
- **Chart types**: CARD_VISUAL_OPTIONS array in planner.js defines available charts
