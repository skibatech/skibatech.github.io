// Application Version - Update this with each change
const APP_VERSION = '1.3.2';

// Configuration
const config = {
    clientId: '073fb8bf-274f-496d-b2a1-648b1a8195b3', // SkibaTech Planner Dashboard app
    authority: 'https://login.microsoftonline.com/skibatech.com', // Tenant-specific endpoint
    redirectUri: window.location.origin + window.location.pathname,
    scopes: ['Tasks.ReadWrite', 'Group.ReadWrite.All', 'User.Read'],
    allowedTenants: ['skibatech.com', 'skibatech.onmicrosoft.com'] // Only allow SkibaTech users
};

const planId = 'nwc8iIFj8U2MvA4RQReZpWUABC_U';
let accessToken = null;
let currentBucketId = null;
let currentBucketName = null;
let sortState = {}; // Store sort state per bucket: { bucketId: { column: 'name', direction: 'asc' } }
let expandedBuckets = new Set(); // Track which buckets are expanded
let expandedAssignees = new Set(); // Track which assignees are expanded
let currentView = 'byBucket'; // Current view: byBucket or byAssignedBucket
let currentGroupBy = 'bucket'; // Current grouping field
let allBuckets = []; // Store buckets for reference
let allTasks = []; // Store tasks for re-grouping
let allTaskDetails = {}; // Store task details (categories, etc.) by task ID
let planCategoryDescriptions = {}; // Store custom label names for categories
let resizingColumn = null;
let resizeStartX = 0;
let resizeStartWidth = 0;
let currentFilter = 'all';
let showCompleted = true;
let columnWidths = {
    'col-task-name': 300,
    'col-assigned': 120,
    'col-start-date': 100,
    'col-due-date': 100,
    'col-progress': 120,
    'col-priority': 100,
    'col-labels': 200
};

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
}

// Check for OAuth callback
window.addEventListener('DOMContentLoaded', () => {
    initializeVersion();
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
    const authRequired = document.getElementById('authRequired');
    const tasksContainer = document.getElementById('tasksContainer');
    const profileContainer = document.getElementById('profileContainer');
    
    if (isAuthenticated) {
        status.textContent = 'Connected';
        status.style.color = '#107c10';
        connectBtn.style.display = 'none';
        refreshBtn.style.display = 'inline-block';
        profileContainer.style.display = 'inline-block';
        authRequired.style.display = 'none';
        tasksContainer.style.display = 'block';
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
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    } else {
        status.textContent = 'Not connected';
        status.style.color = '#666';
        connectBtn.style.display = 'inline-block';
        refreshBtn.style.display = 'none';
        profileContainer.style.display = 'none';
        authRequired.style.display = 'block';
        tasksContainer.style.display = 'none';
        document.body.classList.add('unauthenticated');
    }
}

async function loadTasks() {
    if (!accessToken) {
        alert('Please sign in first');
        return;
    }

    try {
        document.getElementById('status').textContent = 'Loading...';

        // Get buckets
        const bucketsResponse = await fetch(
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
        const planDetailsResponse = await fetch(
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
        }

        // Get tasks
        const tasksResponse = await fetch(
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

        // Fetch task details for categories
        const detailsPromises = tasks.map(task => 
            fetch(`https://graph.microsoft.com/v1.0/planner/tasks/${task.id}/details`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        );
        const details = await Promise.all(detailsPromises);
        
        // Store task details
        allTaskDetails = {};
        tasks.forEach((task, i) => {
            if (details[i]) {
                allTaskDetails[task.id] = details[i];
            }
        });

        // Store for re-grouping
        allBuckets = buckets;
        allTasks = tasks;

        // Apply filters and render
        applyFilters();
        document.getElementById('status').textContent = 'Connected';
    } catch (error) {
        console.error('Error loading tasks:', error);
        document.getElementById('status').textContent = 'Error loading tasks';
        alert('Error: ' + error.message);
    }
}

function renderTasks(buckets, tasks) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';

    // Check current view and render accordingly
    if (currentView === 'byAssignedBucket') {
        renderByAssignedBucket(container, buckets, tasks);
    } else {
        renderByBucket(container, buckets, tasks);
    }
}

function renderByBucket(container, buckets, tasks) {
    if (currentGroupBy === 'bucket') {
        groups = buckets.map(bucket => ({
            id: bucket.id,
            name: bucket.name,
            tasks: tasks.filter(t => t.bucketId === bucket.id)
        }));
    } else {
        groups = groupTasksBy(tasks, buckets, currentGroupBy);
    }

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
                    <div></div>
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
        // Get proper assignee name from task details
        let assigneeName = 'Unassigned';
        if (task.assignments && Object.keys(task.assignments).length > 0) {
            const assigneeId = Object.keys(task.assignments)[0];
            // Try to get display name from task details
            if (allTaskDetails[task.id]?.assignments?.[assigneeId]?.displayName) {
                assigneeName = allTaskDetails[task.id].assignments[assigneeId].displayName;
            } else {
                // Fallback: use "Assigned" rather than trying to format the ID
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
    
    // Render by assignee
    Object.entries(groupedByAssignee).sort().forEach(([assigneeName, bucketMap]) => {
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
                toggleBucket(bucketId);
            };
            
            const taskList = document.createElement('div');
            taskList.className = 'task-list nested' + (bucketExpanded ? ' expanded' : '');
            taskList.innerHTML = bucketTasks.map(task => renderTask(task)).join('');
            
            bucketDiv.appendChild(bucketHeader);
            bucketDiv.appendChild(taskList);
            assigneeContent.appendChild(bucketDiv);
        });
        
        container.appendChild(assigneeDiv);
    });
    
    applyColumnWidths();
}

function toggleAssignee(assigneeId) {
    if (expandedAssignees.has(assigneeId)) {
        expandedAssignees.delete(assigneeId);
    } else {
        expandedAssignees.add(assigneeId);
    }
    applyFilters();
}

function toggleBucket(bucketId) {
    if (expandedBuckets.has(bucketId)) {
        expandedBuckets.delete(bucketId);
    } else {
        expandedBuckets.add(bucketId);
    }
    applyFilters();
}

function groupTasksBy(tasks, buckets, groupBy) {
    const groups = {};
    
    tasks.forEach(task => {
        let key, name;
        
        switch(groupBy) {
            case 'assigned':
                const hasAssignments = task.assignments && Object.keys(task.assignments).length > 0;
                key = hasAssignments ? 'assigned' : 'unassigned';
                name = hasAssignments ? 'Assigned' : 'Unassigned';
                break;
            case 'progress':
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
            case 'dueDate':
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
            case 'priority':
                const priorityMap = {1: 'Urgent', 3: 'Important', 5: 'Medium', 9: 'Low'};
                key = 'priority-' + task.priority;
                name = priorityMap[task.priority] || 'No priority';
                break;
            default:
                key = 'other';
                name = 'Other';
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
    // For nested view, we need task details to be loaded
    if (newView === 'byAssignedBucket' && Object.keys(allTaskDetails).length === 0) {
        // Task details not yet loaded, don't switch views
        document.getElementById('viewSelect').value = currentView;
        return;
    }
    currentView = newView;
    applyFilters();
}

function changeGroupBy() {
    currentGroupBy = document.getElementById('groupBySelect').value;
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
        const categoryNames = {
            'category1': planCategoryDescriptions.category1 || 'Pink',
            'category2': planCategoryDescriptions.category2 || 'Red',
            'category3': planCategoryDescriptions.category3 || 'Yellow',
            'category4': planCategoryDescriptions.category4 || 'Green',
            'category5': planCategoryDescriptions.category5 || 'Blue',
            'category6': planCategoryDescriptions.category6 || 'Purple',
            'category7': planCategoryDescriptions.category7 || 'Bronze',
            'category8': planCategoryDescriptions.category8 || 'Lime',
            'category9': planCategoryDescriptions.category9 || 'Aqua',
            'category10': planCategoryDescriptions.category10 || 'Gray',
            'category11': planCategoryDescriptions.category11 || 'Silver',
            'category12': planCategoryDescriptions.category12 || 'Brown',
            'category13': planCategoryDescriptions.category13 || 'Cranberry',
            'category14': planCategoryDescriptions.category14 || 'Orange',
            'category15': planCategoryDescriptions.category15 || 'Peach',
            'category16': planCategoryDescriptions.category16 || 'Marigold',
            'category17': planCategoryDescriptions.category17 || 'Light green',
            'category18': planCategoryDescriptions.category18 || 'Dark green',
            'category19': planCategoryDescriptions.category19 || 'Teal',
            'category20': planCategoryDescriptions.category20 || 'Light blue',
            'category21': planCategoryDescriptions.category21 || 'Dark blue',
            'category22': planCategoryDescriptions.category22 || 'Lavender',
            'category23': planCategoryDescriptions.category23 || 'Plum',
            'category24': planCategoryDescriptions.category24 || 'Light gray',
            'category25': planCategoryDescriptions.category25 || 'Dark gray'
        };
        const colors = {
            'category1': '#f06292',
            'category2': '#ef5350',
            'category3': '#ffb74d',
            'category4': '#81c784',
            'category5': '#64b5f6',
            'category6': '#ba68c8',
            'category7': '#a1887f',
            'category8': '#dce775',
            'category9': '#4dd0e1',
            'category10': '#bdbdbd',
            'category11': '#bdbdbd',
            'category12': '#795548',
            'category13': '#c2185b',
            'category14': '#ff9800',
            'category15': '#ffab91',
            'category16': '#ffd54f',
            'category17': '#aed581',
            'category18': '#388e3c',
            'category19': '#00897b',
            'category20': '#81d4fa',
            'category21': '#1976d2',
            'category22': '#b39ddb',
            'category23': '#ab47bc',
            'category24': '#e0e0e0',
            'category25': '#616161'
        };
        
        // Debug: log if this is TEST123
        if (categoryNames[cat] && categoryNames[cat].includes('TEST')) {
            console.log(`🏷️  Label: ${categoryNames[cat]} | Category: ${cat} | Color: ${colors[cat]}`);
        }
        
        return `<span class="label-badge" style="background: ${colors[cat]}; color: white;">${categoryNames[cat]}</span>`;
    }).join('');

    return `
        <div class="task-row">
            <input type="checkbox" class="task-checkbox" 
                   ${task.percentComplete === 100 ? 'checked' : ''} 
                   onchange="toggleTaskComplete('${task.id}', this.checked, '${task['@odata.etag']}')">
            <div class="task-title col-task-name" onclick="openTaskDetail('${task.id}')">${task.title}</div>
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
    currentBucketId = bucketId;
    currentBucketName = bucketName;
    document.getElementById('addTaskModal').classList.add('show');
    document.getElementById('newTaskTitle').value = '';
    document.getElementById('newTaskProgress').value = '0';
    document.getElementById('newTaskPriority').value = '5';
    document.getElementById('newTaskStartDate').value = '';
    document.getElementById('newTaskDueDate').value = '';
    document.getElementById('newTaskNotes').value = '';
    
    // Populate bucket dropdown
    const bucketSelect = document.getElementById('newTaskBucket');
    bucketSelect.innerHTML = allBuckets.map(b => 
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

        const response = await fetch('https://graph.microsoft.com/v1.0/planner/tasks', {
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
            await fetch(`https://graph.microsoft.com/v1.0/planner/tasks/${newTask.id}/details`, {
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
        const response = await fetch(`https://graph.microsoft.com/v1.0/planner/tasks/${taskId}`, {
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
        const taskResponse = await fetch(
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
        const detailsResponse = await fetch(
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
        
        // Populate assigned to field
        let assigneeName = 'Unassigned';
        if (task.assignments && Object.keys(task.assignments).length > 0) {
            const assigneeId = Object.keys(task.assignments)[0];
            if (details.assignments && details.assignments[assigneeId]) {
                assigneeName = details.assignments[assigneeId].displayName;
            }
        }
        document.getElementById('detailTaskAssignee').value = assigneeName;
        
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
        
        // Populate bucket dropdown
        const bucketSelect = document.getElementById('detailTaskBucket');
        bucketSelect.innerHTML = allBuckets.map(b => 
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
        
        // Get selected categories (must include all with true/false for Graph API)
        const appliedCategories = {};
        ['category5', 'category4', 'category3', 'category1', 'category7', 'category9', 'category2'].forEach(cat => {
            const checkbox = document.getElementById(cat);
            if (checkbox) {
                appliedCategories[cat] = checkbox.checked;
            }
        });
        
        // Update basic task info
        const taskBody = {
            title: title,
            percentComplete: progress,
            priority: priority,
            bucketId: bucketId,
            appliedCategories: appliedCategories
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
        
        const taskResponse = await fetch(
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
            const detailsResponse = await fetch(
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
        loadTasks();
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Error saving task: ' + error.message);
    } finally {
        document.getElementById('saveTaskBtn').disabled = false;
        document.getElementById('saveTaskBtn').textContent = 'Save Changes';
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
