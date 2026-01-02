# Planner Pro Development Tracking

**This file tracks version history and current development status.**
**For version control workflow and rules, see [VERSION_CONTROL.md](VERSION_CONTROL.md).**

## Current Status
**Last Committed Version**: 3.2.39
**Last Commit**: "v3.2.39: Increase description textarea height from 80px to 120px"
**Last Push**: ✅ Pushed to main
**Current Working Version**: 3.2.40 (ready to commit)

## Version History (Most Recent First)

### v3.2.40 (2026-01-02)
**Changes**:
- Fixed textarea height increases that weren't working
- Problem: inline styles in HTML were overriding CSS changes
- Updated inline style attributes directly in index.html
- detailTaskDescription: 100px → 150px (50% increase)
- newTaskNotes: 120px → 150px (25% increase)
- bugDescription: 150px → 180px (20% increase)

### v3.2.39 (2026-01-02)
**Changes**:
- Increased description textarea min-height from 80px to 120px
- Applies to textarea.task-input CSS class
- Gives more vertical space for task descriptions in new/edit task modals
- Textarea remains resizable (resize: vertical still enabled)

### v3.2.38 (2026-01-02)
**Changes**:
- Filtered Weekly Compass bucket from goal bucket assignment dialog
- Added !bucket.isCompass condition to filter in showBucketSelectorForGoal
- Weekly Compass is personal/non-project bucket so shouldn't be assignable to goals
- Now consistent with other bucket selectors that filter compass bucket

### v3.2.37 (2026-01-02)
**Changes**:
- Fixed root cause of bucket selector modal width problems
- General .modal-content CSS had max-width: 500px limiting modal width
- Added specific .bucket-selector-modal .modal-content override
- Set max-width: none and width: 100% to allow full 700px width
- Removed padding from modal-content (now handled by sections)
- Modal now properly displays at intended width with buttons correctly positioned

### v3.2.36 (2026-01-02)
**Changes**:
- Enhanced bucket selector modal button appearance
- Added comprehensive button styling: padding, font-size, font-weight, border-radius
- Increased button gap from 8px to 12px for better spacing
- Added .btn, .btn-secondary, and .btn-primary styles
- Buttons now have proper colors and hover states
- Secondary button uses tertiary background, Primary uses brand color

### v3.2.35 (2026-01-02)
**Changes**:
- Fixed By Goal view rendering issue on page load/refresh
- Tasks were rendering before goals data loaded, showing everything under "No goal"
- Added logic in initializeGoals() to re-render tasks after goals load
- Now checks if currentView === 'goal' OR currentGroupBy === 'goal'
- Calls applyFilters() to re-render with proper goal associations
- Resolves issue where Update Available refresh showed incorrect goal grouping

### v3.2.34 (2026-01-02)
**Changes**:
- Fixed bucket selector modal layout issues
- Modal title now properly wraps and expands to full width with word-wrap and overflow-wrap
- Added min-width: 400px to modal to prevent excessive narrowing
- Changed header alignment to flex-start for multi-line title support
- Added gap: 12px between title and close button
- Close button now has flex-shrink: 0 to maintain proper size
- Title now has flex: 1 to take available space

### v3.2.33 (2026-01-02)
**Changes**:
- Fixed priority filtering that was completely broken
- Urgent filter was checking priority === 0 (incorrect), now checks === 1 (correct)
- Important filter was checking priority === 1 (incorrect), now checks === 3 (correct)
- Corrected getPriorityLabel() mapping to match actual Planner API values
- Removed incorrect priority value 0 and duplicate value 1 from priority map
- Microsoft Planner priority values: 1=Urgent, 3=Important, 5=Medium, 9=Low

### v3.2.32 (2026-01-02)
**Changes**:
- Fixed critical bug in bulk edit functionality
- Added missing clearSelection() function that was being called but not defined
- Function clears selectedTasks Set, hides bulk edit sidebar, and resets all form inputs
- Resolves "clearSelection is not defined" error when applying bulk changes

### v3.2.31 (2026-01-02)
**Changes**:
- Fixed STE-93: Task controls now properly hidden on Goals and Dashboard tabs
- View, Group by, Filter, Show completed checkbox, and Grid Edit button only visible on Tasks tab
- Prevents confusion when refreshing page while on Goals or Dashboard tab
- Improves UI clarity by showing only relevant controls for each tab

### v3.2.30 (2026-01-02)
**Changes**:
- Fixed STE-92 fully: Buckets now expand when clicking goal task count
- Corrected regex from /\\s+/g to /\s+/g in renderNestedView
- Escaped backslash was preventing proper bucket ID matching
- All buckets under the selected goal now properly expand to show tasks

### v3.2.29 (2026-01-02)
**Changes**:
- Fixed STE-90: Goals bucket no longer appears in task edit dropdowns
- Filtered Goals bucket from new task modal bucket dropdown
- Filtered Goals bucket from task details modal bucket dropdown
- Filtered Goals bucket from bulk edit sidebar bucket dropdown
- Users can no longer accidentally assign tasks to the Goals system bucket

### v3.2.28 (2026-01-02)
**Changes**:
- Fixed STE-92: Goals task count click now works properly
- Changed navigateToGoalTasks() to use switchTab('tasks') instead of manual DOM manipulation
- Task count navigation now correctly switches to Tasks view and expands the selected goal
- Properly integrates with existing tab switching infrastructure

### v3.2.27 (2026-01-02)
**Changes**:
- Fixed bucket selector modal button positioning
- Close button (×) now properly positioned in upper right corner
- Cancel and Save buttons properly aligned in bottom right corner
- Added flexbox layout to modal header with justify-content: space-between
- Added proper styling for modal-close button

### v3.2.26 (2026-01-02)
**Changes**:
- Increased bucket selector modal width from 500px to 700px
- Shortened modal title from "Manage Buckets for Goal:" to "Assign Buckets:"
- Buckets now sorted alphabetically in the selector list
- Improves readability and makes buckets easier to find

### v3.2.25 (2026-01-02)
**Changes**:
- Cosmetic improvements to bucket selector modal
- Reduced modal header font size from 18px to 14px
- Reduced bucket list item font size to 13px
- Decreased padding on checkbox items (6px vertical, 8px horizontal)
- Set checkbox size to 16x16px for consistency
- Added proper padding and borders to modal sections
- Goal names and bucket names now fit on single lines
- More compact, professional appearance

### v3.2.24 (2026-01-02)
**Changes**:
- Fixed bucket selector modal positioning issue
- Added proper z-index (2000-2002) for modal overlay
- Modal now appears centered on screen above all content
- No longer appears under Weekly Compass or other UI elements
- Filtered out Goals system bucket (📊 Goals) from bucket selector
- Only shows user-created buckets in management modal
- Added CSS for #bucketSelectorModal, .modal-backdrop, .modal-dialog

### v3.2.23 (2026-01-02)
**Changes**:
- Added interactive functionality to Goals table
- **Bucket Count Column**: Now clickable with visual hover effect
  - Opens modal showing all buckets with checkboxes
  - Pre-checks buckets already associated with the goal
  - Allows adding/removing bucket associations
  - Saves changes to bucket-goal mapping
- **Task Count Column**: Now clickable with visual hover effect
  - Navigates to Tasks view with View: By Goal, Group by: Bucket
  - Auto-expands the selected goal
  - Auto-expands all buckets within that goal
  - Uses sessionStorage flag for expansion state
- Created showBucketSelectorForGoal() function with modal UI
- Created navigateToGoalTasks() function for task navigation
- Created getGoalBuckets() helper function for reverse bucket lookups
- Modified renderNestedView() to handle auto-expansion on navigation
- Added CSS styling for clickable cells and bucket selector modal
- Updated version to 3.2.23 in planner.js and index.html
- Updated CHANGELOG.md with new features

### v3.2.22 (2026-01-02)
**Changes**:
- **CRITICAL BUG FIX**: Graceful session expiration handling
- Added 401 Unauthorized detection in fetchGraph() function
- When token expires (after 1 hour idle), app now:
  1. Detects 401 response from Microsoft Graph API
  2. Shows status message: "Your session has expired. Please refresh to log in again."
  3. Clears expired token from localStorage
  4. Shows alert dialog
  5. Reloads page to trigger re-authentication
- Prevents weird errors like "Failed to update task" with expired tokens
- User experience: Clear message and automatic re-login prompt instead of cryptic failures

### v3.2.21 (2026-01-02)
**Changes**:
- Fixed Goals table column resizing persistence issue
- Added goalsColumnWidths object to store custom column widths
- Modified handleGoalsResize() to store widths in goalsColumnWidths
- Created applyGoalsColumnWidths() function to reapply widths after table re-render
- Called applyGoalsColumnWidths() at end of renderGoalsView()
- Widths now persist when sorting columns or refreshing view

### v3.2.20 (2026-01-02)
**Changes**:
- Bug reports now automatically record submitter information
- Added header to description with: submitter name, email, and submission date/time
- Format: "Submitted by: [currentUserName] ([currentUserEmail])\nDate: [timestamp]\n---\n\n[user description]"
- Always includes submitter info even if user leaves description empty
- Uses currentUserName and currentUserEmail variables (captured at login)

### v3.2.19 (2026-01-02)
**Changes**:
- Fixed bug report description not saving
- Issue: Was using task etag instead of task details etag
- Solution: GET task details first to retrieve correct etag, then PATCH with description
- Task details have separate etag from task itself (Graph API requirement)

### v3.2.18 (2026-01-02)
**Changes**:
- Added "🐛 Report Bug" button in header toolbar (red background for visibility)
- Created Bug Report modal with simplified form (title, priority, description)
- Added showBugReportModal(), closeBugReportModal(), and submitBugReport() functions
- submitBugReport() creates "BUG: Planner Pro" bucket if it doesn't exist
- Bug tasks auto-assigned to currentUserId (whoever submits the bug)
- Bug tasks auto-tagged with category2 ("Maintain Upgrades & Bug Fixes" theme)
- Available to all users, creates consistent bug reports in same bucket
- Default priority: Important (value 3)
- No start/due dates set on submission

### v3.2.17 (2026-01-02)
**Changes**:
- Increased .goals-wrapper max-width from 1200px to 1600px
- Goals table now uses more available screen space

### v3.2.16 (2026-01-02)
**Changes**:
- Fixed Goals table column resizing functionality
- Added startGoalsResize(), handleGoalsResize(), stopGoalsResize() functions
- Goals table uses table layout (width) instead of flexbox, needed separate resize logic
- Updated all resize-handle elements to call startGoalsResize() instead of startResize()

### v3.2.15 (2026-01-02)
**Changes**:
- Goals table now sorts alphabetically by goal name by default (was date)
- Changed goalsSortColumn initial value from 'date' to 'name'
- Added column resizing to all Goals table columns using resize handles
- Widened columns: color (30→40px), date (120→180px), buckets (100→120px), tasks (100→120px), progress (150→180px), actions (80→100px)
- Added col-goal-* CSS classes for column targeting
- Added .resize-handle styling with hover effect to Goals table headers

### v3.2.14 (2026-01-02)
**Changes**:
- Goal banners now display using the goal's assigned color
- Added goal color support to renderGroup() function (already existed for View: By Goal)
- Added goal color support to renderNestedView() for both primary and secondary headers
- Works in "View: By Goal" and any "Group by: Goal" combination
- Goal colors applied with white text for readability

### v3.2.13 (2026-01-02)
**Changes**:
- Fixed "By Goal" view showing all tasks as "No goal" instead of grouping under actual goals
- Bug in groupTasksBy(): getGoalsForBucket() returns goal objects, not IDs
- Changed taskGoals.forEach(goalId => ...) to taskGoals.forEach(goal => ...)
- Removed unnecessary getGoalById() call since goal object is already available
- Tasks now correctly group under their assigned goals

### v3.2.12 (2026-01-02)
**Changes**:
- Extended compass task exclusion to "Group by: Theme" option
- Modified applyFilters() to check both currentView and currentGroupBy for 'theme'
- Condition: includeCompass = currentView !== 'theme' && currentGroupBy !== 'theme'
- Compass tasks now excluded whenever theme grouping/viewing is used

### v3.2.11 (2026-01-02)
**Changes**:
- Excluded Weekly Compass tasks from Theme view
- Modified applyFilters() to set includeCompass = false when currentView === 'theme'
- Theme view now shows only project-related tasks (no personal Weekly Compass items)
- Compass tasks remain visible in all other views (By Assigned To, By Bucket, etc.)

### v3.2.10 (2026-01-02)
**Changes**:
- Fixed Goals tab displaying blank when page refreshed with Goals tab selected
- Added renderGoalsView() call in initializeGoals() after data loads
- Ensures Goals view renders properly when it's the active tab during initialization
- Timing issue: switchTab() was called before goals data loaded from API

### v3.2.9 (2026-01-02)
**Changes**:
- Added column sorting functionality to Goals table
- All columns sortable: Goal Name, Target Date, Buckets, Tasks, Progress
- Click column header to sort, click again to reverse direction
- Visual indicators (↑↓) show active sort column and direction
- Added hover effects to sortable headers
- Maintains sort state across table re-renders
- Default sort: Target Date ascending (closest deadline first)

### v3.2.8 (2026-01-02)
**Changes**:
- Converted Goals view from card grid layout to table/list format
- Added structured columns: color, name+description, target date, bucket count, task count, progress bar, actions
- Goals sorted by target date (closest deadline first), then alphabetically
- Added days remaining calculation with overdue highlighting in red
- Task counts properly exclude Goals bucket tasks to avoid confusion
- New CSS styling for table rows, hover effects, and responsive layout
- Improves scanability and makes it easier to compare goals at a glance

### v3.2.7 (2026-01-02)
**Changes**:
- Fixed issue where Goals bucket tasks appeared in "Unassigned" group on initial load
- Enhanced getFilteredTasks() to check both goalsBucketRealId and bucket name
- Added fallback to filter by GOALS_BUCKET_NAME constant when ID not yet set
- Prevents goals tasks from leaking into task views during initialization

### v3.2.6 (2026-01-02)
**Changes**:
- Fixed calendar icon visibility in dark mode for date inputs
- Added CSS for ::-webkit-calendar-picker-indicator pseudo-element
- Applied filter: invert(1) for dark mode to make black icon visible
- Light mode uses filter: invert(0) (no change)

### v3.2.5 (2026-01-02)
**Changes**:
- Added cursor: pointer to goal target date input
- Confirmed date picker already functional (uses HTML5 native date input)

### v3.2.4 (2026-01-02)
**Changes**:
- Fixed timezone issue where goal dates shifted by one day
- Changed from local midnight (T00:00:00) to UTC noon (T12:00:00Z)
- Using noon prevents date boundary issues across all timezones
- Example: selecting 12/31/2026 now correctly saves as 12/31/2026 regardless of user timezone

### v3.2.3 (2026-01-02)
**Changes**:
- Fixed Goals bucket appearing in task views
- Updated applyFilters() to filter out goalsBucketRealId from bucketsToRender
- Goals bucket now only visible in Goals tab, not in task lists

### v3.2.2 (2026-01-02)
**Changes**:
- Fixed 412 Precondition Failed errors by fetching task details first before PATCH
- Applied fix to both goal creation and mapping task creation
- Fixed goal date not saving: now converts date to/from ISO format properly
- Renamed BUCKET_GOAL_MAPPINGS to "[System] Bucket-Goal Mappings"
- System task marked as complete (percentComplete: 100) to be less visible
- Updated loadGoalsData to filter out [System] tasks from goals list
- Updated mapping task finder to check for both old and new names

### v3.2.1 (2026-01-02)
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
**Changes**:
- Fixed missing default sort in renderGroup function
- Weekly Compass now sorts alphabetically in all view modes and grouping options
- Previous fix only applied to renderByBucket, now applies to renderGroup as well

### v3.1.5 (2026-01-02)
**Changes**:
- Added default alphabetical sort by title for Weekly Compass bucket
- Tasks now appear in alphabetical order by role name (Brother, Father, Friend, etc.)
- Sort uses full "Role: Task" title format

### v3.1.4 (2026-01-02)
**Changes**:
- Added logging to list all task titles found in PlannerCompass_Data
- Helps debug why duplicates aren't being detected

### v3.1.3 (2026-01-02)
**Changes**:
- loadCompassData now ignores old-format COMPASS_ROLE entries (ones with rocks property)
- Added console logging to debug save process
- Prevents old format from being re-loaded and mixed with new format

### v3.1.2 (2026-01-02)
**Changes**:
- Changed role metadata save to delete ALL old COMPASS_ROLE_X tasks first, then create fresh ones
- Fixes issue where duplicate role entries accumulated in PlannerCompass_Data

### v3.1.1 (2026-01-02)
**Changes**:
- Added better initialization checks in saveCompassData
- Improved error messages for debugging

### v3.1.0 (2026-01-02)
**Changes**:
- MAJOR REFACTOR: Weekly Compass now uses real Microsoft To Do tasks
- Created "Weekly Compass" To Do list for rocks (actual tasks)
- PlannerCompass_Data stores metadata only (roles, quote, date range, sharpen saw)
- Tasks have format "Role: Task" with proper due dates and completion
- Works natively in To Do mobile app
- Keeps personal compass data separate from team Planner

### v3.0.31 (2026-01-02)
**Changes**:
- Fixed saveCompassData to update existing tasks instead of create+delete (prevents duplicates)
- Only deletes extra COMPASS_ROLE_X tasks when roles are removed

### v3.0.30 (2026-01-02)
**Changes**:
- Changed compass task display format from "Task (Role)" to "Role: Task" (e.g., "Father: Send devotionals")

### v3.0.29 (2026-01-02)
**Changes**:
- Fixed compass task rendering to display actual start and due dates instead of hardcoded "--"
- Removed debug logging from date parsing

### v3.0.28 (2026-01-02)
**Changes**:
- Added live countdown timer for 429 rate limit errors (updates every 100ms)
- Applied countdown to both fetchGraph retry logic and edit queue processing

### v3.0.27 (Debug)
**Changes**:
- Added console logging for date range parsing

### v3.0.26 (2026-01-02)
**Changes**:
- Weekly Compass tasks now set startDateTime and dueDateTime based on date range (first date = start, last date = due)
- Dates automatically update when date range changes

### v3.0.25 (2026-01-02)
**Changes**:
- Removed "+ Add task" buttons from all bucket and group views (renderByBucket, renderSingleView, renderNestedView, inline theme/goal rendering)

### v3.0.24 (In Progress)
**Changes**:
- Fixed progressive loading: single fetch, client-side split (Graph API doesn't support $filter on tasks endpoint)
- Process incomplete details first → render → process completed details 100ms later
- Status message shows accurate incomplete task count during detail load

### v3.0.23 (Committed 2026-01-01)
**Changes**:
- Increased dark-mode contrast for compass/theme badges so Weekly Compass items remain legible
**Files Modified**:
- `css/planner.css`: Dark-mode label badges use darker background and lighter text/border
- `js/planner.js`: APP_VERSION = 3.0.18
- `index.html`: Cache-bust updated to v=3.0.18
- `CHANGELOG.md`: Added v3.0.18 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.17 (Committed ✅)
**Changes**:
- Removed stray pre-initialization compass refresh calls that triggered `compassData` ReferenceErrors on the sign-in page
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.17; removed early refresh calls
- `index.html`: Cache-bust updated to v=3.0.17
- `CHANGELOG.md`: Added v3.0.17 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.16 (Completed)
**Changes**:
- Block sign-in when `authority` or `clientId` are missing; reload config and default to the Microsoft common authority to prevent broken authorize URLs/404s
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.16; auth guard with common authority fallback
- `index.html`: Cache-bust updated to v=3.0.16
- `CHANGELOG.md`: Added v3.0.16 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.15 (Committed ✅)
**Changes**:
- Guard compass refresh so it doesn’t run before compassData is initialized (fixes sign-in page error)
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.15; guard in refreshCompassTasksFromData
- `index.html`: Cache-bust updated to v=3.0.15
- `CHANGELOG.md`: Added v3.0.15 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.14 (Committed ✅)
**Changes**:
- Weekly Compass uses the standard bucket table layout (arrow orientation/columns) while suppressing goals/add-task controls
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.14; compass bucket renders with standard bucket UI
- `index.html`: Cache-bust updated to v=3.0.14
- `CHANGELOG.md`: Added v3.0.14 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.11 (Committed ✅)
**Changes**:
- Fixed task details modal z-index so it appears above drill-down modal
**Files Modified**:
- `css/planner.css`: Modal z-index increased from 1000 to 1001
- `js/planner.js`: APP_VERSION = 3.0.11
- `index.html`: Cache-bust updated to v=3.0.11
- `CHANGELOG.md`: Added v3.0.11 entry
- `DEVELOPMENT.md`: Updated current status and history

### v3.0.10 (Committed ✅)
**Changes**:
- Updated Key File Locations to reflect css/ and js/ asset paths after folder moves
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.10
- `index.html`: Cache-bust references updated to v=3.0.10
- `CHANGELOG.md`: Added v3.0.10 entry
- `DEVELOPMENT.md`: Current status, version history, and Key File Locations updated

### v3.0.9 (Committed ✅)
**Changes**:
- Fixed version-check and hard refresh to use js/ and css/ asset paths after folder move
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.9; version-check fetches js/planner.js and preloads js/css assets
- `index.html`: Cache-bust references updated to v=3.0.9
- `CHANGELOG.md`: Added v3.0.9 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.8 (Committed ✅)
**Changes**:
- Finalize asset move by aligning version/cache-bust with admin-core.js relocation
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.8
- `index.html`: Cache-bust references updated to v=3.0.8
- `admin.html`: Script reference points to js/admin-core.js
- `CHANGELOG.md`: Added v3.0.8 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.7 (Committed ✅)
**Changes**:
- Moved admin-core.js into the js/ folder alongside planner.js; updated references and cache-busts
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.7
- `index.html`: Cache-bust references updated to v=3.0.7
- `admin.html`: Script reference updated to js/admin-core.js
- `CHANGELOG.md`: Added v3.0.7 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.6 (Committed ✅)
**Changes**:
- Moved planner assets into `css/` and `js/` folders; updated all HTML references and cache-busts
**Files Modified**:
- `js/planner.js`: APP_VERSION = 3.0.6
- `index.html`: References updated to css/planner.css and js/planner.js with v=3.0.6
- `admin.html`: Stylesheet reference updated to css/planner.css
- `CHANGELOG.md`: Added v3.0.6 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.5 (Committed ✅)
**Changes**:
- Weekly Compass title text is now explicitly bold for emphasis
**Files Modified**:
- `planner.css`: Added font-weight to .compass-title
- `planner.js`: APP_VERSION = 3.0.5
- `index.html`: Cache-bust references updated to v=3.0.5
- `CHANGELOG.md`: Added v3.0.5 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.4 (Committed ✅)
**Changes**:
- Tightened spacing and alignment for the bucket goals (🎯) icon and let it inherit text color for themed headers
**Files Modified**:
- `planner.js`: APP_VERSION = 3.0.4; bucket goals button now uses CSS class
- `planner.css`: Added .bucket-goals-btn styling for spacing/alignment and inherited color
- `index.html`: Cache-bust references updated to v=3.0.4
- `CHANGELOG.md`: Added v3.0.4 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.3 (Committed ✅)
**Changes**:
- Fixed dark-mode modal inputs using theme colors so text stays readable (e.g., Assign Goals to Bucket)
**Files Modified**:
- `planner.css`: Themed .task-input background, text, placeholder, and focus border for dark mode readability
- `planner.js`: APP_VERSION = 3.0.3
- `index.html`: Cache-bust references updated to v=3.0.3
- `CHANGELOG.md`: Added v3.0.3 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.1 (Committed ✅)
**Changes**:
- Fixed goal creation so new goals submit via Graph POST (no placeholder IDs that caused PATCH failures)
**Files Modified**:
- `planner.js`: APP_VERSION = 3.0.1; saveGoalModal keeps new goal IDs null so saveGoal creates tasks instead of patching
- `index.html`: Cache-bust references updated to v=3.0.1
- `CHANGELOG.md`: Added v3.0.1 entry
- `DEVELOPMENT.md`: Updated status and history

### v3.0.0 (Committed ✅)
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

---

## Reference Documentation

For additional documentation, see:
- **[VERSION_CONTROL.md](VERSION_CONTROL.md)** - Version control workflow, git patterns, and development process
- **[CHANGELOG.md](CHANGELOG.md)** - User-facing changelog of all releases
- **[README.md](README.md)** - Project overview and setup instructions

