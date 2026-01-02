// Application Version - Update this with each change
const APP_VERSION = '3.2.33'; // Fix priority filter - Correct urgent/important values
const CARD_VISUAL_OPTIONS = [
    { id: 'bar', label: 'Horizontal Bars' },
    { id: 'vertical', label: 'Vertical Bars' },
    { id: 'pie', label: 'Pie Chart' },
    { id: 'donut', label: 'Donut Chart' }
];
const CARD_SIZE_OPTIONS = [
    { id: 'normal', label: '1x Normal' },
    { id: 'wide', label: '2x Wide' },
    { id: 'full', label: 'Full Width' }
];
let latestAvailableVersion = null;

// Suggestions for Sharpen the Saw categories (loaded from CSV)
const SAW_SUGGESTIONS = {
    physical: [],
    mental: [],
    socialEmotional: [],
    spiritual: []
};

// Load SAW suggestions from CSV file
async function loadSawSuggestions() {
    try {
        const response = await fetch('csv/saw-suggestions.csv');
        if (!response.ok) {
            console.warn('Could not load saw-suggestions.csv, using empty suggestions');
            return;
        }
        const text = await response.text();
        const lines = text.split('\n').slice(1); // Skip header
        lines.forEach(line => {
            if (!line.trim()) return;
            const [category, suggestion] = line.split(',');
            if (category && suggestion && SAW_SUGGESTIONS[category]) {
                SAW_SUGGESTIONS[category].push(suggestion.trim());
            }
        });
        console.log('Loaded SAW suggestions:', Object.keys(SAW_SUGGESTIONS).map(k => `${k}: ${SAW_SUGGESTIONS[k].length}`).join(', '));
    } catch (err) {
        console.error('Error loading SAW suggestions:', err);
    }
}

async function loadQuotes() {
    try {
        const response = await fetch('csv/quotes.csv');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const withoutHeader = lines.slice(1); // first line is header
        MOTIVATIONAL_QUOTES = withoutHeader.map(line => {
            // Support CSV with simple quotes; split on first comma if present
            if (line.startsWith('"') && line.endsWith('"')) {
                return line.slice(1, -1);
            }
            return line;
        }).filter(q => q.length > 0);
        console.log('Loaded quotes:', MOTIVATIONAL_QUOTES.length);
    } catch (err) {
        console.error('Error loading quotes:', err);
        MOTIVATIONAL_QUOTES = [];
    }
}

// Compact set of one-line motivational quotes (loaded from CSV)
let MOTIVATIONAL_QUOTES = [];

// Configuration - will be loaded from config.json
let config = {
    companyName: 'Planner Pro',
    clientId: '',
    authority: '',
    redirectUri: window.location.origin + window.location.pathname,
    scopes: ['Tasks.ReadWrite', 'Group.ReadWrite.All', 'User.Read', 'Directory.Read.All'],
    allowedTenants: [],
    adminGroupId: '',
    adminGroupName: ''
};

let planId = '';
let accessToken = null;
let currentBucketId = null;
let currentBucketName = null;
let sortState = {}; // Store sort state per bucket: { bucketId: { column: 'name', direction: 'asc' } }
let expandedBuckets = new Set(); // Track which buckets are expanded
let expandedAssignees = new Set(); // Track which assignees are expanded
let currentView = localStorage.getItem('plannerDefaultView') || 'assigned'; // Current view: assigned, bucket, progress, dueDate, priority
let currentGroupBy = localStorage.getItem('plannerDefaultGroupBy') || 'bucket'; // Current secondary grouping field (or 'none' for no grouping)
let currentTab = localStorage.getItem('plannerCurrentTab') || 'tasks'; // tasks | dashboard | goals
let allBuckets = []; // Store buckets for reference
let allTasks = []; // Store tasks for re-grouping
let allTaskDetails = {}; // Store task details (categories, etc.) by task ID
let allUsers = {}; // Store user details: { userId: displayName }
let taskIdPrefix = ''; // Configurable task ID prefix
let adminUsers = []; // Admin users list
let currentUserEmail = null; // Store current user's email
let currentUserName = null; // Store current user's display name
let currentUserId = null; // Store current user's ID for assignments
let currentUserIsAdmin = false; // Cache admin status after auth
let planCategoryDescriptions = {}; // Store custom label names for categories
let planDetailsEtag = null; // Store etag for plan details updates
let customThemeNames = JSON.parse(localStorage.getItem('customThemeNames') || '{}');
let allGoals = []; // Store goals: [{ id, name, description, color, targetDate }]
let bucketGoalMap = {}; // Store bucket-to-goals mapping: { bucketId: [goalId1, goalId2, ...] }
// Force default OFF each load (ignores prior stored state to honor requested default view mode)
let gridEditMode = false;
localStorage.setItem('gridEditMode', 'false');

// Edit caching system to reduce 429 rate limiting
let editCache = {}; // { taskId: { field: value, field: value, ... } }
let editCacheTimer = null;
let editQueue = []; // Queue of pending writes
let isProcessingQueue = false;
let retryCount = 0;
const EDIT_CACHE_DELAY_MS = 2000; // Wait 2 seconds before writing to Planner (batch edits)
const MAX_RETRY_DELAY_MS = 30000; // Max 30 seconds between retries

const THEME_DEFAULTS = {
    category1: 'Streamline Reporting',
    category2: 'Maintain Upgrades & Bug Fixes',
    category3: 'Improve Documentation',
    category4: 'Optimize Efficiency & Automation',
    category5: 'Enhance Security & Compliance',
    category6: 'Purple',
    category7: 'Practical Modernization',
    category8: 'Lime',
    category9: 'Develop Capabilities & Cross-Training',
    category10: 'Gray',
    category11: 'Silver',
    category12: 'Brown',
    category13: 'Cranberry',
    category14: 'Orange',
    category15: 'Peach',
    category16: 'Marigold',
    category17: 'Light green',
    category18: 'Dark green',
    category19: 'Teal',
    category20: 'Light blue',
    category21: 'Dark blue',
    category22: 'Indigo',
    category23: 'Plum',
    category24: 'Light gray',
    category25: 'Dark gray'
};
let taskSequentialIds = {}; // { taskId: number } assigned by createdDateTime order
let selectedTasks = new Set(); // Track selected tasks for bulk operations
let isResizing = false; // Suppress sort clicks while resizing columns
let resizingColumn = null;
let resizeStartX = 0;
let resizeStartWidth = 0;
let currentFilter = 'all';
let showCompleted = localStorage.getItem('plannerShowCompleted') === 'true' || false;
let compassPosition = localStorage.getItem('plannerCompassPosition') || 'right'; // 'left' or 'right'
let updateCheckIntervalSeconds = parseInt(localStorage.getItem('plannerUpdateCheckInterval') || '60'); // Update check interval in seconds (minimum 60)
let cardVisualPrefs = JSON.parse(localStorage.getItem('plannerCardVisuals') || '{}'); // { chartId: 'bar' | 'dot' }
let cardSizePrefs = JSON.parse(localStorage.getItem('plannerCardSizes') || '{}'); // { chartId: 'normal' | 'wide' | 'full' }
let cardOrderPrefs = JSON.parse(localStorage.getItem('plannerCardOrder') || '[]'); // ['chartProgress', 'chartPriority', ...]
let draggedCard = null; // Store the dragged card element
let draggedColumnElement = null; // Store the dragged column header element
const COMPASS_BUCKET_ID = 'weekly-compass-bucket';
const COMPASS_BUCKET_NAME = 'Weekly Compass';
const GOALS_BUCKET_ID = 'goals-bucket';
const GOALS_BUCKET_NAME = '📊 Goals';
let compassTasks = [];
let compassTaskIds = new Set();
let goalsBucketRealId = null; // Real Planner bucket ID for goals storage
let columnWidths = {
    'col-id': 90,
    'col-task-name': 300,
    'col-assigned': 120,
    'col-start-date': 100,
    'col-due-date': 100,
    'col-progress': 120,
    'col-priority': 100,
    'col-labels': 200
};

// Graph request tuning
const GRAPH_MAX_RETRIES = 5;
const GRAPH_BASE_DELAY_MS = 500;
const GRAPH_MAX_CONCURRENT = 3; // Lower per-item concurrency to reduce 429s
const GRAPH_GLOBAL_MAX = 4; // Global concurrent Graph requests cap
const GRAPH_STARTUP_JITTER_MS = 200; // Small stagger to avoid burst on hard refresh

let graphActive = 0;
const graphQueue = [];

function acquireGraphSlot() {
    return new Promise(resolve => {
        const tryAcquire = () => {
            if (graphActive < GRAPH_GLOBAL_MAX) {
                graphActive++;
                resolve();
            } else {
                graphQueue.push(tryAcquire);
            }
        };
        tryAcquire();
    });
}
function releaseGraphSlot() {
    graphActive = Math.max(0, graphActive - 1);
    const next = graphQueue.shift();
    if (next) setTimeout(next, 0);
}

// Utility functions for consistent date handling (fixes timezone offset issues)
function formatDateForInput(isoDateString) {
    // Convert ISO date string to local date string for input[type=date]
    // Extracts date portion directly to avoid timezone conversion issues
    if (!isoDateString) return '';
    
    // Extract just the date portion (YYYY-MM-DD) from ISO string
    // This avoids timezone offset issues that occur when parsing the full timestamp
    const datePart = isoDateString.split('T')[0];
    return datePart;
}

function formatDateForDisplay(isoDateString) {
    // Convert ISO date string to locale date string for display in grid
    if (!isoDateString) return '';
    const date = new Date(isoDateString);
    return date.toLocaleDateString();
}

function inputDateToISO(dateInputValue) {
    // Convert input[type=date] value (YYYY-MM-DD string) to ISO 8601 string
    // Store as UTC noon to avoid timezone shifts that move the date backward/forward
    if (!dateInputValue) return null;
    
    const parts = dateInputValue.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const day = parseInt(parts[2], 10);
    
    // Set to 12:00 UTC so any timezone offset won't change the calendar date
    const utcDate = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
    return utcDate.toISOString();
}

function getTodayAsInputValue() {
    // Get today's date in YYYY-MM-DD format (local timezone, not UTC)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function setStatus(text, color = null) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = text;
        console.log(`Status: ${text}`);
        if (color) {
            statusElement.style.color = color;
        } else {
            statusElement.style.color = ''; // Reset to default
        }
    }
}

async function fetchGraph(url, options = {}, attempt = 0) {
    // Small random jitter on initial attempt to reduce burst traffic
    if (attempt === 0) {
        const jitter = Math.floor(Math.random() * GRAPH_STARTUP_JITTER_MS);
        if (jitter > 0) await sleep(jitter);
    }

    await acquireGraphSlot();
    let res;
    try {
        res = await fetch(url, options);
    } finally {
        releaseGraphSlot();
    }
    
    // Handle expired token (401 Unauthorized)
    if (res.status === 401) {
        console.error('Access token expired or invalid');
        setStatus('Your session has expired. Please refresh to log in again.', '#b00020');
        // Clear expired token
        localStorage.removeItem('accessToken');
        // Show alert after a brief delay so user sees the status message
        setTimeout(() => {
            alert('Your session has expired. Click OK to log in again.');
            window.location.reload();
        }, 1000);
        return res;
    }
    
    if (res.status === 429 || res.status === 503) {
        if (attempt >= GRAPH_MAX_RETRIES) {
            setStatus('Too many requests - try again later', '#b00020');
            return res;
        }
        const retryAfter = parseInt(res.headers.get('Retry-After') || '0', 10);
        const backoff = retryAfter > 0
            ? retryAfter * 1000
            : Math.min(16000, GRAPH_BASE_DELAY_MS * Math.pow(2, attempt)) + Math.floor(Math.random() * 250);
        
        // Show countdown timer for rate limit
        const startTime = Date.now();
        const endTime = startTime + backoff;
        const updateCountdown = () => {
            const remaining = Math.max(0, endTime - Date.now());
            const seconds = Math.ceil(remaining / 1000);
            if (remaining > 0) {
                setStatus(`Rate limited - Retrying in ${seconds}s (${attempt + 1}/${GRAPH_MAX_RETRIES})`, '#ff9800');
                setTimeout(updateCountdown, 100);
            }
        };
        updateCountdown();
        
        await sleep(backoff);
        return fetchGraph(url, options, attempt + 1);
    }
    return res;
}

async function mapWithConcurrency(items, mapper, concurrency = GRAPH_MAX_CONCURRENT) {
    const results = new Array(items.length);
    let index = 0;
    let active = 0;
    return await new Promise((resolve, reject) => {
        const next = () => {
            if (index >= items.length && active === 0) {
                resolve(results);
                return;
            }
            while (active < concurrency && index < items.length) {
                const i = index++;
                active++;
                Promise.resolve()
                    .then(() => mapper(items[i], i))
                    .then(r => { results[i] = r; })
                    .catch(err => { results[i] = null; console.warn('Mapper error:', err); })
                    .finally(() => { active--; next(); });
            }
        };
        next();
    });
}

function getThemeDisplayName(categoryId) {
    return customThemeNames[categoryId]
        || planCategoryDescriptions[categoryId]
        || THEME_DEFAULTS[categoryId]
        || 'Theme';
}

function getThemeDisplayNameWithPrefix(categoryId) {
    const themeOrder = ['category5', 'category4', 'category3', 'category1', 'category7', 'category9', 'category2'];
    const themeIdx = themeOrder.indexOf(categoryId);
    const themeNum = themeIdx !== -1 ? themeIdx + 1 : '';
    const themeName = getThemeDisplayName(categoryId);
    return themeNum ? `Theme ${themeNum}: ${themeName}` : themeName;
}

function startResize(event, columnClass) {
    event.preventDefault();
    event.stopPropagation();
    isResizing = true;
    document.addEventListener('click', blockClickDuringResize, true); // capture clicks while resizing
    
    resizingColumn = columnClass;
    resizeStartX = event.clientX;
    
    // Get current width
    const element = document.querySelector('.' + columnClass);
    if (element) {
        resizeStartWidth = element.offsetWidth;
    }
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
}

function handleResize(event) {
    if (!resizingColumn) return;
    
    const diff = event.clientX - resizeStartX;
    const newWidth = Math.max(50, resizeStartWidth + diff);
    
    // Store the new width
    columnWidths[resizingColumn] = newWidth;
    
    // Update all elements with this class
    const elements = document.querySelectorAll('.' + resizingColumn);
    elements.forEach(el => {
        el.style.flex = `0 0 ${newWidth}px`;
    });
}

function headerSort(event, groupId, field) {
    if (isResizing) {
        event.stopPropagation();
        event.preventDefault();
        return;
    }
    event.stopPropagation();
    sortBucket(groupId, field);
}

function blockClickDuringResize(event) {
    if (!isResizing) return;
    event.stopPropagation();
    event.preventDefault();
}

function stopResize() {
    resizingColumn = null;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    // Delay clearing isResizing so the mouseup click does not trigger sort
    setTimeout(() => {
        isResizing = false;
        document.removeEventListener('click', blockClickDuringResize, true);
    }, 50);
}

// Goals table resize functions (for table layout, not flex)
let goalsResizingColumn = null;
let goalsResizeStartX = 0;
let goalsResizeStartWidth = 0;
let goalsColumnWidths = {}; // Store custom widths

function startGoalsResize(event, columnClass) {
    event.preventDefault();
    event.stopPropagation();
    
    goalsResizingColumn = columnClass;
    goalsResizeStartX = event.clientX;
    
    // Get current width from the th element
    const th = event.target.closest('th');
    if (th) {
        goalsResizeStartWidth = th.offsetWidth;
    }
    
    document.addEventListener('mousemove', handleGoalsResize);
    document.addEventListener('mouseup', stopGoalsResize);
}

function handleGoalsResize(event) {
    if (!goalsResizingColumn) return;
    
    const diff = event.clientX - goalsResizeStartX;
    const newWidth = Math.max(50, goalsResizeStartWidth + diff);
    
    // Store the new width
    goalsColumnWidths[goalsResizingColumn] = newWidth;
    
    // Update the column width directly
    const th = document.querySelector(`.${goalsResizingColumn}`);
    if (th) {
        th.style.width = `${newWidth}px`;
    }
}

function stopGoalsResize() {
    goalsResizingColumn = null;
    document.removeEventListener('mousemove', handleGoalsResize);
    document.removeEventListener('mouseup', stopGoalsResize);
}

function applyGoalsColumnWidths() {
    // Apply stored column widths after table re-render
    Object.keys(goalsColumnWidths).forEach(columnClass => {
        const th = document.querySelector(`.${columnClass}`);
        if (th) {
            th.style.width = `${goalsColumnWidths[columnClass]}px`;
        }
    });
}

function applyColumnWidths() {
    // Apply stored column widths to all elements
    Object.keys(columnWidths).forEach(columnClass => {
        const elements = document.querySelectorAll('.' + columnClass);
        elements.forEach(el => {
            el.style.flex = `0 0 ${columnWidths[columnClass]}px`;
        });
    });
    
    // Enable drag-and-drop for column headers
    enableColumnDragDrop();
}

function enableColumnDragDrop() {
    // Get all column header divs that aren't the checkbox
    const columnHeaders = document.querySelectorAll('.column-headers > div:not(:first-child)');
    columnHeaders.forEach(header => {
        header.draggable = true;
        header.addEventListener('dragstart', handleDragStart);
        header.addEventListener('dragover', handleDragOver);
        header.addEventListener('drop', handleDrop);
        header.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    draggedColumnElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (!draggedColumnElement) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback when dragging over a valid target
    if (this !== draggedColumnElement && this.classList.contains('sortable-header')) {
        this.classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    if (!draggedColumnElement || this === draggedColumnElement) {
        cleanupDrag();
        return;
    }
    
    // Get the column classes to identify which columns to swap
    const draggedClass = Array.from(draggedColumnElement.classList).find(c => c.startsWith('col-'));
    const targetClass = Array.from(this.classList).find(c => c.startsWith('col-'));
    
    if (!draggedClass || !targetClass) {
        cleanupDrag();
        return;
    }
    
    // Swap ALL column headers across ALL task lists on the page
    document.querySelectorAll('.column-headers').forEach(headerContainer => {
        const headers = Array.from(headerContainer.children);
        const draggedHeader = headers.find(h => h.classList.contains(draggedClass));
        const targetHeader = headers.find(h => h.classList.contains(targetClass));
        
        if (draggedHeader && targetHeader) {
            const draggedIndex = headers.indexOf(draggedHeader);
            const targetIndex = headers.indexOf(targetHeader);
            
            if (draggedIndex < targetIndex) {
                targetHeader.parentElement.insertBefore(draggedHeader, targetHeader.nextSibling);
            } else {
                targetHeader.parentElement.insertBefore(draggedHeader, targetHeader);
            }
        }
    });
    
    // Swap the same columns in ALL task rows on the page
    document.querySelectorAll('.task-row').forEach(row => {
        const draggedCol = row.querySelector('.' + draggedClass);
        const targetCol = row.querySelector('.' + targetClass);
        
        if (draggedCol && targetCol) {
            const cols = Array.from(row.children);
            const draggedIndex = cols.indexOf(draggedCol);
            const targetIndex = cols.indexOf(targetCol);
            
            if (draggedIndex < targetIndex) {
                targetCol.parentElement.insertBefore(draggedCol, targetCol.nextSibling);
            } else {
                targetCol.parentElement.insertBefore(draggedCol, targetCol);
            }
        }
    });
    
    // Save the current column order to localStorage
    saveColumnOrder();
    
    cleanupDrag();
}

function handleDragEnd(e) {
    cleanupDrag();
}

function cleanupDrag() {
    document.querySelectorAll('.column-headers > div').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
    });
    draggedColumnElement = null;
}

function saveColumnOrder() {
    // Get the order of column classes from the first column header
    const firstHeader = document.querySelector('.column-headers');
    if (!firstHeader) return;
    
    const columnOrder = Array.from(firstHeader.children)
        .slice(1) // Skip checkbox
        .map(col => {
            // Find the col-* class
            const colClass = Array.from(col.classList).find(c => c.startsWith('col-'));
            return colClass || null;
        })
        .filter(c => c !== null);
    
    localStorage.setItem('savedColumnOrder', JSON.stringify(columnOrder));
}

function restoreColumnOrder() {
    const saved = localStorage.getItem('savedColumnOrder');
    if (!saved) return;
    
    const columnOrder = JSON.parse(saved);
    
    // For each task-list container, reorganize the columns
    document.querySelectorAll('.column-headers').forEach(headerContainer => {
        reorderColumns(headerContainer, columnOrder);
    });
}

function reorderColumns(headerContainer, columnOrder) {
    const taskList = headerContainer.closest('.task-list');
    if (!taskList) return;
    
    // Reorder headers
    const headers = Array.from(headerContainer.children).slice(1); // Skip checkbox
    columnOrder.forEach((colClass, index) => {
        const header = headers.find(h => h.classList.contains(colClass));
        if (header) {
            headerContainer.appendChild(header);
        }
    });
    
    // Reorder task row columns
    const taskRows = taskList.querySelectorAll('.task-row');
    taskRows.forEach(row => {
        const cols = Array.from(row.children).slice(1); // Skip checkbox
        columnOrder.forEach((colClass, index) => {
            const col = cols.find(c => c.classList.contains(colClass));
            if (col) {
                row.appendChild(col);
            }
        });
    });
}

// Select-all checkbox handler: toggles selection for all rows under the same header
function toggleSelectAll(el) {
    const checked = el.checked;
    // Find nearest task-list container
    let container = el.closest('.column-headers');
    if (!container) return;
    const taskList = container.parentElement; // .task-list
    if (!taskList) return;
    const rows = taskList.querySelectorAll('.task-row');
    rows.forEach(row => {
        const tid = row.getAttribute('data-task-id');
        if (!tid) return;
        if (row.dataset.source === 'compass' || compassTaskIds.has(tid)) {
            const checkbox = row.querySelector('.task-checkbox');
            if (checkbox) checkbox.checked = false;
            return;
        }
        const checkbox = row.querySelector('.task-checkbox');
        if (checked) {
            selectedTasks.add(tid);
            if (checkbox) checkbox.checked = true;
        } else {
            selectedTasks.delete(tid);
            if (checkbox) checkbox.checked = false;
        }
    });
    updateBulkEditSidebar();
    applyFilters();
}

function applyCompassBackground(color) {
    if (!color) return;
    document.documentElement.style.setProperty('--compass-bg', color);
    document.body.style.setProperty('--compass-bg', color);
    try {
        const hex = color.replace('#','');
        const r = parseInt(hex.substring(0,2), 16);
        const g = parseInt(hex.substring(2,4), 16);
        const b = parseInt(hex.substring(4,6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000; // perceived brightness
        const textColor = brightness > 160 ? '#000000' : '#ffffff';
        document.documentElement.style.setProperty('--compass-text', textColor);
    } catch (e) {
        document.documentElement.style.setProperty('--compass-text', '#ffffff');
    }
}

function handleCompassColorChange() {
    const color = document.getElementById('compassBgColorInput').value;
    localStorage.setItem('compassBgColor', color);
    applyCompassBackground(color);
}

// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }
    
    // Update all theme toggle icons
    document.querySelectorAll('#themeToggleIcon').forEach(icon => {
        icon.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });

    // Re-apply saved compass background color after theme switch
    const savedCompassBg = localStorage.getItem('compassBgColor') || '#2d5016';
    applyCompassBackground(savedCompassBg);
}

function toggleGridEditMode() {
    gridEditMode = !gridEditMode;
    localStorage.setItem('gridEditMode', gridEditMode ? 'true' : 'false');
    
    updateGridEditButtonState();
    
    // Refresh view to apply/remove editable-cell classes (re-render all tasks with new mode)
    applyFilters();
}

function updateGridEditButtonState() {
    const btn = document.getElementById('gridEditModeBtn');
    if (!btn) return;
    btn.style.opacity = gridEditMode ? '1' : '0.8';
    btn.style.filter = gridEditMode ? 'brightness(1)' : 'brightness(0.95)';
    btn.title = gridEditMode ? 'Grid editing enabled - click cells to edit inline' : 'Grid editing disabled - click task names to view details';
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('themeToggleIcon');
    const themeText = document.getElementById('themeToggleText');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeIcon) themeIcon.textContent = '☀️';
        if (themeText) themeText.textContent = 'Light Mode';
    } else {
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = 'Dark Mode';
    }
    
    // Apply saved compass background color
    const savedCompassBg = localStorage.getItem('compassBgColor');
    if (savedCompassBg) {
        applyCompassBackground(savedCompassBg);
    }
}

// Load configuration from config.json
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error('Failed to load config.json');
        }
        const configData = await response.json();
        
        // Apply config
        config.companyName = configData.companyName || 'Planner Pro';
        config.clientId = configData.clientId;
        config.authority = configData.authority;
        config.allowedTenants = configData.allowedTenants || [];
        config.adminGroupId = configData.adminGroupId || '';
        config.adminGroupName = configData.adminGroupName || '';
        planId = configData.planId;
        taskIdPrefix = configData.taskIdPrefix || 'PRJ';
        adminUsers = (configData.adminUsers || []).map(e => e.trim().toLowerCase()).filter(e => e);
        
        // Update page title and header with company name
        updateBrandingFromConfig();
        
        console.log('✅ Configuration loaded from config.json');
        if (!config.authority || !config.clientId) {
            console.error('❌ Missing authority or clientId in config.json');
            alert('Configuration is missing authority or clientId. Please update config.json.');
            return false;
        }
        return true;
    } catch (err) {
        console.error('❌ Failed to load config.json:', err);
        alert('Failed to load application configuration. Please ensure config.json exists.');
        return false;
    }
}

// Update page branding with company name from config
function updateBrandingFromConfig() {
    const title = `${config.companyName} - Planner Pro`;
    document.title = title;
    
    const dashboardTitle = document.getElementById('dashboardTitle');
    if (dashboardTitle) {
        // Preserve the version pill HTML, just update the title text
        const versionPill = dashboardTitle.querySelector('.version-pill');
        dashboardTitle.textContent = title + ' ';
        if (versionPill) {
            dashboardTitle.appendChild(versionPill);
        }
    }
    
    const authMessage = document.getElementById('authRequiredMessage');
    if (authMessage) {
        authMessage.textContent = `This is a secure area. Please sign in with your ${config.companyName} Microsoft account to access Planner Pro.`;
    }
}

// Check for OAuth callback
window.addEventListener('DOMContentLoaded', async () => {
    initializeVersion();
    initializeTheme();
    await loadSawSuggestions();
    await loadQuotes();
    
    // Load config first
    const configLoaded = await loadConfig();
    if (!configLoaded) return;
    
    handleRedirectCallback();
});

async function handleRedirectCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('🔍 Checking for OAuth callback...', {
        hasCode: urlParams.has('code'),
        hasError: urlParams.has('error'),
        url: window.location.href
    });
    
    if (urlParams.has('error')) {
        const error = urlParams.get('error');
        const errorDesc = urlParams.get('error_description');
        console.error('❌ OAuth error:', error, errorDesc);
        alert(`Authentication error: ${error}\n${errorDesc}`);
        return;
    }
    
    if (urlParams.has('code')) {
        const code = urlParams.get('code');
        const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
        
        console.log('✅ Authorization code received', { 
            code: code.substring(0, 20) + '...', 
            hasVerifier: !!codeVerifier 
        });
        
        if (!codeVerifier) {
            console.error('❌ Code verifier not found in sessionStorage');
            alert('Authentication error: Session lost. Please try signing in again.');
            return;
        }
        
        // Clean URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Exchange code for token
        try {
            console.log('🔄 Exchanging code for token...');
            
            const tokenResponse = await fetch(`${config.authority}/oauth2/v2.0/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: config.clientId,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: config.redirectUri,
                    code_verifier: codeVerifier,
                    scope: config.scopes.join(' ')
                })
            });
            
            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.text();
                console.error('❌ Token exchange failed:', errorData);
                throw new Error('Failed to exchange code for token');
            }
            
            const tokenData = await tokenResponse.json();
            accessToken = tokenData.access_token;
            console.log('✅ Access token received');
            const expiresIn = tokenData.expires_in;
            
            // Store token with expiration
            const expirationTime = Date.now() + (parseInt(expiresIn) * 1000);
            localStorage.setItem('plannerAccessToken', accessToken);
            localStorage.setItem('tokenExpiration', expirationTime.toString());
            
            // Clear code verifier
            sessionStorage.removeItem('pkce_code_verifier');
            
            // Verify user tenant
            console.log('🔍 Verifying user tenant...');
            const isValid = await verifyUserTenant();
            console.log('✅ Tenant verification result:', isValid);
            
            if (isValid) {
                updateAuthUI(true);
                loadTasks();
            } else {
                localStorage.removeItem('plannerAccessToken');
                localStorage.removeItem('tokenExpiration');
                accessToken = null;
                alert(`Access denied. This dashboard is only available to ${config.companyName} users.`);
                updateAuthUI(false);
            }
        } catch (error) {
            console.error('❌ Token exchange failed:', error);
            alert('Authentication failed: ' + error.message);
            sessionStorage.removeItem('pkce_code_verifier');
        }
    } else {
        // Check for stored token
        const storedToken = localStorage.getItem('plannerAccessToken');
        const expiration = localStorage.getItem('tokenExpiration');
        
        if (storedToken && expiration && Date.now() < parseInt(expiration)) {
            accessToken = storedToken;
            updateAuthUI(true);
            loadTasks();
        } else {
            // Token expired, clear it
            localStorage.removeItem('plannerAccessToken');
            localStorage.removeItem('tokenExpiration');
        }
    }
}

// PKCE helper functions
function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64UrlEncode(array);
}

function base64UrlEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(new Uint8Array(hash));
}

async function login() {
    if (!config.authority || !config.clientId) {
        console.warn('Auth config missing; attempting reload of config.json');
        const cfg = await loadConfig();
        if (!cfg || !config.authority || !config.clientId) {
            alert('Cannot sign in: missing authority or clientId in config.json');
            return;
        }
    }

    const authBase = config.authority || 'https://login.microsoftonline.com/common';
    // Use OAuth 2.0 Authorization Code Flow with PKCE (recommended for SPAs)
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store code verifier for token exchange
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    
    const authUrl = `${authBase}/oauth2/v2.0/authorize?` +
        `client_id=${config.clientId}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
        `&scope=${encodeURIComponent(config.scopes.join(' '))}` +
        `&response_mode=query` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256` +
        `&prompt=select_account` +
        `&state=12345`;
    
    window.location.href = authUrl;
}

async function verifyUserTenant() {
    try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) return false;
        
        const user = await response.json();
        const userEmail = user.userPrincipalName || user.mail;
        
        // Verify user is from allowed tenant
        const isAllowed = config.allowedTenants.some(tenant => 
            userEmail.toLowerCase().endsWith('@' + tenant.toLowerCase())
        );
        
        if (!isAllowed) {
            console.warn('Unauthorized tenant access attempt:', userEmail);
        }
        
        return isAllowed;
    } catch (error) {
        console.error('Tenant verification failed:', error);
        return false;
    }
}

function initializeVersion() {
    const versionDisplay = document.getElementById('versionDisplay');
    if (versionDisplay) {
        versionDisplay.textContent = APP_VERSION;
        console.log('✓ Version initialized:', APP_VERSION);
        // Check for updates after a short delay to avoid startup lag
        setTimeout(checkForVersionUpdate, 2000);
        // Then check periodically at configured interval (minimum 60 seconds)
        const intervalMs = Math.max(updateCheckIntervalSeconds * 1000, 60000);
        setInterval(checkForVersionUpdate, intervalMs);
    } else {
        console.warn('⚠️ Version display element not found');
    }
}

async function updateAuthUI(isAuthenticated) {
    const status = document.getElementById('status');
    const connectBtn = document.getElementById('connectBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const compassToggleBtn = document.getElementById('compassToggleBtn');
    const authRequired = document.getElementById('authRequired');
    const tasksContainer = document.getElementById('tasksContainer');
    const mainWrapper = document.getElementById('mainContentWrapper');
    const profileContainer = document.getElementById('profileContainer');
    const adminModeItem = document.getElementById('adminModeItem');
    const tabTasks = document.getElementById('tabTasks');
    const tabDashboard = document.getElementById('tabDashboard');
    const headerDivider = document.querySelector('.header-divider');
    
    if (isAuthenticated) {
        status.textContent = 'Connected';
        status.style.color = '#107c10';
        connectBtn.style.display = 'none';
        refreshBtn.style.display = 'inline-block';
        compassToggleBtn.style.display = 'inline-block';
        profileContainer.style.display = 'inline-block';
        if (tabTasks) tabTasks.style.display = 'inline-block';
        if (tabDashboard) tabDashboard.style.display = 'inline-block';
        const tabGoals = document.getElementById('tabGoals');
        if (tabGoals) tabGoals.style.display = 'inline-block';
        if (headerDivider) headerDivider.style.display = 'block';
        const gridEditBtn = document.getElementById('gridEditModeBtn');
        if (gridEditBtn) {
            gridEditBtn.style.display = 'inline-block';
            updateGridEditButtonState();
        }
        authRequired.style.display = 'none';
        mainWrapper.style.display = 'flex';
        document.body.classList.remove('unauthenticated');
        
        // Fetch and display user info
        try {
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) {
                const user = await response.json();
                const name = user.displayName || 'User';
                const email = user.userPrincipalName || user.mail || '';
                currentUserEmail = email.toLowerCase(); // Store for admin checks
                currentUserName = name; // Store display name for compass tasks
                currentUserId = user.id; // Store user ID for compass task assignments
                document.getElementById('profileName').textContent = name;
                document.getElementById('profileEmail').textContent = email;
                
                // Set initials (first and last name only)
                const nameParts = name.split(' ').filter(n => n.length > 0);
                let initials = '';
                if (nameParts.length === 1) {
                    initials = nameParts[0].substring(0, 2).toUpperCase();
                } else {
                    initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                }
                document.getElementById('profileIcon').textContent = initials;

                // Evaluate admin status (group + email fallback)
                await evaluateAdminStatus();
                if (adminModeItem) {
                    adminModeItem.style.display = currentUserIsAdmin ? 'block' : 'none';
                }
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    } else {
        status.textContent = 'Not connected';
        status.style.color = '#666';
        connectBtn.style.display = 'inline-block';
        refreshBtn.style.display = 'none';
        compassToggleBtn.style.display = 'none';
        profileContainer.style.display = 'none';
        const gridEditBtn = document.getElementById('gridEditModeBtn');
        if (gridEditBtn) gridEditBtn.style.display = 'none';
        authRequired.style.display = 'block';
        mainWrapper.style.display = 'none';
        document.body.classList.add('unauthenticated');
        if (adminModeItem) adminModeItem.style.display = 'none';
    }
    
    // Check for new version
    checkForVersionUpdate();
}

// Check if a new version is available
async function checkForVersionUpdate() {
    try {
        // Fetch planner.js directly (APP_VERSION lives there, not in index.html)
        const response = await fetch('./js/planner.js?t=' + Date.now(), { cache: 'no-store' });
        console.log('[version-check] fetch status', response.status);
        if (!response.ok) {
            console.log('[version-check] fetch failed');
            return;
        }

        const jsText = await response.text();
        console.log('[version-check] script length', jsText.length);
        const match = jsText.match(/const APP_VERSION = '([^']+)'/);
        console.log('[version-check] match', match ? match[1] : 'none');
        if (!match) return;

        const latestVersion = match[1];
        latestAvailableVersion = latestVersion;
        const updateBadge = document.getElementById('updateBadge');
        if (!updateBadge) return;

        if (latestVersion === APP_VERSION) {
            updateBadge.style.display = 'none';
            console.log('[version-check] already on latest');
            return;
        }

        const currentParts = APP_VERSION.split('.').map(Number);
        const latestParts = latestVersion.split('.').map(Number);
        let isNewer = false;
        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const curr = currentParts[i] || 0;
            const latest = latestParts[i] || 0;
            if (latest > curr) { isNewer = true; break; }
            if (latest < curr) { break; }
        }

        console.log('[version-check] isNewer', isNewer, 'server', latestVersion, 'local', APP_VERSION);
        if (isNewer) {
            updateBadge.style.display = 'inline-block';
            console.log(`✓ New version available: ${latestVersion} (current: ${APP_VERSION})`);
        }
    } catch (err) {
        console.log('[version-check] error', err);
    }
}

// Hard refresh the page (clears cache)
async function doHardRefresh() {
    const bust = Date.now();
    const targetVersion = latestAvailableVersion || APP_VERSION;
    const target = `${window.location.origin}${window.location.pathname}?v=${targetVersion}&bust=${bust}`;

    // Best-effort cache clear
    try {
        if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map(n => caches.delete(n)));
        }
    } catch (e) {
        console.log('cache clear failed', e);
    }

    // Pre-fetch core assets with cache-bust
    const preload = async (url) => {
        try {
            await fetch(`${url}?bust=${targetVersion}-${bust}`, { cache: 'no-store' });
        } catch (e) { /* ignore */ }
    };
    await Promise.all([
        preload('./js/planner.js'),
        preload('./css/planner.css'),
        preload('./index.html')
    ]);

    // Force navigation with cache-bust to guarantee fresh assets
    window.location.replace(target);
}

// Evaluate whether the current user has admin privileges
async function evaluateAdminStatus() {
    try {
        const groupIdConfigured = !!(config.adminGroupId && config.adminGroupId.trim());
        const groupNameConfigured = !!(config.adminGroupName && config.adminGroupName.trim());
        const emailConfigured = Array.isArray(adminUsers) && adminUsers.length > 0;

        // Email allow-list takes precedence
        if (emailConfigured && currentUserEmail) {
            const isListed = adminUsers.includes(currentUserEmail.toLowerCase());
            if (isListed) {
                currentUserIsAdmin = true;
                return currentUserIsAdmin;
            }
        }

        if (groupIdConfigured || groupNameConfigured) {
            // Check if user is a member of the configured admin group (by Id or Name)
            const select = groupNameConfigured ? '$select=id,displayName' : '$select=id';
            const resp = await fetchGraph(`https://graph.microsoft.com/v1.0/me/memberOf?${select}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                let inGroup = false;
                if (groupIdConfigured) {
                    inGroup = (data.value || []).some(g => g.id && g.id.toLowerCase() === config.adminGroupId.toLowerCase());
                } else if (groupNameConfigured) {
                    inGroup = (data.value || []).some(g => (g.displayName || '').toLowerCase() === config.adminGroupName.toLowerCase());
                }
                currentUserIsAdmin = !!inGroup;
                return currentUserIsAdmin;
            }
            // If Graph call fails and a group is configured, default to non-admin
            currentUserIsAdmin = false;
            return currentUserIsAdmin;
        }

        // If no admin controls configured, allow access to avoid lockout
        currentUserIsAdmin = true;
        return currentUserIsAdmin;
    } catch (err) {
        console.warn('Admin status evaluation failed:', err);
        currentUserIsAdmin = false;
        return currentUserIsAdmin;
    }
}

function openAdminPortal() {
    window.open('admin.html', '_blank', 'noopener');
}

async function loadTasks() {
    if (!accessToken) {
        alert('Please sign in first');
        return;
    }

    try {
        setStatus('Loading plan details...');

        // Get buckets
            const bucketsResponse = await fetchGraph(
                `https://graph.microsoft.com/v1.0/planner/plans/${planId}/buckets`,
                {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!bucketsResponse.ok) {
            if (bucketsResponse.status === 401) {
                // Token expired
                localStorage.removeItem('plannerAccessToken');
                localStorage.removeItem('tokenExpiration');
                accessToken = null;
                updateAuthUI(false);
                alert('Session expired. Please sign in again.');
                return;
            }
            throw new Error('Failed to load buckets');
        }

        const bucketsData = await bucketsResponse.json();
        const buckets = bucketsData.value;

        setStatus('Loading bucket details...');

        // Get plan details for category descriptions
        const planDetailsResponse = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/plans/${planId}/details`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        if (planDetailsResponse.ok) {
            const planDetails = await planDetailsResponse.json();
            planCategoryDescriptions = planDetails.categoryDescriptions || {};
            planDetailsEtag = planDetails['@odata.etag'];
        }

        // Get tasks (fetch all, but process incomplete first for faster initial render)
        setStatus('Loading tasks...');
        const tasksResponse = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/plans/${planId}/tasks`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!tasksResponse.ok) {
            throw new Error('Failed to load tasks');
        }

        const tasksData = await tasksResponse.json();
        const allFetchedTasks = tasksData.value;
        
        // Split into incomplete and completed
        const incompleteTasks = allFetchedTasks.filter(t => t.percentComplete !== 100);
        const completedTasks = allFetchedTasks.filter(t => t.percentComplete === 100);
        
        console.log(`📊 Loaded ${incompleteTasks.length} active, ${completedTasks.length} completed tasks`);
        
        // Process incomplete tasks first
        setStatus(`Loading ${incompleteTasks.length} active task details...`);
        const tasks = incompleteTasks;

        // Assign sequential IDs based on createdDateTime (oldest -> 1)
        taskSequentialIds = {};
        const ordered = [...tasks].sort((a, b) => {
            const at = a.createdDateTime ? new Date(a.createdDateTime).getTime() : 0;
            const bt = b.createdDateTime ? new Date(b.createdDateTime).getTime() : 0;
            if (at !== bt) return at - bt;
            return a.id.localeCompare(b.id);
        });
        ordered.forEach((t, idx) => { taskSequentialIds[t.id] = idx + 1; });

        // Fetch task details for categories (use lower concurrency on startup to avoid rate limiting)
        setStatus(`Loading ${tasks.length} task details...`);
        const details = await mapWithConcurrency(
            tasks,
            async (task) => {
                const r = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${task.id}/details`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (!r.ok) return null;
                return r.json();
            },
            3  // Lower concurrency on initial load to avoid 429 errors
        );
        
        // Collect all unique user IDs from assignments and extract any available names
        const userIds = new Set();
        const userDetailsMap = {}; // Initialize early so assignment metadata extraction can use it
        tasks.forEach(task => {
            if (task.assignments) {
                Object.keys(task.assignments).forEach(userId => {
                    userIds.add(userId);
                    // Try to extract displayName from assignment metadata
                    const assignment = task.assignments[userId];
                    if (assignment?.displayName && !userDetailsMap[userId]) {
                        userDetailsMap[userId] = assignment.displayName;
                    } else if (assignment?.assignedBy?.user?.displayName) {
                        userDetailsMap[userId] = assignment.assignedBy.user.displayName;
                    }
                });
            }
        });
        
        setStatus('Loading assignee information...');
        
        // Also fetch all plan members for the assignee dropdown
        let planMembers = [];
        try {
            // Use the roster API to get plan members
            const rosterResponse = await fetchGraph(
                `https://graph.microsoft.com/v1.0/planner/plans/${planId}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (rosterResponse.ok) {
                const planData = await rosterResponse.json();
                
                // Try to get members from the plan's container
                if (planData.container && planData.container.containerId) {
                    const containerId = planData.container.containerId;
                    const containerType = planData.container.type || 'group';
                    
                    // For group containers, fetch group members
                    if (containerType === 'group') {
                        const membersResponse = await fetchGraph(
                            `https://graph.microsoft.com/v1.0/groups/${containerId}/members`,
                            { headers: { 'Authorization': `Bearer ${accessToken}` } }
                        );
                        if (membersResponse.ok) {
                            const membersData = await membersResponse.json();
                            planMembers = membersData.value || [];
                            planMembers.forEach(member => userIds.add(member.id));
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Could not fetch plan members, using assigned users only:', e);
        }
        
        // Build user details for display names (prefer planMembers to avoid per-user GETs)
        planMembers.forEach(m => {
            if (m && m.id && m.displayName) userDetailsMap[m.id] = m.displayName;
        });
        const missingUserIds = Array.from(userIds).filter(uid => !userDetailsMap[uid]);
        // Fetch remaining users via directoryObjects/getByIds in chunks, with fallback
        async function fetchUsersByIds(ids) {
            const r = await fetchGraph('https://graph.microsoft.com/v1.0/directoryObjects/getByIds', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids, types: ['user'] })
            });
            if (!r.ok) {
                console.warn(`⚠️ Batch user fetch failed (${r.status}), will try individual fetches`);
                return null; // Signal to fall back to individual fetches
            }
            const data = await r.json();
            console.log('✅ Batch-fetched users: ' + (data.value?.length || 0) + ' users');
            return data.value || [];
        }
        
        // Fallback: fetch individual user (limited to current user + group members)
        async function fetchUserById(userId) {
            try {
                const r = await fetchGraph(`https://graph.microsoft.com/v1.0/users/${userId}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (r.ok) {
                    return await r.json();
                } else if (r.status === 403) {
                    console.warn(`⚠️ No permission to read user ${userId.substring(0, 8)}...`);
                }
            } catch (e) {
                console.warn(`Could not fetch user ${userId.substring(0, 8)}...`);
            }
            return null;
        }
        
        // Try to fetch group members if we have the plan's group ID
        async function fetchGroupMembers() {
            try {
                const planData = await fetchGraph(
                    `https://graph.microsoft.com/v1.0/planner/plans/${planId}`,
                    { headers: { 'Authorization': `Bearer ${accessToken}` } }
                ).then(r => r.ok ? r.json() : null);
                
                if (planData?.container?.containerId) {
                    const groupId = planData.container.containerId;
                    console.log('📋 Fetching group members...');
                    const response = await fetchGraph(
                        `https://graph.microsoft.com/v1.0/groups/${groupId}/members`,
                        { headers: { 'Authorization': `Bearer ${accessToken}` } }
                    );
                    
                    if (response.ok) {
                        const membersData = await response.json();
                        if (membersData?.value && membersData.value.length > 0) {
                            membersData.value.forEach(m => {
                                if (m.id && m.displayName) {
                                    userDetailsMap[m.id] = m.displayName;
                                }
                            });
                            console.log('✅ Group members loaded: ' + membersData.value.length + ' members');
                            return true;
                        } else {
                            console.log('⚠️ No group members found');
                        }
                    } else {
                        console.error('❌ Group members fetch failed: ' + response.status);
                    }
                } else {
                    console.log('⚠️ No container found in plan data');
                }
            } catch (e) {
                console.warn('Could not fetch group members:', e.message);
            }
            return false;
        }
        
        const chunkSize = 100;
        let batchFailed = false;
        
        // First, try group members fetch (most reliable)
        const hasGroupMembers = await fetchGroupMembers();
        
        // Update missing list after group fetch
        const stillMissingUserIds = missingUserIds.filter(uid => !userDetailsMap[uid]);
        
        if (stillMissingUserIds.length > 0) {
            for (let i = 0; i < stillMissingUserIds.length; i += chunkSize) {
                const chunk = stillMissingUserIds.slice(i, i + chunkSize);
                if (!batchFailed) {
                    const users = await fetchUsersByIds(chunk);
                    if (users === null) {
                        // Batch fetch failed, fall back to individual
                        batchFailed = true;
                        console.log('🔄 Switching to individual user fetches...');
                    } else {
                        users.forEach(u => {
                            if (u && u.id && u.displayName) {
                                userDetailsMap[u.id] = u.displayName;
                            }
                        });
                        continue;
                    }
                }
                
                // Individual fetch fallback (limited by permission)
                if (batchFailed) {
                    for (const userId of chunk) {
                        const user = await fetchUserById(userId);
                        if (user && user.displayName) {
                            userDetailsMap[user.id] = user.displayName;
                        }
                    }
                }
            }
        }
        
        console.log('👥 Users loaded: ' + Object.keys(userDetailsMap).length + ' total');
        // Store users globally for assignment dropdown
        allUsers = { ...userDetailsMap };
        
        // Store task details with user display names
        allTaskDetails = {};
        tasks.forEach((task, i) => {
            const taskWithNames = { ...task };
            if (task.assignments) {
                taskWithNames.assignments = {};
                Object.keys(task.assignments).forEach(userId => {
                    taskWithNames.assignments[userId] = {
                        ...task.assignments[userId],
                        displayName: userDetailsMap[userId]
                    };
                });
            }
            allTaskDetails[task.id] = {
                ...taskWithNames,
                details: details[i]
            };
        });

        // Store for re-grouping
        allBuckets = buckets;
        allTasks = tasks;
        injectCompassBucket();

        // Set view dropdown to match current view
        document.getElementById('viewSelect').value = currentView;
        
        // Sync show completed checkbox with saved setting
        document.getElementById('showCompletedCheckbox').checked = showCompleted;
        
        // Initialize Group By dropdown to exclude current view
        changeView();

        // Apply filters and render
        setStatus('Rendering tasks...');
        applyFilters();
        // Restore last tab selection
        switchTab(currentTab || 'tasks');
        setStatus('Connected', '#107c10');
        
        // Initialize compass on first load (with delay to avoid rate limiting)
        if (!compassListId) {
            // Add 500ms delay before initializing compass to spread out API calls
            setTimeout(async () => {
                try {
                    await initializeCompass();
                } catch (err) {
                    console.error('Failed to initialize compass after delay:', err);
                }
            }, 500);
        }
        
        // Process completed tasks in background after initial render
        if (completedTasks.length > 0) {
            setTimeout(async () => {
                try {
                    console.log(`📦 Processing ${completedTasks.length} completed tasks in background...`);
                    
                    // Fetch details for completed tasks
                    const completedDetails = await mapWithConcurrency(
                        completedTasks,
                        async (task) => {
                            const r = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${task.id}/details`, {
                                headers: { 'Authorization': `Bearer ${accessToken}` }
                            });
                            if (!r.ok) return null;
                            return r.json();
                        },
                        5
                    );
                    
                    // Merge completed tasks into allTasks
                    allTasks = [...allTasks, ...completedTasks];
                    
                    // Update sequential IDs for all tasks
                    taskSequentialIds = {};
                    const ordered = [...allTasks].sort((a, b) => {
                        const at = a.createdDateTime ? new Date(a.createdDateTime).getTime() : 0;
                        const bt = b.createdDateTime ? new Date(b.createdDateTime).getTime() : 0;
                        if (at !== bt) return at - bt;
                        return a.id.localeCompare(b.id);
                    });
                    ordered.forEach((t, idx) => { taskSequentialIds[t.id] = idx + 1; });
                    
                    // Extract any new user IDs from completed tasks
                    const newUserIds = new Set();
                    completedTasks.forEach(task => {
                        if (task.assignments) {
                            Object.keys(task.assignments).forEach(userId => {
                                if (!allUsers[userId]) {
                                    newUserIds.add(userId);
                                }
                            });
                        }
                    });
                    
                    // Fetch new user details if needed
                    if (newUserIds.size > 0) {
                        const newUserDetailsMap = {};
                        const userIdArray = Array.from(newUserIds);
                        const chunkSize = 100;
                        
                        for (let i = 0; i < userIdArray.length; i += chunkSize) {
                            const chunk = userIdArray.slice(i, i + chunkSize);
                            try {
                                const r = await fetchGraph('https://graph.microsoft.com/v1.0/directoryObjects/getByIds', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ ids: chunk, types: ['user'] })
                                });
                                if (r.ok) {
                                    const data = await r.json();
                                    (data.value || []).forEach(u => {
                                        if (u && u.id && u.displayName) {
                                            newUserDetailsMap[u.id] = u.displayName;
                                        }
                                    });
                                }
                            } catch (e) {
                                console.warn('Could not fetch new users for completed tasks:', e);
                            }
                        }
                        
                        allUsers = { ...allUsers, ...newUserDetailsMap };
                    }
                    
                    // Store completed task details
                    completedTasks.forEach((task, i) => {
                        const taskWithNames = { ...task };
                        if (task.assignments) {
                            taskWithNames.assignments = {};
                            Object.keys(task.assignments).forEach(userId => {
                                taskWithNames.assignments[userId] = {
                                    ...task.assignments[userId],
                                    displayName: allUsers[userId]
                                };
                            });
                        }
                        allTaskDetails[task.id] = {
                            ...taskWithNames,
                            details: completedDetails[i]
                        };
                    });
                    
                    console.log('✅ Completed tasks ready');
                    
                    // Re-render if "Show completed" is enabled
                    if (showCompleted) {
                        console.log('🔄 Re-rendering with completed tasks...');
                        applyFilters();
                    }
                    
                } catch (error) {
                    console.error('Error processing completed tasks:', error);
                }
            }, 100); // Process completed tasks almost immediately after incomplete ones render
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        setStatus('Error loading tasks', '#b00020');
        alert('Error: ' + error.message);
    }
}

function renderTasks(buckets, tasks) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';

        // If we have a secondary grouping, render nested hierarchy
        applyColumnWidths();
    if (currentGroupBy && currentGroupBy !== 'none') {
        renderNestedView(container, buckets, tasks, currentView, currentGroupBy);
    } else {
        // Single level grouping
        renderSingleView(container, buckets, tasks, currentView);
    }
    
    // Restore previously saved column order
    restoreColumnOrder();
}

function renderByBucket(container, buckets, tasks) {
    if (currentGroupBy === 'bucket') {
        // Sort buckets alphabetically by name
        groups = buckets.slice().sort((a, b) => a.name.localeCompare(b.name)).map(bucket => ({
            id: bucket.id,
            name: bucket.name,
            tasks: tasks.filter(t => t.bucketId === bucket.id)
        }));
    } else {
        groups = groupTasksBy(tasks, buckets, currentGroupBy);
    }

    // Sort groups - special handling for themes to maintain order
    groups = groups.sort((a, b) => {
        if (currentGroupBy === 'theme') {
            const themeOrder = ['category5', 'category4', 'category3', 'category1', 'category7', 'category9', 'category2'];
            const aIdx = themeOrder.indexOf(a.id);
            const bIdx = themeOrder.indexOf(b.id);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        }
        if (a.name === 'Unassigned') return 1;
        if (b.name === 'Unassigned') return -1;
        return a.name.localeCompare(b.name);
    });

    groups.forEach(group => {
        let groupTasks = group.tasks;
        
        // Apply sorting if set
        const sort = sortState[group.id];
        if (sort) {
            groupTasks = sortTasks(groupTasks, sort.column, sort.direction);
        } else if (group.id === COMPASS_BUCKET_ID) {
            // Default sort for Weekly Compass: alphabetical by title (includes role prefix)
            groupTasks = sortTasks(groupTasks, 'title', 'asc');
        }
        
        const bucketDiv = document.createElement('div');
        bucketDiv.className = 'bucket-container';
        bucketDiv.setAttribute('data-bucket-id', group.id);
        
        const sortArrows = (col) => {
            if (!sort || sort.column !== col) return '<span class="sort-arrow">▼</span>';
            return `<span class="sort-arrow active">${sort.direction === 'asc' ? '▲' : '▼'}</span>`;
        };

        // Check if all tasks in this group are selected
        const allSelected = groupTasks.every(t => selectedTasks.has(t.id));

        // Ensure column widths get applied even for nested renders
        applyColumnWidths();
        
        bucketDiv.innerHTML = `
            <div class="bucket-header" onclick="toggleBucket(this)">
                <div class="bucket-title">
                    <span class="expand-icon">▶</span>
                    ${group.name}
                    <span class="task-count">${groupTasks.length}</span>
                </div>
            </div>
            <div class="task-list">
                <div class="column-headers">
                    <div><input type="checkbox" class="select-all-checkbox" ${allSelected && groupTasks.length > 0 ? 'checked' : ''} onclick="event.stopPropagation();" onchange="toggleSelectAll(this)"></div>
                    <div class="sortable-header col-id" onclick="headerSort(event, '${group.id}', 'id')">
                        ID ${sortArrows('id')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-id')" onclick="event.stopPropagation(); event.preventDefault();"></div>
                    </div>
                    <div class="sortable-header col-task-name" onclick="headerSort(event, '${group.id}', 'title')">
                        Task name ${sortArrows('title')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-task-name')" onclick="event.stopPropagation(); event.preventDefault();"></div>
                    </div>
                    <div class="sortable-header col-assigned" onclick="headerSort(event, '${group.id}', 'assigned')">
                        Assigned to ${sortArrows('assigned')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-assigned')" onclick="event.stopPropagation(); event.preventDefault();"></div>
                    </div>
                    <div class="sortable-header col-start-date" onclick="headerSort(event, '${group.id}', 'startDate')">
                        Start date ${sortArrows('startDate')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-start-date')" onclick="event.stopPropagation(); event.preventDefault();"></div>
                    </div>
                    <div class="sortable-header col-due-date" onclick="headerSort(event, '${group.id}', 'dueDate')">
                        Due date ${sortArrows('dueDate')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-due-date')" onclick="event.stopPropagation(); event.preventDefault();"></div>
                    </div>
                    <div class="sortable-header col-progress" onclick="headerSort(event, '${group.id}', 'progress')">
                        Progress ${sortArrows('progress')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-progress')" onclick="event.stopPropagation(); event.preventDefault();"></div>
                    </div>
                    <div class="sortable-header col-priority" onclick="headerSort(event, '${group.id}', 'priority')">
                        Priority ${sortArrows('priority')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-priority')" onclick="event.stopPropagation(); event.preventDefault();"></div>
                    </div>
                    <div class="col-labels">Themes</div>
                </div>
                ${groupTasks.map(task => renderTask(task)).join('')}
            </div>
        `;
        
        container.appendChild(bucketDiv);
        
        // Restore expanded state
        if (expandedBuckets.has(group.id)) {
            const header = bucketDiv.querySelector('.bucket-header');
            const taskList = bucketDiv.querySelector('.task-list');
            header.classList.add('expanded');
            taskList.classList.add('expanded');
        }
    });
    
    // Apply custom column widths
    applyColumnWidths();
}

function renderByAssignedBucket(container, buckets, tasks) {
    // Group tasks by assignee(s), then by bucket. Tasks with multiple assignees appear under each name.
    const groupedByAssignee = {};
    
    tasks.forEach(task => {
        const assigneeNames = getAssigneeNames(task);
        assigneeNames.forEach(assigneeName => {
            if (!groupedByAssignee[assigneeName]) {
                groupedByAssignee[assigneeName] = {};
            }
            const bucketName = buckets.find(b => b.id === task.bucketId)?.name || 'No Bucket';
            if (!groupedByAssignee[assigneeName][bucketName]) {
                groupedByAssignee[assigneeName][bucketName] = [];
            }
            groupedByAssignee[assigneeName][bucketName].push(task);
        });
    });
    
    // Render by assignee (alphabetically, with Unassigned last)
    Object.entries(groupedByAssignee).sort((a, b) => {
        if (a[0] === 'Unassigned') return 1;
        if (b[0] === 'Unassigned') return -1;
        return a[0].localeCompare(b[0]);
    }).forEach(([assigneeName, bucketMap]) => {
        const assigneeDiv = document.createElement('div');
        assigneeDiv.className = 'assignee-container';
        
        const assigneeId = assigneeName.toLowerCase().replace(/\s+/g, '-');
        const isExpanded = expandedAssignees.has(assigneeId);
        
        const assigneeHeader = document.createElement('div');
        assigneeHeader.className = 'assignee-header' + (isExpanded ? ' expanded' : '');
        assigneeHeader.style.cursor = 'pointer';
        assigneeHeader.innerHTML = `
            <span class="collapse-icon">${isExpanded ? '▼' : '▶'}</span>
            <strong>${assigneeName}</strong> (${Object.values(bucketMap).flat().length} tasks)
        `;
        assigneeHeader.onclick = (e) => {
            e.stopPropagation();
            toggleAssignee(assigneeId);
        };
        
        const assigneeContent = document.createElement('div');
        assigneeContent.className = 'assignee-content' + (isExpanded ? ' expanded' : '');
        
        assigneeDiv.appendChild(assigneeHeader);
        assigneeDiv.appendChild(assigneeContent);
        
        // Render buckets under this assignee
        Object.entries(bucketMap).sort().forEach(([bucketName, bucketTasks]) => {
            const bucketId = bucketName.toLowerCase().replace(/\s+/g, '-') + '-' + assigneeId;
            const bucketExpanded = expandedBuckets.has(bucketId);
            const sort = sortState[bucketId];
            if (sort) {
                bucketTasks = sortTasks(bucketTasks, sort.column, sort.direction);
            }
            
            const bucketDiv = document.createElement('div');
            bucketDiv.className = 'bucket-in-assignee';
            
            const bucketHeader = document.createElement('div');
            bucketHeader.className = 'bucket-header nested' + (bucketExpanded ? ' expanded' : '');
            bucketHeader.style.cursor = 'pointer';
            bucketHeader.innerHTML = `
                <span class="collapse-icon">${bucketExpanded ? '▼' : '▶'}</span>
                <span>${bucketName}</span> (${bucketTasks.length} tasks)
            `;
            bucketHeader.onclick = (e) => {
                e.stopPropagation();
                toggleNestedBucket(bucketId);
            };
            
            const taskList = document.createElement('div');
            taskList.className = 'task-list nested' + (bucketExpanded ? ' expanded' : '');
            
            // Add column headers with sorting + resizing
            const columnHeaders = document.createElement('div');
            columnHeaders.className = 'column-headers';
            const sortArrows = (col) => {
                if (!sort || sort.column !== col) return '<span class="sort-arrow">▼</span>';
                return `<span class="sort-arrow active">${sort.direction === 'asc' ? '▲' : '▼'}</span>`;
            };
            columnHeaders.innerHTML = `
                <div><input type="checkbox" class="select-all-checkbox" onclick="event.stopPropagation();" onchange="toggleSelectAll(this)"></div>
                <div class="sortable-header col-id" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'id')">ID ${sortArrows('id')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-id')"></div>
                </div>
                <div class="sortable-header col-task-name" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'title')">Task name ${sortArrows('title')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-task-name')"></div>
                </div>
                <div class="sortable-header col-assigned" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'assigned')">Assigned to ${sortArrows('assigned')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-assigned')"></div>
                </div>
                <div class="sortable-header col-start-date" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'startDate')">Start date ${sortArrows('startDate')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-start-date')"></div>
                </div>
                <div class="sortable-header col-due-date" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'dueDate')">Due date ${sortArrows('dueDate')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-due-date')"></div>
                </div>
                <div class="sortable-header col-progress" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'progress')">Progress ${sortArrows('progress')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-progress')"></div>
                </div>
                <div class="sortable-header col-priority" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'priority')">Priority ${sortArrows('priority')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-priority')"></div>
                </div>
                <div class="col-labels">Themes</div>
            `;
            taskList.appendChild(columnHeaders);
            
            // Add tasks
            bucketTasks.forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.innerHTML = renderTask(task);
                taskList.appendChild(taskDiv.firstElementChild);
            });
            
            bucketDiv.appendChild(bucketHeader);
            bucketDiv.appendChild(taskList);
            assigneeContent.appendChild(bucketDiv);
        });
        
        container.appendChild(assigneeDiv);
    });
    
    applyColumnWidths();
}

function renderSingleView(container, buckets, tasks, viewBy) {
    let groups = groupTasksBy(tasks, buckets, viewBy);
    
    // Sort groups - special handling for themes to maintain order
    groups = groups.sort((a, b) => {
        if (a.name === 'Unassigned') return 1;
        if (b.name === 'Unassigned') return -1;
        
        // If grouping by theme, sort by theme order
        if (viewBy === 'theme') {
            const themeOrder = ['category5', 'category4', 'category3', 'category1', 'category7', 'category9', 'category2'];
            const aIdx = themeOrder.indexOf(a.id);
            const bIdx = themeOrder.indexOf(b.id);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        }
        
        return a.name.localeCompare(b.name);
    });
    
    groups.forEach(group => {
        renderGroup(container, group, buckets, false);
    });
    
    applyColumnWidths();
}

function renderNestedView(container, buckets, tasks, primaryGroup, secondaryGroup) {
    // Check if we need to expand a specific goal
    const expandGoalId = sessionStorage.getItem('expandGoalId');
    if (expandGoalId && primaryGroup === 'goal') {
        // Auto-expand this goal and its buckets
        const goal = getGoalById(expandGoalId);
        if (goal) {
            const primaryId = goal.name.toLowerCase().replace(/\s+/g, '-');
            expandedAssignees.add(primaryId);
            
            // Also expand all buckets for this goal
            const goalBuckets = getGoalBuckets(expandGoalId);
            goalBuckets.forEach(bucketId => {
                const bucket = allBuckets.find(b => b.id === bucketId);
                if (bucket) {
                    const bucketName = bucket.name.toLowerCase().replace(/\s+/g, '-');
                    const bucketExpandId = bucketName + '-' + primaryId;
                    expandedBuckets.add(bucketExpandId);
                }
            });
        }
        // Clear the flag after using it
        sessionStorage.removeItem('expandGoalId');
    }
    
    // Group by primary first
    const primaryGroups = groupTasksBy(tasks, buckets, primaryGroup);
    
    // Sort primary groups - special handling for themes to maintain order
    primaryGroups.sort((a, b) => {
        if (a.name === 'Unassigned') return 1;
        if (b.name === 'Unassigned') return -1;
        
        // If primary group is theme, sort by theme order
        if (primaryGroup === 'theme') {
            const themeOrder = ['category5', 'category4', 'category3', 'category1', 'category7', 'category9', 'category2'];
            const aIdx = themeOrder.indexOf(a.id);
            const bIdx = themeOrder.indexOf(b.id);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        }
        
        return a.name.localeCompare(b.name);
    });
    
    // For each primary group, create nested secondary groups
    primaryGroups.forEach(primaryGrp => {
        const primaryId = primaryGrp.name.toLowerCase().replace(/\s+/g, '-');
        const isExpanded = expandedAssignees.has(primaryId);
        
        const primaryDiv = document.createElement('div');
        primaryDiv.className = 'assignee-container';
        
        const primaryHeader = document.createElement('div');
        primaryHeader.className = 'assignee-header' + (isExpanded ? ' expanded' : '');
        primaryHeader.style.cursor = 'pointer';
        
        // Apply theme color if primary group is 'theme'
        let primaryDisplayName = primaryGrp.name;
        if (primaryGroup === 'theme') {
            const themeColor = getThemeColorForCategoryId(primaryGrp.id);
            if (themeColor) {
                primaryHeader.style.background = themeColor;
                primaryHeader.style.color = 'white';
            }
            // Use prefixed theme name for display
            primaryDisplayName = getThemeDisplayNameWithPrefix(primaryGrp.id);
        } else if (primaryGroup === 'goal') {
            const goal = getGoalById(primaryGrp.id);
            if (goal && goal.color) {
                primaryHeader.style.background = goal.color;
                primaryHeader.style.color = 'white';
            }
        }
        
        primaryHeader.innerHTML = `
            <span class="collapse-icon">${isExpanded ? '▼' : '▶'}</span>
            <strong>${primaryDisplayName}</strong> (${primaryGrp.tasks.length} tasks)
        `;
        primaryHeader.onclick = (e) => {
            e.stopPropagation();
            toggleAssignee(primaryId);
        };
        
        const primaryContent = document.createElement('div');
        primaryContent.className = 'assignee-content' + (isExpanded ? ' expanded' : '');
        
        primaryDiv.appendChild(primaryHeader);
        primaryDiv.appendChild(primaryContent);
        
        // Group the tasks within this primary group by secondary grouping
        const secondaryGroups = groupTasksBy(primaryGrp.tasks, buckets, secondaryGroup);
        secondaryGroups.sort((a, b) => {
            // If secondary group is theme, sort by theme order
            if (secondaryGroup === 'theme') {
                const themeOrder = ['category5', 'category4', 'category3', 'category1', 'category7', 'category9', 'category2'];
                const aIdx = themeOrder.indexOf(a.id);
                const bIdx = themeOrder.indexOf(b.id);
                if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            }
            return a.name.localeCompare(b.name);
        });
        
        secondaryGroups.forEach(secondaryGrp => {
            const bucketId = secondaryGrp.name.toLowerCase().replace(/\s+/g, '-') + '-' + primaryId;
            const bucketExpanded = expandedBuckets.has(bucketId);
            
            const bucketDiv = document.createElement('div');
            bucketDiv.className = 'bucket-in-assignee';
            
            const bucketHeader = document.createElement('div');
            bucketHeader.className = 'bucket-header nested' + (bucketExpanded ? ' expanded' : '');
            bucketHeader.style.cursor = 'pointer';
            
            // Apply theme color if secondary group is 'theme'
            let secondaryDisplayName = secondaryGrp.name;
            if (secondaryGroup === 'theme') {
                const themeColor = getThemeColorForCategoryId(secondaryGrp.id);
                if (themeColor) {
                    bucketHeader.style.background = themeColor;
                    bucketHeader.style.color = 'white';
                }
                // Use prefixed theme name for display
                secondaryDisplayName = getThemeDisplayNameWithPrefix(secondaryGrp.id);
            } else if (secondaryGroup === 'goal') {
                const goal = getGoalById(secondaryGrp.id);
                if (goal && goal.color) {
                    bucketHeader.style.background = goal.color;
                    bucketHeader.style.color = 'white';
                }
            }
            
            bucketHeader.innerHTML = `
                <span class="collapse-icon">${bucketExpanded ? '▼' : '▶'}</span>
                <span>${secondaryDisplayName}</span> (${secondaryGrp.tasks.length} tasks)
            `;
            bucketHeader.onclick = (e) => {
                e.stopPropagation();
                toggleNestedBucket(bucketId);
            };
            
            const taskList = document.createElement('div');
            taskList.className = 'task-list nested' + (bucketExpanded ? ' expanded' : '');
            
            // Prepare tasks for this nested group (apply sorting if set)
            const sort = sortState[bucketId];
            let nestedTasks = secondaryGrp.tasks;
            if (sort) {
                nestedTasks = sortTasks(nestedTasks, sort.column, sort.direction);
            }
            
            // Add column headers with select-all, sorting, and resizing
            const columnHeaders = document.createElement('div');
            columnHeaders.className = 'column-headers';
            const sortArrows = (col) => {
                if (!sort || sort.column !== col) return '<span class="sort-arrow">▼</span>';
                return `<span class="sort-arrow active">${sort.direction === 'asc' ? '▲' : '▼'}</span>`;
            };
            // Check if all tasks in this group are selected
            const allSelected = nestedTasks.every(t => selectedTasks.has(t.id));
            columnHeaders.innerHTML = `
                <div><input type="checkbox" class="select-all-checkbox" ${allSelected && nestedTasks.length > 0 ? 'checked' : ''} onclick="event.stopPropagation();" onchange="toggleSelectAll(this)"></div>
                <div class="sortable-header col-id" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'id')">ID ${sortArrows('id')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-id')"></div>
                </div>
                <div class="sortable-header col-task-name" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'title')">Task name ${sortArrows('title')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-task-name')"></div>
                </div>
                <div class="sortable-header col-assigned" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'assigned')">Assigned to ${sortArrows('assigned')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-assigned')"></div>
                </div>
                <div class="sortable-header col-start-date" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'startDate')">Start date ${sortArrows('startDate')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-start-date')"></div>
                </div>
                <div class="sortable-header col-due-date" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'dueDate')">Due date ${sortArrows('dueDate')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-due-date')"></div>
                </div>
                <div class="sortable-header col-progress" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'progress')">Progress ${sortArrows('progress')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-progress')"></div>
                </div>
                <div class="sortable-header col-priority" onclick="event.stopPropagation(); sortBucket('${bucketId}', 'priority')">Priority ${sortArrows('priority')}
                    <div class="resize-handle" onmousedown="startResize(event, 'col-priority')"></div>
                </div>
                <div class="col-labels">Themes</div>
            `;
            taskList.appendChild(columnHeaders);
            
            // Add tasks to the list
            nestedTasks.forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.innerHTML = renderTask(task);
                taskList.appendChild(taskDiv.firstElementChild);
            });
            
            bucketDiv.appendChild(bucketHeader);
            bucketDiv.appendChild(taskList);
            primaryContent.appendChild(bucketDiv);
        });
        
        container.appendChild(primaryDiv);
    });
    
    applyColumnWidths();
}

function getThemeColorForCategoryId(categoryId) {
    // Map category IDs directly to their colors
    const colors = {
        'category1': '#c2185b',
        'category2': '#c62828',
        'category3': '#f57f17',
        'category4': '#388e3c',
        'category5': '#1565c0',
        'category6': '#6a1b9a',
        'category7': '#5d4037',
        'category8': '#9ccc65',
        'category9': '#00838f',
        'category10': '#424242',
        'category11': '#424242',
        'category12': '#3e2723',
        'category13': '#880e4f',
        'category14': '#e65100',
        'category15': '#bf360c',
        'category16': '#f57f17',
        'category17': '#689f38',
        'category18': '#1b5e20',
        'category19': '#00695c',
        'category20': '#01579b',
        'category21': '#0d47a1',
        'category22': '#4527a0',
        'category23': '#6a1b9a',
        'category24': '#616161',
        'category25': '#212121'
    };
    return colors[categoryId] || null;
}

function renderGroup(container, group, buckets, isNested = false) {
    const isCompassBucket = group.id === COMPASS_BUCKET_ID;

    let groupTasks = group.tasks;
    
    // Apply sorting if set
    const sort = sortState[group.id];
    if (sort) {
        groupTasks = sortTasks(groupTasks, sort.column, sort.direction);
    } else if (isCompassBucket) {
        // Default sort for Weekly Compass: alphabetical by title (includes role prefix)
        groupTasks = sortTasks(groupTasks, 'title', 'asc');
    }
    
    const bucketDiv = document.createElement('div');
    bucketDiv.className = 'bucket-container';
    bucketDiv.setAttribute('data-bucket-id', group.id);
    
    const sortArrows = (col) => {
        if (!sort || sort.column !== col) return '<span class=\"sort-arrow\">▼</span>';
        return `<span class=\"sort-arrow active\">${sort.direction === 'asc' ? '▲' : '▼'}</span>`;
    };
    
    // Check if all tasks in this group are selected
    const allSelected = groupTasks.every(t => selectedTasks.has(t.id));
    
    // Get theme color if viewing by theme, or goal color if viewing by goal
    let themeColorStyle = '';
    let groupDisplayName = group.name;
    if (currentView === 'theme') {
        const themeColor = getThemeColorForCategoryId(group.id);
        if (themeColor) {
            themeColorStyle = ` style="background: ${themeColor}; color: white;"`;
        }
        // Use prefixed theme name for display
        groupDisplayName = getThemeDisplayNameWithPrefix(group.id);
    } else if (currentView === 'goal') {
        const goal = getGoalById(group.id);
        if (goal && goal.color) {
            themeColorStyle = ` style="background: ${goal.color}; color: white;"`;
        }
    }
    
    // Add goals button for bucket view (skip for virtual compass bucket)
    let goalsButton = '';
    if (currentView === 'bucket' && !isCompassBucket) {
        goalsButton = `<button class="bucket-goals-btn" onclick="event.stopPropagation(); showBucketGoalsModal('${group.id}')" title="Manage Goals">🎯</button>`;
    }
    
    bucketDiv.innerHTML = `
        <div class=\"bucket-header\"${themeColorStyle} onclick=\"toggleBucket(this)\">
            <div class=\"bucket-title\">
                <span class=\"expand-icon\">▶</span>
                ${groupDisplayName}
                <span class=\"task-count\">${groupTasks.length}</span>
                ${goalsButton}
            </div>
        </div>
        <div class=\"task-list\">
            <div class="column-headers">
                <div><input type="checkbox" class="select-all-checkbox" ${allSelected && groupTasks.length > 0 ? 'checked' : ''} onclick="event.stopPropagation();" onchange="toggleSelectAll(this)"></div>
                <div class=\"sortable-header col-id\" onclick=\"event.stopPropagation(); sortBucket('${group.id}', 'id')\">
                    ID ${sortArrows('id')}
                    <div class=\"resize-handle\" onmousedown=\"startResize(event, 'col-id')\"></div>
                </div>
                <div class=\"sortable-header col-task-name\" onclick=\"event.stopPropagation(); sortBucket('${group.id}', 'title')\">
                    Task name ${sortArrows('title')}
                    <div class=\"resize-handle\" onmousedown=\"startResize(event, 'col-task-name')\"></div>
                </div>
                <div class=\"sortable-header col-assigned\" onclick=\"event.stopPropagation(); sortBucket('${group.id}', 'assigned')\">
                    Assigned to ${sortArrows('assigned')}
                    <div class=\"resize-handle\" onmousedown=\"startResize(event, 'col-assigned')\"></div>
                </div>
                <div class=\"sortable-header col-start-date\" onclick=\"event.stopPropagation(); sortBucket('${group.id}', 'startDate')\">
                    Start date ${sortArrows('startDate')}
                    <div class=\"resize-handle\" onmousedown=\"startResize(event, 'col-start-date')\"></div>
                </div>
                <div class=\"sortable-header col-due-date\" onclick=\"event.stopPropagation(); sortBucket('${group.id}', 'dueDate')\">
                    Due date ${sortArrows('dueDate')}
                    <div class=\"resize-handle\" onmousedown=\"startResize(event, 'col-due-date')\"></div>
                </div>
                <div class=\"sortable-header col-progress\" onclick=\"event.stopPropagation(); sortBucket('${group.id}', 'progress')\">
                    Progress ${sortArrows('progress')}
                    <div class=\"resize-handle\" onmousedown=\"startResize(event, 'col-progress')\"></div>
                </div>
                <div class=\"sortable-header col-priority\" onclick=\"event.stopPropagation(); sortBucket('${group.id}', 'priority')\">
                    Priority ${sortArrows('priority')}
                    <div class=\"resize-handle\" onmousedown=\"startResize(event, 'col-priority')\"></div>
                </div>
                <div class=\"col-labels\">Themes</div>
            </div>
            ${groupTasks.map(task => renderTask(task)).join('')}
        </div>
    `;
    
    container.appendChild(bucketDiv);
    
    // Restore expanded state
    if (expandedBuckets.has(group.id)) {
        const header = bucketDiv.querySelector('.bucket-header');
        const taskList = bucketDiv.querySelector('.task-list');
        header.classList.add('expanded');
        taskList.classList.add('expanded');
    }
}

function toggleAssignee(assigneeId) {
    if (expandedAssignees.has(assigneeId)) {
        expandedAssignees.delete(assigneeId);
    } else {
        expandedAssignees.add(assigneeId);
    }
    applyFilters();
}

function toggleNestedBucket(bucketId) {
    if (expandedBuckets.has(bucketId)) {
        expandedBuckets.delete(bucketId);
    } else {
        expandedBuckets.add(bucketId);
    }
    applyFilters();
}

function groupTasksBy(tasks, buckets, groupBy) {
    const groups = {};
    const bucketMap = (buckets || []).reduce((m, b) => { m[b.id] = b.name; return m; }, {});

    tasks.forEach(task => {
        let key, name;

        switch (groupBy) {
            case 'assigned': {
                const assigneeNames = getAssigneeNames(task);
                assigneeNames.forEach(assigneeName => {
                    const groupKey = assigneeName.toLowerCase().replace(/\s+/g, '-');
                    if (!groups[groupKey]) {
                        groups[groupKey] = { id: groupKey, name: assigneeName, tasks: [] };
                    }
                    groups[groupKey].tasks.push(task);
                });
                return; // Skip default grouping logic after assigning to all assignee groups
            }
            case 'bucket': {
                key = task.bucketId || 'no-bucket';
                name = bucketMap[key] || 'Unknown bucket';
                break;
            }
            case 'progress': {
                if (task.percentComplete === 0) {
                    key = 'not-started';
                    name = 'Not started';
                } else if (task.percentComplete === 100) {
                    key = 'completed';
                    name = 'Completed';
                } else {
                    key = 'in-progress';
                    name = 'In progress';
                }
                break;
            }
            case 'dueDate': {
                if (!task.dueDateTime) {
                    key = 'no-due-date';
                    name = 'No due date';
                } else {
                    const dueDate = new Date(task.dueDateTime);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const due = new Date(dueDate);
                    due.setHours(0, 0, 0, 0);

                    if (due < today) {
                        key = 'overdue';
                        name = 'Overdue';
                    } else if (due.getTime() === today.getTime()) {
                        key = 'today';
                        name = 'Due today';
                    } else if (due <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                        key = 'this-week';
                        name = 'Due this week';
                    } else {
                        key = 'later';
                        name = 'Due later';
                    }
                }
                break;
            }
            case 'priority': {
                const priorityMap = { 1: 'Urgent', 3: 'Important', 5: 'Medium', 9: 'Low' };
                key = 'priority-' + task.priority;
                name = priorityMap[task.priority] || 'No priority';
                break;
            }
            case 'theme': {
                const applied = task.appliedCategories || {};
                const ordered = [
                    'category5','category4','category3','category1','category7',
                    'category9','category2'
                ];
                // Find ALL applied themes, not just the first one
                const appliedThemes = ordered.filter(cat => applied[cat]);
                
                if (appliedThemes.length > 0) {
                    // Add task to each theme group it belongs to
                    appliedThemes.forEach(cat => {
                        const themeName = getThemeDisplayName(cat);
                        if (!groups[cat]) {
                            groups[cat] = { id: cat, name: themeName, tasks: [] };
                        }
                        groups[cat].tasks.push(task);
                    });
                    return; // Skip the default grouping logic below
                } else {
                    key = 'no-theme';
                    name = 'No theme';
                }
                break;
            }
            case 'goal': {
                // Find goals for this task's bucket
                const taskGoals = getGoalsForBucket(task.bucketId);
                
                if (taskGoals.length > 0) {
                    // Add task to each goal group
                    taskGoals.forEach(goal => {
                        if (goal) {
                            if (!groups[goal.id]) {
                                groups[goal.id] = { id: goal.id, name: goal.name, tasks: [] };
                            }
                            groups[goal.id].tasks.push(task);
                        }
                    });
                    return; // Skip the default grouping logic below
                } else {
                    key = 'no-goal';
                    name = 'No goal';
                }
                break;
            }
            default: {
                key = 'other';
                name = 'Other';
            }
        }

        if (!groups[key]) {
            groups[key] = { id: key, name: name, tasks: [] };
        }
        groups[key].tasks.push(task);
    });

    return Object.values(groups);
}

function changeView() {
    const newView = document.getElementById('viewSelect').value;
    currentView = newView;
    localStorage.setItem('plannerDefaultView', currentView);
    
    // Update Group By dropdown to exclude current view
    const groupBySelect = document.getElementById('groupBySelect');
    const currentGroupByValue = groupBySelect.value;
    
    // Hide/show options based on current view
    Array.from(groupBySelect.options).forEach(opt => {
        // Always show None, and hide options that match the current view
        if (opt.value === 'none' || opt.value === newView) {
            opt.style.display = opt.value === 'none' ? '' : 'none';
        } else {
            opt.style.display = '';
        }
    });
    
    // Restore previous selection if still valid, otherwise default to bucket or none
    const isCurrentSelectionHidden = currentGroupByValue === newView || currentGroupByValue === 'none';
    if (!isCurrentSelectionHidden && groupBySelect.querySelector(`option[value="${currentGroupByValue}"]`)) {
        if (groupBySelect.querySelector(`option[value="${currentGroupByValue}"]`).style.display !== 'none') {
            groupBySelect.value = currentGroupByValue;
        } else if (newView === 'assigned') {
            groupBySelect.value = 'bucket';
        } else {
            groupBySelect.value = 'none';
        }
    } else if (newView === 'assigned') {
        groupBySelect.value = 'bucket';
    } else {
        groupBySelect.value = 'none';
    }
    
    currentGroupBy = groupBySelect.value;
    applyFilters();
}

function changeGroupBy() {
    currentGroupBy = document.getElementById('groupBySelect').value;
    localStorage.setItem('plannerDefaultGroupBy', currentGroupBy);
    applyFilters();
}

function getFilteredTasks(includeCompass = false) {
    // Filter out goals bucket tasks from normal views (check both ID and name for safety)
    const tasksWithoutGoals = allTasks.filter(t => {
        if (goalsBucketRealId && t.bucketId === goalsBucketRealId) return false;
        // Also check bucket name in case ID isn't set yet
        const bucket = allBuckets.find(b => b.id === t.bucketId);
        if (bucket && bucket.name === GOALS_BUCKET_NAME) return false;
        return true;
    });
    const pool = includeCompass ? [...tasksWithoutGoals, ...compassTasks] : [...tasksWithoutGoals];
    if (pool.length === 0) return [];
    currentFilter = document.getElementById('filterSelect').value;
    showCompleted = document.getElementById('showCompletedCheckbox').checked;

    return pool.filter(task => {
        if (!showCompleted && task.percentComplete === 100) return false;
        switch(currentFilter) {
            case 'all':
                return true;
            case 'urgent':
                return task.priority === 1;
            case 'important':
                return task.priority === 3;
            case 'assigned':
                return task.assignments && Object.keys(task.assignments).length > 0;
            case 'unassigned':
                return !task.assignments || Object.keys(task.assignments).length === 0;
            case 'overdue':
                if (!task.dueDateTime) return false;
                const dueDate = new Date(task.dueDateTime);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const due = new Date(dueDate);
                due.setHours(0, 0, 0, 0);
                return due < today && task.percentComplete !== 100;
            case 'due-today':
                if (!task.dueDateTime) return false;
                const dueDateToday = new Date(task.dueDateTime);
                const todayNow = new Date();
                todayNow.setHours(0, 0, 0, 0);
                const dueToday = new Date(dueDateToday);
                dueToday.setHours(0, 0, 0, 0);
                return dueToday.getTime() === todayNow.getTime();
            case 'due-this-week':
                if (!task.dueDateTime) return false;
                const dueDateWeek = new Date(task.dueDateTime);
                const todayWeek = new Date();
                todayWeek.setHours(0, 0, 0, 0);
                const dueWeek = new Date(dueDateWeek);
                dueWeek.setHours(0, 0, 0, 0);
                const weekFromNow = new Date(todayWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
                return dueWeek >= todayWeek && dueWeek <= weekFromNow;
            default:
                return true;
        }
    });
}

function applyFilters() {
    // Exclude compass tasks from Theme view/grouping (they're personal, not project-related)
    const includeCompass = currentView !== 'theme' && currentGroupBy !== 'theme';
    const filteredTasks = getFilteredTasks(includeCompass);
    // Filter out Goals bucket from normal task views
    const bucketsToRender = allBuckets.filter(b => b.id !== goalsBucketRealId);
    renderTasks(bucketsToRender, filteredTasks);
    if (currentTab === 'dashboard') {
        renderDashboard();
    }
}

function switchTab(tab) {
    currentTab = tab;
    localStorage.setItem('plannerCurrentTab', tab);
    const tasksView = document.getElementById('tasksView');
    const dashboardView = document.getElementById('dashboardContainer');
    const goalsView = document.getElementById('goalsContainer');
    const tasksBtn = document.getElementById('tabTasks');
    const dashBtn = document.getElementById('tabDashboard');
    const goalsBtn = document.getElementById('tabGoals');
    
    if (!tasksView || !dashboardView || !goalsView || !tasksBtn || !dashBtn || !goalsBtn) return;
    
    // Get task control elements
    const gridEditBtn = document.getElementById('gridEditBtn');
    const viewSelect = document.getElementById('viewSelect');
    const groupByContainer = document.getElementById('groupByContainer');
    const filterSelect = document.getElementById('filterSelect');
    const showCompletedCheckbox = document.getElementById('showCompletedCheckbox');
    
    // Hide all views
    tasksView.style.display = 'none';
    dashboardView.style.display = 'none';
    goalsView.style.display = 'none';
    tasksBtn.classList.remove('active');
    dashBtn.classList.remove('active');
    goalsBtn.classList.remove('active');
    
    // Show selected view and appropriate controls
    if (tab === 'dashboard') {
        dashboardView.style.display = 'block';
        dashBtn.classList.add('active');
        // Hide task controls on Dashboard
        if (gridEditBtn) gridEditBtn.style.display = 'none';
        if (viewSelect && viewSelect.parentElement) viewSelect.parentElement.style.display = 'none';
        if (groupByContainer) groupByContainer.style.display = 'none';
        if (filterSelect && filterSelect.parentElement) filterSelect.parentElement.style.display = 'none';
        if (showCompletedCheckbox && showCompletedCheckbox.parentElement) showCompletedCheckbox.parentElement.style.display = 'none';
        renderDashboard();
    } else if (tab === 'goals') {
        goalsView.style.display = 'block';
        goalsBtn.classList.add('active');
        // Hide task controls on Goals
        if (gridEditBtn) gridEditBtn.style.display = 'none';
        if (viewSelect && viewSelect.parentElement) viewSelect.parentElement.style.display = 'none';
        if (groupByContainer) groupByContainer.style.display = 'none';
        if (filterSelect && filterSelect.parentElement) filterSelect.parentElement.style.display = 'none';
        if (showCompletedCheckbox && showCompletedCheckbox.parentElement) showCompletedCheckbox.parentElement.style.display = 'none';
        renderGoalsView();
    } else {
        tasksView.style.display = 'block';
        tasksBtn.classList.add('active');
        // Show task controls on Tasks view
        if (gridEditBtn) gridEditBtn.style.display = '';
        if (viewSelect && viewSelect.parentElement) viewSelect.parentElement.style.display = '';
        if (groupByContainer) groupByContainer.style.display = '';
        if (filterSelect && filterSelect.parentElement) filterSelect.parentElement.style.display = '';
        if (showCompletedCheckbox && showCompletedCheckbox.parentElement) showCompletedCheckbox.parentElement.style.display = '';
    }
}

function openCardMenu(event, chartId) {
    event.stopPropagation();
    let menu = document.getElementById('cardMenu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'cardMenu';
        menu.className = 'card-menu';
        document.body.appendChild(menu);
        document.addEventListener('click', closeCardMenu, { capture: true });
    }
    const currentVisual = cardVisualPrefs[chartId] || 'bar';
    const currentSize = cardSizePrefs[chartId] || 'normal';
    
    const visualHtml = CARD_VISUAL_OPTIONS.map(opt => {
        const active = opt.id === currentVisual ? 'active' : '';
        const check = opt.id === currentVisual ? ' ✓' : '';
        return `<button class="card-menu-item ${active}" onclick="selectCardVisual('${chartId}','${opt.id}'); event.stopPropagation();">${opt.label}${check}</button>`;
    }).join('');
    
    const sizeHtml = CARD_SIZE_OPTIONS.map(opt => {
        const active = opt.id === currentSize ? 'active' : '';
        const check = opt.id === currentSize ? ' ✓' : '';
        return `<button class="card-menu-item ${active}" onclick="selectCardSize('${chartId}','${opt.id}'); event.stopPropagation();">${opt.label}${check}</button>`;
    }).join('');
    
    menu.innerHTML = `
        <div style="font-weight:700; font-size:11px; color:var(--text-secondary); padding:4px 8px; border-bottom:1px solid var(--border-color);">CHART TYPE</div>
        ${visualHtml}
        <div style="font-weight:700; font-size:11px; color:var(--text-secondary); padding:4px 8px; border-bottom:1px solid var(--border-color); margin-top:4px;">CARD SIZE</div>
        ${sizeHtml}
    `;

    const rect = event.target.getBoundingClientRect();
    menu.style.display = 'block';
    menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
    menu.style.left = `${rect.right + window.scrollX - menu.offsetWidth}px`;
}

function closeCardMenu() {
    const menu = document.getElementById('cardMenu');
    if (menu) menu.style.display = 'none';
}

function selectCardVisual(chartId, visual) {
    cardVisualPrefs[chartId] = visual;
    localStorage.setItem('plannerCardVisuals', JSON.stringify(cardVisualPrefs));
    closeCardMenu();
    renderDashboard();
}

function selectCardSize(chartId, size) {
    cardSizePrefs[chartId] = size;
    localStorage.setItem('plannerCardSizes', JSON.stringify(cardSizePrefs));
    closeCardMenu();
    renderDashboard();
}

function resetDashboardLayout() {
    if (confirm('Reset dashboard layout to default? This will clear all saved card positions and sizes.')) {
        cardSizePrefs = {};
        cardOrderPrefs = [];
        localStorage.removeItem('plannerCardSizes');
        localStorage.removeItem('plannerCardOrder');
        renderDashboard();
        alert('Dashboard layout reset to default.');
    }
}

function initCardDragDrop() {
    const grid = document.querySelector('.dashboard-grid');
    if (!grid) return;
    
    const cards = grid.querySelectorAll('.dashboard-card');
    cards.forEach(card => {
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', handleCardDragStart);
        card.addEventListener('dragover', handleCardDragOver);
        card.addEventListener('drop', handleCardDrop);
        card.addEventListener('dragend', handleCardDragEnd);
        
        // Add drag handle cursor to header
        const header = card.querySelector('.dashboard-card-header');
        if (header) header.style.cursor = 'move';
    });
}

function handleCardDragStart(e) {
    draggedCard = e.currentTarget;
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleCardDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const target = e.currentTarget;
    if (target !== draggedCard && target.classList.contains('dashboard-card')) {
        target.style.borderTop = '3px solid var(--link-color)';
    }
    return false;
}

function handleCardDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    
    const target = e.currentTarget;
    if (draggedCard !== target) {
        const grid = target.parentElement;
        const allCards = Array.from(grid.querySelectorAll('.dashboard-card'));
        const draggedIndex = allCards.indexOf(draggedCard);
        const targetIndex = allCards.indexOf(target);
        
        if (draggedIndex < targetIndex) {
            target.parentNode.insertBefore(draggedCard, target.nextSibling);
        } else {
            target.parentNode.insertBefore(draggedCard, target);
        }
        
        // Save new order
        const newOrder = Array.from(grid.querySelectorAll('.dashboard-card')).map(card => {
            const chartEl = card.querySelector('[id^="chart"]');
            return chartEl ? chartEl.id : null;
        }).filter(id => id);
        
        cardOrderPrefs = newOrder;
        localStorage.setItem('plannerCardOrder', JSON.stringify(cardOrderPrefs));
    }
    
    target.style.borderTop = '';
    return false;
}

function handleCardDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.dashboard-card').forEach(card => {
        card.style.borderTop = '';
    });
    draggedCard = null;
}

function renderBarGroup(containerId, data, filterType) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<div class="chart-empty">No data</div>';
        return;
    }
    
    // Adjust label layout: add wide-labels class to bar group when labels are long
    const maxLabelLength = Math.max(...data.map(d => (d.label || '').length));
    if (maxLabelLength >= 15) {
        container.classList.add('wide-labels');
    } else {
        container.classList.remove('wide-labels');
    }
    
    const visual = cardVisualPrefs[containerId] || 'bar';
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const totalValue = data.reduce((sum, d) => sum + d.value, 0);
    
    // Pie and Donut charts
    if (visual === 'pie' || visual === 'donut') {
        let cumulativePercent = 0;
        const slices = data.map(item => {
            const slicePercent = (item.value / totalValue) * 100;
            const startPercent = cumulativePercent;
            cumulativePercent += slicePercent;
            const gradientId = 'slice-' + Math.random().toString(36).substr(2, 9);
            return {
                item,
                percent: slicePercent,
                start: startPercent,
                end: cumulativePercent,
                gradientId
            };
        });
        
        const pieSize = 120;
        const donutHoleSize = visual === 'donut' ? 60 : 0;
        
        let svgSlices = '';
        slices.forEach(slice => {
            const startAngle = (slice.start / 100) * 360 - 90;
            const endAngle = (slice.end / 100) * 360 - 90;
            const isLarge = slice.percent > 50 ? 1 : 0;
            
            const startRad = startAngle * Math.PI / 180;
            const endRad = endAngle * Math.PI / 180;
            
            const x1 = pieSize + pieSize * Math.cos(startRad);
            const y1 = pieSize + pieSize * Math.sin(startRad);
            const x2 = pieSize + pieSize * Math.cos(endRad);
            const y2 = pieSize + pieSize * Math.sin(endRad);
            
            const pathData = visual === 'donut' 
                ? `M ${x1} ${y1} A ${pieSize} ${pieSize} 0 ${isLarge} 1 ${x2} ${y2} L ${pieSize + donutHoleSize * Math.cos(endRad)} ${pieSize + donutHoleSize * Math.sin(endRad)} A ${donutHoleSize} ${donutHoleSize} 0 ${isLarge} 0 ${pieSize + donutHoleSize * Math.cos(startRad)} ${pieSize + donutHoleSize * Math.sin(startRad)} Z`
                : `M ${pieSize} ${pieSize} L ${x1} ${y1} A ${pieSize} ${pieSize} 0 ${isLarge} 1 ${x2} ${y2} Z`;
            
            svgSlices += `<path d="${pathData}" fill="${slice.item.color}" stroke="var(--bg-secondary)" stroke-width="1" onclick="drillDownTasks('${filterType}', '${escapeForAttribute(slice.item.label)}');" style="cursor:pointer;" title="${slice.item.label}: ${slice.item.value}"/>`;
        });
        
        const svgSize = pieSize * 2 + 10;
        const chartHtml = `
            <svg width="${svgSize}" height="${svgSize}" style="margin:0 auto; display:block;">
                ${svgSlices}
            </svg>
            <div style="margin-top:8px; font-size:12px;">
                ${data.map(item => `
                    <div style="display:flex; justify-content:space-between; gap:8px; padding:4px 0; cursor:pointer;" onclick="drillDownTasks('${filterType}', '${escapeForAttribute(item.label)}');">
                        <span><span style="display:inline-block; width:10px; height:10px; background:${item.color}; margin-right:6px;"></span>${escapeHtml(item.label)}</span>
                        <strong>${item.value}</strong>
                    </div>
                `).join('')}
            </div>
        `;
        container.innerHTML = chartHtml;
        return;
    }
    
    // Vertical bars
    if (visual === 'vertical') {
        const chartHtml = `
            <div style="display:flex; align-items:flex-end; justify-content:center; gap:8px; min-height:200px; padding:16px 8px; background:var(--bg-primary); border-radius:4px;">
                ${data.map(item => {
                    const pct = Math.max(10, Math.round((item.value / maxValue) * 100));
                    const height = (pct / 100) * 160;
                    return `
                        <div style="display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer;" onclick="drillDownTasks('${filterType}', '${escapeForAttribute(item.label)}');" title="${item.label}: ${item.value}">
                            <span style="font-size:11px; font-weight:600; color:var(--text-primary);">${item.value}</span>
                            <div style="width:32px; height:${height}px; background:${item.color}; border-radius:2px; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"></div>
                            <span style="font-size:11px; color:var(--text-secondary); text-align:center; max-width:50px; word-break:break-word;">${escapeHtml(item.label)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        container.innerHTML = chartHtml;
        return;
    }
    
    // Horizontal bars (default)
    container.innerHTML = data.map(item => {
        const pct = Math.max(4, Math.round((item.value / maxValue) * 100));
        const escapedLabel = escapeHtml(item.label);
        return `
            <div class="bar-row" onclick="drillDownTasks('${filterType}', '${escapeForAttribute(item.label)}')">
                <div class="bar-label">${escapedLabel}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${pct}%; background:${item.color};"></div>
                </div>
                <div class="bar-value">${item.value}</div>
            </div>
        `;
    }).join('');
}

function escapeForAttribute(text) {
    return String(text).replace(/'/g, '\\\'').replace(/"/g, '&quot;');
}

// Helper: derive the most specific names for task assignees
function getAssigneeNames(task) {
    const detailsAssignments = allTaskDetails[task.id]?.assignments || {};
    const rawAssignments = task.assignments || {};
    const ids = Object.keys(rawAssignments);
    if (ids.length === 0) return ['Unassigned'];
    
    const names = ids.map(id => {
        const detailName = detailsAssignments[id]?.displayName;
        const userMapName = allUsers[id];
        const rawDisplay = rawAssignments[id]?.displayName;
        const assignedByName = rawAssignments[id]?.assignedBy?.user?.displayName;
        const name = detailName || userMapName || rawDisplay || assignedByName;
        
        // If still no name, show truncated user ID as last resort
        if (!name) {
            return id.substring(0, 8) + '...';
        }
        return name;
    });
    return names;
}

function getProgressLabel(percentComplete) {
    if (percentComplete === 100) return 'Completed';
    if (percentComplete > 0) return 'In progress';
    return 'Not started';
}

function getPriorityLabel(priority) {
    const map = { 1: 'Urgent', 3: 'Important', 5: 'Medium', 9: 'Low' };
    return map[priority] || 'Unspecified';
}

function renderDashboard() {
    const dashboard = document.getElementById('dashboardContainer');
    if (!dashboard) return;

    const tasks = getFilteredTasks();
    const summaryEl = document.getElementById('dashboardSummary');
    const emptyEl = document.getElementById('dashboardEmpty');

    if (!tasks || tasks.length === 0) {
        if (summaryEl) summaryEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        renderBarGroup('chartProgress', []);
        renderBarGroup('chartPriority', []);
        renderBarGroup('chartDue', []);
        renderBarGroup('chartAssignees', []);
        renderBarGroup('chartThemes', []);
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summary = {
        total: tasks.length,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        overdue: 0,
        dueThisWeek: 0
    };

    const statusCounts = { 'Not started': 0, 'In progress': 0, 'Completed': 0 };
    const priorityCounts = {};
    const dueCounts = { 'Overdue': 0, 'Due this week': 0, 'Due this month': 0, 'Future': 0, 'No due date': 0 };
    const assigneeCounts = {};
    const themeCounts = {};

    tasks.forEach(task => {
        const progress = getProgressLabel(task.percentComplete);
        statusCounts[progress] = (statusCounts[progress] || 0) + 1;
        if (progress === 'Completed') summary.completed++;
        else if (progress === 'In progress') summary.inProgress++;
        else summary.notStarted++;

        const priorityLabel = getPriorityLabel(task.priority);
        priorityCounts[priorityLabel] = (priorityCounts[priorityLabel] || 0) + 1;

        if (task.dueDateTime) {
            const due = new Date(task.dueDateTime);
            due.setHours(0, 0, 0, 0);
            const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
            if (diffDays < 0 && task.percentComplete !== 100) {
                dueCounts['Overdue']++;
                summary.overdue++;
            } else if (diffDays <= 7) {
                dueCounts['Due this week']++;
                summary.dueThisWeek++;
            } else if (diffDays <= 30) {
                dueCounts['Due this month']++;
            } else {
                dueCounts['Future']++;
            }
        } else {
            dueCounts['No due date']++;
        }

        const assigneeNames = getAssigneeNames(task);
        assigneeNames.forEach(name => {
            assigneeCounts[name] = (assigneeCounts[name] || 0) + 1;
        });

        const categories = task.appliedCategories || {};
        Object.keys(categories).forEach(cat => {
            const themeName = getThemeDisplayName ? getThemeDisplayName(cat) : cat;
            themeCounts[themeName] = (themeCounts[themeName] || 0) + 1;
        });
    });

    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="summary-item"><div class="summary-label">Total</div><div class="summary-value">${summary.total}</div></div>
            <div class="summary-item"><div class="summary-label">In progress</div><div class="summary-value">${summary.inProgress}</div></div>
            <div class="summary-item"><div class="summary-label">Not started</div><div class="summary-value">${summary.notStarted}</div></div>
            <div class="summary-item"><div class="summary-label">Completed</div><div class="summary-value">${summary.completed}</div></div>
            <div class="summary-item"><div class="summary-label">Overdue</div><div class="summary-value warning">${summary.overdue}</div></div>
            <div class="summary-item"><div class="summary-label">Due in 7 days</div><div class="summary-value">${summary.dueThisWeek}</div></div>
        `;
    }

    const palette = ['#0078d4', '#f7630c', '#107c10', '#6f4bbf', '#0099bc', '#d13438', '#498205', '#9a9a9a'];

    renderBarGroup('chartProgress', [
        { label: 'Not started', value: statusCounts['Not started'] || 0, color: palette[1] },
        { label: 'In progress', value: statusCounts['In progress'] || 0, color: palette[0] },
        { label: 'Completed', value: statusCounts['Completed'] || 0, color: palette[2] }
    ], 'progress');

    const priorityData = Object.keys(priorityCounts).map((label, idx) => ({
        label,
        value: priorityCounts[label],
        color: palette[idx % palette.length]
    })).sort((a, b) => b.value - a.value);
    renderBarGroup('chartPriority', priorityData, 'priority');

    const dueData = Object.keys(dueCounts).map((label, idx) => ({
        label,
        value: dueCounts[label],
        color: palette[idx % palette.length]
    })).sort((a, b) => b.value - a.value);
    renderBarGroup('chartDue', dueData, 'due');

    const assigneeData = Object.keys(assigneeCounts)
        .map((label, idx) => ({ label, value: assigneeCounts[label], color: palette[idx % palette.length] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    renderBarGroup('chartAssignees', assigneeData, 'assignee');

    const themeData = Object.keys(themeCounts)
        .map((label, idx) => ({ label, value: themeCounts[label], color: palette[idx % palette.length] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    renderBarGroup('chartThemes', themeData, 'theme');
    
    // Apply card sizes and reorder
    applyCardLayoutPreferences();
    initCardDragDrop();
}

function applyCardLayoutPreferences() {
    const grid = document.querySelector('.dashboard-grid');
    if (!grid) return;
    
    // Apply sizes
    Object.keys(cardSizePrefs).forEach(chartId => {
        const size = cardSizePrefs[chartId];
        const container = document.getElementById(chartId);
        if (!container) return;
        
        const card = container.closest('.dashboard-card');
        if (!card) return;
        
        card.classList.remove('card-size-normal', 'card-size-wide', 'card-size-full');
        card.classList.add(`card-size-${size}`);
    });
    
    // Apply order
    if (cardOrderPrefs && cardOrderPrefs.length > 0) {
        const cards = Array.from(grid.querySelectorAll('.dashboard-card'));
        const cardMap = new Map();
        
        cards.forEach(card => {
            const chartEl = card.querySelector('[id^="chart"]');
            if (chartEl) cardMap.set(chartEl.id, card);
        });
        
        cardOrderPrefs.forEach(chartId => {
            const card = cardMap.get(chartId);
            if (card) grid.appendChild(card);
        });
    }
}

function drillDownTasks(filterType, filterValue) {
    const tasks = getFilteredTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = tasks.filter(task => {
        switch(filterType) {
            case 'progress':
                return getProgressLabel(task.percentComplete) === filterValue;
            case 'priority':
                return getPriorityLabel(task.priority) === filterValue;
            case 'due':
                if (filterValue === 'No due date') return !task.dueDateTime;
                if (filterValue === 'Overdue') {
                    if (!task.dueDateTime) return false;
                    const due = new Date(task.dueDateTime);
                    due.setHours(0, 0, 0, 0);
                    return due < today && task.percentComplete !== 100;
                }
                if (filterValue === 'Due this week') {
                    if (!task.dueDateTime) return false;
                    const due = new Date(task.dueDateTime);
                    due.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 7;
                }
                if (filterValue === 'Due this month') {
                    if (!task.dueDateTime) return false;
                    const due = new Date(task.dueDateTime);
                    due.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
                    return diffDays > 7 && diffDays <= 30;
                }
                if (filterValue === 'Future') {
                    if (!task.dueDateTime) return false;
                    const due = new Date(task.dueDateTime);
                    due.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
                    return diffDays > 30;
                }
                return false;
            case 'assignee':
                const taskDetails = allTaskDetails[task.id];
                const assignments = taskDetails?.assignments || task.assignments || {};
                if (filterValue === 'Unassigned') {
                    return !assignments || Object.keys(assignments).length === 0;
                }
                return Object.values(assignments).some(a => a.displayName === filterValue);
            case 'theme':
                const categories = task.appliedCategories || {};
                return Object.keys(categories).some(cat => {
                    const themeName = getThemeDisplayName(cat);
                    return themeName === filterValue;
                });
            default:
                return false;
        }
    });

    showDrillDownModal(filterType, filterValue, filtered);
}

function showDrillDownModal(filterType, filterValue, tasks) {
    const modal = document.createElement('div');
    modal.className = 'drill-down-modal';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    const bucketMap = {};
    allBuckets.forEach(b => bucketMap[b.id] = b.name);

    const taskRows = tasks.map(task => {
        const details = allTaskDetails[task.id] || {};
        const assignments = details.assignments || task.assignments || {};
        const assignees = Object.values(assignments).map(a => a.displayName || '').filter(Boolean).join(', ') || 'Unassigned';
        const progress = getProgressLabel(task.percentComplete);
        const priority = getPriorityLabel(task.priority);
        const bucket = bucketMap[task.bucketId] || '';
        const dueDate = formatDateForDisplay(task.dueDateTime);

        return `
            <div class="drill-task-item" onclick="event.stopPropagation(); openTaskDetail('${task.id}')">
                <div class="drill-task-title">${escapeHtml(task.title || 'Untitled')}</div>
                <div class="drill-task-meta">
                    <div class="drill-task-meta-item"><strong>Progress:</strong> ${progress}</div>
                    <div class="drill-task-meta-item"><strong>Priority:</strong> ${priority}</div>
                    <div class="drill-task-meta-item"><strong>Bucket:</strong> ${escapeHtml(bucket)}</div>
                    <div class="drill-task-meta-item"><strong>Assigned:</strong> ${escapeHtml(assignees)}</div>
                    ${dueDate ? `<div class="drill-task-meta-item"><strong>Due:</strong> ${dueDate}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    modal.innerHTML = `
        <div class="drill-down-content" onclick="event.stopPropagation()">
            <div class="drill-down-header">
                <div>
                    <div class="drill-down-title">${escapeHtml(filterValue)}</div>
                    <div class="drill-down-subtitle">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</div>
                </div>
                <button class="drill-down-close" onclick="this.closest('.drill-down-modal').remove()">×</button>
            </div>
            <div class="drill-down-body">
                ${tasks.length > 0 ? taskRows : '<div class="drill-empty">No tasks match this filter</div>'}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function exportDashboardCsv() {
    const tasks = getFilteredTasks();
    if (!tasks || tasks.length === 0) {
        alert('No tasks to export. Adjust filters or load tasks.');
        return;
    }

    const bucketMap = {};
    allBuckets.forEach(b => bucketMap[b.id] = b.name);

    const rows = tasks.map(task => {
        const assignees = getAssigneeNames(task).join('; ');
        const categories = task.appliedCategories || {};
        const themes = Object.keys(categories).map(cat => getThemeDisplayName ? getThemeDisplayName(cat) : cat).join('; ');
        return {
            Title: task.title || '',
            Progress: getProgressLabel(task.percentComplete),
            Priority: getPriorityLabel(task.priority),
            Bucket: bucketMap[task.bucketId] || '',
            Assignees: assignees,
            'Start Date': formatDateForDisplay(task.startDateTime),
            'Due Date': formatDateForDisplay(task.dueDateTime),
            Themes: themes
        };
    });

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];
    rows.forEach(row => {
        const line = headers.map(h => {
            const val = row[h] || '';
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(',');
        csvLines.push(line);
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'planner-dashboard.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function renderTask(task) {
    if (task.source === 'compass') {
        const displayId = `WC-${(task.roleIndex ?? 0) + 1}.${(task.rockIndex ?? 0) + 1}`;
        const done = task.percentComplete === 100;
        const rolePill = task.compassRole ? `<span class="label-badge compass-role-pill">${escapeHtml(task.compassRole)}</span>` : '';
        const assigneeName = currentUserName || 'Me';
        const startDate = formatDateForDisplay(task.startDateTime);
        const dueDate = formatDateForDisplay(task.dueDateTime);
        const taskTitle = task.compassRole ? `${escapeHtml(task.compassRole)}: ${escapeHtml(task.title)}` : escapeHtml(task.title);
        return `
            <div class="task-row compass-task-row" data-task-id="${task.id}" data-source="compass" data-role-index="${task.roleIndex}" data-rock-index="${task.rockIndex}">
                <input type="checkbox" class="task-checkbox" disabled>
                <div class="task-id col-id">${displayId}</div>
                <div class="task-title col-task-name" style="cursor: pointer;" onclick="openCompassTaskDetail(${task.roleIndex}, ${task.rockIndex})">
                    ${taskTitle}
                </div>
                <div class="task-assignee col-assigned">${assigneeName}</div>
                <div class="task-date col-start-date">${startDate || '<span class="placeholder">--</span>'}</div>
                <div class="task-date col-due-date">${dueDate || '<span class="placeholder">--</span>'}</div>
                <div class="task-progress col-progress" onclick="toggleCompassTaskFromGrid(${task.roleIndex}, ${task.rockIndex})" style="cursor: pointer;" title="Click to toggle completion">
                    <span class="progress-dot ${done ? 'completed' : 'not-started'}"></span>
                    ${done ? 'Completed' : 'Not started'}
                </div>
                <div class="task-priority col-priority"><span class="placeholder">--</span></div>
                <div class="task-labels col-labels">${rolePill}</div>
            </div>
        `;
    }

    // Use sequential ID assigned by createdDateTime (oldest -> 1)
    const seq = taskSequentialIds[task.id];
    const taskDisplayId = seq ? `${taskIdPrefix}-${seq}` : `${taskIdPrefix}-?`;
    
    const progressClass = task.percentComplete === 0 ? 'not-started' : 
                         task.percentComplete === 100 ? 'completed' : 'in-progress';
    const progressText = task.percentComplete === 0 ? 'Not started' : 
                        task.percentComplete === 100 ? 'Completed' : 'In progress';
    
    const priorityMap = {1: 'Urgent', 3: 'Important', 5: 'Medium', 9: 'Low'};
    const priorityText = priorityMap[task.priority] || '';
    
    const startDate = formatDateForDisplay(task.startDateTime);
    const dueDate = formatDateForDisplay(task.dueDateTime);
    
    const assignee = getAssigneeNames(task).join(', ');
    
    // Get goals for this task's bucket
    const taskGoals = getGoalsForBucket(task.bucketId);
    const goalBadges = taskGoals.map(goalId => {
        const goal = getGoalById(goalId);
        if (!goal) return '';
        return `<span class="goal-badge" style="background: ${goal.color};" title="${escapeHtml(goal.name)}">${escapeHtml(goal.name)}</span>`;
    }).join('');
    
    // Get categories
    const appliedCategories = task.appliedCategories || {};
    
    // Applied categories for task rendering
    const categoryBadges = Object.keys(appliedCategories).map(cat => {
        const colors = {
            'category1': '#c2185b',
            'category2': '#c62828',
            'category3': '#f57f17',
            'category4': '#388e3c',
            'category5': '#1565c0',
            'category6': '#6a1b9a',
            'category7': '#5d4037',
            'category8': '#9ccc65',
            'category9': '#00838f',
            'category10': '#424242',
            'category11': '#424242',
            'category12': '#3e2723',
            'category13': '#880e4f',
            'category14': '#e65100',
            'category15': '#bf360c',
            'category16': '#f57f17',
            'category17': '#689f38',
            'category18': '#1b5e20',
            'category19': '#00695c',
            'category20': '#01579b',
            'category21': '#0d47a1',
            'category22': '#4527a0',
            'category23': '#6a1b9a',
            'category24': '#616161',
            'category25': '#212121'
        };
        
        return `<span class="label-badge" style="background: ${colors[cat]}; color: white;">${getThemeDisplayName(cat)}</span>`;
    }).join('');

    // Determine if cells should be editable
    const editableClass = gridEditMode ? 'editable-cell' : '';
    const titleClickHandler = gridEditMode ? `onclick="makeEditable(this, 'text')"` : `onclick="openTaskDetail('${task.id}')"`;
    const assigneeClickHandler = gridEditMode ? `onclick="makeEditable(this, 'select-user')"` : `onclick="openTaskDetail('${task.id}')"`;
    const startDateClickHandler = gridEditMode ? `onclick="makeEditable(this, 'date')"` : `onclick="openTaskDetail('${task.id}')"`;
    const dueDateClickHandler = gridEditMode ? `onclick="makeEditable(this, 'date')"` : `onclick="openTaskDetail('${task.id}')"`;
    const progressClickHandler = gridEditMode ? `onclick="makeEditable(this, 'select-progress')"` : `onclick="openTaskDetail('${task.id}')"`;
    const priorityClickHandler = gridEditMode ? `onclick="makeEditable(this, 'select-priority')"` : `onclick="openTaskDetail('${task.id}')"`;

    return `
        <div class="task-row" data-task-id="${task.id}">
            <input type="checkbox" class="task-checkbox" 
                ${selectedTasks.has(task.id) ? 'checked' : ''} 
                onchange="toggleTaskSelection('${task.id}')">
            <div class="task-id col-id">${taskDisplayId}</div>
            <div class="task-title col-task-name ${editableClass}" 
                data-field="title" 
                data-task-id="${task.id}"
                ${titleClickHandler}>
                <span>${task.title}</span>
            </div>
            <div class="task-assignee col-assigned ${editableClass}" 
                data-field="assignments" 
                data-task-id="${task.id}"
                ${assigneeClickHandler}>
                ${assignee || '<span class="placeholder">Unassigned</span>'}
            </div>
            <div class="task-date col-start-date ${editableClass}" 
                data-field="startDateTime" 
                data-task-id="${task.id}"
                ${startDateClickHandler}>
                ${startDate || '<span class="placeholder">--</span>'}
            </div>
            <div class="task-date col-due-date ${editableClass}" 
                data-field="dueDateTime" 
                data-task-id="${task.id}"
                ${dueDateClickHandler}>
                ${dueDate || '<span class="placeholder">--</span>'}
            </div>
            <div class="task-progress col-progress ${editableClass}" 
                data-field="percentComplete" 
                data-task-id="${task.id}"
                ${progressClickHandler}>
                <span class="progress-dot ${progressClass}"></span>
                ${progressText}
            </div>
            <div class="task-priority col-priority ${editableClass}" 
                data-field="priority" 
                data-task-id="${task.id}"
                ${priorityClickHandler}>
                ${priorityText || '<span class="placeholder">--</span>'}
            </div>
            <div class="task-labels col-labels">${goalBadges}${categoryBadges}</div>
        </div>
    `;
}

// Inline Grid Editing Functions
let currentEditingCell = null;

function makeEditable(cell, type) {
    // Prevent editing if already editing
    if (currentEditingCell) {
        cancelEdit(currentEditingCell);
    }
    
    const taskId = cell.getAttribute('data-task-id');
    const field = cell.getAttribute('data-field');
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    currentEditingCell = cell;
    cell.classList.add('editing');
    
    const originalContent = cell.innerHTML;
    cell.setAttribute('data-original-content', originalContent);
    
    switch (type) {
        case 'text':
            makeTextEditable(cell, task, field);
            break;
        case 'date':
            makeDateEditable(cell, task, field);
            break;
        case 'select-user':
            makeUserSelectEditable(cell, task, field);
            break;
        case 'select-progress':
            makeProgressSelectEditable(cell, task, field);
            break;
        case 'select-priority':
            makePrioritySelectEditable(cell, task, field);
            break;
    }
}

function makeTextEditable(cell, task, field) {
    const currentValue = task[field] || '';
    cell.innerHTML = `<input type="text" class="inline-edit-input" value="${escapeHtml(currentValue)}" />`;
    const input = cell.querySelector('input');
    input.focus();
    input.select();
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveInlineEdit(cell, task, field, input.value);
        } else if (e.key === 'Escape') {
            cancelEdit(cell);
        }
    });
    input.addEventListener('blur', () => {
        setTimeout(() => saveInlineEdit(cell, task, field, input.value), 150);
    });
}

function makeDateEditable(cell, task, field) {
    const currentValue = formatDateForInput(task[field]);
    cell.innerHTML = `<input type="date" class="inline-edit-input" value="${currentValue}" />`;
    const input = cell.querySelector('input');
    input.focus();
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveInlineEdit(cell, task, field, input.value);
        } else if (e.key === 'Escape') {
            cancelEdit(cell);
        }
    });
    input.addEventListener('blur', () => {
        setTimeout(() => saveInlineEdit(cell, task, field, input.value), 150);
    });
}

function makeUserSelectEditable(cell, task, field) {
    const currentAssignee = task.assignments && Object.keys(task.assignments).length > 0 
        ? Object.keys(task.assignments)[0] 
        : '';
    
    const options = ['<option value="">Unassigned</option>'];
    Object.keys(allUsers).forEach(userId => {
        const selected = userId === currentAssignee ? 'selected' : '';
        options.push(`<option value="${userId}" ${selected}>${allUsers[userId]}</option>`);
    });
    
    cell.innerHTML = `<select class="inline-edit-select">${options.join('')}</select>`;
    const select = cell.querySelector('select');
    select.focus();
    select.addEventListener('mousedown', (e) => e.stopPropagation());
    select.addEventListener('click', (e) => e.stopPropagation());
    
    select.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveInlineEdit(cell, task, field, select.value);
        } else if (e.key === 'Escape') {
            cancelEdit(cell);
        }
    });
    select.addEventListener('blur', () => {
        setTimeout(() => saveInlineEdit(cell, task, field, select.value), 150);
    });
}

function makeProgressSelectEditable(cell, task, field) {
    const currentValue = task.percentComplete;
    cell.innerHTML = `
        <select class="inline-edit-select">
            <option value="0" ${currentValue === 0 ? 'selected' : ''}>Not started</option>
            <option value="50" ${currentValue === 50 ? 'selected' : ''}>In progress</option>
            <option value="100" ${currentValue === 100 ? 'selected' : ''}>Completed</option>
        </select>
    `;
    const select = cell.querySelector('select');
    select.focus();
    select.addEventListener('mousedown', (e) => e.stopPropagation());
    select.addEventListener('click', (e) => e.stopPropagation());
    
    select.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveInlineEdit(cell, task, field, parseInt(select.value));
        } else if (e.key === 'Escape') {
            cancelEdit(cell);
        }
    });
    select.addEventListener('blur', () => {
        setTimeout(() => saveInlineEdit(cell, task, field, parseInt(select.value)), 150);
    });
}

function makePrioritySelectEditable(cell, task, field) {
    const currentValue = task.priority;
    cell.innerHTML = `
        <select class="inline-edit-select">
            <option value="9" ${currentValue === 9 ? 'selected' : ''}>Low</option>
            <option value="5" ${currentValue === 5 ? 'selected' : ''}>Medium</option>
            <option value="3" ${currentValue === 3 ? 'selected' : ''}>Important</option>
            <option value="1" ${currentValue === 1 ? 'selected' : ''}>Urgent</option>
        </select>
    `;
    const select = cell.querySelector('select');
    select.focus();
    select.addEventListener('mousedown', (e) => e.stopPropagation());
    select.addEventListener('click', (e) => e.stopPropagation());
    
    select.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveInlineEdit(cell, task, field, parseInt(select.value));
        } else if (e.key === 'Escape') {
            cancelEdit(cell);
        }
    });
    select.addEventListener('blur', () => {
        setTimeout(() => saveInlineEdit(cell, task, field, parseInt(select.value)), 150);
    });
}

async function saveInlineEdit(cell, task, field, newValue) {
    if (!currentEditingCell) return;
    
    try {
        // Add to edit cache instead of writing immediately
        if (!editCache[task.id]) {
            editCache[task.id] = {};
        }
        
        // Store the edit in cache
        editCache[task.id][field] = newValue;
        
        // Update local task object immediately for UI feedback
        if (field === 'assignments') {
            if (newValue) {
                task.assignments = { [newValue]: { '@odata.type': '#microsoft.graph.plannerAssignment', 'orderHint': ' !' } };
            } else {
                task.assignments = {};
            }
        } else if (field === 'startDateTime' || field === 'dueDateTime') {
            // Convert input date string to ISO format preserving local date
            task[field] = newValue ? inputDateToISO(newValue) : null;
        } else {
            task[field] = newValue;
        }
        
        // Clear editing state
        cell.classList.remove('editing');
        currentEditingCell = null;
        
        // Cancel existing timer if any
        if (editCacheTimer) {
            clearTimeout(editCacheTimer);
        }
        
        // Set new timer to batch writes
        editCacheTimer = setTimeout(() => {
            flushEditCache();
        }, EDIT_CACHE_DELAY_MS);
        
        // Refresh the view to show updated values
        applyFilters();
        
    } catch (error) {
        console.error('Error in inline edit:', error);
        cancelEdit(cell);
        alert('Failed to process edit: ' + error.message);
    }
}

// Flush cached edits to Planner API (batched to reduce 429 rate limiting)
async function flushEditCache() {
    if (Object.keys(editCache).length === 0) return;
    if (isProcessingQueue) return; // Already processing
    
    console.log('📤 Flushing edit cache with', Object.keys(editCache).length, 'tasks');
    
    const tasksToUpdate = Object.keys(editCache);
    const cacheSnapshot = { ...editCache };
    editCache = {}; // Clear cache while writing
    
    // Add to queue
    for (const taskId of tasksToUpdate) {
        editQueue.push({ taskId, edits: cacheSnapshot[taskId] });
    }
    
    // Process queue
    await processEditQueue();
}

async function processEditQueue() {
    if (isProcessingQueue || editQueue.length === 0) return;
    
    isProcessingQueue = true;
    let consecutiveErrors = 0;
    
    while (editQueue.length > 0) {
        const { taskId, edits } = editQueue.shift();
        const task = allTasks.find(t => t.id === taskId);
        
        if (!task) {
            console.warn(`⚠️ Task ${taskId} not found in allTasks`);
            continue;
        }
        
        try {
            // Prepare update payload from cached edits
            let updatePayload = {};
            
            for (const [field, newValue] of Object.entries(edits)) {
                if (field === 'assignments') {
                    if (newValue) {
                        updatePayload.assignments = { [newValue]: { '@odata.type': '#microsoft.graph.plannerAssignment', 'orderHint': ' !' } };
                    } else {
                        updatePayload.assignments = {};
                    }
                } else if (field === 'startDateTime' || field === 'dueDateTime') {
                    updatePayload[field] = newValue ? inputDateToISO(newValue) : null;
                } else {
                    updatePayload[field] = newValue;
                }
            }
            
            // Update via API with fetchGraph (handles 429 automatically)
            const response = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'If-Match': task['@odata.etag'],
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updatePayload)
            });
            
            if (!response.ok) {
                if (response.status === 429) {
                    // Put back at front of queue for retry
                    editQueue.unshift({ taskId, edits });
                    consecutiveErrors++;
                    
                    // Calculate exponential backoff
                    const delayMs = Math.min(EDIT_CACHE_DELAY_MS * Math.pow(2, consecutiveErrors), MAX_RETRY_DELAY_MS);
                    console.warn(`⚠️ 429 rate limit - retrying in ${delayMs}ms (${editQueue.length} items in queue)`);
                    
                    // Show countdown timer for queue rate limit
                    const startTime = Date.now();
                    const endTime = startTime + delayMs;
                    const updateCountdown = () => {
                        const remaining = Math.max(0, endTime - Date.now());
                        const seconds = Math.ceil(remaining / 1000);
                        if (remaining > 0) {
                            setStatus(`Syncing paused (${editQueue.length} pending) - retry in ${seconds}s`, 'orange');
                            setTimeout(updateCountdown, 100);
                        }
                    };
                    updateCountdown();
                    
                    // Wait before retrying
                    await sleep(delayMs);
                    continue;
                }
                throw new Error(`Update failed: ${response.status}`);
            }
            
            const updatedTask = await response.json();
            // Update local task object with server response
            const taskIndex = allTasks.findIndex(t => t.id === taskId);
            if (taskIndex >= 0) {
                allTasks[taskIndex] = updatedTask;
            }
            
            consecutiveErrors = 0; // Reset on success
            console.log(`✅ Task ${taskId} synced (${editQueue.length} remaining)`);
            
            // Brief delay between successful writes to avoid rate limiting
            if (editQueue.length > 0) {
                await sleep(300);
            }
            
        } catch (error) {
            console.error(`❌ Error saving edits for task ${taskId}:`, error);
            consecutiveErrors++;
            
            // Re-queue with limit
            if (consecutiveErrors < 5) {
                editQueue.push({ taskId, edits }); // Retry at end of queue
            } else {
                console.error(`❌ Giving up on task ${taskId} after too many errors`);
                setStatus(`Failed to sync some changes - please refresh`, 'red');
            }
        }
    }
    
    isProcessingQueue = false;
    
    // Refresh view after all updates
    if (editQueue.length === 0) {
        setStatus('Connected', 'green');
        console.log('✅ All edits synced successfully');
    }
}

function cancelEdit(cell) {
    if (!cell) return;
    const originalContent = cell.getAttribute('data-original-content');
    if (originalContent) {
        cell.innerHTML = originalContent;
    }
    cell.classList.remove('editing');
    cell.removeAttribute('data-original-content');
    if (currentEditingCell === cell) {
        currentEditingCell = null;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleBucket(header) {
    header.classList.toggle('expanded');
    const taskList = header.nextElementSibling;
    taskList.classList.toggle('expanded');
    
    // Track expanded state
    const bucketDiv = header.closest('.bucket-container');
    const bucketId = bucketDiv.getAttribute('data-bucket-id');
    if (header.classList.contains('expanded')) {
        expandedBuckets.add(bucketId);
    } else {
        expandedBuckets.delete(bucketId);
    }
}

function showAddTask(bucketId, bucketName) {
    // Default to "To Do" bucket if no bucket specified
    if (!bucketId) {
        const toDoBucket = allBuckets.find(b => b.name.toLowerCase() === 'to do');
        if (toDoBucket) {
            bucketId = toDoBucket.id;
            bucketName = toDoBucket.name;
        }
    }
    
    currentBucketId = bucketId;
    currentBucketName = bucketName;
    document.getElementById('addTaskModal').classList.add('show');
    document.getElementById('newTaskTitle').value = '';
    document.getElementById('newTaskAssignee').value = '';
    document.getElementById('newTaskProgress').value = '0';
    document.getElementById('newTaskPriority').value = '5';
    
    // Set Start Date to today (local timezone)
    document.getElementById('newTaskStartDate').value = getTodayAsInputValue();
    
    document.getElementById('newTaskDueDate').value = '';
    document.getElementById('newTaskNotes').value = '';
    
    // Populate assignee dropdown
    const assigneeSelect = document.getElementById('newTaskAssignee');
    assigneeSelect.innerHTML = '<option value="">Unassigned</option>' + Object.entries(allUsers)
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([userId, displayName]) => `<option value="${userId}">${displayName}</option>`)
        .join('');
    
    // Populate bucket dropdown (sorted alphabetically)
    const bucketSelect = document.getElementById('newTaskBucket');
    bucketSelect.innerHTML = allBuckets
        .slice()
        .filter(b => b.name !== GOALS_BUCKET_NAME)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(b => 
            `<option value="${b.id}" ${b.id === bucketId ? 'selected' : ''}>${b.name}</option>`
        ).join('');
    
    // Populate category names
    ['category5', 'category4', 'category3', 'category1', 'category7', 'category9', 'category2'].forEach(cat => {
        const label = document.querySelector(`#newCategoriesContainer .category-option[data-category="${cat}"] .category-name`);
        if (label) {
            const defaultNames = {
                'category1': 'Pink',
                'category2': 'Red',
                'category3': 'Yellow',
                'category4': 'Green',
                'category5': 'Blue',
                'category7': 'Bronze',
                'category9': 'Aqua'
            };
            label.textContent = planCategoryDescriptions[cat] || defaultNames[cat];
        }
    });
    
    // Clear categories
    ['newCategory5', 'newCategory4', 'newCategory3', 'newCategory1', 'newCategory7', 'newCategory9', 'newCategory2'].forEach(cat => {
        const checkbox = document.getElementById(cat);
        if (checkbox) checkbox.checked = false;
    });
}

function closeAddTaskModal() {
    document.getElementById('addTaskModal').classList.remove('show');
}

function showBugReportModal() {
    document.getElementById('bugReportModal').classList.add('show');
    document.getElementById('bugTitle').value = '';
    document.getElementById('bugPriority').value = '3'; // Default to Important
    document.getElementById('bugDescription').value = '';
    document.getElementById('bugTitle').focus();
}

function closeBugReportModal() {
    document.getElementById('bugReportModal').classList.remove('show');
}

async function submitBugReport() {
    const title = document.getElementById('bugTitle').value.trim();
    if (!title) {
        alert('Please enter a bug title');
        return;
    }

    const priority = parseInt(document.getElementById('bugPriority').value);
    const description = document.getElementById('bugDescription').value.trim();
    
    // Build description with submitter info
    const submitterInfo = `Submitted by: ${currentUserName || 'Unknown'} (${currentUserEmail || 'unknown@email.com'})\n` +
                         `Date: ${new Date().toLocaleString()}\n` +
                         `---\n\n`;
    const fullDescription = submitterInfo + (description || 'No additional details provided.');

    // Find or create "BUG: Planner Pro" bucket
    let bugBucket = allBuckets.find(b => b.name === 'BUG: Planner Pro');
    
    try {
        document.getElementById('submitBugBtn').disabled = true;
        document.getElementById('submitBugBtn').textContent = 'Submitting...';

        // If bucket doesn't exist, create it
        if (!bugBucket) {
            const createBucketResponse = await fetchGraph('https://graph.microsoft.com/v1.0/planner/buckets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'BUG: Planner Pro',
                    planId: planId,
                    orderHint: ' !'
                })
            });

            if (!createBucketResponse.ok) {
                throw new Error('Failed to create BUG bucket');
            }

            bugBucket = await createBucketResponse.json();
            allBuckets.push(bugBucket);
        }

        // Create the bug task
        const taskBody = {
            planId: planId,
            bucketId: bugBucket.id,
            title: title,
            percentComplete: 0,
            priority: priority,
            appliedCategories: {
                'category2': true  // Maintain Upgrades & Bug Fixes theme
            }
        };

        // Assign to current user
        if (currentUserId) {
            taskBody.assignments = {
                [currentUserId]: { '@odata.type': '#microsoft.graph.plannerAssignment', orderHint: ' !' }
            };
        }

        const response = await fetchGraph('https://graph.microsoft.com/v1.0/planner/tasks', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskBody)
        });

        if (!response.ok) {
            throw new Error('Failed to create bug report task');
        }

        const newTask = await response.json();

        // Add description if provided
        if (fullDescription) {
            // First GET the task details to get its etag
            const detailsResponse = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${newTask.id}/details`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (detailsResponse.ok) {
                const details = await detailsResponse.json();
                
                // Now PATCH with the correct etag
                await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${newTask.id}/details`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'If-Match': details['@odata.etag']
                    },
                    body: JSON.stringify({
                        description: fullDescription
                    })
                });
            }
        }

        closeBugReportModal();
        alert('Bug report submitted successfully!');
        loadTasks();
    } catch (error) {
        console.error('Error submitting bug report:', error);
        alert('Error submitting bug report: ' + error.message);
    } finally {
        document.getElementById('submitBugBtn').disabled = false;
        document.getElementById('submitBugBtn').textContent = 'Submit Bug Report';
    }
}

async function createTaskFromModal() {
    const title = document.getElementById('newTaskTitle').value.trim();
    if (!title) {
        alert('Please enter a task name');
        return;
    }

    const assigneeId = document.getElementById('newTaskAssignee').value;
    const progress = parseInt(document.getElementById('newTaskProgress').value);
    const priority = parseInt(document.getElementById('newTaskPriority').value);
    const startDate = document.getElementById('newTaskStartDate').value;
    const dueDate = document.getElementById('newTaskDueDate').value;
    const notes = document.getElementById('newTaskNotes').value.trim();
    const bucketId = document.getElementById('newTaskBucket').value;
    
    // Get selected categories (only include checked ones for new tasks)
    const appliedCategories = {};
    ['newCategory5', 'newCategory4', 'newCategory3', 'newCategory1', 'newCategory7', 'newCategory9', 'newCategory2'].forEach(catId => {
        const checkbox = document.getElementById(catId);
        if (checkbox && checkbox.checked) {
            appliedCategories[checkbox.value] = true;
        }
    });

    try {
        document.getElementById('createTaskBtn').disabled = true;
        document.getElementById('createTaskBtn').textContent = 'Creating...';

        const taskBody = {
            planId: planId,
            bucketId: bucketId,
            title: title,
            percentComplete: progress,
            priority: priority,
            appliedCategories: appliedCategories
        };

        if (startDate) {
            taskBody.startDateTime = inputDateToISO(startDate);
        }
        if (dueDate) {
            taskBody.dueDateTime = inputDateToISO(dueDate);
        }
        
        // Add assignee if selected
        if (assigneeId) {
            taskBody.assignments = {
                [assigneeId]: { '@odata.type': '#microsoft.graph.plannerAssignment', orderHint: ' !' }
            };
        }

        const response = await fetchGraph('https://graph.microsoft.com/v1.0/planner/tasks', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskBody)
        });

        if (!response.ok) {
            throw new Error('Failed to create task');
        }

        const newTask = await response.json();

        // Add notes if provided
        if (notes) {
            await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${newTask.id}/details`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'If-Match': newTask['@odata.etag']
                },
                body: JSON.stringify({
                    description: notes
                })
            });
        }

        closeAddTaskModal();
        loadTasks();
    } catch (error) {
        console.error('Error creating task:', error);
        alert('Error creating task: ' + error.message);
    } finally {
        document.getElementById('createTaskBtn').disabled = false;
        document.getElementById('createTaskBtn').textContent = 'Create Task';
    }
}

async function toggleTaskComplete(taskId, isComplete, etag) {
    try {
        const response = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'If-Match': etag
            },
            body: JSON.stringify({
                percentComplete: isComplete ? 100 : 0
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update task');
        }

        loadTasks();
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Error updating task: ' + error.message);
    }
}

let currentTaskId = null;
let currentTaskEtag = null;
let currentTaskDetailsEtag = null;

async function openTaskDetail(taskId) {
    currentTaskId = taskId;
    document.getElementById('taskDetailsModal').classList.add('show');
    document.getElementById('taskDetailsLoading').style.display = 'block';
    document.getElementById('taskDetailsContent').style.display = 'none';
    
    try {
        // Fetch task basic info
        const taskResponse = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        
        if (!taskResponse.ok) throw new Error('Failed to load task');
        const task = await taskResponse.json();
        currentTaskEtag = task['@odata.etag'];
        
        // Fetch task details (description, checklist, etc.)
        const detailsResponse = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/tasks/${taskId}/details`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        
        if (!detailsResponse.ok) throw new Error('Failed to load task details');
        const details = await detailsResponse.json();
        currentTaskDetailsEtag = details['@odata.etag'];
        
        // Populate modal
        document.getElementById('detailTaskTitle').textContent = task.title;
        document.getElementById('detailTaskName').value = task.title;
        document.getElementById('detailTaskProgress').value = task.percentComplete;
        document.getElementById('detailTaskPriority').value = task.priority;
        
        // Populate assigned to dropdown
        const assigneeSelect = document.getElementById('detailTaskAssignee');
        assigneeSelect.innerHTML = '<option value="">Unassigned</option>';
        
        // Add all known users to dropdown
        Object.entries(allUsers).sort((a, b) => a[1].localeCompare(b[1])).forEach(([userId, displayName]) => {
            const option = document.createElement('option');
            option.value = userId;
            option.textContent = displayName;
            assigneeSelect.appendChild(option);
        });
        
        // Set current assignee
        if (task.assignments && Object.keys(task.assignments).length > 0) {
            const assigneeId = Object.keys(task.assignments)[0];
            assigneeSelect.value = assigneeId;
        } else {
            assigneeSelect.value = '';
        }
        
        console.log('Loaded task from Planner - Priority value:', task.priority, 'Title:', task.title);
        
        // Format dates for input fields (using local timezone to avoid offset issues)
        if (task.startDateTime) {
            document.getElementById('detailTaskStartDate').value = formatDateForInput(task.startDateTime);
        } else {
            document.getElementById('detailTaskStartDate').value = '';
        }
        
        if (task.dueDateTime) {
            document.getElementById('detailTaskDueDate').value = formatDateForInput(task.dueDateTime);
        } else {
            document.getElementById('detailTaskDueDate').value = '';
        }
        
        document.getElementById('detailTaskDescription').value = details.description || '';
        
        // Populate bucket dropdown (sorted alphabetically)
        const bucketSelect = document.getElementById('detailTaskBucket');
        bucketSelect.innerHTML = allBuckets
            .slice()
            .filter(b => !b.isCompass && b.name !== GOALS_BUCKET_NAME)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(b => 
                `<option value="${b.id}" ${b.id === task.bucketId ? 'selected' : ''}>${b.name}</option>`
            ).join('');
        
        // Populate categories
        ['category5', 'category4', 'category3', 'category1', 'category7', 'category9', 'category2'].forEach(cat => {
            const label = document.querySelector(`#categoriesContainer .category-option[data-category="${cat}"] .category-name`);
            if (label) {
                const defaultNames = {
                    'category1': 'Pink',
                    'category2': 'Red',
                    'category3': 'Yellow',
                    'category4': 'Green',
                    'category5': 'Blue',
                    'category7': 'Bronze',
                    'category9': 'Aqua'
                };
                label.textContent = planCategoryDescriptions[cat] || defaultNames[cat];
            }
        });
        
        // Set checkboxes
        const appliedCategories = task.appliedCategories || {};
        ['category5', 'category4', 'category3', 'category1', 'category7', 'category9', 'category2'].forEach(cat => {
            const checkbox = document.getElementById(cat);
            if (checkbox) {
                checkbox.checked = appliedCategories.hasOwnProperty(cat);
            }
        });
        
        // Set Planner link
        // Planner now lives under planner.cloud.microsoft
        document.getElementById('openInPlannerLink').href = 
            `https://planner.cloud.microsoft/tasks/${taskId}`;
        
        // Show content
        document.getElementById('taskDetailsLoading').style.display = 'none';
        document.getElementById('taskDetailsContent').style.display = 'block';
    } catch (error) {
        console.error('Error loading task details:', error);
        alert('Error loading task details: ' + error.message);
        closeTaskDetailsModal();
    }
}

function closeTaskDetailsModal() {
    document.getElementById('taskDetailsModal').classList.remove('show');
    currentTaskId = null;
    currentTaskEtag = null;
    currentTaskDetailsEtag = null;
}

async function saveTaskDetails() {
    if (!currentTaskId || !currentTaskEtag) {
        alert('Error: Task information missing');
        return;
    }
    
    const title = document.getElementById('detailTaskName').value.trim();
    if (!title) {
        alert('Please enter a task name');
        return;
    }
    
    try {
        document.getElementById('saveTaskBtn').disabled = true;
        document.getElementById('saveTaskBtn').textContent = 'Saving...';
        
        const progress = parseInt(document.getElementById('detailTaskProgress').value);
        const priority = parseInt(document.getElementById('detailTaskPriority').value);
        console.log('Saving task - Priority value being sent to Planner:', priority);
        const startDate = document.getElementById('detailTaskStartDate').value;
        const dueDate = document.getElementById('detailTaskDueDate').value;
        const bucketId = document.getElementById('detailTaskBucket').value;
        const description = document.getElementById('detailTaskDescription').value.trim();
        const assigneeUserId = document.getElementById('detailTaskAssignee').value;
        
        // Get current task to check existing assignments
        const currentTask = allTasks.find(t => t.id === currentTaskId);
        
        // Get selected categories (must include all with true/false for Graph API)
        const appliedCategories = {};
        ['category5', 'category4', 'category3', 'category1', 'category7', 'category9', 'category2'].forEach(cat => {
            const checkbox = document.getElementById(cat);
            if (checkbox) {
                appliedCategories[cat] = checkbox.checked;
            }
        });
        
        // Build assignments object
        const assignments = {};
        
        // If there are existing assignments, set them to null (to remove)
        if (currentTask && currentTask.assignments) {
            Object.keys(currentTask.assignments).forEach(userId => {
                assignments[userId] = null;
            });
        }
        
        // If a user is selected, assign to them
        if (assigneeUserId) {
            assignments[assigneeUserId] = {
                '@odata.type': '#microsoft.graph.plannerAssignment',
                orderHint: ' !'
            };
        }
        
        // Update basic task info
        const taskBody = {
            title: title,
            percentComplete: progress,
            priority: priority,
            bucketId: bucketId,
            appliedCategories: appliedCategories,
            assignments: assignments
        };
        
        if (startDate) {
            taskBody.startDateTime = inputDateToISO(startDate);
        } else {
            taskBody.startDateTime = null;
        }
        
        if (dueDate) {
            taskBody.dueDateTime = inputDateToISO(dueDate);
        } else {
            taskBody.dueDateTime = null;
        }
        
        const taskResponse = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/tasks/${currentTaskId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'If-Match': currentTaskEtag
                },
                body: JSON.stringify(taskBody)
            }
        );
        
        if (!taskResponse.ok) {
            throw new Error('Failed to update task');
        }
        
        // Update task details (description)
        if (currentTaskDetailsEtag) {
            const detailsResponse = await fetchGraph(
                `https://graph.microsoft.com/v1.0/planner/tasks/${currentTaskId}/details`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'If-Match': currentTaskDetailsEtag
                    },
                    body: JSON.stringify({
                        description: description
                    })
                }
            );
            
            if (!detailsResponse.ok) {
                console.warn('Failed to update task description');
            }
        }
        
        closeTaskDetailsModal();
        // Reload tasks to refresh the display with updated data
        loadTasks();
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Error saving task: ' + error.message);
    } finally {
        document.getElementById('saveTaskBtn').disabled = false;
        document.getElementById('saveTaskBtn').textContent = 'Save Changes';
    }
}

async function deleteTaskDetail() {
    if (!currentTaskId) return;
    
    const confirmed = confirm('Are you sure you want to delete this task? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
        document.getElementById('deleteTaskBtn').disabled = true;
        document.getElementById('deleteTaskBtn').textContent = 'Deleting...';
        
        // Get current task etag
        const getRes = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${currentTaskId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!getRes.ok) {
            throw new Error('Failed to fetch task for deletion');
        }
        
        const task = await getRes.json();
        const etag = task['@odata.etag'];
        
        // Delete the task
        const deleteRes = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${currentTaskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'If-Match': etag
            }
        });
        
        if (!deleteRes.ok) {
            throw new Error('Failed to delete task');
        }
        
        closeTaskDetailsModal();
        loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task: ' + error.message);
    } finally {
        document.getElementById('deleteTaskBtn').disabled = false;
        document.getElementById('deleteTaskBtn').textContent = 'Delete';
    }
}

function sortBucket(bucketId, column) {
    const currentSort = sortState[bucketId];
    let direction = 'asc';
    
    // Toggle direction if clicking same column
    if (currentSort && currentSort.column === column) {
        direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }
    
    sortState[bucketId] = { column, direction };
    // Re-render with existing data and filters
    applyFilters();
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const profileContainer = document.getElementById('profileContainer');
    const dropdown = document.getElementById('profileDropdown');
    if (profileContainer && !profileContainer.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

function signOut() {
    // Clear tokens
    localStorage.removeItem('plannerAccessToken');
    localStorage.removeItem('tokenExpiration');
    accessToken = null;
    
    // Reset state
    allBuckets = [];
    allTasks = [];
    allTaskDetails = {};
    expandedBuckets.clear();
    sortState = {};
    
    // Update UI
    updateAuthUI(false);
    
    // Clear container
    document.getElementById('tasksContainer').innerHTML = '';
}

function showNewBucketInput() {
    document.getElementById('newBucketContainer').style.display = 'block';
    document.getElementById('newBucketName').focus();
}

function cancelNewBucket() {
    document.getElementById('newBucketContainer').style.display = 'none';
    document.getElementById('newBucketName').value = '';
}

function showOptions() {
    document.getElementById('defaultViewInput').value = currentView;
    document.getElementById('defaultGroupByInput').value = currentGroupBy;
    document.getElementById('showCompletedDefaultInput').checked = showCompleted;
    document.getElementById('compassPositionInput').value = compassPosition;
    document.getElementById('showCompassDefaultInput').checked = compassVisible;
    document.getElementById('updateCheckIntervalInput').value = updateCheckIntervalSeconds;
    
    document.getElementById('optionsModal').style.display = 'flex';
    switchOptionsTab('views');
}

function closeOptions() {
    const modal = document.getElementById('optionsModal');
    if (modal) modal.style.display = 'none';
}

function switchOptionsTab(tabName) {
    const tabs = document.querySelectorAll('.options-tab');
    tabs.forEach(tab => { tab.style.display = 'none'; });
    const target = document.getElementById(`${tabName}Tab`);
    if (target) target.style.display = 'block';
    const navItems = document.querySelectorAll('.options-nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    // Mark the corresponding nav item active using data-tab attribute
    const activeItem = Array.from(navItems).find(i => i.getAttribute('data-tab') === tabName);
    if (activeItem) activeItem.classList.add('active');
}

function showSawSuggestions(category) {
    const categoryNames = {
        physical: 'Physical',
        mental: 'Mental',
        socialEmotional: 'Social/Emotional',
        spiritual: 'Spiritual'
    };

    const suggestions = SAW_SUGGESTIONS[category] || [];
    const categoryName = categoryNames[category] || category;

    // Helper to truncate to max 6 words
    const truncateToWords = (text, max = 6) => {
        if (!text) return '';
        const parts = text.trim().split(/\s+/);
        return parts.slice(0, max).join(' ');
    };

    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 0; z-index: 10000; width: 64vw; max-width: 600px; box-sizing: border-box; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; flex-direction: column;';

    // Header with title and close button
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color); flex-shrink: 0;';
    
    const h3 = document.createElement('h3');
    h3.textContent = `Ideas for ${categoryName} Renewal:`;
    h3.style.cssText = 'margin: 0; color: var(--compass-text); flex: 1;';
    header.appendChild(h3);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-primary); padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;';
    closeBtn.onclick = () => { modal.remove(); backdrop.remove(); };
    header.appendChild(closeBtn);

    modal.appendChild(header);

    // Scroll area
    const scroll = document.createElement('div');
    scroll.style.cssText = 'max-height: 420px; overflow-y: auto; padding: 16px 20px;';

    const ul = document.createElement('ul');
    ul.className = 'saw-suggestions-list';
    ul.style.cssText = 'list-style: none; padding-left: 0; color: var(--compass-text); margin: 0;';

    suggestions.forEach((s) => {
        const t = truncateToWords(s, 6);
        const li = document.createElement('li');
        li.className = 'saw-suggestion-item';
        li.style.cssText = 'padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;';
        li.textContent = t;
        li.title = `Click to add to ${categoryName}`;
        li.addEventListener('mouseover', () => { li.style.backgroundColor = 'rgba(255,255,255,0.05)'; });
        li.addEventListener('mouseout', () => { li.style.backgroundColor = 'transparent'; });
        li.addEventListener('click', () => {
            addSuggestionToSaw(category, t);
            modal.remove();
            const backdropEl = document.getElementById('saw-suggestions-backdrop');
            if (backdropEl) backdropEl.remove();
        });
        ul.appendChild(li);
    });
    scroll.appendChild(ul);

    const hint = document.createElement('p');
    hint.textContent = `Click any suggestion to add it to your ${categoryName} field`;
    hint.style.cssText = 'font-size: 11px; color: var(--text-muted); margin-top: 12px; margin-bottom: 0;';
    scroll.appendChild(hint);

    modal.appendChild(scroll);

    const backdrop = document.createElement('div');
    backdrop.id = 'saw-suggestions-backdrop';
    backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999;';
    backdrop.onclick = () => { modal.remove(); backdrop.remove(); };

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            backdrop.remove();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}


async function syncThemesToPlanner(themeNames) {
    if (!accessToken || !planDetailsEtag) {
        console.warn('Cannot sync themes: missing access token or plan details etag');
        return false;
    }
    
    try {
        // Build category descriptions object with all 7 themes
        const categoryDescriptions = {
            category5: themeNames.category5 || THEME_DEFAULTS.category5,
            category4: themeNames.category4 || THEME_DEFAULTS.category4,
            category3: themeNames.category3 || THEME_DEFAULTS.category3,
            category1: themeNames.category1 || THEME_DEFAULTS.category1,
            category7: themeNames.category7 || THEME_DEFAULTS.category7,
            category9: themeNames.category9 || THEME_DEFAULTS.category9,
            category2: themeNames.category2 || THEME_DEFAULTS.category2
        };
        
        const response = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/plans/${planId}/details`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'If-Match': planDetailsEtag
                },
                body: JSON.stringify({ categoryDescriptions })
            }
        );
        
        if (response.ok) {
            const newEtag = response.headers.get('etag') || response.headers.get('ETag') || planDetailsEtag;
            if (response.status === 204) {
                planDetailsEtag = newEtag;
                console.log('✅ Theme names synced to Planner (204)');
                return true;
            }
            try {
                const updated = await response.json();
                planCategoryDescriptions = updated.categoryDescriptions || {};
                planDetailsEtag = updated['@odata.etag'] || newEtag;
            } catch (parseErr) {
                // No body returned; treat as success
                planDetailsEtag = newEtag;
            }
            console.log('✅ Theme names synced to Planner');
            return true;
        } else {
            const error = await response.text();
            console.error('Failed to sync themes to Planner:', error);
            return false;
        }
    } catch (err) {
        console.error('Error syncing themes to Planner:', err);
        return false;
    }
}

async function saveOptions() {
    const defaultView = document.getElementById('defaultViewInput').value;
    const defaultGroupBy = document.getElementById('defaultGroupByInput').value;
    const showCompletedDefault = document.getElementById('showCompletedDefaultInput').checked;
    const compassPos = document.getElementById('compassPositionInput').value;
    const showCompassDefault = document.getElementById('showCompassDefaultInput').checked;
    let updateInterval = parseInt(document.getElementById('updateCheckIntervalInput').value) || 60;
    
    // Enforce minimum 60 seconds
    if (updateInterval < 60) {
        updateInterval = 60;
        document.getElementById('updateCheckIntervalInput').value = 60;
    }
    
    // Save to local state and localStorage
    currentView = defaultView;
    localStorage.setItem('plannerDefaultView', defaultView);
    currentGroupBy = defaultGroupBy;
    localStorage.setItem('plannerDefaultGroupBy', defaultGroupBy);
    showCompleted = showCompletedDefault;
    localStorage.setItem('plannerShowCompleted', showCompletedDefault ? 'true' : 'false');
    compassPosition = compassPos;
    localStorage.setItem('plannerCompassPosition', compassPos);
    compassVisible = showCompassDefault;
    localStorage.setItem('plannerCompassVisible', showCompassDefault ? 'true' : 'false');
    updateCheckIntervalSeconds = updateInterval;
    localStorage.setItem('plannerUpdateCheckInterval', updateInterval.toString());
    
    // Save to To Do for sync
    await saveOptionsData(defaultView, defaultGroupBy, showCompletedDefault, compassPos, showCompassDefault);

    // Apply compass visibility and position
    if (showCompassDefault) {
        const panel = document.getElementById('weeklyCompassPanel');
        const wrapper = document.getElementById('mainContentWrapper');
        if (panel) panel.style.display = 'block';
        if (wrapper) wrapper.style.display = 'flex';
    } else {
        const panel = document.getElementById('weeklyCompassPanel');
        const wrapper = document.getElementById('mainContentWrapper');
        if (panel) panel.style.display = 'none';
        if (wrapper) wrapper.style.display = 'block';
    }
    applyCompassPosition();

    // Immediately apply the new view/group/filter to the main screen
    const viewSelect = document.getElementById('viewSelect');
    if (viewSelect) {
        viewSelect.value = defaultView;
        changeView();
    } else {
        // Fallback: ensure currentView takes effect without the dropdown
        currentView = defaultView;
    }
    const groupSelect = document.getElementById('groupBySelect');
    if (groupSelect) {
        groupSelect.value = defaultGroupBy;
        changeGroupBy();
    } else {
        currentGroupBy = defaultGroupBy;
    }
    const showCompletedCheckbox = document.getElementById('showCompletedCheckbox');
    if (showCompletedCheckbox) {
        showCompletedCheckbox.checked = showCompletedDefault;
    }
    applyFilters();

    closeOptions();
    alert('View preferences saved!');
    await loadTasks();
}

// Expose modal handlers for inline onclick bindings
window.showOptions = showOptions;
window.closeOptions = closeOptions;
window.switchOptionsTab = switchOptionsTab;
window.saveOptions = saveOptions;

async function saveOptionsData(defaultView, defaultGroupBy, showCompletedDefault, compassPos, showCompassDefault) {
    if (!optionsListId || !accessToken) return;
    
    try {
        // Fetch existing tasks
        const existingResponse = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${optionsListId}/tasks`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!existingResponse.ok) return;
        
        const existingData = await existingResponse.json();
        const existingTasks = existingData.value || [];
        
        // Create new option tasks
        const createTask = async (title, body) => {
            const resp = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${optionsListId}/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, body: { contentType: 'text', content: body } })
            });
            if (!resp.ok) throw new Error(`Create failed (${resp.status})`);
            return resp;
        };
        
        await createTask('OPTION_DEFAULT_VIEW', defaultView);
        await createTask('OPTION_DEFAULT_GROUPBY', defaultGroupBy);
        await createTask('OPTION_SHOW_COMPLETED', showCompletedDefault ? 'true' : 'false');
        await createTask('OPTION_COMPASS_POSITION', compassPos || 'right');
        await createTask('OPTION_COMPASS_VISIBLE', showCompassDefault ? 'true' : 'false');
        
        // Delete old tasks
        await Promise.all(existingTasks.map(task =>
            fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${optionsListId}/tasks/${task.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
        ));
    } catch (err) {
        console.error('Failed to save options to To Do:', err);
    }
}

async function createNewBucket() {
    const bucketName = document.getElementById('newBucketName').value.trim();
    if (!bucketName) {
        alert('Please enter a bucket name');
        return;
    }
    
    try {
        const response = await fetch('https://graph.microsoft.com/v1.0/planner/buckets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: bucketName,
                planId: planId,
                orderHint: ' !'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create bucket');
        }
        
        const newBucket = await response.json();
        
        // Add to allBuckets
        allBuckets.push(newBucket);
        
        // Update dropdown
        const bucketSelect = document.getElementById('detailTaskBucket');
        const option = document.createElement('option');
        option.value = newBucket.id;
        option.text = newBucket.name;
        option.selected = true;
        bucketSelect.add(option);
        
        // Hide input
        cancelNewBucket();
        
        alert(`Bucket "${bucketName}" created successfully!`);
    } catch (error) {
        console.error('Error creating bucket:', error);
        alert('Error creating bucket: ' + error.message);
    }
}

function sortTasks(tasks, column, direction) {
    const sorted = [...tasks].sort((a, b) => {
        let aVal, bVal;
        
        switch(column) {
            case 'id':
                aVal = taskSequentialIds[a.id] || 0;
                bVal = taskSequentialIds[b.id] || 0;
                break;
            case 'title':
                aVal = a.title.toLowerCase();
                bVal = b.title.toLowerCase();
                break;
            case 'assigned':
                aVal = (a.assignments && Object.keys(a.assignments).length > 0) ? 1 : 0;
                bVal = (b.assignments && Object.keys(b.assignments).length > 0) ? 1 : 0;
                break;
            case 'startDate':
                aVal = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
                bVal = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
                break;
            case 'dueDate':
                aVal = a.dueDateTime ? new Date(a.dueDateTime).getTime() : 0;
                bVal = b.dueDateTime ? new Date(b.dueDateTime).getTime() : 0;
                break;
            case 'progress':
                aVal = a.percentComplete;
                bVal = b.percentComplete;
                break;
            case 'priority':
                aVal = a.priority;
                bVal = b.priority;
                break;
            default:
                return 0;
        }
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    return sorted;
}

// Bulk selection and operations
function toggleTaskSelection(taskId) {
    if (compassTaskIds.has(taskId)) return; // Compass tasks are read-only in bulk operations
    if (selectedTasks.has(taskId)) {
        selectedTasks.delete(taskId);
    } else {
        selectedTasks.add(taskId);
    }
    updateBulkEditSidebar();
    applyFilters(); // Re-render to update checkboxes
}

function updateBulkEditSidebar() {
    const sidebar = document.getElementById('bulkEditSidebar');
    const countSpan = document.getElementById('bulkSidebarCount');
    const assigneeSelect = document.getElementById('bulkAssigneeSelect');
    const bucketSelect = document.getElementById('bulkBucketSelect');
    if (!sidebar) return;
    
    if (selectedTasks.size > 0) {
        sidebar.style.display = 'block';
        if (countSpan) countSpan.textContent = `${selectedTasks.size} selected`;
        
        // Populate assignee dropdown if we haven't already
        if (assigneeSelect && assigneeSelect.options.length === 1) { // Only "No change" option exists
            Object.entries(allUsers).sort((a, b) => a[1].localeCompare(b[1])).forEach(([userId, displayName]) => {
                const opt = document.createElement('option');
                opt.value = userId;
                opt.textContent = displayName;
                assigneeSelect.appendChild(opt);
            });
        }
        
        // Populate bucket dropdown if we haven't already
        if (bucketSelect && bucketSelect.options.length === 1) { // Only "No change" option exists
            (allBuckets || []).slice().filter(b => !b.isCompass && b.name !== GOALS_BUCKET_NAME).sort((a, b) => a.name.localeCompare(b.name)).forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.name;
                bucketSelect.appendChild(opt);
            });
        }
    } else {
        sidebar.style.display = 'none';
    }
}

function clearSelection() {
    selectedTasks.clear();
    const sidebar = document.getElementById('bulkEditSidebar');
    if (sidebar) sidebar.style.display = 'none';
    // Reset all form inputs
    const assigneeSelect = document.getElementById('bulkAssigneeSelect');
    const bucketSelect = document.getElementById('bulkBucketSelect');
    const prioritySelect = document.getElementById('bulkPrioritySelect');
    const progressSelect = document.getElementById('bulkProgressSelect');
    const startDate = document.getElementById('bulkStartDate');
    const dueDate = document.getElementById('bulkDueDate');
    if (assigneeSelect) assigneeSelect.value = '';
    if (bucketSelect) bucketSelect.value = '';
    if (prioritySelect) prioritySelect.value = '';
    if (progressSelect) progressSelect.value = '';
    if (startDate) startDate.value = '';
    if (dueDate) dueDate.value = '';
    applyFilters(); // Re-render to update checkboxes
}

async function bulkApplyAllChanges() {
    if (selectedTasks.size === 0) return;
    const assigneeUserId = document.getElementById('bulkAssigneeSelect')?.value;
    const bucketId = document.getElementById('bulkBucketSelect')?.value || '';
    const priorityVal = document.getElementById('bulkPrioritySelect')?.value || '';
    const progressVal = document.getElementById('bulkProgressSelect')?.value || '';
    const startDate = document.getElementById('bulkStartDate')?.value || '';
    const dueDate = document.getElementById('bulkDueDate')?.value || '';
    
    // Only proceed if there's at least one change to apply
    // Note: assigneeUserId can be undefined (no change), '' (no change), or a user ID
    if (assigneeUserId === undefined || assigneeUserId === '') {
        // If assignee is not changed, check if anything else is being changed
        if (!bucketId && !priorityVal && !progressVal && !startDate && !dueDate) {
            alert('Please select at least one field to change');
            return;
        }
    }
    
    try {
        const taskIds = Array.from(selectedTasks);
        await mapWithConcurrency(taskIds, async (taskId) => {
            const getRes = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
                method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!getRes.ok) return;
            const task = await getRes.json();
            const etag = task['@odata.etag'];
            const body = {};
            
            // Handle assignee - only if a specific value was chosen (not empty/no change)
            if (assigneeUserId && assigneeUserId !== '') {
                if (!body.assignments) body.assignments = task.assignments || {};
                body.assignments[assigneeUserId] = { '@odata.type': '#microsoft.graph.plannerAssignment', orderHint: ' !' };
                // Remove from other assignees
                Object.keys(task.assignments || {}).forEach(uid => {
                    if (uid !== assigneeUserId && uid !== '@odata.type') {
                        body.assignments[uid] = null;
                    }
                });
            }
            
            // Handle bucket
            if (bucketId) body.bucketId = bucketId;
            
            // Handle priority
            if (priorityVal) body.priority = parseInt(priorityVal);
            
            // Handle progress
            if (progressVal) body.percentComplete = parseInt(progressVal);
            
            // Handle dates
            if (startDate) body.startDateTime = new Date(startDate).toISOString();
            if (dueDate) body.dueDateTime = new Date(dueDate).toISOString();
            
            if (Object.keys(body).length === 0) return;
            
            await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'If-Match': etag
                },
                body: JSON.stringify(body)
            });
            await sleep(250);
        }, 2);
        clearSelection();
        loadTasks();
    } catch (err) {
        console.error('Bulk apply all changes error:', err);
        alert('Error applying bulk edits: ' + err.message);
    }
}

function showBulkDeleteConfirm() {
    const el = document.getElementById('bulkDeleteConfirm');
    if (el) el.style.display = 'block';
}
function hideBulkDeleteConfirm() {
    const el = document.getElementById('bulkDeleteConfirm');
    const input = document.getElementById('bulkDeleteInput');
    const btn = document.getElementById('bulkDeleteConfirmBtn');
    if (el) el.style.display = 'none';
    if (input) input.value = '';
    if (btn) btn.disabled = true; btn && (btn.style.cursor = 'not-allowed');
}
function updateDeleteConfirmState() {
    const input = document.getElementById('bulkDeleteInput');
    const btn = document.getElementById('bulkDeleteConfirmBtn');
    if (!input || !btn) return;
    const ok = input.value.trim().toUpperCase() === 'DELETE';
    btn.disabled = !ok;
    btn.style.cursor = ok ? 'pointer' : 'not-allowed';
}

async function bulkDeleteSelected() {
    if (selectedTasks.size === 0) return;
    const input = document.getElementById('bulkDeleteInput');
    if (!input || input.value.trim().toUpperCase() !== 'DELETE') return;
    try {
        const taskIds = Array.from(selectedTasks);
        await mapWithConcurrency(taskIds, async (taskId) => {
            const getRes = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!getRes.ok) return;
            const task = await getRes.json();
            const etag = task['@odata.etag'];
            await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'If-Match': etag
                }
            });
            await sleep(300);
        }, 2);
        hideBulkDeleteConfirm();
        clearSelection();
        loadTasks();
    } catch (err) {
        console.error('Bulk delete error:', err);
        alert('Error deleting tasks: ' + err.message);
    }
}

async function bulkMarkComplete() {
    if (selectedTasks.size === 0) return;
    
    const confirmed = confirm(`Mark ${selectedTasks.size} task(s) as complete?`);
    if (!confirmed) return;
    
    try {
        const promises = Array.from(selectedTasks).map(async (taskId) => {
            const task = allTasks.find(t => t.id === taskId);
            if (!task || task.percentComplete === 100) return;
            
            return fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'If-Match': task['@odata.etag']
                },
                body: JSON.stringify({ percentComplete: 100 })
            });
        });
        
        await Promise.all(promises);
        clearSelection();
        loadTasks();
    } catch (err) {
        console.error('Bulk complete error:', err);
        alert('Error marking tasks complete: ' + err.message);
    }
}

async function bulkMarkIncomplete() {
    if (selectedTasks.size === 0) return;
    
    const confirmed = confirm(`Mark ${selectedTasks.size} task(s) as incomplete?`);
    if (!confirmed) return;
    
    try {
        const promises = Array.from(selectedTasks).map(async (taskId) => {
            const task = allTasks.find(t => t.id === taskId);
            if (!task || task.percentComplete === 0) return;
            
            return fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'If-Match': task['@odata.etag']
                },
                body: JSON.stringify({ percentComplete: 0 })
            });
        });
        
        await Promise.all(promises);
        clearSelection();
        loadTasks();
    } catch (err) {
        console.error('Bulk incomplete error:', err);
        alert('Error marking tasks incomplete: ' + err.message);
    }
}

// ===== Weekly Compass Feature =====
let compassData = {
    quote: '',
    dateRange: '',
    sharpenSaw: {
        physical: '',
        socialEmotional: '',
        mental: '',
        spiritual: ''
    },
    roles: []
};
let compassListId = null; // PlannerCompass_Data - stores metadata
let compassTasksListId = null; // Weekly Compass - stores actual tasks
let optionsListId = null;
const storedCompassVisible = localStorage.getItem('plannerCompassVisible');
let compassVisible = storedCompassVisible === null ? true : storedCompassVisible === 'true';
let compassEditMode = false;
let compassAutoSaveTimer = null;

function injectCompassBucket() {
    if (compassTasks.length === 0) {
        allBuckets = allBuckets.filter(b => b.id !== COMPASS_BUCKET_ID);
        return;
    }
    const exists = allBuckets.some(b => b.id === COMPASS_BUCKET_ID);
    if (!exists) {
        allBuckets = [...allBuckets, { id: COMPASS_BUCKET_ID, name: COMPASS_BUCKET_NAME, isCompass: true }];
    }
}

function refreshCompassTasksFromData(shouldRender = false) {
    if (!compassData || !compassData.roles) return;
    
    // Parse date range to get start and due dates
    let startDateTime = null;
    let dueDateTime = null;
    if (compassData.dateRange) {
        const dateRangeParts = compassData.dateRange.split(' - ');
        if (dateRangeParts.length === 2) {
            const startDate = new Date(dateRangeParts[0]);
            const endDate = new Date(dateRangeParts[1]);
            if (!isNaN(startDate.getTime())) {
                startDateTime = startDate.toISOString();
            }
            if (!isNaN(endDate.getTime())) {
                // Set due date to end of day
                endDate.setHours(23, 59, 59, 999);
                dueDateTime = endDate.toISOString();
            }
        }
    }
    
    const tasks = [];
    (compassData.roles || []).forEach((role, roleIndex) => {
        const rocks = role.rocks || [];
        rocks.forEach((rock, rockIndex) => {
            const rockObj = typeof rock === 'string' ? { text: rock, done: false } : (rock || { text: '', done: false });
            if (!rockObj.text) return;
            
            // Create assignment object for current user
            const assignments = {};
            if (currentUserId) {
                assignments[currentUserId] = {
                    '@odata.type': '#microsoft.graph.plannerAssignment',
                    assignedDateTime: new Date().toISOString()
                };
            }
            
            tasks.push({
                id: `compass-${roleIndex}-${rockIndex}`,
                bucketId: COMPASS_BUCKET_ID,
                title: rockObj.text,
                percentComplete: rockObj.done ? 100 : 0,
                priority: 5,
                startDateTime: startDateTime,
                dueDateTime: dueDateTime,
                assignments: assignments,
                appliedCategories: {},
                compassRole: role.name || `Role ${roleIndex + 1}`,
                compassType: 'rock',
                roleIndex,
                rockIndex,
                source: 'compass'
            });
        });
    });

    compassTasks = tasks;
    compassTaskIds = new Set(tasks.map(t => t.id));
    injectCompassBucket();
    if (shouldRender) {
        applyFilters();
    }
}

function handleCompassTaskToggle(taskId, isDone) {
    const task = compassTasks.find(t => t.id === taskId);
    if (!task) return;
    if (task.compassType === 'rock') {
        toggleCompassRockDone(task.roleIndex, task.rockIndex, isDone);
    }
}

async function initializeCompass() {
    try {
        if (!accessToken) return; // Can't initialize without token
        
        // Try to find existing compass list
        const listsResponse = await fetchGraph('https://graph.microsoft.com/v1.0/me/todo/lists', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!listsResponse.ok) {
            console.error('Failed to fetch To Do lists:', listsResponse.status);
            return;
        }
        
        const listsData = await listsResponse.json();
        let compassList = listsData.value.find(list => list.displayName === 'PlannerCompass_Data');
        let compassTasksList = listsData.value.find(list => list.displayName === 'Weekly Compass');
        
        if (!compassList) {
            // Create the metadata list if it doesn't exist
            const createResponse = await fetchGraph('https://graph.microsoft.com/v1.0/me/todo/lists', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    displayName: 'PlannerCompass_Data'
                })
            });
            
            if (!createResponse.ok) {
                console.error('Failed to create compass metadata list:', createResponse.status);
                return;
            }
            
            compassList = await createResponse.json();
        }
        
        if (!compassTasksList) {
            // Create the tasks list if it doesn't exist
            const createResponse = await fetchGraph('https://graph.microsoft.com/v1.0/me/todo/lists', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    displayName: 'Weekly Compass'
                })
            });
            
            if (!createResponse.ok) {
                console.error('Failed to create Weekly Compass list:', createResponse.status);
                return;
            }
            
            compassTasksList = await createResponse.json();
        }
        
        compassListId = compassList.id;
        compassTasksListId = compassTasksList.id;
        await loadCompassData();
        await initializeGoals(); // Initialize goals list and data
        await initializeOptions();
        
        // Apply saved compass visibility preference
        if (compassVisible) {
            const panel = document.getElementById('weeklyCompassPanel');
            const wrapper = document.getElementById('mainContentWrapper');
            if (panel) panel.style.display = 'block';
            if (wrapper) wrapper.style.display = 'flex';
        } else {
            const panel = document.getElementById('weeklyCompassPanel');
            const wrapper = document.getElementById('mainContentWrapper');
            if (panel) panel.style.display = 'none';
            if (wrapper) wrapper.style.display = 'block';
        }
        applyCompassPosition();
    } catch (err) {
        console.error('Failed to initialize compass:', err);
    }
}

async function initializeOptions() {
    try {
        if (!accessToken) return;
        
        const listsResponse = await fetchGraph('https://graph.microsoft.com/v1.0/me/todo/lists', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!listsResponse.ok) return;
        
        const listsData = await listsResponse.json();
        let optionsList = listsData.value.find(list => list.displayName === 'PlannerOptions_Data');
        
        if (!optionsList) {
            const createResponse = await fetchGraph('https://graph.microsoft.com/v1.0/me/todo/lists', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ displayName: 'PlannerOptions_Data' })
            });
            
            if (!createResponse.ok) return;
            optionsList = await createResponse.json();
        }
        
        optionsListId = optionsList.id;
        await loadOptionsData();
    } catch (err) {
        console.error('Failed to initialize options:', err);
    }
}

async function loadOptionsData() {
    if (!optionsListId || !accessToken) return;
    
    try {
        const response = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${optionsListId}/tasks`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        const tasks = data.value || [];
        
        // Load each option from To Do
        const viewTask = tasks.find(t => t.title === 'OPTION_DEFAULT_VIEW');
        if (viewTask && viewTask.body?.content) {
            currentView = viewTask.body.content;
            localStorage.setItem('plannerDefaultView', currentView);
        }
        
        const groupByTask = tasks.find(t => t.title === 'OPTION_DEFAULT_GROUPBY');
        if (groupByTask && groupByTask.body?.content) {
            currentGroupBy = groupByTask.body.content;
            localStorage.setItem('plannerDefaultGroupBy', currentGroupBy);
        }
        
        const showCompletedTask = tasks.find(t => t.title === 'OPTION_SHOW_COMPLETED');
        if (showCompletedTask && showCompletedTask.body?.content) {
            showCompleted = showCompletedTask.body.content === 'true';
            localStorage.setItem('plannerShowCompleted', showCompletedTask.body.content);
        }
        
        const compassPosTask = tasks.find(t => t.title === 'OPTION_COMPASS_POSITION');
        if (compassPosTask && compassPosTask.body?.content) {
            compassPosition = compassPosTask.body.content;
            localStorage.setItem('plannerCompassPosition', compassPosition);
            applyCompassPosition();
        }

        const compassVisibleTask = tasks.find(t => t.title === 'OPTION_COMPASS_VISIBLE');
        if (compassVisibleTask && compassVisibleTask.body?.content) {
            compassVisible = compassVisibleTask.body.content === 'true';
            localStorage.setItem('plannerCompassVisible', compassVisible ? 'true' : 'false');
        }
    } catch (err) {
        console.error('Failed to load options:', err);
    }
}

async function loadCompassData() {
    if (!compassListId || !compassTasksListId || !accessToken) return;
    
    try {
        // Reset local cache before loading
        compassData = {
            quote: '',
            dateRange: '',
            sharpenSaw: {
                physical: '',
                socialEmotional: '',
                mental: '',
                spiritual: ''
            },
            roles: []
        };

        // Load metadata from PlannerCompass_Data
        const metadataResponse = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassListId}/tasks`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!metadataResponse.ok) {
            console.error('Failed to load compass metadata:', metadataResponse.status);
            return;
        }
        
        const metadataData = await metadataResponse.json();
        const metadataTasks = metadataData.value || [];
        
        // Parse metadata
        metadataTasks.forEach(task => {
            const title = task.title;
            const body = task.body?.content || '';
            
            if (title === 'COMPASS_QUOTE') {
                // Skip loading quote; always generate fresh
            } else if (title === 'COMPASS_DATERANGE') {
                compassData.dateRange = body;
            } else if (title === 'COMPASS_SAW') {
                try {
                    compassData.sharpenSaw = JSON.parse(body);
                } catch (e) {
                    compassData.sharpenSaw = { physical: '', socialEmotional: '', mental: '', spiritual: '' };
                }
            } else if (title.startsWith('COMPASS_ROLE_')) {
                try {
                    // Role metadata: just the role name (new format)
                    const roleData = JSON.parse(body);
                    // Only load if it's new format (just has 'name' property, no 'rocks')
                    if (roleData.name && !roleData.rocks) {
                        compassData.roles.push(roleData);
                    } else {
                        console.warn('Ignoring old-format COMPASS_ROLE entry:', title);
                    }
                } catch (e) {
                    console.error('Failed to parse role metadata:', e);
                }
            }
        });
        
        // Load actual tasks from Weekly Compass list
        const tasksResponse = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassTasksListId}/tasks`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!tasksResponse.ok) {
            console.error('Failed to load compass tasks:', tasksResponse.status);
            return;
        }
        
        const tasksData = await tasksResponse.json();
        const realTasks = tasksData.value || [];
        
        // Parse tasks and assign to roles based on title prefix
        realTasks.forEach(task => {
            const title = task.title || '';
            const colonIndex = title.indexOf(':');
            if (colonIndex > 0) {
                const roleName = title.substring(0, colonIndex).trim();
                const taskText = title.substring(colonIndex + 1).trim();
                
                // Find matching role
                const role = compassData.roles.find(r => r.name === roleName);
                if (role) {
                    if (!role.rocks) role.rocks = [];
                    role.rocks.push({
                        text: taskText,
                        done: task.status === 'completed',
                        taskId: task.id // Store To Do task ID
                    });
                }
            }
        });

        // Normalize roles/rocks structure to include completion state
        compassData.roles = compassData.roles.map(role => {
            const rocks = (role.rocks || []).map(r => {
                if (typeof r === 'string') return { text: r, done: false };
                return { text: r?.text || '', done: !!r?.done, taskId: r?.taskId || null };
            });
            return { ...role, rocks };
        });
        
        renderCompass();
        refreshCompassTasksFromData(true);
    } catch (err) {
        console.error('Failed to load compass data:', err);
    }
}

function captureCompassInputs() {
    const updated = {
        quote: compassData.quote,
        dateRange: compassData.dateRange,
        sharpenSaw: {
            physical: compassData.sharpenSaw.physical,
            socialEmotional: compassData.sharpenSaw.socialEmotional,
            mental: compassData.sharpenSaw.mental,
            spiritual: compassData.sharpenSaw.spiritual
        },
        roles: []
    };

    const quoteInput = document.getElementById('compassQuoteInput');
    if (quoteInput) updated.quote = quoteInput.value;

    const dateInput = document.getElementById('compassDateRange');
    if (dateInput) updated.dateRange = dateInput.value;

    const physicalInput = document.getElementById('sawPhysical');
    if (physicalInput) updated.sharpenSaw.physical = physicalInput.value;

    const socialInput = document.getElementById('sawSocialEmotional');
    if (socialInput) updated.sharpenSaw.socialEmotional = socialInput.value;

    const mentalInput = document.getElementById('sawMental');
    if (mentalInput) updated.sharpenSaw.mental = mentalInput.value;

    const spiritualInput = document.getElementById('sawSpiritual');
    if (spiritualInput) updated.sharpenSaw.spiritual = spiritualInput.value;

    document.querySelectorAll('.compass-role-section').forEach(section => {
        const roleName = section.querySelector('.compass-role-input')?.value || '';
        const rocks = [];
        section.querySelectorAll('.compass-rock-item').forEach(item => {
            const textInput = item.querySelector('.compass-rock-input');
            const check = item.querySelector('.compass-rock-checkbox');
            const val = textInput ? textInput.value.trim() : '';
            const done = check ? check.checked : false;
            if (val) rocks.push({ text: val, done });
        });
        if (roleName.trim() || rocks.length > 0) {
            updated.roles.push({ name: roleName, rocks });
        }
    });

    compassData = updated;
    return updated;
}

async function saveCompassData(showAlert = true) {
    if (!compassListId || !compassTasksListId || !accessToken) {
        console.error('Cannot save compass data:', { compassListId, compassTasksListId, hasAccessToken: !!accessToken });
        if (showAlert) alert('Weekly Compass not fully initialized. Please wait a moment and try again.');
        return;
    }
    
    try {
        // Capture unsaved UI changes before persisting
        captureCompassInputs();
        
        // Parse date range for task due dates
        let dueDate = null;
        if (compassData.dateRange) {
            const dateRangeParts = compassData.dateRange.split(' - ');
            if (dateRangeParts.length === 2) {
                const endDate = new Date(dateRangeParts[1]);
                if (!isNaN(endDate.getTime())) {
                    dueDate = endDate.toISOString();
                }
            }
        }
        
        // 1. Save metadata to PlannerCompass_Data
        const metadataResponse = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassListId}/tasks`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!metadataResponse.ok) {
            console.error('Failed to fetch metadata:', metadataResponse.status);
            if (showAlert) alert('Failed to save compass data: unable to fetch metadata.');
            return;
        }
        const metadataData = await metadataResponse.json();
        const metadataTasks = metadataData.value || [];
        
        // Log all tasks in PlannerCompass_Data
        console.log(`[Compass Save] Found ${metadataTasks.length} total tasks in PlannerCompass_Data:`);
        metadataTasks.forEach(task => {
            console.log(`  - ${task.title}`);
        });
        
        // Build map of existing metadata tasks
        const metadataMap = {};
        metadataTasks.forEach(task => {
            metadataMap[task.title] = task;
        });

        // Helper to update or create a metadata task
        const upsertMetadata = async (title, body) => {
            const existing = metadataMap[title];
            if (existing) {
                const resp = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassListId}/tasks/${existing.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        body: { contentType: 'text', content: body }
                    })
                });
                if (!resp.ok) throw new Error(`Update metadata failed for ${title} (${resp.status})`);
                return resp;
            } else {
                const resp = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassListId}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title,
                        body: { contentType: 'text', content: body }
                    })
                });
                if (!resp.ok) throw new Error(`Create metadata failed for ${title} (${resp.status})`);
                return resp;
            }
        };

        await upsertMetadata('COMPASS_QUOTE', compassData.quote);
        await upsertMetadata('COMPASS_DATERANGE', compassData.dateRange || '');
        await upsertMetadata('COMPASS_SAW', JSON.stringify(compassData.sharpenSaw));
        
        // Delete ALL existing COMPASS_ROLE_X tasks (including duplicates and old format)
        const oldRoleTasks = metadataTasks.filter(task => task.title.startsWith('COMPASS_ROLE_'));
        console.log(`[Compass Save] Deleting ${oldRoleTasks.length} old COMPASS_ROLE tasks`);
        await Promise.all(oldRoleTasks.map(task =>
            fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassListId}/tasks/${task.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
        ));
        
        // Create fresh role metadata tasks
        console.log(`[Compass Save] Creating ${compassData.roles.length} new COMPASS_ROLE tasks`);
        for (let i = 0; i < compassData.roles.length; i++) {
            const roleTitle = `COMPASS_ROLE_${i}`;
            const resp = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassListId}/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: roleTitle,
                    body: { contentType: 'text', content: JSON.stringify({ name: compassData.roles[i].name }) }
                })
            });
            if (!resp.ok) throw new Error(`Create role metadata failed for ${roleTitle} (${resp.status})`);
        }
        
        // 2. Save actual tasks to Weekly Compass list
        const tasksResponse = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassTasksListId}/tasks`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!tasksResponse.ok) {
            console.error('Failed to fetch compass tasks:', tasksResponse.status);
            if (showAlert) alert('Failed to save compass tasks.');
            return;
        }
        const tasksData = await tasksResponse.json();
        const existingTasks = tasksData.value || [];
        
        // Build map of existing tasks by title
        const existingTaskMap = {};
        existingTasks.forEach(task => {
            existingTaskMap[task.title] = task;
        });
        
        // Track which tasks we've created/updated
        const processedTaskTitles = new Set();
        
        // Create/update tasks for each role's rocks
        for (const role of compassData.roles) {
            const rocks = role.rocks || [];
            for (const rock of rocks) {
                if (!rock.text) continue;
                
                const taskTitle = `${role.name}: ${rock.text}`;
                processedTaskTitles.add(taskTitle);
                
                const existing = existingTaskMap[taskTitle] || (rock.taskId ? existingTasks.find(t => t.id === rock.taskId) : null);
                
                if (existing) {
                    // Update existing task
                    await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassTasksListId}/tasks/${existing.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            title: taskTitle,
                            status: rock.done ? 'completed' : 'notStarted',
                            dueDateTime: dueDate ? { dateTime: dueDate, timeZone: 'UTC' } : null
                        })
                    });
                } else {
                    // Create new task
                    await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassTasksListId}/tasks`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            title: taskTitle,
                            status: rock.done ? 'completed' : 'notStarted',
                            dueDateTime: dueDate ? { dateTime: dueDate, timeZone: 'UTC' } : null
                        })
                    });
                }
            }
        }
        
        // Delete tasks that no longer exist in compass data
        const tasksToDelete = existingTasks.filter(task => !processedTaskTitles.has(task.title));
        await Promise.all(tasksToDelete.map(task =>
            fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassTasksListId}/tasks/${task.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
        ));

        refreshCompassTasksFromData(true);
        if (showAlert) alert('Weekly Compass saved successfully!');
    } catch (err) {
        console.error('Failed to save compass:', err);
        if (showAlert) alert('Failed to save compass data: ' + err.message);
    }
}

function scheduleCompassAutoSave() {
    try {
        if (compassAutoSaveTimer) {
            clearTimeout(compassAutoSaveTimer);
        }
        // Debounce to avoid excessive requests on rapid toggles
        compassAutoSaveTimer = setTimeout(() => {
            saveCompassData(false);
            compassAutoSaveTimer = null;
        }, 1000);
    } catch (e) {
        console.error('Auto-save scheduling failed:', e);
    }
}

function toggleCompass() {
    compassVisible = !compassVisible;
    const panel = document.getElementById('weeklyCompassPanel');
    const wrapper = document.getElementById('mainContentWrapper');
    
    if (compassVisible) {
        panel.style.display = 'block';
        wrapper.style.display = 'flex';
        compassEditMode = false;
        renderCompass();
        updateCompassEditUI();
        applyCompassPosition();
    } else {
        panel.style.display = 'none';
        wrapper.style.display = 'block';
    }
}

function toggleCompassEdit() {
    compassEditMode = !compassEditMode;
    updateCompassEditUI();
    renderCompass();
    renderCompassRoles();
    updateCompassHeaderButtons();
    // Ensure native color input stays hidden; show eyedropper button in edit mode
    const colorInput = document.getElementById('compassBgColorInput');
    if (colorInput) {
        // Keep input invisible but present to anchor picker near icon
        colorInput.style.display = '';
    }
}

function updateCompassEditUI() {
    const panel = document.getElementById('weeklyCompassPanel');
    if (!panel) return;
    if (compassEditMode) {
        panel.classList.remove('compass-readonly');
    } else {
        panel.classList.add('compass-readonly');
    }
    updateCompassHeaderButtons();
}

function renderCompass() {
    // Initialize color picker with saved value and add change listener
    const colorInput = document.getElementById('compassBgColorInput');
    if (colorInput) {
        colorInput.value = localStorage.getItem('compassBgColor') || '#2d5016';
        // Ensure element renders (even at 1px/opacity 0) so native picker anchors here
        colorInput.style.display = '';
        colorInput.removeEventListener('change', handleCompassColorChange);
        colorInput.addEventListener('change', handleCompassColorChange);
    }
    // Wire eyedropper button to open native color picker
    const colorBtn = document.getElementById('compassColorBtn');
    if (colorBtn && colorInput) {
        colorBtn.onclick = () => colorInput.click();
    }
    updateCompassHeaderButtons();
    
    // Update quote
    const quoteInput = document.getElementById('compassQuoteInput');
    if (!compassData.quote) {
        compassData.quote = getRandomQuote();
    }
    if (quoteInput) {
        quoteInput.value = compassData.quote;
        quoteInput.readOnly = true; // Always read-only
    }
    
    // Update date range (editable field)
    const dateInput = document.getElementById('compassDateRange');
    if (!compassData.dateRange) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const formatDate = d => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
        compassData.dateRange = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    }
    dateInput.value = compassData.dateRange;
    dateInput.readOnly = !compassEditMode;
    
    // Update Sharpen the Saw
    const sawPhysical = document.getElementById('sawPhysical');
    const sawSocial = document.getElementById('sawSocialEmotional');
    const sawMental = document.getElementById('sawMental');
    const sawSpiritual = document.getElementById('sawSpiritual');
    if (sawPhysical) { sawPhysical.value = compassData.sharpenSaw.physical || ''; sawPhysical.readOnly = !compassEditMode; }
    if (sawSocial) { sawSocial.value = compassData.sharpenSaw.socialEmotional || ''; sawSocial.readOnly = !compassEditMode; }
    if (sawMental) { sawMental.value = compassData.sharpenSaw.mental || ''; sawMental.readOnly = !compassEditMode; }
    if (sawSpiritual) { sawSpiritual.value = compassData.sharpenSaw.spiritual || ''; sawSpiritual.readOnly = !compassEditMode; }
    
    // Attach event listeners to Sharpen the Saw labels and toggle clickable state
    document.querySelectorAll('.saw-label').forEach(label => {
        label.removeEventListener('click', handleSawLabelClick);
        label.addEventListener('click', handleSawLabelClick);

        if (compassEditMode) {
            label.classList.add('clickable');
            label.title = 'Click for suggestions';
        } else {
            label.classList.remove('clickable');
            label.removeAttribute('title');
        }
    });
    
    // Render roles
    renderCompassRoles();
}

function updateCompassHeaderButtons() {
    const editBtn = document.getElementById('compassEditBtn');
    const saveBtn = document.getElementById('compassSaveBtn');
    const cancelBtn = document.getElementById('compassCancelBtn');
    const colorBtn = document.getElementById('compassColorBtn');
    if (editBtn) editBtn.style.display = compassEditMode ? 'none' : 'inline-block';
    if (saveBtn) saveBtn.style.display = compassEditMode ? 'inline-block' : 'none';
    if (cancelBtn) cancelBtn.style.display = compassEditMode ? 'inline-block' : 'none';
    if (colorBtn) colorBtn.style.display = compassEditMode ? 'inline-flex' : 'none';
}

async function saveCompass() {
    await saveCompassData();
    compassEditMode = false;
    updateCompassEditUI();
    renderCompass();
    renderCompassRoles();
    refreshCompassTasksFromData(true);
}

function cancelCompassEdit() {
    compassEditMode = false;
    updateCompassEditUI();
    renderCompass();
    renderCompassRoles();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getRandomQuote() {
    if (!Array.isArray(MOTIVATIONAL_QUOTES) || MOTIVATIONAL_QUOTES.length === 0) return '';
    const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[idx];
}

function renderCompassRoles() {
    const container = document.getElementById('compassRoles');
    container.innerHTML = '';
    
    compassData.roles.forEach((role, index) => {
        const section = document.createElement('div');
        section.className = 'compass-section compass-role-section';
        section.draggable = compassEditMode;
        section.dataset.roleIndex = index;
        
        section.innerHTML = `
            <div class="compass-role-header">
                ${compassEditMode ? '<span class="drag-handle">☰</span>' : ''}
                Role: <input type="text" class="compass-role-input" ${compassEditMode ? '' : 'readonly'} value="${escapeHtml(role.name)}" placeholder="Enter role name...">
                ${compassEditMode ? `<button class="compass-trash-btn" onclick="removeCompassRole(${index})" title="Remove role">🗑️</button>` : ''}
            </div>
            <div class="compass-rocks">
                <div class="compass-rocks-header">${compassEditMode ? `Big Rocks <button class="compass-add-rock-icon" onclick="addCompassRock(${index})" title="Add priority">＋</button>` : ''}</div>
                ${role.rocks.map((rock, i) => {
                    const rockObj = typeof rock === 'string' ? { text: rock, done: false } : (rock || { text: '', done: false });
                    return `
                    <div class="compass-rock-item ${rockObj.done ? 'rock-done' : ''}">
                        <input type="checkbox" class="compass-rock-checkbox" ${rockObj.done ? 'checked' : ''} onchange="toggleCompassRockDone(${index}, ${i}, this.checked)">
                        <input type="text" class="compass-rock-input" ${compassEditMode ? '' : 'readonly'} placeholder="Enter a big rock..." value="${escapeHtml(rockObj.text)}">
                        ${compassEditMode ? `<button class="compass-mini-btn" onclick="removeCompassRock(${index}, ${i})" title="Remove priority">✕</button>` : ''}
                    </div>
                `;}).join('')}
            </div>
        `;
        
        if (compassEditMode) {
            section.addEventListener('dragstart', handleRoleDragStart);
            section.addEventListener('dragover', handleRoleDragOver);
            section.addEventListener('drop', handleRoleDrop);
            section.addEventListener('dragend', handleRoleDragEnd);
        }
        
        container.appendChild(section);
    });
}

// Removed duplicate showSawSuggestions; valid definition exists earlier

function handleSawLabelClick(event) {
    if (!compassEditMode) return;
    const category = event.target.dataset.category;
    if (category) {
        showSawSuggestions(category);
    }
}

function addSuggestionToSaw(category, suggestion) {
    // Enforce max 6 words on insert
    const truncateToWords = (text, max = 6) => {
        if (!text) return '';
        const parts = text.trim().split(/\s+/);
        return parts.slice(0, max).join(' ');
    };
    const safeSuggestion = truncateToWords(suggestion, 6);
    const fieldId = `saw${category.charAt(0).toUpperCase() + category.slice(1)}`;
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const current = field.value.trim();
    if (current) {
        field.value = current + '\n• ' + safeSuggestion;
    } else {
        field.value = safeSuggestion;
    }
    
    field.focus();
    // Close any open modal
    const modal = document.querySelector('div[style*="fixed"]');
    if (modal) modal.remove();
    const backdrop = document.querySelector('div[style*="rgba(0,0,0,0.5)"]');
    if (backdrop) backdrop.remove();
}

function addCompassRole() {
    if (compassData.roles.length >= 7) {
        alert('Maximum 7 roles allowed');
        return;
    }
    captureCompassInputs();
    compassData.roles.push({ name: '', rocks: [] });
    renderCompassRoles();
    refreshCompassTasksFromData(true);
}

function removeCompassRole(index) {
    captureCompassInputs();
    compassData.roles.splice(index, 1);
    renderCompassRoles();
    refreshCompassTasksFromData(true);
}

function addCompassRock(roleIndex) {
    captureCompassInputs();
    if (!compassData.roles[roleIndex]) return;
    compassData.roles[roleIndex].rocks.push({ text: '', done: false });
    renderCompassRoles();
    refreshCompassTasksFromData(true);
}

function removeCompassRock(roleIndex, rockIndex) {
    captureCompassInputs();
    if (!compassData.roles[roleIndex]) return;
    compassData.roles[roleIndex].rocks.splice(rockIndex, 1);
    renderCompassRoles();
    refreshCompassTasksFromData(true);
}

function toggleCompassRockDone(roleIndex, rockIndex, isDone) {
    const role = compassData.roles[roleIndex];
    if (!role || !role.rocks[rockIndex]) return;
    const rock = role.rocks[rockIndex];
    if (typeof rock === 'string') {
        role.rocks[rockIndex] = { text: rock, done: isDone };
    } else {
        role.rocks[rockIndex].done = isDone;
    }
    renderCompassRoles();
    scheduleCompassAutoSave();
    refreshCompassTasksFromData(true);
}

// Drag and drop handlers for role reordering
let draggedRoleIndex = null;

function handleRoleDragStart(e) {
    draggedRoleIndex = parseInt(e.currentTarget.dataset.roleIndex);
    e.currentTarget.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function handleRoleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleRoleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    const dropIndex = parseInt(e.currentTarget.dataset.roleIndex);
    
    if (draggedRoleIndex !== null && draggedRoleIndex !== dropIndex) {
        captureCompassInputs();
        
        // Reorder the roles array
        const draggedRole = compassData.roles[draggedRoleIndex];
        compassData.roles.splice(draggedRoleIndex, 1);
        compassData.roles.splice(dropIndex, 0, draggedRole);
        
        renderCompassRoles();
    }
    
    return false;
}

function handleRoleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    draggedRoleIndex = null;
}

// Apply compass position (left or right)
function applyCompassPosition() {
    const panel = document.getElementById('weeklyCompassPanel');
    if (!panel) return;
    
    panel.classList.remove('compass-left', 'compass-right');
    panel.classList.add(`compass-${compassPosition}`);
}

// Expose compass functions globally
window.toggleCompass = toggleCompass;
window.saveCompassData = saveCompassData;
window.addCompassRole = addCompassRole;
window.removeCompassRole = removeCompassRole;
window.toggleCompassEdit = toggleCompassEdit;
window.addCompassRock = addCompassRock;
window.removeCompassRock = removeCompassRock;
window.handleCompassTaskToggle = handleCompassTaskToggle;

// Scroll to and highlight a compass item in the Weekly Compass panel
function scrollToCompassItem(roleIndex, rockIndex) {
    // Ensure compass panel is visible
    if (!compassVisible) {
        toggleCompass();
    }
    
    // Find the role section
    const sections = document.querySelectorAll('.compass-role-section');
    const targetSection = sections[roleIndex];
    if (!targetSection) return;
    
    // Find the specific rock item
    const rocks = targetSection.querySelectorAll('.compass-rock-item');
    const targetRock = rocks[rockIndex];
    if (!targetRock) return;
    
    // Scroll into view
    targetRock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add temporary highlight
    targetRock.style.transition = 'background 0.3s ease';
    targetRock.style.background = 'var(--accent-yellow-bg, #fff3cd)';
    setTimeout(() => {
        targetRock.style.background = '';
    }, 1500);
}

// Toggle compass task completion from grid view
function toggleCompassTaskFromGrid(roleIndex, rockIndex) {
    const role = compassData.roles[roleIndex];
    if (!role || !role.rocks[rockIndex]) return;
    const rock = role.rocks[rockIndex];
    const currentDone = typeof rock === 'object' ? rock.done : false;
    toggleCompassRockDone(roleIndex, rockIndex, !currentDone);
}

// Open compass task detail modal
function openCompassTaskDetail(roleIndex, rockIndex) {
    const role = compassData.roles[roleIndex];
    if (!role || !role.rocks[rockIndex]) return;
    
    const rock = role.rocks[rockIndex];
    const rockObj = typeof rock === 'object' ? rock : { text: rock, done: false };
    
    // Store current edit context
    window.currentCompassEdit = { roleIndex, rockIndex };
    
    // Populate modal
    document.getElementById('compassTaskTitle').textContent = rockObj.text || 'Edit Task';
    document.getElementById('compassTaskName').value = rockObj.text || '';
    document.getElementById('compassTaskProgress').value = rockObj.done ? '100' : '0';
    document.getElementById('compassTaskRole').value = role.name || `Role ${roleIndex + 1}`;
    
    // Show modal
    document.getElementById('compassTaskModal').classList.add('show');
}

// Close compass task modal
function closeCompassTaskModal() {
    document.getElementById('compassTaskModal').classList.remove('show');
    window.currentCompassEdit = null;
}

// Save compass task details from modal
function saveCompassTaskDetails() {
    if (!window.currentCompassEdit) return;
    
    const { roleIndex, rockIndex } = window.currentCompassEdit;
    const role = compassData.roles[roleIndex];
    if (!role || !role.rocks[rockIndex]) return;
    
    const newName = document.getElementById('compassTaskName').value.trim();
    const newProgress = parseInt(document.getElementById('compassTaskProgress').value);
    
    if (!newName) {
        alert('Task name cannot be empty');
        return;
    }
    
    // Update the rock
    const rock = role.rocks[rockIndex];
    const rockObj = typeof rock === 'object' ? rock : { text: rock, done: false };
    rockObj.text = newName;
    rockObj.done = newProgress === 100;
    role.rocks[rockIndex] = rockObj;
    
    // Save and re-render
    renderCompassRoles();
    scheduleCompassAutoSave();
    refreshCompassTasksFromData(true);
    closeCompassTaskModal();
}

window.scrollToCompassItem = scrollToCompassItem;
window.toggleCompassTaskFromGrid = toggleCompassTaskFromGrid;
window.openCompassTaskDetail = openCompassTaskDetail;
window.closeCompassTaskModal = closeCompassTaskModal;
window.saveCompassTaskDetails = saveCompassTaskDetails;
// ============ Goals Management ============

async function initializeGoals() {
    try {
        if (!accessToken || !planId) return;
        
        // Ensure goals bucket exists
        await ensureGoalsBucket();
        
        // Load goals from bucket tasks
        await loadGoalsData();
        
        // If Goals tab is active, render the view now that data is loaded
        if (currentTab === 'goals') {
            renderGoalsView();
        }
    } catch (err) {
        console.error('Error initializing goals:', err);
    }
}

async function ensureGoalsBucket() {
    if (!planId || !accessToken) return;
    
    try {
        // Check if goals bucket already exists
        const bucketsResponse = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/plans/${planId}/buckets`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        
        if (!bucketsResponse.ok) {
            console.error('Failed to fetch buckets for goals:', bucketsResponse.status);
            return;
        }
        
        const bucketsData = await bucketsResponse.json();
        let goalsBucket = bucketsData.value.find(b => b.name === GOALS_BUCKET_NAME);
        
        if (!goalsBucket) {
            // Create the goals bucket
            const createResponse = await fetchGraph(
                'https://graph.microsoft.com/v1.0/planner/buckets',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: GOALS_BUCKET_NAME,
                        planId: planId,
                        orderHint: ' !'
                    })
                }
            );
            
            if (!createResponse.ok) {
                console.error('Failed to create goals bucket:', createResponse.status);
                return;
            }
            
            goalsBucket = await createResponse.json();
            console.log('✅ Created goals bucket:', goalsBucket.id);
        }
        
        goalsBucketRealId = goalsBucket.id;
    } catch (err) {
        console.error('Error ensuring goals bucket:', err);
    }
}

async function loadGoalsData() {
    if (!goalsBucketRealId || !accessToken) return;
    
    try {
        // Fetch all tasks in the goals bucket
        const tasksResponse = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/plans/${planId}/tasks`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        
        if (!tasksResponse.ok) {
            console.error('Failed to load tasks for goals:', tasksResponse.status);
            return;
        }
        
        const tasksData = await tasksResponse.json();
        const goalsTasks = tasksData.value.filter(t => t.bucketId === goalsBucketRealId);
        
        allGoals = [];
        bucketGoalMap = {};
        
        for (const task of goalsTasks) {
            if (task.title === 'BUCKET_GOAL_MAPPINGS' || task.title === '[System] Bucket-Goal Mappings') {
                // This task stores bucket-to-goal mappings (hidden from UI)
                try {
                    const detailsResponse = await fetchGraph(
                        `https://graph.microsoft.com/v1.0/planner/tasks/${task.id}/details`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    );
                    
                    if (detailsResponse.ok) {
                        const details = await detailsResponse.json();
                        const parsed = JSON.parse(details.description || '{}');
                        bucketGoalMap = parsed.bucketGoalMap || {};
                    }
                } catch (err) {
                    console.error('Error loading bucket-goal mappings:', err);
                }
            } else if (!task.title.startsWith('[System]')) {
                // Regular goal task
                try {
                    const detailsResponse = await fetchGraph(
                        `https://graph.microsoft.com/v1.0/planner/tasks/${task.id}/details`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    );
                    
                    if (detailsResponse.ok) {
                        const details = await detailsResponse.json();
                        const parsed = JSON.parse(details.description || '{}');
                        
                        allGoals.push({
                            id: task.id,
                            name: task.title,
                            description: parsed.description || '',
                            color: parsed.color || '#0078d4',
                            targetDate: parsed.targetDate || task.dueDateTime || null,
                            etag: task['@odata.etag'],
                            detailsEtag: details['@odata.etag']
                        });
                    }
                } catch (err) {
                    console.error('Error loading goal details:', err);
                }
            }
        }
        
        console.log('✅ Loaded goals from bucket:', allGoals.length);
    } catch (err) {
        console.error('Error loading goals data:', err);
        allGoals = [];
        bucketGoalMap = {};
    }
}

async function saveGoal(goal) {
    if (!goalsBucketRealId || !accessToken) return null;
    
    try {
        const goalData = {
            description: goal.description || '',
            color: goal.color || '#0078d4',
            targetDate: goal.targetDate || null
        };
        
        if (!goal.id || goal.id.startsWith('goal-')) {
            // New goal - create task
            const taskResponse = await fetchGraph(
                'https://graph.microsoft.com/v1.0/planner/tasks',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        planId: planId,
                        bucketId: goalsBucketRealId,
                        title: goal.name,
                        dueDateTime: goal.targetDate || null
                    })
                }
            );
            
            if (!taskResponse.ok) {
                const errorText = await taskResponse.text();
                console.error('Failed to create goal task:', errorText);
                throw new Error('Failed to create goal task');
            }
            
            const newTask = await taskResponse.json();
            
            // Fetch details first to get proper etag
            const getDetailsResponse = await fetchGraph(
                `https://graph.microsoft.com/v1.0/planner/tasks/${newTask.id}/details`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );
            
            if (getDetailsResponse.ok) {
                const details = await getDetailsResponse.json();
                
                // Now update with correct etag
                const updateDetailsResponse = await fetchGraph(
                    `https://graph.microsoft.com/v1.0/planner/tasks/${newTask.id}/details`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            'If-Match': details['@odata.etag']
                        },
                        body: JSON.stringify({
                            description: JSON.stringify(goalData)
                        })
                    }
                );
                
                if (!updateDetailsResponse.ok) {
                    console.warn('Failed to update goal details, but task created');
                }
            }
            
            await loadGoalsData();
            return newTask.id;
            
        } else if (goal.id) {
            // Existing goal - update task
            const existingGoal = allGoals.find(g => g.id === goal.id);
            if (!existingGoal) {
                throw new Error('Goal not found');
            }
            
            // Update task title and due date
            const taskResponse = await fetchGraph(
                `https://graph.microsoft.com/v1.0/planner/tasks/${goal.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'If-Match': existingGoal.etag
                    },
                    body: JSON.stringify({
                        title: goal.name,
                        dueDateTime: goal.targetDate || null
                    })
                }
            );
            
            if (!taskResponse.ok) {
                throw new Error('Failed to update goal task');
            }
            
            // Update task details
            const detailsResponse = await fetchGraph(
                `https://graph.microsoft.com/v1.0/planner/tasks/${goal.id}/details`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'If-Match': existingGoal.detailsEtag
                    },
                    body: JSON.stringify({
                        description: JSON.stringify(goalData)
                    })
                }
            );
            
            if (!detailsResponse.ok) {
                console.warn('Failed to update goal details');
            }
            
            await loadGoalsData();
            return goal.id;
        }
        
        return null;
    } catch (err) {
        console.error('Error saving goal:', err);
        alert('Failed to save goal: ' + err.message);
        return null;
    }
}

async function deleteGoal(goalId) {
    if (!goalsBucketRealId || !accessToken || !goalId) return false;
    
    try {
        const existingGoal = allGoals.find(g => g.id === goalId);
        if (!existingGoal) {
            throw new Error('Goal not found');
        }
        
        // Delete the Planner task
        const response = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/tasks/${goalId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'If-Match': existingGoal.etag
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to delete goal task');
        }
        
        // Remove from bucket mappings and save
        for (const bucketId in bucketGoalMap) {
            bucketGoalMap[bucketId] = bucketGoalMap[bucketId].filter(id => id !== goalId);
        }
        await saveBucketGoalMappings();
        
        await loadGoalsData();
        return true;
    } catch (err) {
        console.error('Error deleting goal:', err);
        alert('Failed to delete goal: ' + err.message);
        return false;
    }
}

async function saveBucketGoalMapping(bucketId, goalIds) {
    if (!goalsBucketRealId || !accessToken) return false;
    
    try {
        bucketGoalMap[bucketId] = goalIds;
        await saveBucketGoalMappings();
        return true;
    } catch (err) {
        console.error('Error saving bucket-goal mapping:', err);
        return false;
    }
}

async function saveBucketGoalMappings() {
    if (!goalsBucketRealId || !accessToken) return false;
    
    try {
        // Find or create the BUCKET_GOAL_MAPPINGS task
        const tasksResponse = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/plans/${planId}/tasks`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        
        if (!tasksResponse.ok) {
            throw new Error('Failed to fetch tasks');
        }
        
        const tasksData = await tasksResponse.json();
        const mappingTask = tasksData.value.find(t => 
            t.bucketId === goalsBucketRealId && (t.title === 'BUCKET_GOAL_MAPPINGS' || t.title === '[System] Bucket-Goal Mappings')
        );
        
        const mappingData = {
            bucketGoalMap: bucketGoalMap
        };
        
        if (mappingTask) {
            // Update existing mapping task
            const detailsResponse = await fetchGraph(
                `https://graph.microsoft.com/v1.0/planner/tasks/${mappingTask.id}/details`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );
            
            if (!detailsResponse.ok) {
                throw new Error('Failed to fetch mapping details');
            }
            
            const details = await detailsResponse.json();
            
            const updateResponse = await fetchGraph(
                `https://graph.microsoft.com/v1.0/planner/tasks/${mappingTask.id}/details`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'If-Match': details['@odata.etag']
                    },
                    body: JSON.stringify({
                        description: JSON.stringify(mappingData)
                    })
                }
            );
            
            if (!updateResponse.ok) {
                throw new Error('Failed to update mapping task');
            }
        } else {
            // Create new mapping task
            const createResponse = await fetchGraph(
                'https://graph.microsoft.com/v1.0/planner/tasks',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        planId: planId,
                        bucketId: goalsBucketRealId,
                        title: '[System] Bucket-Goal Mappings',
                        percentComplete: 100  // Mark as complete so it's less visible
                    })
                }
            );
            
            if (!createResponse.ok) {
                throw new Error('Failed to create mapping task');
            }
            
            const newTask = await createResponse.json();
            
            // Fetch details first to get proper etag
            const getDetailsResponse = await fetchGraph(
                `https://graph.microsoft.com/v1.0/planner/tasks/${newTask.id}/details`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );
            
            if (!getDetailsResponse.ok) {
                throw new Error('Failed to fetch new mapping details');
            }
            
            const details = await getDetailsResponse.json();
            
            // Update details with mapping data
            const updateResponse = await fetchGraph(
                `https://graph.microsoft.com/v1.0/planner/tasks/${newTask.id}/details`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'If-Match': details['@odata.etag']
                    },
                    body: JSON.stringify({
                        description: JSON.stringify(mappingData)
                    })
                }
            );
            
            if (!updateResponse.ok) {
                console.warn('Failed to update mapping details');
            }
        }
        
        console.log('✅ Saved bucket-goal mappings');
        return true;
    } catch (err) {
        console.error('Error saving bucket-goal mappings:', err);
        throw err;
    }
}

function getGoalsForBucket(bucketId) {
    const goalIds = bucketGoalMap[bucketId] || [];
    return allGoals.filter(g => goalIds.includes(g.id));
}

function getGoalById(goalId) {
    return allGoals.find(g => g.id === goalId);
}

// ========================================
// Goals UI Functions
// ========================================

// Track goals table sort state
let goalsSortColumn = 'name';
let goalsSortDirection = 'asc';

function sortGoalsTable(column) {
    if (goalsSortColumn === column) {
        goalsSortDirection = goalsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        goalsSortColumn = column;
        goalsSortDirection = 'asc';
    }
    renderGoalsView();
}

function renderGoalsView() {
    const container = document.getElementById('goalsGrid');
    const empty = document.getElementById('goalsEmpty');
    
    if (!allGoals || allGoals.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    
    empty.style.display = 'none';
    
    // Calculate progress for each goal
    const goalsWithProgress = allGoals.map(goal => {
        // Find buckets associated with this goal
        const bucketIds = Object.keys(bucketGoalMap).filter(bucketId => 
            bucketGoalMap[bucketId].includes(goal.id)
        );
        
        // Get tasks from those buckets (exclude goals bucket tasks)
        const goalTasks = allTasks.filter(task => {
            if (goalsBucketRealId && task.bucketId === goalsBucketRealId) return false;
            const bucket = allBuckets.find(b => b.id === task.bucketId);
            if (bucket && bucket.name === GOALS_BUCKET_NAME) return false;
            return bucketIds.includes(task.bucketId);
        });
        const totalTasks = goalTasks.length;
        const completedTasks = goalTasks.filter(t => t.percentComplete === 100).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
            ...goal,
            bucketCount: bucketIds.length,
            taskCount: totalTasks,
            completedTasks,
            progress,
            bucketIds
        };
    });
    
    // Sort goals based on current sort column and direction
    goalsWithProgress.sort((a, b) => {
        let aVal, bVal;
        
        switch(goalsSortColumn) {
            case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
            case 'date':
                aVal = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
                bVal = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
                break;
            case 'buckets':
                aVal = a.bucketCount;
                bVal = b.bucketCount;
                break;
            case 'tasks':
                aVal = a.taskCount;
                bVal = b.taskCount;
                break;
            case 'progress':
                aVal = a.progress;
                bVal = b.progress;
                break;
            default:
                return 0;
        }
        
        if (aVal < bVal) return goalsSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return goalsSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    container.innerHTML = `
        <div class="goals-table-wrapper">
            <table class="goals-table">
                <thead>
                    <tr>
                        <th class="col-goal-color" style="width: 40px;"></th>
                        <th class="col-goal-name" style="width: 35%; cursor: pointer;" onclick="sortGoalsTable('name')">
                            Goal Name ${goalsSortColumn === 'name' ? (goalsSortDirection === 'asc' ? '↑' : '↓') : ''}
                            <div class="resize-handle" onmousedown="startGoalsResize(event, 'col-goal-name')"></div>
                        </th>
                        <th class="col-goal-date" style="width: 180px; cursor: pointer;" onclick="sortGoalsTable('date')">
                            Target Date ${goalsSortColumn === 'date' ? (goalsSortDirection === 'asc' ? '↑' : '↓') : ''}
                            <div class="resize-handle" onmousedown="startGoalsResize(event, 'col-goal-date')"></div>
                        </th>
                        <th class="col-goal-buckets" style="width: 120px; cursor: pointer;" onclick="sortGoalsTable('buckets')">
                            Buckets ${goalsSortColumn === 'buckets' ? (goalsSortDirection === 'asc' ? '↑' : '↓') : ''}
                            <div class="resize-handle" onmousedown="startGoalsResize(event, 'col-goal-buckets')"></div>
                        </th>
                        <th class="col-goal-tasks" style="width: 120px; cursor: pointer;" onclick="sortGoalsTable('tasks')">
                            Tasks ${goalsSortColumn === 'tasks' ? (goalsSortDirection === 'asc' ? '↑' : '↓') : ''}
                            <div class="resize-handle" onmousedown="startGoalsResize(event, 'col-goal-tasks')"></div>
                        </th>
                        <th class="col-goal-progress" style="width: 180px; cursor: pointer;" onclick="sortGoalsTable('progress')">
                            Progress ${goalsSortColumn === 'progress' ? (goalsSortDirection === 'asc' ? '↑' : '↓') : ''}
                            <div class="resize-handle" onmousedown="startGoalsResize(event, 'col-goal-progress')"></div>
                        </th>
                        <th class="col-goal-actions" style="width: 100px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${goalsWithProgress.map(goal => {
                        const targetDate = goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'None';
                        const daysRemaining = goal.targetDate ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                        const daysText = daysRemaining !== null ? 
                            (daysRemaining > 0 ? `${daysRemaining} days left` : daysRemaining === 0 ? 'Today' : `${Math.abs(daysRemaining)} days overdue`) 
                            : '';
                        
                        return `
                            <tr class="goal-row" onclick="editGoal('${goal.id}')">
                                <td><div class="goal-color-indicator" style="background: ${goal.color};"></div></td>
                                <td>
                                    <div class="goal-name-cell">
                                        <div class="goal-name-text">${escapeHtml(goal.name)}</div>
                                        ${goal.description ? `<div class="goal-description-text">${escapeHtml(goal.description)}</div>` : ''}
                                    </div>
                                </td>
                                <td>
                                    <div class="goal-date-cell">
                                        <div>${targetDate}</div>
                                        ${daysText ? `<div class="goal-days-text ${daysRemaining < 0 ? 'overdue' : ''}">${daysText}</div>` : ''}
                                    </div>
                                </td>
                                <td class="goal-count-cell goal-count-clickable" onclick="event.stopPropagation(); showBucketSelectorForGoal('${goal.id}')" title="Click to manage buckets for this goal">${goal.bucketCount} bucket${goal.bucketCount !== 1 ? 's' : ''}</td>
                                <td class="goal-count-cell goal-count-clickable" onclick="event.stopPropagation(); navigateToGoalTasks('${goal.id}')" title="Click to view tasks for this goal">${goal.taskCount} task${goal.taskCount !== 1 ? 's' : ''}</td>
                                <td>
                                    <div class="goal-progress-cell">
                                        <div class="goal-progress-bar-small">
                                            <div class="goal-progress-fill-small" style="width: ${goal.progress}%; background: ${goal.color};"></div>
                                        </div>
                                        <div class="goal-progress-percentage">${goal.progress}%</div>
                                    </div>
                                </td>
                                <td>
                                    <div class="goal-actions-cell">
                                        <button class="goal-action-btn" onclick="event.stopPropagation(); editGoal('${goal.id}')" title="Edit Goal">✏️</button>
                                        <button class="goal-action-btn" onclick="event.stopPropagation(); confirmDeleteGoalFromCard('${goal.id}')" title="Delete Goal">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Apply stored column widths
    applyGoalsColumnWidths();
}

function showGoalModal(goalId = null) {
    const modal = document.getElementById('goalModal');
    const title = document.getElementById('goalModalTitle');
    const idInput = document.getElementById('goalIdInput');
    const nameInput = document.getElementById('goalNameInput');
    const descInput = document.getElementById('goalDescriptionInput');
    const colorInput = document.getElementById('goalColorInput');
    const targetInput = document.getElementById('goalTargetDateInput');
    const deleteBtn = document.getElementById('goalDeleteBtn');
    
    if (goalId) {
        const goal = getGoalById(goalId);
        if (!goal) return;
        
        title.textContent = 'Edit Goal';
        idInput.value = goal.id;
        nameInput.value = goal.name;
        descInput.value = goal.description || '';
        colorInput.value = goal.color || '#0078d4';
        
        // Format date for input (YYYY-MM-DD)
        if (goal.targetDate) {
            const date = new Date(goal.targetDate);
            const formatted = date.toISOString().split('T')[0];
            targetInput.value = formatted;
        } else {
            targetInput.value = '';
        }
        
        deleteBtn.style.display = 'block';
    } else {
        title.textContent = 'Add Goal';
        idInput.value = '';
        nameInput.value = '';
        descInput.value = '';
        colorInput.value = '#0078d4';
        targetInput.value = '';
        deleteBtn.style.display = 'none';
    }
    
    modal.style.display = 'flex';
}

function closeGoalModal() {
    const modal = document.getElementById('goalModal');
    modal.style.display = 'none';
}

async function saveGoalModal() {
    const idInput = document.getElementById('goalIdInput');
    const nameInput = document.getElementById('goalNameInput');
    const descInput = document.getElementById('goalDescriptionInput');
    const colorInput = document.getElementById('goalColorInput');
    const targetInput = document.getElementById('goalTargetDateInput');
    
    const name = nameInput.value.trim();
    if (!name) {
        alert('Please enter a goal name');
        return;
    }
    
    const goal = {
        // Leave id null for new goals so saveGoal can create instead of patching
        id: idInput.value.trim() || null,
        name: name,
        description: descInput.value.trim(),
        color: colorInput.value,
        // Convert date to ISO format using UTC noon to avoid timezone shifts
        targetDate: targetInput.value ? new Date(targetInput.value + 'T12:00:00Z').toISOString() : null
    };
    
    await saveGoal(goal);
    closeGoalModal();
    renderGoalsView();
}

function editGoal(goalId) {
    showGoalModal(goalId);
}

// Get all bucket IDs associated with a goal
function getGoalBuckets(goalId) {
    const buckets = [];
    for (const [bucketId, goalIds] of Object.entries(bucketGoalMap)) {
        if (goalIds.includes(goalId)) {
            buckets.push(bucketId);
        }
    }
    return buckets;
}

// Show bucket selector modal for a goal
async function showBucketSelectorForGoal(goalId) {
    const goal = getGoalById(goalId);
    if (!goal) return;
    
    const currentBuckets = getGoalBuckets(goalId);
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal-backdrop" id="bucketSelectorBackdrop" onclick="closeBucketSelector()"></div>
        <div class="modal-dialog bucket-selector-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Assign Buckets: ${escapeHtml(goal.name)}</h2>
                    <button class="modal-close" onclick="closeBucketSelector()">×</button>
                </div>
                <div class="modal-body">
                    <div class="bucket-selector-list">
                        ${allBuckets
                            .filter(bucket => bucket.name !== GOALS_BUCKET_NAME)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(bucket => {
                                const isChecked = currentBuckets.includes(bucket.id);
                                return `
                                    <label class="bucket-checkbox-item">
                                        <input type="checkbox" value="${bucket.id}" ${isChecked ? 'checked' : ''}>
                                        <span>${escapeHtml(bucket.name)}</span>
                                    </label>
                                `;
                            }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeBucketSelector()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveBucketSelection('${goalId}')">Save</button>
                </div>
            </div>
        </div>
    `;
    
    // Insert modal into page
    const modalContainer = document.createElement('div');
    modalContainer.id = 'bucketSelectorModal';
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
}

function closeBucketSelector() {
    const modal = document.getElementById('bucketSelectorModal');
    if (modal) {
        modal.remove();
    }
}

async function saveBucketSelection(goalId) {
    const checkboxes = document.querySelectorAll('.bucket-checkbox-item input[type="checkbox"]');
    const selectedBucketIds = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    // Update bucketGoalMap
    // First, remove this goal from all buckets
    for (const bucketId in bucketGoalMap) {
        bucketGoalMap[bucketId] = bucketGoalMap[bucketId].filter(gId => gId !== goalId);
        if (bucketGoalMap[bucketId].length === 0) {
            delete bucketGoalMap[bucketId];
        }
    }
    
    // Then add this goal to selected buckets
    for (const bucketId of selectedBucketIds) {
        if (!bucketGoalMap[bucketId]) {
            bucketGoalMap[bucketId] = [];
        }
        if (!bucketGoalMap[bucketId].includes(goalId)) {
            bucketGoalMap[bucketId].push(goalId);
        }
    }
    
    // Save the updated mapping to the system task
    await saveBucketGoalMapping();
    
    closeBucketSelector();
    renderGoalsView();
}

// Navigate to Tasks view with specific goal expanded
function navigateToGoalTasks(goalId) {
    const goal = getGoalById(goalId);
    if (!goal) return;
    
    // Set view to 'goal' and grouping to 'bucket'
    const viewSelect = document.getElementById('viewSelect');
    const groupBySelect = document.getElementById('groupBySelect');
    
    viewSelect.value = 'goal';
    groupBySelect.value = 'bucket';
    
    // Store the goal to expand
    sessionStorage.setItem('expandGoalId', goalId);
    
    // Switch to Tasks tab (this will trigger rendering)
    switchTab('tasks');
    
    // Change view and render
    changeView();
    changeGrouping();
}

function confirmDeleteGoalFromCard(goalId) {
    const goal = getGoalById(goalId);
    if (!goal) return;
    
    if (confirm(`Are you sure you want to delete the goal "${goal.name}"? This will not delete the associated buckets or tasks.`)) {
        deleteGoalAndRefresh(goalId);
    }
}

function confirmDeleteGoal() {
    const idInput = document.getElementById('goalIdInput');
    const goalId = idInput.value;
    
    if (!goalId) return;
    
    const goal = getGoalById(goalId);
    if (!goal) return;
    
    if (confirm(`Are you sure you want to delete the goal "${goal.name}"? This will not delete the associated buckets or tasks.`)) {
        deleteGoalAndRefresh(goalId);
        closeGoalModal();
    }
}

async function deleteGoalAndRefresh(goalId) {
    await deleteGoal(goalId);
    
    // Remove goal from bucket mappings
    for (const bucketId in bucketGoalMap) {
        const index = bucketGoalMap[bucketId].indexOf(goalId);
        if (index > -1) {
            bucketGoalMap[bucketId].splice(index, 1);
            await saveBucketGoalMapping(bucketId, bucketGoalMap[bucketId]);
        }
    }
    
    renderGoalsView();
}

function generateId() {
    return 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showBucketGoalsModal(bucketId) {
    const modal = document.getElementById('bucketGoalsModal');
    const bucketIdInput = document.getElementById('bucketGoalsModalBucketId');
    const bucketNameInput = document.getElementById('bucketGoalsModalBucketName');
    const checkboxesContainer = document.getElementById('bucketGoalsCheckboxes');
    
    const bucket = allBuckets.find(b => b.id === bucketId);
    if (!bucket) return;
    
    bucketIdInput.value = bucketId;
    bucketNameInput.value = bucket.name;
    
    // Get currently assigned goals for this bucket
    const assignedGoals = bucketGoalMap[bucketId] || [];
    
    // Render goal checkboxes
    checkboxesContainer.innerHTML = allGoals.map(goal => `
        <label style="display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; border-bottom: 1px solid var(--border-light);">
            <input type="checkbox" value="${goal.id}" ${assignedGoals.includes(goal.id) ? 'checked' : ''} style="cursor: pointer;">
            <div style="width: 16px; height: 16px; border-radius: 4px; background: ${goal.color}; flex-shrink: 0;"></div>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(goal.name)}</div>
                ${goal.description ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(goal.description)}</div>` : ''}
            </div>
        </label>
    `).join('');
    
    if (allGoals.length === 0) {
        checkboxesContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No goals available. Create a goal first.</div>';
    }
    
    modal.style.display = 'flex';
}

function closeBucketGoalsModal() {
    const modal = document.getElementById('bucketGoalsModal');
    modal.style.display = 'none';
}

async function saveBucketGoalsModal() {
    const bucketIdInput = document.getElementById('bucketGoalsModalBucketId');
    const checkboxesContainer = document.getElementById('bucketGoalsCheckboxes');
    
    const bucketId = bucketIdInput.value;
    const checkboxes = checkboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
    const selectedGoalIds = Array.from(checkboxes).map(cb => cb.value);
    
    await saveBucketGoalMapping(bucketId, selectedGoalIds);
    closeBucketGoalsModal();
    
    // Refresh the current view if needed
    if (currentTab === 'tasks') {
        applyFilters();
    } else if (currentTab === 'goals') {
        renderGoalsView();
    }
}

