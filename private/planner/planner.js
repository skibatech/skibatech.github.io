// Application Version - Update this with each change
const APP_VERSION = '1.4.87'; // Dynamic compass text contrast and readable labels

// Compact set of one-line motivational quotes (Covey, Carnegie, Brown, Holiday, Peale, others)
const MOTIVATIONAL_QUOTES = [
    'Begin with the end in mind. — Stephen Covey',
    'Put first things first. — Stephen Covey',
    'The main thing is the main thing. — Stephen Covey',
    'Success is getting what you want; happiness is wanting what you get. — Dale Carnegie',
    'Do one thing well today. — Dale Carnegie',
    'The obstacle is the way. — Ryan Holiday',
    'Discipline equals freedom. — Ryan Holiday',
    'No great thing is created suddenly. — Epictetus',
    'We suffer more in imagination than in reality. — Seneca',
    'Well done is better than well said. — Benjamin Franklin',
    'Small deeds, big results. — Anonymous',
    'Change your thoughts; change your world. — Norman Vincent Peale'
];

// Configuration - will be loaded from config.json
let config = {
    clientId: '',
    authority: '',
    redirectUri: window.location.origin + window.location.pathname,
    scopes: ['Tasks.ReadWrite', 'Group.ReadWrite.All', 'User.Read'],
    allowedTenants: [],
    adminGroupId: ''
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
let allBuckets = []; // Store buckets for reference
let allTasks = []; // Store tasks for re-grouping
let allTaskDetails = {}; // Store task details (categories, etc.) by task ID
let allUsers = {}; // Store user details: { userId: displayName }
let taskIdPrefix = ''; // Configurable task ID prefix
let adminUsers = []; // Admin users list
let currentUserEmail = null; // Store current user's email
let currentUserIsAdmin = false; // Cache admin status after auth
let planCategoryDescriptions = {}; // Store custom label names for categories
let planDetailsEtag = null; // Store etag for plan details updates
let customThemeNames = JSON.parse(localStorage.getItem('customThemeNames') || '{}');
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
let resizingColumn = null;
let resizeStartX = 0;
let resizeStartWidth = 0;
let currentFilter = 'all';
let showCompleted = localStorage.getItem('plannerShowCompleted') === 'true' || false;
let draggedColumnElement = null; // Store the dragged column header element
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
const GRAPH_MAX_CONCURRENT = 6; // Cap concurrent per-item calls (e.g., task details)

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function fetchGraph(url, options = {}, attempt = 0) {
    const res = await fetch(url, options);
    if (res.status === 429 || res.status === 503) {
        if (attempt >= GRAPH_MAX_RETRIES) return res;
        const retryAfter = parseInt(res.headers.get('Retry-After') || '0', 10);
        const backoff = retryAfter > 0
            ? retryAfter * 1000
            : Math.min(16000, GRAPH_BASE_DELAY_MS * Math.pow(2, attempt)) + Math.floor(Math.random() * 250);
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

function stopResize() {
    resizingColumn = null;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
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
        config.clientId = configData.clientId;
        config.authority = configData.authority;
        config.allowedTenants = configData.allowedTenants || [];
        config.adminGroupId = configData.adminGroupId || '';
        planId = configData.planId;
        taskIdPrefix = configData.taskIdPrefix || 'STE';
        adminUsers = (configData.adminUsers || []).map(e => e.trim().toLowerCase()).filter(e => e);
        
        console.log('✅ Configuration loaded from config.json');
        return true;
    } catch (err) {
        console.error('❌ Failed to load config.json:', err);
        alert('Failed to load application configuration. Please ensure config.json exists.');
        return false;
    }
}

// Check for OAuth callback
window.addEventListener('DOMContentLoaded', async () => {
    initializeVersion();
    initializeTheme();
    
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
                alert('Access denied. This dashboard is only available to SkibaTech users.');
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
    // Use OAuth 2.0 Authorization Code Flow with PKCE (recommended for SPAs)
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store code verifier for token exchange
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    
    const authUrl = `${config.authority}/oauth2/v2.0/authorize?` +
        `client_id=${config.clientId}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
        `&scope=${encodeURIComponent(config.scopes.join(' '))}` +
        `&response_mode=query` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256` +
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
    
    if (isAuthenticated) {
        status.textContent = 'Connected';
        status.style.color = '#107c10';
        connectBtn.style.display = 'none';
        refreshBtn.style.display = 'inline-block';
        compassToggleBtn.style.display = 'inline-block';
        profileContainer.style.display = 'inline-block';
        authRequired.style.display = 'none';
        mainWrapper.style.display = 'block';
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
        authRequired.style.display = 'block';
        mainWrapper.style.display = 'none';
        document.body.classList.add('unauthenticated');
        if (adminModeItem) adminModeItem.style.display = 'none';
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
        document.getElementById('status').textContent = 'Loading...';

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

        // Get tasks
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
        const tasks = tasksData.value;

        // Assign sequential IDs based on createdDateTime (oldest -> 1)
        taskSequentialIds = {};
        const ordered = [...tasks].sort((a, b) => {
            const at = a.createdDateTime ? new Date(a.createdDateTime).getTime() : 0;
            const bt = b.createdDateTime ? new Date(b.createdDateTime).getTime() : 0;
            if (at !== bt) return at - bt;
            return a.id.localeCompare(b.id);
        });
        ordered.forEach((t, idx) => { taskSequentialIds[t.id] = idx + 1; });

        // Fetch task details for categories
        const details = await mapWithConcurrency(
            tasks,
            async (task) => {
                const r = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${task.id}/details`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (!r.ok) return null;
                return r.json();
            }
        );
        
        // Collect all unique user IDs from assignments
        const userIds = new Set();
        tasks.forEach(task => {
            if (task.assignments) {
                Object.keys(task.assignments).forEach(userId => userIds.add(userId));
            }
        });
        
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
        const userDetailsMap = {};
        planMembers.forEach(m => {
            if (m && m.id && m.displayName) userDetailsMap[m.id] = m.displayName;
        });
        const missingUserIds = Array.from(userIds).filter(uid => !userDetailsMap[uid]);
        // Fetch remaining users via directoryObjects/getByIds in chunks
        async function fetchUsersByIds(ids) {
            const r = await fetchGraph('https://graph.microsoft.com/v1.0/directoryObjects/getByIds', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids, types: ['user'] })
            });
            if (!r.ok) return [];
            const data = await r.json();
            return data.value || [];
        }
        const chunkSize = 100;
        for (let i = 0; i < missingUserIds.length; i += chunkSize) {
            const chunk = missingUserIds.slice(i, i + chunkSize);
            const users = await fetchUsersByIds(chunk);
            users.forEach(u => {
                if (u && u.id && u.displayName) userDetailsMap[u.id] = u.displayName;
            });
        }
        
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
                        displayName: userDetailsMap[userId] || 'Assigned'
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

        // Set view dropdown to match current view
        document.getElementById('viewSelect').value = currentView;
        
        // Initialize Group By dropdown to exclude current view
        changeView();

        // Apply filters and render
        applyFilters();
        document.getElementById('status').textContent = 'Connected';
        
        // Initialize compass on first load
        if (!compassListId) {
            initializeCompass();
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        document.getElementById('status').textContent = 'Error loading tasks';
        alert('Error: ' + error.message);
    }
}

function renderTasks(buckets, tasks) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';

    // If we have a secondary grouping, render nested hierarchy
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
                    <div class="sortable-header col-id" onclick="event.stopPropagation(); sortBucket('${group.id}', 'id')">
                        ID ${sortArrows('id')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-id')"></div>
                    </div>
                    <div class="sortable-header col-task-name" onclick="event.stopPropagation(); sortBucket('${group.id}', 'title')">
                        Task name ${sortArrows('title')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-task-name')"></div>
                    </div>
                    <div class="sortable-header col-assigned" onclick="event.stopPropagation(); sortBucket('${group.id}', 'assigned')">
                        Assigned to ${sortArrows('assigned')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-assigned')"></div>
                    </div>
                    <div class="sortable-header col-start-date" onclick="event.stopPropagation(); sortBucket('${group.id}', 'startDate')">
                        Start date ${sortArrows('startDate')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-start-date')"></div>
                    </div>
                    <div class="sortable-header col-due-date" onclick="event.stopPropagation(); sortBucket('${group.id}', 'dueDate')">
                        Due date ${sortArrows('dueDate')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-due-date')"></div>
                    </div>
                    <div class="sortable-header col-progress" onclick="event.stopPropagation(); sortBucket('${group.id}', 'progress')">
                        Progress ${sortArrows('progress')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-progress')"></div>
                    </div>
                    <div class="sortable-header col-priority" onclick="event.stopPropagation(); sortBucket('${group.id}', 'priority')">
                        Priority ${sortArrows('priority')}
                        <div class="resize-handle" onmousedown="startResize(event, 'col-priority')"></div>
                    </div>
                    <div class="col-labels">Themes</div>
                </div>
                ${groupTasks.map(task => renderTask(task)).join('')}
                <button class="add-task-btn" onclick="showAddTask('${group.id}', '${group.name.replace(/'/g, "\\'")}')">+ Add task</button>
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
    // Group tasks by assignee, then by bucket
    const groupedByAssignee = {};
    
    tasks.forEach(task => {
        // Get proper assignee name from enriched task details
        let assigneeName = 'Unassigned';
        if (task.assignments && Object.keys(task.assignments).length > 0) {
            const assigneeId = Object.keys(task.assignments)[0];
            // Get display name from allTaskDetails which has enriched user info
            if (allTaskDetails[task.id]?.assignments?.[assigneeId]?.displayName) {
                assigneeName = allTaskDetails[task.id].assignments[assigneeId].displayName;
            } else {
                assigneeName = 'Assigned';
            }
        }
        
        if (!groupedByAssignee[assigneeName]) {
            groupedByAssignee[assigneeName] = {};
        }
        
        const bucketName = buckets.find(b => b.id === task.bucketId)?.name || 'No Bucket';
        if (!groupedByAssignee[assigneeName][bucketName]) {
            groupedByAssignee[assigneeName][bucketName] = [];
        }
        
        groupedByAssignee[assigneeName][bucketName].push(task);
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
            
            // Add "Add task" button
            const addTaskBtn = document.createElement('button');
            addTaskBtn.className = 'add-task-btn';
            addTaskBtn.textContent = '+ Add task';
            addTaskBtn.onclick = () => {
                const bucket = buckets.find(b => b.name === bucketName);
                if (bucket) {
                    showAddTask(bucket.id, bucket.name);
                }
            };
            taskList.appendChild(addTaskBtn);
            
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
        const primaryId = primaryGrp.name.toLowerCase().replace(/\\s+/g, '-');
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
            const bucketId = secondaryGrp.name.toLowerCase().replace(/\\s+/g, '-') + '-' + primaryId;
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
            
            // Add \"Add task\" button
            const addTaskBtn = document.createElement('button');
            addTaskBtn.className = 'add-task-btn';
            addTaskBtn.textContent = '+ Add task';
            addTaskBtn.onclick = () => {
                // Find bucket ID if secondary group is bucket
                if (secondaryGroup === 'bucket') {
                    const bucket = buckets.find(b => b.name === secondaryGrp.name);
                    if (bucket) {
                        showAddTask(bucket.id, bucket.name);
                    }
                } else {
                    showAddTask(null, null);
                }
            };
            taskList.appendChild(addTaskBtn);
            
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
    let groupTasks = group.tasks;
    
    // Apply sorting if set
    const sort = sortState[group.id];
    if (sort) {
        groupTasks = sortTasks(groupTasks, sort.column, sort.direction);
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
    
    // Get theme color if viewing by theme
    let themeColorStyle = '';
    let groupDisplayName = group.name;
    if (currentView === 'theme') {
        const themeColor = getThemeColorForCategoryId(group.id);
        if (themeColor) {
            themeColorStyle = ` style="background: ${themeColor}; color: white;"`;
        }
        // Use prefixed theme name for display
        groupDisplayName = getThemeDisplayNameWithPrefix(group.id);
    }
    
    bucketDiv.innerHTML = `
        <div class=\"bucket-header\"${themeColorStyle} onclick=\"toggleBucket(this)\">
            <div class=\"bucket-title\">
                <span class=\"expand-icon\">▶</span>
                ${groupDisplayName}
                <span class=\"task-count\">${groupTasks.length}</span>
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
            <button class=\"add-task-btn\" onclick=\"showAddTask('${group.id}', '${group.name.replace(/'/g, "\\\\'")}')\">+ Add task</button>
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
                if (task.assignments && Object.keys(task.assignments).length > 0) {
                    const assigneeId = Object.keys(task.assignments)[0];
                    key = assigneeId;
                    // Prefer enriched names from allTaskDetails, then allUsers
                    const enriched = allTaskDetails[task.id]?.assignments?.[assigneeId]?.displayName;
                    const fromUsers = allUsers[assigneeId];
                    name = enriched || fromUsers || 'Assigned';
                } else {
                    key = 'unassigned';
                    name = 'Unassigned';
                }
                break;
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

function applyFilters() {
    if (allTasks.length === 0) return;
    
    currentFilter = document.getElementById('filterSelect').value;
    showCompleted = document.getElementById('showCompletedCheckbox').checked;
    
    let filteredTasks = allTasks.filter(task => {
        // Filter by completion status
        if (!showCompleted && task.percentComplete === 100) {
            return false;
        }
        
        // Apply other filters
        switch(currentFilter) {
            case 'all':
                return true;
            case 'urgent':
                return task.priority === 0;
            case 'important':
                return task.priority === 1;
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
    
    renderTasks(allBuckets, filteredTasks);
}

function renderTask(task) {
    // Use sequential ID assigned by createdDateTime (oldest -> 1)
    const seq = taskSequentialIds[task.id];
    const taskDisplayId = seq ? `${taskIdPrefix}-${seq}` : `${taskIdPrefix}-?`;
    
    const progressClass = task.percentComplete === 0 ? 'not-started' : 
                         task.percentComplete === 100 ? 'completed' : 'in-progress';
    const progressText = task.percentComplete === 0 ? 'Not started' : 
                        task.percentComplete === 100 ? 'Completed' : 'In progress';
    
    const priorityMap = {1: 'Urgent', 3: 'Important', 5: 'Medium', 9: 'Low'};
    const priorityText = priorityMap[task.priority] || '';
    
    const startDate = task.startDateTime ? new Date(task.startDateTime).toLocaleDateString() : '';
    const dueDate = task.dueDateTime ? new Date(task.dueDateTime).toLocaleDateString() : '';
    
    const assignee = task.assignments && Object.keys(task.assignments).length > 0 ? 
        (allTaskDetails[task.id]?.assignments ? 
            Object.values(allTaskDetails[task.id].assignments)
                .map(a => a.displayName)
                .join(', ')
            : 'Assigned') 
        : '';
    
    // Get categories
    const appliedCategories = task.appliedCategories || {};
    
    // Debug logging for TEST123
    if (task.title && task.title.includes('Microsoft Learn')) {
        console.log('📋 Task:', task.title, '| Applied Categories:', Object.keys(appliedCategories), '| Category Descriptions:', planCategoryDescriptions);
    }
    
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

    return `
        <div class="task-row" data-task-id="${task.id}">
            <input type="checkbox" class="task-checkbox" 
                ${selectedTasks.has(task.id) ? 'checked' : ''} 
                onchange="toggleTaskSelection('${task.id}')">
            <div class="task-id col-id">${taskDisplayId}</div>
            <div class="task-title col-task-name" onclick="openTaskDetail('${task.id}')">
                <span>${task.title}</span>
            </div>
            <div class="task-assignee col-assigned">${assignee}</div>
            <div class="task-date col-start-date">${startDate}</div>
            <div class="task-date col-due-date">${dueDate}</div>
            <div class="task-progress col-progress">
                <span class="progress-dot ${progressClass}"></span>
                ${progressText}
            </div>
            <div class="task-priority col-priority">${priorityText}</div>
            <div class="task-labels col-labels">${categoryBadges}</div>
        </div>
    `;
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
    
    // Set Start Date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('newTaskStartDate').value = today;
    
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
            taskBody.startDateTime = new Date(startDate).toISOString();
        }
        if (dueDate) {
            taskBody.dueDateTime = new Date(dueDate).toISOString();
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
        
        // Format dates for input fields
        if (task.startDateTime) {
            const startDate = new Date(task.startDateTime);
            document.getElementById('detailTaskStartDate').value = startDate.toISOString().split('T')[0];
        } else {
            document.getElementById('detailTaskStartDate').value = '';
        }
        
        if (task.dueDateTime) {
            const dueDate = new Date(task.dueDateTime);
            document.getElementById('detailTaskDueDate').value = dueDate.toISOString().split('T')[0];
        } else {
            document.getElementById('detailTaskDueDate').value = '';
        }
        
        document.getElementById('detailTaskDescription').value = details.description || '';
        
        // Populate bucket dropdown (sorted alphabetically)
        const bucketSelect = document.getElementById('detailTaskBucket');
        bucketSelect.innerHTML = allBuckets
            .slice()
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
        document.getElementById('openInPlannerLink').href = 
            `https://tasks.office.com/skibatech.com/Home/Task/${taskId}`;
        
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
            taskBody.startDateTime = new Date(startDate).toISOString();
        } else {
            taskBody.startDateTime = null;
        }
        
        if (dueDate) {
            taskBody.dueDateTime = new Date(dueDate).toISOString();
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
    document.getElementById('compassBgColorInput').value = localStorage.getItem('compassBgColor') || '#2d5016';
    
    // Add real-time color change listener
    const colorInput = document.getElementById('compassBgColorInput');
    colorInput.addEventListener('change', function() {
        applyCompassBackground(this.value);
    });
    
    document.getElementById('optionsModal').style.display = 'flex';
    switchOptionsTab('views');
}

function switchOptionsTab(tab) {
    // Hide all tabs
    document.getElementById('viewsTab').style.display = 'none';
    
    // Remove active class from all nav items
    document.querySelectorAll('.options-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab and mark nav item as active
    if (tab === 'views') {
        document.getElementById('viewsTab').style.display = 'block';
        document.querySelectorAll('.options-nav-item')[0].classList.add('active');
    }
}

function closeOptions() {
    document.getElementById('optionsModal').style.display = 'none';
}

function isAdmin() {
    return currentUserIsAdmin === true;
}

async function evaluateAdminStatus() {
    currentUserIsAdmin = false;
    if (!currentUserEmail) return false;

    const groupConfigured = !!config.adminGroupId;

    // Group check if configured
    if (groupConfigured && accessToken) {
        try {
            const res = await fetchGraph('https://graph.microsoft.com/v1.0/me/checkMemberGroups', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ groupIds: [config.adminGroupId] })
            });
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.value) && data.value.includes(config.adminGroupId)) {
                    currentUserIsAdmin = true;
                    return true;
                }
            }
        } catch (err) {
            console.warn('Group membership check failed', err);
        }
    }

    // Fallback to email list when provided
    if (adminUsers.length > 0) {
        currentUserIsAdmin = adminUsers.includes(currentUserEmail);
        return currentUserIsAdmin;
    }

    // If a group is configured and no email override, default to non-admin
    if (groupConfigured) {
        currentUserIsAdmin = false;
        return false;
    }

    // No admin controls configured: allow access to avoid lockout
    currentUserIsAdmin = true;
    return true;
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
    const compassBgColor = document.getElementById('compassBgColorInput').value;
    
    // Anyone can save view preferences
    currentView = defaultView;
    localStorage.setItem('plannerDefaultView', defaultView);
    currentGroupBy = defaultGroupBy;
    localStorage.setItem('plannerDefaultGroupBy', defaultGroupBy);
    showCompleted = showCompletedDefault;
    localStorage.setItem('plannerShowCompleted', showCompletedDefault ? 'true' : 'false');
    localStorage.setItem('compassBgColor', compassBgColor);
    applyCompassBackground(compassBgColor);

    closeOptions();
    alert('View preferences saved!');
    await loadTasks();
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
            (allBuckets || []).slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(b => {
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
    updateBulkEditSidebar();
    applyFilters();
}

async function bulkAssignSelected() {
    const assigneeSelect = document.getElementById('bulkAssigneeSelect');
    if (!assigneeSelect) return;
    const assigneeUserId = assigneeSelect.value; // empty for unassigned
    if (selectedTasks.size === 0) return;
    
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
            const assignments = {};
            if (task.assignments) {
                Object.keys(task.assignments).forEach(uid => { assignments[uid] = null; });
            }
            if (assigneeUserId) {
                assignments[assigneeUserId] = { '@odata.type': '#microsoft.graph.plannerAssignment', orderHint: ' !' };
            }
            await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'If-Match': etag
                },
                body: JSON.stringify({ assignments })
            });
            await sleep(250);
        }, 2);
        clearSelection();
        loadTasks();
    } catch (err) {
        console.error('Bulk assign error:', err);
        alert('Error assigning tasks: ' + err.message);
    }
}

async function bulkMoveSelected() {
    const bucketSelect = document.getElementById('bulkBucketSelect');
    if (!bucketSelect || !bucketSelect.value) return;
    const targetBucketId = bucketSelect.value;
    if (selectedTasks.size === 0) return;
    try {
        const taskIds = Array.from(selectedTasks);
        await mapWithConcurrency(taskIds, async (taskId) => {
            const getRes = await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
                method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!getRes.ok) return;
            const task = await getRes.json();
            const etag = task['@odata.etag'];
            await fetchGraph(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'If-Match': etag
                },
                body: JSON.stringify({ bucketId: targetBucketId })
            });
            await sleep(250);
        }, 2);
        clearSelection();
        loadTasks();
    } catch (err) {
        console.error('Bulk move error:', err);
        alert('Error moving tasks: ' + err.message);
    }
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
let compassListId = null;
let compassVisible = false;
let compassEditMode = false;

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
        
        if (!compassList) {
            // Create the list if it doesn't exist
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
                console.error('Failed to create compass list:', createResponse.status);
                return;
            }
            
            compassList = await createResponse.json();
        }
        
        compassListId = compassList.id;
        await loadCompassData();
    } catch (err) {
        console.error('Failed to initialize compass:', err);
    }
}

async function loadCompassData() {
    if (!compassListId || !accessToken) return;
    
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

        const response = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassListId}/tasks`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            console.error('Failed to load compass tasks:', response.status);
            return;
        }
        
        const tasksData = await response.json();
        const tasks = (tasksData.value || []).slice();
        // Ensure roles keep entered order by sorting on the numeric suffix
        tasks.sort((a, b) => {
            const getIdx = (title) => {
                if (!title || !title.startsWith('COMPASS_ROLE_')) return Number.MAX_SAFE_INTEGER;
                const num = parseInt(title.replace('COMPASS_ROLE_', ''), 10);
                return isNaN(num) ? Number.MAX_SAFE_INTEGER : num;
            };
            return getIdx(a.title) - getIdx(b.title);
        });
        
        // Parse compass data from To Do tasks
        tasks.forEach(task => {
            const title = task.title;
            const body = task.body?.content || '';
            
            if (title === 'COMPASS_QUOTE') {
                compassData.quote = body;
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
                    const roleData = JSON.parse(body);
                    compassData.roles.push(roleData);
                } catch (e) {
                    console.error('Failed to parse role:', e);
                }
            }
        });
        
        renderCompass();
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
        section.querySelectorAll('.compass-rock-input').forEach(input => {
            const val = input.value.trim();
            if (val) rocks.push(val);
        });
        if (roleName.trim() || rocks.length > 0) {
            updated.roles.push({ name: roleName, rocks });
        }
    });

    compassData = updated;
    return updated;
}

async function saveCompassData() {
    if (!compassListId || !accessToken) return;
    
    try {
        // Capture unsaved UI changes before persisting
        captureCompassInputs();
        
        // Fetch existing tasks
        const existingResponse = await fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassListId}/tasks`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!existingResponse.ok) {
            console.error('Failed to fetch existing tasks:', existingResponse.status);
            alert('Failed to save compass data: unable to fetch existing items.');
            return;
        }
        const existingData = await existingResponse.json();
        const existingTasks = existingData.value || [];

        // Create new tasks first (safer). If any creation fails, we abort without deleting old data.
        const createTask = async (title, body) => {
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
            if (!resp.ok) throw new Error(`Create failed (${resp.status})`);
            return resp;
        };

        try {
            await createTask('COMPASS_QUOTE', compassData.quote);
            await createTask('COMPASS_DATERANGE', compassData.dateRange || '');
            await createTask('COMPASS_SAW', JSON.stringify(compassData.sharpenSaw));
            for (let i = 0; i < compassData.roles.length; i++) {
                await createTask(`COMPASS_ROLE_${i}`, JSON.stringify(compassData.roles[i]));
            }
        } catch (createErr) {
            console.error('Failed to create compass items:', createErr);
            alert('Failed to save compass data (create phase). Existing data was preserved.');
            return;
        }

        // If creation succeeded, delete old tasks
        await Promise.all(existingTasks.map(task =>
            fetchGraph(`https://graph.microsoft.com/v1.0/me/todo/lists/${compassListId}/tasks/${task.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
        ));
        
        alert('Weekly Compass saved successfully!');
    } catch (err) {
        console.error('Failed to save compass:', err);
        alert('Failed to save compass data: ' + err.message);
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
    const editBtn = document.getElementById('compassEditBtn');
    if (editBtn) editBtn.textContent = compassEditMode ? 'Done' : 'Edit';
}

function updateCompassEditUI() {
    const panel = document.getElementById('weeklyCompassPanel');
    if (!panel) return;
    if (compassEditMode) {
        panel.classList.remove('compass-readonly');
    } else {
        panel.classList.add('compass-readonly');
    }
}

function renderCompass() {
    // Update quote
    const quoteInput = document.getElementById('compassQuoteInput');
    if (!compassData.quote) {
        compassData.quote = getRandomQuote();
    }
    if (quoteInput) {
        quoteInput.value = compassData.quote;
        quoteInput.readOnly = !compassEditMode;
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
    
    // Render roles
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
        section.innerHTML = `
            <div class="compass-role-header">
                Role: <input type="text" class="compass-role-input" ${compassEditMode ? '' : 'readonly'} value="${escapeHtml(role.name)}" placeholder="Enter role name...">
                ${compassEditMode ? `<button class="compass-trash-btn" onclick="removeCompassRole(${index})" title="Remove role">🗑️</button>` : ''}
            </div>
            <div class="compass-rocks">
                <div class="compass-rocks-header">Big Rocks ${compassEditMode ? `<button class="compass-add-rock-icon" onclick="addCompassRock(${index})" title="Add priority">＋</button>` : ''}</div>
                ${role.rocks.map((rock, i) => `
                    <div class="compass-rock-item">
                        <input type="text" class="compass-rock-input" ${compassEditMode ? '' : 'readonly'} placeholder="Enter a big rock..." value="${escapeHtml(rock)}">
                        ${compassEditMode ? `<button class="compass-mini-btn" onclick="removeCompassRock(${index}, ${i})" title="Remove priority">✕</button>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(section);
    });
}

function addCompassRole() {
    if (compassData.roles.length >= 7) {
        alert('Maximum 7 roles allowed');
        return;
    }
    captureCompassInputs();
    compassData.roles.push({ name: '', rocks: [] });
    renderCompassRoles();
}

function removeCompassRole(index) {
    captureCompassInputs();
    compassData.roles.splice(index, 1);
    renderCompassRoles();
}

function addCompassRock(roleIndex) {
    captureCompassInputs();
    if (!compassData.roles[roleIndex]) return;
    compassData.roles[roleIndex].rocks.push('');
    renderCompassRoles();
}

function removeCompassRock(roleIndex, rockIndex) {
    captureCompassInputs();
    if (!compassData.roles[roleIndex]) return;
    compassData.roles[roleIndex].rocks.splice(rockIndex, 1);
    renderCompassRoles();
}

// Expose compass functions globally
window.toggleCompass = toggleCompass;
window.saveCompassData = saveCompassData;
window.addCompassRole = addCompassRole;
window.removeCompassRole = removeCompassRole;
window.toggleCompassEdit = toggleCompassEdit;
window.addCompassRock = addCompassRock;
window.removeCompassRock = removeCompassRock;
