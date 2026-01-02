# Changelog

All notable changes to the Planner Pro application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.4] - 2026-01-02

### Fixed
- Enhanced version check logging to diagnose Update Available badge issues

## [3.3.3] - 2026-01-02

### Changed
- Test version bump to verify Update Available badge functionality

## [3.3.2] - 2026-01-02

### Changed
- Repositioned Pomodoro Timer to the right of Refresh button to prevent shifting when status text changes
- Timer now maintains stable position regardless of status message length

## [3.3.1] - 2026-01-02

### Changed
- Redesigned Pomodoro Timer to horizontal layout for better space efficiency
- Repositioned timer to the left of status indicator
- Reduced timer size and adjusted spacing for cleaner header appearance

## [3.3.0] - 2026-01-02

### Added
- **Pomodoro Timer** feature with active countdown in header
  - 25-minute focus sessions
  - 5-minute short breaks
  - 15-minute long breaks (after 4 focus sessions)
  - Visual countdown timer in MM:SS format
  - Session counter tracking completed pomodoros (🍅)
  - Play, pause, and reset controls
  - Auto-advances to break/focus after completion
  - Browser notifications when sessions complete
  - Document title updates with countdown when running
  - Session count persisted in localStorage

## [3.2.47] - 2026-01-02

### Changed
- Improved Update Available badge visual separation from version pill with increased margin, padding, and shadow

## [3.2.46] - 2026-01-02

### Fixed
- Fixed "changeGrouping is not defined" error when clicking task counts in Goals view
- Corrected function name from changeGrouping() to changeGroupBy()

## [3.2.45] - 2026-01-02

### Fixed
- Fixed view and group by dropdowns not respecting stored defaults on page refresh
- Both dropdowns now properly restore last selected view/groupby from localStorage

## [3.2.44] - 2026-01-02

### Changed
- Alphabetized SAW (Sharpen the Saw) suggestions in picker modal
- Suggestions now sorted A-Z for easier browsing when editing Weekly Compass
- Applies to all four categories: Physical, Mental, Social/Emotional, Spiritual

## [3.2.43] - 2026-01-02

### Added
- Added "My tasks" filter option positioned after "All tasks" in filter dropdown
- Shows only tasks assigned to the currently logged-in user
- Filters based on currentUserId in task assignments
- Provides quick way to see personal task list

## [3.2.42] - 2026-01-02

### Changed
- Restructured Update Available badge as separate bubble outside version pill
- Version number now in its own bubble, Update Available in adjacent bubble
- Reduced spacing to 8px between bubbles for cleaner visual separation
- Increased badge padding slightly (3px 8px) for better appearance as standalone element
- Eliminates visual confusion of badge appearing inside/outside version pill

## [3.2.41] - 2026-01-02

### Fixed
- Increased spacing between version number and Update Available badge
- Badge margin-left increased from 12px to 16px for better visual separation

## [3.2.40] - 2026-01-02

### Fixed
- Actually increased description textarea heights (inline styles were overriding CSS)
- Task detail description: 100px → 150px
- New task description: 120px → 150px
- Bug report description: 150px → 180px
- Updated inline style attributes in HTML for immediate effect

## [3.2.39] - 2026-01-02

### Changed
- Increased description textarea height from 80px to 120px
- Applies to all task edit and new task screens
- Provides more space for entering task descriptions

## [3.2.38] - 2026-01-02

### Fixed
- Weekly Compass bucket now hidden from bucket assignment dialog in Goals tab
- Added !bucket.isCompass filter to showBucketSelectorForGoal function
- Consistent with other bucket dropdowns that already filter compass bucket

## [3.2.37] - 2026-01-02

### Fixed
- Fixed bucket selector modal width issue
- General .modal-content had max-width: 500px which overrode bucket selector's 700px width
- Added .bucket-selector-modal .modal-content override with max-width: none and width: 100%
- Reset padding to 0 on modal-content (padding now on individual sections)
- Modal now properly expands to intended 700px width

## [3.2.36] - 2026-01-02

### Fixed
- Improved bucket selector modal button styling and spacing
- Added proper padding (8px 20px) to Cancel and Save buttons
- Increased gap between buttons from 8px to 12px
- Added hover states for both button types
- Buttons now have consistent size and professional appearance

## [3.2.35] - 2026-01-02

### Fixed
- Fixed "By Goal" view showing "No goal" on page load/refresh
- Tasks view now re-renders after goals data loads when using goal-based view or grouping
- Previously tasks were rendered before goals loaded, causing all tasks to appear under "No goal"
- Added check in initializeGoals() to re-render tasks if currentView or currentGroupBy is 'goal'

## [3.2.34] - 2026-01-02

### Fixed
- Fixed bucket selector modal text and button width issues
- Modal title now wraps properly instead of getting cut off
- Added min-width: 400px to prevent modal from being too narrow
- Header now uses flex-start alignment for proper multi-line title handling
- Close button now has flex-shrink: 0 to maintain size
- Added gap between title and close button for better spacing

## [3.2.33] - 2026-01-02

### Fixed
- Fixed priority filter values for Urgent and Important
- Urgent filter now correctly checks for priority === 1 (was checking === 0)
- Important filter now correctly checks for priority === 3 (was checking === 1)
- Updated getPriorityLabel() to remove incorrect mappings (0 and duplicate 1)
- Priority values: 1=Urgent, 3=Important, 5=Medium, 9=Low

## [3.2.32] - 2026-01-02

### Fixed
- Fixed bulk edit error: "clearSelection is not defined"
- Added missing clearSelection() function to clear selected tasks and reset bulk edit panel
- Function now properly clears selectedTasks Set, hides sidebar, and resets all form inputs

## [3.2.31] - 2026-01-02

### Fixed
- Fixed STE-93: Task controls (View, Group by, Filter, Show completed, Grid Edit) now properly hidden when on Goals or Dashboard tabs
- Controls now only visible on Tasks tab where they're relevant
- Improves UI clarity when switching between tabs

## [3.2.30] - 2026-01-02

### Fixed
- Fixed bucket expansion when clicking goal task count
- Corrected regex pattern (removed escaped backslash) for bucket ID generation
- All buckets under selected goal now properly expand to show tasks

## [3.2.29] - 2026-01-02

### Fixed
- Goals system bucket no longer appears in task bucket dropdowns
- Filtered out Goals bucket from new task modal
- Filtered out Goals bucket from task details modal
- Filtered out Goals bucket from bulk edit sidebar

## [3.2.28] - 2026-01-02

### Fixed
- Clicking task count in Goals table now properly navigates to Tasks view
- Fixed navigateToGoalTasks() to use switchTab('tasks') instead of manual DOM manipulation
- Task count navigation now correctly shows goal with expanded buckets

## [3.2.27] - 2026-01-02

### Fixed
- Bucket selector modal close button now properly positioned in upper right corner
- Cancel and Save buttons properly aligned to bottom right
- Modal header uses flexbox layout for proper button positioning

## [3.2.26] - 2026-01-02

### Changed
- Bucket selector modal width increased from 500px to 700px for better readability
- Modal title shortened from "Manage Buckets for Goal:" to "Assign Buckets:" 
- Buckets now sorted alphabetically in selector modal

## [3.2.25] - 2026-01-02

### Changed
- Reduced font sizes in bucket selector modal for more compact display
- Modal header now 14px instead of 18px
- Bucket list items now 13px with tighter padding
- Checkbox inputs sized to 16x16px for consistency
- Modal sections have appropriate padding and borders
- Each bucket item now fits on a single line

## [3.2.24] - 2026-01-02

### Fixed
- Bucket selector modal now properly displays as overlay with correct z-index positioning
- Modal no longer appears under Weekly Compass or other content
- Goals system bucket (📊 Goals) now filtered out from bucket selector list
- Only user-created buckets shown in bucket management modal

## [3.2.23] - 2026-01-02

### Added
- Goals table interactivity: Bucket count column is now clickable
- Clicking bucket count opens modal to add/remove bucket associations for that goal
- Goals table interactivity: Task count column is now clickable
- Clicking task count navigates to Tasks view filtered by goal with all buckets expanded
- Auto-expands selected goal and its buckets when navigating from Goals page
- Visual hover effects on clickable count cells

### Technical
- Added showBucketSelectorForGoal() function with modal UI
- Added navigateToGoalTasks() function for goal-specific task navigation
- Added getGoalBuckets() helper function for reverse bucket lookups
- Auto-expansion logic in renderNestedView() via sessionStorage flag
- CSS styling for clickable cells and bucket selector modal

## [3.2.22] - 2026-01-02

### Fixed
- **Critical**: Session expiration now detected and handled gracefully
- Added 401 Unauthorized detection in fetchGraph function
- User-friendly message shown when session expires
- Automatic page reload and re-authentication prompt
- Prevents cryptic errors from API calls with expired tokens

## [3.2.21] - 2026-01-02

### Fixed
- Goals table column widths now persist when sorting or refreshing
- Added goalsColumnWidths storage and applyGoalsColumnWidths function
- Column resizing no longer springs back to default widths

## [3.2.20] - 2026-01-02

### Changed
- Bug reports now automatically include submitter name, email, and submission date at top of description
- Format: "Submitted by: [Name] ([Email])" followed by date and divider before user's description

## [3.2.19] - 2026-01-02

### Fixed
- Bug report descriptions now save correctly
- Fixed etag retrieval for task details updates

## [3.2.18] - 2026-01-02

### Added
- Bug report button (🐛 Report Bug) in header toolbar
- Bug submission modal with title, priority, and description fields
- Auto-creates "BUG: Planner Pro" bucket if it doesn't exist
- Auto-assigns bug reports to current user
- Auto-applies "Maintain Upgrades & Bug Fixes" theme (category2)
- Available to all users with consistent behavior

## [3.2.17] - 2026-01-02

### Changed
- Goals view max-width increased from 1200px to 1600px for wider table display

## [3.2.16] - 2026-01-02

### Fixed
- Goals table column resizing now works correctly
- Added Goals-specific resize functions for table layout

## [3.2.15] - 2026-01-02

### Changed
- Goals table now sorts alphabetically by goal name by default
- Added column resizing to all Goals table columns
- Widened columns for better readability (especially target date: 120px → 180px)
- Added resize handles with hover effect

## [3.2.14] - 2026-01-02

### Changed
- Goal banners now use the goal's assigned color
- Applied to both "View: By Goal" and "Group by: Goal" scenarios
- Goal colors now visible in primary and secondary group headers

## [3.2.13] - 2026-01-02

### Fixed
- Fixed "By Goal" view showing all tasks as "No goal" instead of grouping by actual goals
- Bug: getGoalsForBucket() returns goal objects, but code was treating them as IDs
- Tasks now properly grouped under their assigned goals

## [3.2.12] - 2026-01-02

### Changed
- Extended compass task exclusion to "Group by: Theme" option
- Weekly Compass tasks now excluded when theme is used in either View or Group By
- Ensures compass items never appear in theme-based views/groupings

## [3.2.11] - 2026-01-02

### Changed
- Weekly Compass tasks now excluded from Theme view
- Compass tasks are personal productivity items unrelated to project themes
- Theme view now shows only project-related tasks

## [3.2.10] - 2026-01-02

### Fixed
- Fixed Goals tab showing blank on page refresh
- Goals view now renders after data is loaded during initialization
- Added render call in initializeGoals() when Goals tab is active

## [3.2.9] - 2026-01-02

### Added
- Column sorting functionality for Goals table view
- Click any column header (Goal Name, Target Date, Buckets, Tasks, Progress) to sort
- Visual sort indicators (↑↓) show current sort column and direction
- Hover effects on sortable column headers

## [3.2.8] - 2026-01-02

### Changed
- Converted Goals view from card grid to table/list format
- Added columns: color indicator, name, description, target date, bucket count, task count, progress, actions
- Goals sorted by target date (closest first), then by name
- Added days remaining calculation with overdue highlighting
- Task counts exclude Goals bucket tasks
- Improved visual layout for easier scanning and sorting

## [3.2.7] - 2026-01-02

### Fixed
- Fixed "Unassigned" group appearing on initial load with Goals bucket tasks
- Enhanced task filtering to check both bucket ID and bucket name
- Goals bucket tasks now properly excluded even before goals initialization completes

## [3.2.6] - 2026-01-02

### Fixed
- Date picker calendar icon now visible in dark mode
- Applied filter: invert(1) to calendar icon in dark mode
- Icon remains visible in both light and dark themes

## [3.2.5] - 2026-01-02

### Changed
- Added cursor pointer style to goal target date input for better UX
- Date picker already present (native browser date picker via type="date")

## [3.2.4] - 2026-01-02

### Fixed
- Fixed goal target date timezone issue causing dates to shift by one day
- Now uses UTC noon (12:00:00Z) to prevent timezone-related date changes
- Selected date (e.g., 12/31/2026) now correctly saves and displays as 12/31/2026

## [3.2.3] - 2026-01-02

### Fixed
- Goals bucket now properly hidden from Tasks view
- Only Weekly Compass virtual bucket visible in task lists

## [3.2.2] - 2026-01-02

### Fixed
- Fixed 412 Precondition Failed errors when creating goals by fetching details first to get proper etag
- Fixed goal target date not saving when editing (now properly converts to/from ISO format)
- BUCKET_GOAL_MAPPINGS task now named "[System] Bucket-Goal Mappings" and marked complete to be less visible
- System tasks filtered out of goals list to prevent confusion

## [3.2.1] - 2026-01-02

### Changed
- Goals now stored as tasks in a special "📊 Goals" Planner bucket
- Goals bucket hidden from normal task views but visible in Goals tab
- Each goal is a real Planner task with metadata in description
- Bucket-goal mappings stored in special BUCKET_GOAL_MAPPINGS task
- More reliable than plan details sharedWith field approach

### Fixed
- Resolved API error when trying to save goals to plan details
- Goals now properly shared with all team members

## [3.2.0] - 2026-01-02

### Changed
- **BREAKING**: Goals now stored in Planner plan details instead of Microsoft To Do
- Goals are now shared with all team members who have access to the plan
- Removed dependency on personal To Do lists for goals storage
- Goals data stored in plan's `sharedWith.goalsData` field

### Migration
- Existing goals in To Do will need to be recreated in the Goals tab
- All team members will see the same goals

## [3.1.6] - 2026-01-02

### Fixed
- Fixed Weekly Compass sorting in all view modes (added default sort to renderGroup function)
- Tasks now consistently sort alphabetically by role name across all grouping options

## [3.1.5] - 2026-01-02

### Fixed
- Weekly Compass tasks now sort alphabetically by role name when no explicit sort is applied
- Added default ascending sort by title for Weekly Compass bucket

## [3.1.4] - 2026-01-02

### Added
- Detailed console logging of all tasks found in PlannerCompass_Data during save

## [3.1.3] - 2026-01-02

### Fixed
- Load function now ignores old-format COMPASS_ROLE entries that contain rocks data
- Added console logging to track deletion and creation of role metadata
- Prevents mixing of old and new format data

## [3.1.2] - 2026-01-02

### Fixed
- Fixed duplicate COMPASS_ROLE entries in PlannerCompass_Data by deleting all old role tasks before creating new ones

## [3.1.1] - 2026-01-02

### Fixed
- Added better error handling when Weekly Compass lists aren't fully initialized
- Improved error messages to help debug save issues

## [3.1.0] - 2026-01-02

### Changed
- **MAJOR**: Weekly Compass now uses real Microsoft To Do tasks instead of JSON storage
- Created separate "Weekly Compass" To Do list for storing rocks as actual tasks
- PlannerCompass_Data now only stores metadata (roles, quote, date range, sharpen saw)
- Each rock is now a real To Do task with format "Role: Task name"
- Tasks include proper due dates, completion status, and can be managed in To Do app
- Rocks are personal tasks in To Do, keeping them separate from team Planner data

## [3.0.31] - 2026-01-02

### Fixed
- Fixed Weekly Compass save creating duplicate entries in To Do list
- Changed save logic to update existing tasks instead of create-then-delete approach

## [3.0.30] - 2026-01-02

### Changed
- Weekly Compass task names now display as "Role: Task" format (e.g., "Father: Send devotionals") instead of "Task (Role)"

## [3.0.29] - 2026-01-02

### Fixed
- Fixed Weekly Compass tasks not displaying start and due dates in grid view
- Dates now correctly show based on date range (start = first date, due = last date)

## [3.0.28] - 2026-01-02

### Added
- Live countdown timer when rate limited (429 errors) - shows seconds remaining until retry
- Countdown updates every 100ms for smooth UX during throttling

## [3.0.26] - 2026-01-02

### Changed
- Weekly Compass tasks now automatically set start date to first date in date range and due date to last date in date range
- Dates update dynamically when date range changes

## [3.0.25] - 2026-01-02

### Removed
- Removed "+ Add task" buttons from all bucket and group views to reduce UI clutter

## [3.0.17] - 2026-01-01

### Fixed
- **Compass init**: Removed stray pre-initialization refresh calls so compassData is not touched before it exists, eliminating the sign-in page ReferenceError

## [3.0.24] - 2026-01-01
### Fixed
- Fixed progressive loading: fetch all tasks in one call, client-side split incomplete/completed
- Process incomplete task details first (renders immediately), completed details processed 100ms later in background
- Status now shows "Loading X active task details..." reflecting actual incomplete count
- Reduced delay from 800ms to 100ms for completed task processing (starts almost immediately after incomplete render)

## [3.0.23] - 2026-01-01
### Performance
- Progressive loading: loads incomplete tasks first for immediate display, then loads completed tasks in background
- Reduces initial page load time, especially for plans with many completed tasks
- Status message now shows "Loading active tasks..." during initial phase

## [3.0.22] - 2026-01-01
### Fixed
- Fixed compass task title click handler - now properly opens edit modal instead of just highlighting panel
- Compass tasks now assigned to current user, so they appear under user's name in "By Assigned To" view grouped by Bucket

## [3.0.21] - 2026-01-01
### Changed
- Compass tasks now appear in all views (not just "By Bucket")
- Compass tasks show logged-in user's name as assignee (instead of "Compass")
- Clicking compass task title opens custom edit dialog (simple modal with name/progress/role)
- Compass edit dialog syncs changes back to Weekly Compass panel and task grid

## [3.0.20] - 2026-01-01
### Fixed
- Made Weekly Compass tasks interactive in task grid: clicking title scrolls to item in compass panel with highlight; clicking progress toggles completion
- "Add task" button already hidden for Weekly Compass bucket (no change needed)

## [3.0.19] - 2026-01-01
### Fixed
- Fixed compass rock checkbox duplication bug: toggling a checkbox no longer duplicates all compass items in the panel, task grid, and To Do list

## [3.0.18] - 2026-01-01

### Fixed
- **Dark mode readability**: Increased contrast for compass/theme badges so Weekly Compass items stay legible in dark mode

## [3.0.16] - 2026-01-01

### Fixed
- **Auth guard**: Block sign-in when `authority`/`clientId` are missing and fall back to the Microsoft common authority to avoid broken authorize URLs/404 redirects

## [3.0.12] - 2026-01-01

### Added
- **Weekly Compass virtual bucket**: Shows To Do–backed compass items grouped by role in a read-only bucket alongside Planner buckets (bucket view only)

### Changed
- **Compass completion sync**: Big Rock checkboxes toggle completion in both the compass panel and the virtual bucket, preserving To Do state
- **Bulk/creation safeguards**: Compass items are excluded from bulk edits, select-all, and add-task UI to avoid Planner writes


## [3.0.15] - 2026-01-01

### Fixed
- **Compass init**: Prevented refreshCompassTasksFromData from running before compassData is initialized, fixing sign-in page error

## [3.0.14] - 2026-01-01

### Changed
- **Compass bucket layout**: Virtual Weekly Compass now uses the standard bucket table layout (same arrow/orientation and columns) while keeping goals/add-task controls hidden for safety

## [3.0.13] - 2026-01-01

### Fixed
- **Compass bucket refresh**: Compass bucket now stays visible after toggling Big Rock checkboxes or editing roles/rocks (refresh rebuilds the virtual list immediately)

## [3.0.12] - 2026-01-01

### Fixed
- **Task details modal z-index**: Modal now appears above drill-down modal when clicking a task from dashboard drill-down view

## [3.0.10] - 2026-01-01

### Changed
- **Docs**: Updated Key File Locations to reference css/ and js/ asset paths

## [3.0.9] - 2026-01-01

### Fixed
- **Version check paths**: Updated version-check and hard refresh to use js/ and css/ asset paths after folder move

## [3.0.8] - 2026-01-01

### Changed
- **Asset structure**: Finalize moving admin-core.js into js/ and update cache-bust version to 3.0.8

## [3.0.7] - 2026-01-01

### Changed
- **Asset structure**: Moved admin-core.js into js/ alongside planner.js; updated references and cache-bust

## [3.0.6] - 2026-01-01

### Changed
- **Asset structure**: Moved planner.css to css/ and planner.js to js/, updating all references

## [3.0.5] - 2026-01-01

### Changed
- **Weekly Compass title**: Title text is now explicitly bold for better emphasis

## [3.0.4] - 2026-01-01

### Changed
- **Bucket goal icon spacing**: Tighter spacing and inherited color for the 🎯 button on bucket headers

## [3.0.3] - 2026-01-01

### Fixed
- **Dark mode inputs**: Modal inputs now use themed colors so text remains readable in dark mode (e.g., Assign Goals to Bucket)

## [3.0.1] - 2026-01-01

### Fixed
- **Goal creation**: New goals no longer receive placeholder IDs, ensuring the app issues Graph POST requests instead of failing PATCH attempts

## [3.0.0] - 2025-12-31

### Added
- **Goals Feature (Major)**: Strategic planning layer with Goals → Buckets (Epics) → Tasks hierarchy
  - Goals tab with visual goal cards showing progress, target dates, and associated buckets/tasks
  - Goal management: Create, edit, delete goals with name, description, color, and target date
  - Bucket-to-goals mapping: Buckets can belong to multiple goals (many-to-many relationship)
  - "By Goal" view and "Group by Goal" options in task list
  - Goal badges on task cards showing inherited goals from bucket assignments
  - Goals stored in Microsoft To Do List "PlannerGoals_Data" (Planner-native, no external database)
  - Real-time progress tracking: Goals show completion % based on tasks in associated buckets

## [2.2.7] - 2025-12-31

### Changed
- **Hide header when unauthenticated**: Header with all task controls now hidden until user signs in for cleaner authentication screen

## [2.2.6] - 2025-12-31

### Changed
- **Options modal reorganized**: Split settings into 3 tabs (Views, Dashboard, Advanced) to eliminate scrollbar and improve organization
- Views tab: Task list views and Weekly Compass settings
- Dashboard tab: Dashboard-specific settings (reset layout)
- Advanced tab: System settings (update check interval)

## [2.2.5] - 2025-12-31

### Changed
- **Motivational quotes moved to CSV**: Quotes now load from csv/quotes.csv instead of being hardcoded in planner.js

## [2.2.4] - 2025-12-31

### Changed
- **Housekeeping**: Synced development tracking and tidied config.json formatting; version bump to 2.2.4

## [2.2.2] - 2025-12-30

### Fixed
- **Card sizing conflict**: Manual card size preferences now override automatic wide-card expansion for long labels

### Added
- **Reset Dashboard Layout**: Added button in Options modal to clear saved card positions and sizes, restoring default layout

## [2.2.1] - 2025-12-30

### Fixed
- **Card menu button accessibility**: Added z-index to card headers and menu buttons to prevent them from being hidden behind other cards when resizing

## [2.2.0] - 2025-12-30

### Added
- **Dashboard card drag-and-drop**: Reorder cards by dragging them to new positions
- **Dashboard card resizing**: Each card can be resized via menu (⋯) to 1x Normal, 2x Wide, or Full Width
- **Layout persistence**: Card order and sizes are saved to localStorage and restored on page load
- **Visual drag feedback**: Cards show opacity change while dragging and drop zones with colored borders

### Changed
- **Card menu expanded**: Now includes both Chart Type and Card Size sections
- **Version bump to 2.2.0**: Major feature upgrade from 2.1.x series

## [2.1.50] - 2025-12-30

### Fixed
- **Vertical bars chart**: Changed from fixed height to flexible min-height so container auto-resizes like Pie and Donut charts

## [2.1.49] - 2025-12-30

### Added
- **Console logging for status updates**: All status messages (e.g., "Loading 83 items") now appear in F12 Console for debugging

## [2.1.48] - 2025-12-30

### Changed
- **Dashboard visualization types**: Replaced symbol-based visuals with proper chart types
  - **Horizontal Bars** (default): Traditional horizontal bar chart
  - **Vertical Bars**: Vertical column chart with interactive hover effect
  - **Pie Chart**: Full circular pie visualization with color-coded slices and legend
  - **Donut Chart**: Pie chart with hollow center, same slicing as pie

## [2.1.47] - 2025-12-30

### Added
- **CSV file organization**: Moved `saw-suggestions.csv` to `csv/` subdirectory for better file organization

## [2.1.46] - 2025-12-30

### Fixed
- **UPDATE AVAILABLE badge positioning**: Increased left margin from 8px to 12px to prevent overlap with version number

## [2.1.45] - 2025-12-30

### Changed
- **Cleaner console output**: Removed verbose data dumps from F12 Console
  - Removed full userDetailsMap object logging
  - Removed individual member listings (group members, batch-fetched users)
  - Removed plan data structure dumps
  - Removed task category details logging
  - Kept informational headers and status messages (batch counts, member counts, etc.)
  - Version checking logs remain unchanged

## [2.1.44] - 2025-12-30

### Changed
- **Enhanced date range display**: Increased font size from 12px to 14px for date label and input
- **Stronger emphasis**: Increased font-weight to 700 (bold) for date range label and input field
- **Label text update**: Changed "Date:" to "Date Range" for clarity in Weekly Compass

## [2.1.43] - 2025-12-30

### Changed
- **Reduced console verbosity**: Removed verbose logging for task assignment metadata scanning
  - Removed console.log output that printed task title and assignment details for each task
  - Quieter F12 console during task loading

## [2.2.3] - 2025-12-30

### Fixed
- **Bar label layout**: Long labels now widen the label column inside the card (without forcing the card to span 2 columns), preventing bars from overlapping text while keeping manual card sizes

## [2.2.2] - 2025-12-30

### Added
- **Reset Dashboard Layout**: Added button in Options modal to clear saved card positions and sizes, restoring default layout

## [2.2.1] - 2025-12-30
## [2.1.41] - 2025-12-30

### Added
- **Configurable update check interval**: New setting in Options to control how frequently the app checks for updates
  - Stored in localStorage as `plannerUpdateCheckInterval` (in seconds)
  - Minimum enforced at 60 seconds (cannot set lower)
  - Default is 60 seconds
  - Updates immediately saved when options are saved

## [2.1.40] - 2025-12-30

### Changed
- **Tighter vertical spacing in grouped views**: Reduced margins and padding in assignee containers and nested buckets for more compact display when View and Group By are selected
  - Assignee container margin reduced from 20px to 12px
  - Assignee header padding reduced from 12px to 10px
  - Bucket-in-assignee margin reduced from 8px to 6px
  - Nested bucket header padding reduced from 8px to 6px
## [2.1.39] - 2024-12-30

### Changed
- **Removed hard-coded company references**: All mentions of "SkibaTech" removed from main files
- **Added `companyName` configuration field**: Company name now configurable via config.json
- **Generic examples in templates**: config.example.json and admin.html now use generic domain examples (yourdomain.com)
- **Dynamic branding**: Page title, header, and authentication messages now use companyName from config
- **Documentation updates**: README.md and admin.html updated with Directory.Read.All permission troubleshooting

## [2.1.38] - 2024-12-30

### Fixed
- **Fixed userDetailsMap initialization order**: Moved initialization earlier in code to prevent reference errors

## [2.1.37] - 2025-12-30

### Fixed
- **Assignee Debugging**: Added detailed console logging to diagnose assignment metadata and group member lookups

## [2.1.38] - 2025-12-30

### Fixed
- **Assignee Lookup**: Moved userDetailsMap initialization before assignment metadata extraction to prevent reference errors

## [2.1.37] - 2025-12-30

### Fixed
- **Assignee Debugging**: Added detailed console logging to diagnose assignment metadata and group member lookups

## [2.1.36] - 2025-12-30

### Fixed
- **Assignee Lookup**: Extract display names directly from assignment metadata; prioritize group members fetch before falling back to individual user lookups

## [2.1.35] - 2025-12-30

### Fixed
- **Assignee User Lookup**: Added Directory.Read.All scope and implemented fallback to individual user fetches when batch API fails due to permissions

## [2.1.34] - 2025-12-30

### Fixed
- **Assignee Debug**: Added console logging to diagnose user fetching and display name resolution issues

## [2.1.33] - 2025-12-30

### Changed
- **SAW Suggestions**: Moved Sharpen the Saw suggestions to external CSV file (saw-suggestions.csv) for easier editing without code changes

## [2.1.32] - 2025-12-30

### Fixed
- **Assignee Names**: Removed 'Assigned' fallback that was masking missing user data; now shows truncated user ID if display name unavailable

## [2.1.31] - 2025-12-30

### Changed
- **Dashboard Card Widths**: Cards dynamically resize based on content—labels ≤15 chars use narrow format (15ch label column), longer labels trigger wide format with flexible label column

## [2.1.30] - 2025-12-30

### Fixed
- **Assignee Grouping**: Tasks now appear under each assignee (including multi-assigned tasks) and use enriched display names instead of the generic "Assigned" label across lists and dashboard counts

## [2.1.29] - 2025-12-30

### Fixed
- **Assignee Display**: Grouping and task rows now use enriched task details to show actual assignee names (including multiple assignees), avoiding generic "Assigned" labels

## [2.1.28] - 2025-12-30

### Added
- **Dashboard Card Menus**: Three-dot menu on each dashboard card to choose visualization type (bars or dots); preference saved per card

## [2.1.27] - 2025-12-30

### Changed
- **Dashboard Layout**: Bar rows give more width to labels (wider first column, slightly smaller bar column) to reduce truncation

## [2.1.26] - 2025-12-30

### Changed
- **Dashboard Layout**: Themes card now spans two columns (≈4 boxes) and labels no longer wrap/ellipsis; asset cache-bust updated

## [2.1.25] - 2025-12-30

### Changed
- **Dashboard Layout**: Summary tiles and cards use smaller min widths (120px stats, 260px cards; 320px on very wide screens) so stats stay single-box and charts can expand to 3–4 columns

## [2.1.24] - 2025-12-30

### Fixed
- **Update Delivery**: index.html now cache-busts planner.js/planner.css with version query strings so clicking UPDATE loads the fresh assets

## [2.1.23] - 2025-12-30

### Changed
- **Update Refresh**: Uses the server version when launching the cache-busted reload to avoid sticking on the prior build; preloads use versioned bust tags
- **Dashboard Layout**: Card min width reduced (300px base, 360px on wide screens) to allow 3–4 columns

## [2.1.22] - 2025-12-30

### Fixed
- **Weekly Compass Default**: Persisted default visibility now loads correctly (defaults to on when unset; saved to To Do and localStorage)

## [2.1.21] - 2025-12-30

### Changed
- **Dashboard Layout**: Grid min width reduced (340px base, 420px on very wide screens) to allow 3–4 columns; dense flow retained
- **Bar Labels**: Wrapping restored (no ellipsis) for better readability
- **Update Refresh**: Hard refresh uses versioned cache-bust URL and no-store preloads for better update reliability

## [2.1.20] - 2025-12-30

### Changed
- **Weekly Compass**: Date input width tightened (min 140px, max 190px) to match expected entries

## [2.1.19] - 2025-12-30

### Changed
- **Dashboard Layout**: Grid now uses min widths that allow 3–4 columns on typical screens (420px base, 480px on very wide viewports); dense flow reduces gaps

## [2.1.18] - 2025-12-30

### Changed
- **Dashboard Layout**: Cards use wider min width (500px) to reduce truncation; version bump

## [2.1.17] - 2025-12-30

### Fixed
- **Update Navigation**: UPDATE AVAILABLE now clears caches, preloads core assets with cache-bust, then navigates with a cache-busted URL (more reliable than prior reload)

## [2.1.16] - 2025-12-30

### Changed
- **Dashboard Layout**: Cards use wider min width (360px) and bar labels wrap instead of truncating; legend column widened to reduce ellipsis

## [2.1.15] - 2025-12-30

### Fixed
- **Update Button Reload**: Clicking UPDATE AVAILABLE now clears caches, preloads fresh planner.js/css/html with cache-bust, then hard-reloads (matches Ctrl+Shift+R behavior)

## [2.1.14] - 2025-12-30

### Changed
- **Badge Text**: UPDATE button now reads "UPDATE AVAILABLE" for clarity

## [2.1.13] - 2025-12-30

### Fixed
- **Update Button**: Now pre-fetches fresh planner.js with cache-bust before reload to ensure new version loads after clicking UPDATE

## [2.1.12] - 2025-12-30

### Fixed
- **Update Badge Refresh**: UPDATE button now forces a cache-busted reload, ensuring the newest assets load (previously could stick on old version)

## [2.1.11] - 2025-12-30

### Changed
- **Archive Cleanup**: Staged _archived folder contents and removed old create-changelog.html; repo state now reflects archive move
- **Version**: Bumped to 2.1.11

## [2.1.10] - 2025-12-30

### Fixed
- **Version Polling**: Update checker now reads planner.js (where APP_VERSION is defined) so the UPDATE badge appears correctly

## [2.1.9] - 2025-12-30

### Changed
- **Dashboard Layout**: Cards use minmax(300px, 1fr) to intelligently resize; better responsive behavior with compass visible

## [2.1.8] - 2025-12-30

### Improved
- **Background Update Polling**: Version check now runs every 60 seconds instead of just once
- Shows UPDATE badge silently when new version is available - no page interruption
- User can click UPDATE badge whenever ready to hard refresh and get new version
- Better UX for long sessions - users aware of updates without workflow interruption

## [2.1.7] - 2025-12-30

### Improved
- **Weekly Compass Default**: New option in Settings to show/hide compass by default
- Compass visibility preference is saved to localStorage and persists across sessions
- Users can toggle compass visibility with the button, but default behavior is configurable

## [2.1.6] - 2025-12-30

### Improved
- **Version Update Check**: Automatically checks for new versions on startup
- Shows red UPDATE badge next to version if newer version is available
- Badge is clickable to perform a hard refresh (clears cache and reloads)
- Update check runs 2 seconds after page load to avoid startup lag

## [2.1.5] - 2025-12-30

### Improved
- **Loading Status**: More detailed status messages during initial load (plan details → task details → assignees → rendering)
- Users can now see what's being loaded instead of generic "Loading..."
- Helps identify which API calls are slower or causing delays

## [2.1.4] - 2025-12-30

### Fixed
- **Layout Overlap**: Content (tasks and dashboard) now properly flows beside Weekly Compass instead of underneath
- Improved flex layout structure for proper side-by-side display
- Content scrolls independently while compass remains sticky in its position

## [2.1.3] - 2025-12-30

### Changed
- **Tab Location**: Moved Tasks/Dashboard tabs to header nav bar (second row, before New Task button)
- **Weekly Compass**: Now appears in both Tasks and Dashboard views (was only showing in Tasks)
- Added spacing divider between tabs and action buttons in header

### Fixed
- Compass panel no longer disappears when switching to Dashboard view
- Improved layout consistency across both tabs

## [2.1.2] - 2025-12-30

### Added
- **Interactive Charts**: Click any bar in dashboard charts to drill down and see filtered task list
- **Task Details**: Click any task in drill-down modal to open full task details
- Charts now include: Progress, Priority, Due timeline, Assignee load, Themes

### Fixed
- **Dashboard Layout**: Fixed horizontal sizing issues with responsive grid

## [2.1.1] - 2025-12-30

### Fixed
- **Weekly Compass Layout**: Fixed compass panel positioning conflicts with new tab structure
- Compass now properly stacks below tabs instead of overlapping

## [2.1.0] - 2025-12-30

### Added
- **Dashboard Tab**: New in-app reporting interface with tab switcher
- **Charts**: Progress, Priority, Due timeline, Assignee load, Themes (top 10) using lightweight bar charts
- **Filters**: Dashboard respects current View, Group by, Filter, and Show completed settings
- **CSV Export**: Export filtered dataset to CSV (Title, Progress, Priority, Bucket, Assignees, Dates, Themes)
- All data aggregated client-side in-memory; no external dependencies or backend

## [2.0.68] - 2025-12-30

### Fixed
- **Column Resize**: Added capture-phase click guard during resize to fully block header sort triggers

## [2.0.67] - 2025-12-30

### Fixed
- **Column Resize**: Prevent sorting while resizing by guarding header clicks when resize is active

## [2.0.66] - 2025-12-30

### Fixed
- **Column Resize**: Added click event prevention to resize handles to stop sort from triggering when releasing mouse after resize

## [2.0.65] - 2025-12-30

### Fixed
- **Column Resize**: Increased z-index of resize handle to prevent accidental sorting when grabbing to resize

## [2.0.64] - 2025-12-30

### Changed
- **Column Resize**: Changed resize handle from light blue rectangle to thin border line
- Resize indicator now appears as a 2px blue line on hover for better visibility

## [2.0.63] - 2025-12-30

### Changed
- **Weekly Compass Save Icon**: Replaced SVG disk icon with checkmark (✓) character for better alignment and consistency with palette emoji and X icons

## [2.0.62] - 2025-12-30

### Fixed
- **Weekly Compass Save Icon**: Fixed alignment so save (disk) icon is now centered instead of sitting far right/bottom

## [2.0.61] - 2025-12-30

### Fixed
- **Weekly Compass Header Icons**: Increased all icons to 24-28px for better visibility; fixed X icon alignment to center properly instead of sitting bottom-right

## [2.0.60] - 2025-12-30

### Changed
- **Weekly Compass Header Icons**: Palette picker, save icon, and cancel X are now all the same size (20px) and properly aligned horizontally center

## [2.0.59] - 2025-12-29

### Changed
- **Admin Help**: Now exactly matches README Admin Portal Usage section (removed internal maintainer note, added "What Should NEVER Be in config.json" and "Network Security" sections)
- **Versions**: Admin portal bumped to 1.4.73-admin

## [2.0.58] - 2025-12-29

### Changed
- **Docs & Help**: Admin Mode help modal now 100% matches README wording (removed maintainer note, fixed wording differences in all sections, matched code formatting)
- **Versions**: Admin portal bumped to 1.4.72-admin

## [2.0.57] - 2025-12-29

### Changed
- **Docs**: Removed internal maintainer note from README; section renamed to "Admin Portal Usage"

## [2.0.56] - 2025-12-29

### Changed
- **Docs & Help**: README and Admin Mode help now share identical content/wording (initial setup, ongoing management, troubleshooting, advanced, licensing) with an explicit sync note
- **Versions**: App bumped to 2.0.56; Admin portal to 1.4.71-admin

## [2.0.55] - 2025-12-29

### Changed
- **Admin Portal Version**: Bumped admin portal to 1.4.70-admin to stay aligned with README/help content

## [2.0.54] - 2025-12-29

### Changed
- **Docs & Admin Help**: Synchronized README and Admin Mode help content (setup, ongoing management, troubleshooting, advanced, licensing) with a note to avoid duplicate/conflicting steps

## [2.0.52] - 2025-12-29

### Changed
- **Docs**: Added minimal and preferred Microsoft 365 licensing guidance for Planner Pro usage

## [2.0.51] - 2025-12-29

### Changed
- **Docs**: Added explicit guidance for config values (how to get clientId, authority, planId; clarified adminGroupName placeholder; explained allowedTenants, adminUsers, taskIdPrefix)

## [2.0.50] - 2025-12-29

### Changed
- **Docs**: Clarified how to copy the Planner Plan ID from the `/plan/{id}` segment in the Planner URL

## [2.0.49] - 2025-12-29

### Changed
- **Planner Deep Link**: Updated task link target to planner.cloud.microsoft instead of tasks.office.com (Outlook Planner experience)
- **Docs**: README instructions now direct to planner.cloud.microsoft for Plan ID lookup

## [2.0.48] - 2025-12-29

### Changed
- **Admin Group Configuration**: Added support for `adminGroupName` so admin checks can be done by group display name via Graph; enables removing `adminGroupId` from public `config.json`

## [2.0.47] - 2025-12-29

### Changed
- **Options Save Behavior**: Applying View, Group By, and Show Completed immediately to the main screen on Save (no longer waits for refresh/load)

## [2.0.46] - 2025-12-29

### Changed
- **Weekly Compass Color Picker Icon**: Temporary switch to a text-based palette icon (🎨) for reliable visibility while we investigate the eyedropper rendering issue

## [2.0.45] - 2025-12-29

### Fixed
- **Options Modal Controls**: Implemented `closeOptions()` and `switchOptionsTab()` and bound handlers to `window` so Cancel, Save, and Close (×) work reliably

## [2.0.44] - 2025-12-29

### Fixed
- **Eyedropper Icon Visibility**: Replaced complex filled path with a simple stroked SVG (circle + stem + tip) to render consistently

## [2.0.43] - 2025-12-29

### Fixed
- **Color Picker Position**: Nest hidden color input inside Eyedropper button and render invisibly (1px, opacity 0) so the native picker anchors near the icon

## [2.0.42] - 2025-12-29

### Fixed
- **Eyedropper Icon**: Explicit SVG width/height to ensure icon renders visibly in the Weekly Compass header

## [2.0.41] - 2025-12-29

### Changed
- **Weekly Compass Color Picker**: Replaced small swatch with an Eyedropper icon button that opens the native color picker; native input remains hidden

## [2.0.40] - 2025-12-29

### Changed
- **Weekly Compass Header Icons**: Save and Cancel buttons increased to 32px with 22px glyphs; background color picker reduced to 18px for better visual balance

## [2.0.39] - 2025-12-29

### Changed
- **429 Retry Status Message**: Updated text shown during throttling to "Too Many Requests (429) - Retrying (x/5) in XXXs" for clearer feedback

## [2.0.38] - 2025-12-29

### Fixed
- **Hard Refresh 429s**: Added global Graph request limiter (max 4 concurrent), reduced detail fetch concurrency to 3, and introduced small startup jitter to stagger calls

## [2.0.37] - 2025-12-29

### Changed
- **Compass Header Controls**: Background color picker made smaller; Save and Cancel icons made larger for consistent sizing

## [2.0.36] - 2025-12-29

### Changed
- **Weekly Compass Rocks**: Checkbox state now auto-saves (debounced ~1s) so changes persist across refresh without needing manual Save

## [2.0.35] - 2025-12-29

### Fixed
- **Sharpen the Saw Labels**: Clickable styling and tooltip now only shown in edit mode; in read-only, labels are non-clickable and show no hint

## [2.0.34] - 2025-12-29

### Changed
- **Suggestions Modal Width**: Reduced by 20% (from 80vw/750px to 64vw/600px)

## [2.0.33] - 2025-12-29

### Changed
- **All Suggestion Categories**: Updated mental, social/emotional, and spiritual suggestions to be 6 words or less
  - **Mental**: "Visit a museum or art gallery" → "Visit a museum or gallery"; "Study the works of spiritual leaders" → "Study spiritual leader works"
  - **Social/Emotional**: Significantly shortened all 37 items while preserving meaning
    - Removed self-care/others-care comments, condensed suggestions
    - "Treat yourself to a hot bath by candlelight" → "Take a hot bath by candlelight"
    - "Practice the \"Platinum Rule\": Do unto others as they want" → "Practice the Platinum Rule always"
  - **Spiritual**: Fixed 4 items
    - "Reflect on your values and principles" → "Reflect on your values"
    - "Study the works of spiritual leaders" → "Study spiritual leader works"
    - "Serve others without expecting reward" → "Serve others without reward"
    - "Create a vision board for goals" → "Create a vision board"

## [2.0.32] - 2025-12-29

### Changed
- **Suggestions Modal Width**: Reduced width from 90vw/900px to 80vw/750px (skinnier modal)
- **Physical Suggestions**: Updated all suggestions to be 6 words or less and semantically complete
  - "Drink eight to ten glasses of water a day" → "Drink eight glasses of water daily"
  - "Park the car further away so you have to walk more" → "Park further away to walk more"
  - "Add a raw fruit or vegetable to your daily diet" → "Add raw fruit or vegetable daily"
  - "Start a stretching-and-flexibility program" → "Start a stretching program"
  - "Delete harmful or empty-calorie items" → "Delete empty-calorie food items"
  - "Hire a trainer for fitness program" → "Hire a fitness trainer"
  - "Use a treadmill while watching TV" → "Use treadmill while watching TV"
  - "Take the stairs instead of the elevator" → "Take the stairs instead of elevator"

## [2.0.31] - 2025-12-29

### Fixed
- **Suggestions Modal Close Button**: Restructured modal with dedicated header bar
  - Title and close button now in separate header (not in scrollable area)
  - Close button clearly visible and not overlapped by scrollbar
  - Header uses flexbox layout with padding for better spacing
  - Scroll area now contains only suggestions and hint text

## [2.0.30] - 2025-12-29

### Fixed
- **Suggestions Modal Close Button**: Fixed close button visibility issue
  - Changed modal width to 90vw (90% of viewport width) with max-width 900px for better responsiveness
  - Adjusted close button positioning (right: 16px, top: 12px) with larger font size (24px)
  - Added box-sizing: border-box to ensure padding is included in width calculation
  - Reduced scroll area padding-right from 20px to 8px for better space utilization

## [2.0.29] - 2025-12-29

### Changed
- **Header Layout**: Moved Status indicator and Refresh button to top toolbar, to the left of compass toggle, dark mode, and profile icon

## [2.0.28] - 2025-12-29

### Fixed
- **Suggestions Modal Width**: Further increased max-width to 850px and scroll area padding-right to 20px for better scrollbar spacing

## [2.0.27] - 2025-12-29

### Fixed
- **Suggestions Modal Width**: Increased max-width from 640px to 720px so close button is not blocked by scrollbar

## [2.0.26] - 2025-12-29

### Changed
- **Sharpen the Saw UX**: Replaced icon button with clickable label text
  - Label text (Physical, Social/Emotional, Mental, Spiritual) is now underlined and clickable
  - Opens suggestions modal on click in edit mode
  - Improves usability by removing button that occupied space to the right of text input

## [2.0.21] - 2025-12-29

### Fixed
- **Rate Limiting on Hard Refresh**: Resolved 429 "too many requests" errors on initial page load
  - Added 500ms delay between task loading and compass initialization to stagger API calls

## [2.0.24] - 2025-12-29
### Fixed
- **Edit-only Visibility**: Ensure the lightbulb button is hidden in read-only mode by increasing selector specificity
- **Suggestions Modal**: Close button no longer blocked by scrollbar; ESC closes the modal
- **Modal Width**: Increased width for better readability (min 480px, max 640px)
### Changed
- **Suggestion Length**: All suggestions limited to 6 words max (both display and inserted text)
  - Reduced initial task detail fetch concurrency from 6 to 3 on startup for safer rate limiting
  - Ensures compass initialization waits for task loading to complete (was previously fire-and-forget)
  - Compass feature now initializes with better spacing of API requests to avoid triggering rate limits

---

## [2.0.20] - 2025-12-29

### Fixed
- **Suggestion Buttons in Read-Only Mode**: Buttons now visible when compass is not in edit mode
  - Added overflow: visible and z-index to sharpen-saw section
  - Ensured buttons stay visible despite read-only input styling

---

## [2.0.19] - 2025-12-29

### Fixed
- **Suggestion Buttons Visibility**: Added !important flags and bright yellow borders to ensure buttons are always visible
  - Yellow background (#ffff00) with bright border
  - Added overflow: visible to container
  - Added visibility: visible and display: block with !important

---

## [2.0.18] - 2025-12-29

### Improved
- **Suggestion Buttons**: Made much more visible - bright yellow text, semi-transparent background, larger size
  - Yellow color stands out against green compass background
  - Slight hover effect (scale up) to encourage interaction

---

## [2.0.17] - 2025-12-29

### Improved
- **Suggestion Buttons**: 💡 buttons now always visible (in both edit and read-only modes) for easy access
  - Larger font size (16px) for better visibility
  - Slightly transparent (70%) by default, full opacity on hover

---

## [2.0.16] - 2025-12-29

### Fixed
- **Header Layout**: Restored two-line header layout that was accidentally collapsed to one line
  - Top row: Title, profile menu, toggle buttons
  - Bottom row: View, Group By, Filter, Show completed, Status, Refresh

---

## [2.0.15] - 2025-12-29

### Improved
- **Weekly Compass Social/Emotional Suggestions**: Expanded from 20 to 39 ideas
  - Now includes both self-care (personal renewal) and others-care (relationships) categories
  - Self-care: hot baths, saying no/yes, treating yourself, quiet time, etc.
  - Others-care: listening, keeping promises, compliments, volunteering, sending cards, etc.

---

## [2.0.14] - 2025-12-29

### Added
- **Weekly Compass Suggestions**: Sharpen the Saw categories now have a 💡 suggestion button
  - Physical Renewal: 34 ideas (exercise, nutrition, health)
  - Mental Renewal: 20 ideas (learning, growth, skills)
  - Social/Emotional Renewal: 20 ideas (relationships, community, empathy)
  - Spiritual Renewal: 20 ideas (meditation, faith, purpose)
  - Click any suggestion to add it to the field

---

## [2.0.13] - 2025-12-29

### Improved
- **Weekly Compass Readability**: Higher-contrast text, subtle shadow, and spacing tweaks for easier reading (roles and big rocks)

---

## [2.0.12] - 2025-12-29

### Improved
- **Weekly Compass Big Rocks**: Indented checkboxes to align with Role label for cleaner hierarchy

---

## [2.0.11] - 2025-12-29

### Improved
- **Weekly Compass Big Rocks**: Checkbox styling polish (no bullets; clear that only priorities are checkable)

---

## [2.0.10] - 2025-12-29

### Improved
- **Weekly Compass Big Rocks**: Replaced dot bullets with checkboxes and strike-through when checked; completion state is captured for each rock

---

## [2.0.9] - 2025-12-27

### Fixed
- **Due Date Display Drift**: Dates no longer shift a day earlier in views
  - Store dates at 12:00 UTC to prevent timezone offsets from rolling dates backward/forward

---

## [2.0.8] - 2025-12-27

### Fixed
- **Due Date Bug**: Fixed timezone conversion issue causing due dates to display 1 day behind
  - Changed date parsing to extract date portion directly from ISO string instead of converting through Date object
  - Prevents timezone offset from affecting displayed date values

---

## [2.0.7] - 2025-12-27

### Improved
- **429 Rate Limiting**: Major improvements to handle API throttling
  - Changes display locally immediately (optimistic UI)
  - Queue system prevents overwhelming the API
  - Exponential backoff when rate limited (2s → 4s → 8s → 16s → 30s max)
  - Automatic retry with status feedback ("Syncing paused (X pending) - retry in Xs")
  - 300ms delay between successful writes to avoid rate limits
  - Console logging shows sync progress: 📤 flush, ✅ success, ⚠️ retry, ❌ error
  - Better error recovery - gives up after 5 consecutive failures per task

---

## [2.0.6] - 2025-12-27

### Improved
- **Weekly Compass**: Removed white border for cleaner appearance - background color now extends to edge

---

## [2.0.5] - 2025-12-27

### Fixed
- **Grid Edit Default OFF**: Grid edit mode now forces off on load and resets stored state to honor view-as-default
- **Dropdown Stability**: Inline dropdowns stop event bubbling so clicks no longer collapse instantly (Progress/Priority/etc.)

---

## [2.0.4] - 2025-12-27

### Fixed
- **Grid Edit Dropdown Usability**: Removed hover pencil icon and raised inline select z-index to prevent interference when changing Progress/Priority dropdowns in grid edit mode

---

## [2.0.3] - 2025-12-27

### Fixed
- **Grid Edit Progress Dropdown**: Hover pencil icon no longer intercepts clicks, so progress changes work reliably in grid edit mode

---

## [2.0.2] - 2025-12-27

### Fixed
- **Grid Edit Toggle Bug**: Grid editing now switches immediately without requiring manual refresh
  - Changed from non-existent `renderTasksView()` to `applyFilters()` for proper re-rendering
  - Toggle button now instantly updates all task cells on click

### Improved
- **Edit Caching System**: Reduces 429 API rate limiting errors during bulk grid editing
  - Caches edits locally for 1.5 seconds before batching writes to Microsoft Planner
  - Allows multiple edits to be combined into single API calls
  - Handles 429 throttling gracefully by re-queuing failed edits
  - Shows console logs for edit operations: 📤 flush, ✅ success, ⚠️ retry
  - Updates UI immediately for responsive feel while writes happen in background
  - Reduces server load and helps avoid hitting rate limits during rapid editing sessions

---

## [2.0.1] - 2025-12-27

### Fixed
- **Grid Editing Mode Toggle**: Grid editing is now an optional MODE, not the default behavior
  - **Default OFF**: Task names are clickable and open the details modal (pre-v2.0.0 behavior)
  - **Toggle ON**: Cells become editable inline for quick field updates
  - **📝 Grid Edit button**: Added to header (visible when logged in) to toggle mode on/off
  - **Preference saved**: Grid edit mode preference persists across sessions via localStorage
  - **Visual indicator**: Button highlights in blue when grid edit mode is active

### Improved
- **Header Layout**: Reorganized into two rows for better UX
  - **Top row**: Title/version, Weekly Compass toggle, Dark/Light mode, MS Profile dropdown
  - **Bottom row**: New Task, View, Group By, Filter, Show completed, Status, Refresh, Grid Edit
  - Reduces visual clutter and improves control accessibility
  - Responsive layout that wraps gracefully on smaller screens

---

## [2.0.0] - 2025-12-27

### Added
- **🎯 Inline Grid Editing (Major Feature)**: Click any cell to edit directly in the grid view
  - **Text fields**: Click task name to edit inline with text input
  - **Date fields**: Click start/due dates to edit with date picker
  - **Dropdowns**: Click to edit assigned user, progress, and priority with dropdown selects
  - **Visual feedback**: Cells highlight on hover with pencil icon; yellow border when editing
  - **Keyboard shortcuts**: 
    - Enter to save changes
    - Escape to cancel editing
  - **Auto-save**: Changes save automatically on blur (click away)
  - **Real-time updates**: Changes sync immediately to Microsoft Planner
  - Similar to SharePoint's quick edit experience

### Changed
- Task name no longer opens details modal on single click (use double-click or click themes column for details)
- Improved cell hover states for better discoverability

---

## [1.8.1] - 2025-12-27

### Improved
- **429 Throttling Status**: Enhanced user feedback when Microsoft Graph API rate limits are hit
  - Orange warning status: "Please wait (429) - retry X/5 in Ns" with countdown
  - Red error status if all retries fail: "Too many requests - try again later"
  - Green "Connected" status restored after successful retry
  - Color-coded status messages for better visual feedback

---

## [1.8.0] - 2025-12-27

### Added
- **Weekly Compass Position Toggle**: Users can now choose to dock the Weekly Compass on the left or right side
  - New dropdown in Options modal: "Weekly Compass Position"
  - Preference syncs across devices via Microsoft To Do
  - Default: Right side (preserves existing behavior)

---

## [1.7.0] - 2025-12-26

### Improved
- **Header UI Visibility**: Made all header labels bold for better readability
  - Bold labels: "View:", "Group by:", "Filter", "Show completed", "Connected"
  - Unified button styling: Both "New Task" and "Refresh" now use primary blue color
- **Bug Fix**: "Show completed by default" option now correctly syncs the checkbox with saved preference on page load

---

## [1.6.9] - 2025-12-26

### Improved
- Improved header label visibility (View, Group by, Filter, Show completed)
- Enhanced readability in both light and dark modes

---

## [1.6.8] - 2025-12-26

### Added
- **Cross-Device Sync**: User preferences now stored in Microsoft To Do for sync across devices
  - Synced preferences: Default view, Group by, Show completed
  - Fallback to localStorage if To Do unavailable

---

## [1.6.7] - 2025-12-26

### Fixed
- Weekly Compass title and cancel button visibility improved in light mode

---

## [1.6.6] - 2025-12-26

### Improved
- Weekly Compass: Uniform icon sizes (28×28px) for consistent appearance

---

## [1.6.5] - 2025-12-26

### Improved
- Weekly Compass: Replaced checkmark with save icon (SVG) and properly sized

---

## [1.6.4] - 2025-12-26

### Improved
- Weekly Compass: Grouped Save (✓) icon with color picker and cancel for tighter spacing

---

## [1.6.3] - 2025-12-26

### Improved
- Weekly Compass: Tighter spacing between Save and Cancel buttons in header

---

## [1.6.2] - 2025-12-26

### Improved

## [1.6.1] - 2025-12-26

---

## [1.6.0] - 2025-12-26

### Added
- **Drag-and-Drop Role Reordering**: Users can now reorder roles in Weekly Compass by dragging
  - Visual feedback during drag operations
  - Persists to Microsoft To Do storage

---

## [1.5.0 - 1.5.9] - 2025-12-26

### Improved
- Profile menu icon alignment and width constraints (1.5.6-1.5.9)
- Admin Mode menu item alignment (1.5.8)
- Weekly Compass date row centering and styling (1.5.3-1.5.5)
- Date made editable in edit mode (1.5.4)
- Quote moved above date; improved pencil button styling (1.5.0-1.5.2)

---

## [1.4.83 - 1.4.88] - 2025-12-26

### Added
- **Weekly Compass Panel**: Introduced read-only Weekly Compass with edit toggle
  - Sticky bottom positioning for always-visible access
  - Stores data in Microsoft To Do (PlannerCompass_Data list)
  - Configurable background color (default: forest green)
  - Dynamic motivational quotes that change on each page load
  - Editable date range
  - Big Rocks section with role-based organization
  - Sharpen the Saw fields (Physical, Mental, Social/Emotional, Spiritual)
  - Drag-and-drop role reordering

### Improved
- Dynamic text contrast for compass labels on light backgrounds (1.4.87)
- Read-only captions for Sharpen-the-Saw (1.4.85)
- Removed Big Rocks numbering (1.4.84)
- Curated one-line motivational quotes (1.4.86)
- Improved dark mode dividers (1.4.85)

---

## [1.4.65 - 1.4.69] (Admin Portal) - 2025-12-26

### Added
- **Admin Portal Help Modal**: Comprehensive setup and troubleshooting guide (1.4.65)
  - Step-by-step setup instructions
  - Known issues section (429 throttling, authorization failures, theme sync)
  - Common tasks reference
  - Tips for offline work and persistence

### Improved
- Simplified theme labels to "Theme 1 (Blue)" through "Theme 7 (Red)" (1.4.66)
- Added fallback theme name map with defaults (1.4.67)
- Improved getting started panel with clearer workflow (1.4.68)
- Updated Planner URL to planner.cloud.microsoft (1.4.69)

---

## [1.4.50 - 1.4.64] - 2025-12

### Added
- **Admin Mode**: Designated admins can manage configuration and theme names (1.4.52)
  - Admin group gating via Entra (formerly Azure AD) security group
  - Admin email list fallback
  - Admin portal (admin.html) for configuration management
- **Automatic Theme Sync**: Theme names automatically sync to Microsoft Planner categories (1.4.51)
- **Config Modal**: Selectable/copyable config.json modal in Admin Mode (1.4.64)

### Improved
- External config.json loading - removed hardcoded tenant info (1.4.63)
- Fixed theme-to-category mappings to match Planner's color assignments (1.4.50)
- Persist view and groupBy changes to localStorage (1.4.66)

---

## [1.4.40 - 1.4.49] - 2025-12

### Added
- **Theme/Strategic Theme Support**: Full support for color-coded strategic themes
  - "By Theme" view option
  - Theme colors applied to group headers
  - Theme checkboxes in task editor
  - Custom theme names configurable

### Improved
- Task editor layout: Description moved under themes with divider (1.4.48)
- "Open in Planner" link moved to modal footer (1.4.48)
- Darkened theme colors for better visibility in dark mode (1.4.41)
- Fixed theme color rendering in nested views (1.4.43-1.4.44)
- Profile dropdown hover styling in dark mode (1.4.45)

### Fixed
- CategoryNames undefined error (1.4.47)
- Theme header text color in light mode (1.4.46)

---

## [1.4.0 - 1.4.39] - 2025-11 to 2025-12

### Added
- **Dark/Light Mode Toggle**: System-wide theme switcher
  - Toggle in main header
  - Preference persists in localStorage
  - Available in both main app and admin portal
- **Group By Secondary Grouping**: Ability to group tasks by a secondary dimension
  - Options: None, Bucket, Assigned to, Progress, Due date, Priority, Theme
  - Nested view rendering
- **View Options**: Multiple view perspectives
  - By Assigned To
  - By Bucket
  - By Progress
  - By Due Date
  - By Priority
  - By Theme (Strategic Themes)
- **Filter Options**: Task visibility controls
  - Show/hide completed tasks
  - "Show completed by default" preference in Options modal

### Improved
- Task ID prefix now configurable (default: "STE")
- Default bucket set to "To Do"
- "Add task" button color matched to theme
- Removed vertical scrollbar from Add New Task modal
- Improved responsive layout and modal sizing

---

## [1.0.0 - 1.3.x] - 2025-10 to 2025-11

### Added
- **Core Planner Integration**: Full Microsoft Planner task management
  - OAuth 2.0 authentication with Microsoft
  - Read/write access to Planner tasks
  - Bucket organization
  - Task assignments
  - Priority levels (Low, Medium, Important, Urgent)
  - Progress tracking (Not started, In progress, Completed)
  - Start and due dates
  - Task descriptions
  - Bulk operations
  
### Features
- Sortable columns (ID, Name, Assigned, Start Date, Due Date, Progress, Priority)
- Resizable columns with drag handles
- Task details modal with full editing capabilities
- New task creation with bucket assignment
- Task deletion with confirmation
- Profile dropdown with user info
- Refresh functionality
- "Open in Planner" deep links

---

## Legend

- **Added**: New features
- **Changed**: Changes in existing functionality  
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Improved**: Enhancements to existing features
- **Security**: Vulnerability fixes
