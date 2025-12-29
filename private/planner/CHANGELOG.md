# Changelog

All notable changes to the Planner Pro application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.53] - 2025-12-29

### Changed
- **Docs**: README now mirrors the Admin Portal help content (setup, ongoing management, troubleshooting, advanced)

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
