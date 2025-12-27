# Changelog

All notable changes to the Planner Pro application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.4] - 2025-12-27

### Fixed
- **Grid Edit Dropdown Usability**: Removed hover pencil icon and raised inline select z-index to prevent interference when changing Progress/Priority dropdowns in grid edit mode

---

## [2.0.5] - 2025-12-27

### Fixed
- **Grid Edit Default OFF**: Grid edit mode now forces off on load and resets stored state to honor view-as-default
- **Dropdown Stability**: Inline dropdowns stop event bubbling so clicks no longer collapse instantly (Progress/Priority/etc.)

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
- Weekly Compass: Improved Save/Cancel UX in header

---

## [1.6.1] - 2025-12-26

### Changed
- Moved compass background color picker from Options modal to compass panel header

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
