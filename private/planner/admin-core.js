// Admin portal core logic
const ADMIN_APP_VERSION = '1.4.67-admin';
const DEFAULT_THEME_NAMES = {
    category5: 'Enhance Security & Compliance',
    category4: 'Optimize Efficiency & Automation',
    category3: 'Improve Documentation',
    category1: 'Streamline Reporting',
    category7: 'Practical Modernization',
    category9: 'Develop Capabilities & Cross-Training',
    category2: 'Maintain Upgrades & Bug Fixes'
};
const ADMIN_ROLE = 'PlannerAdmin';

let accessToken = null;
let currentUserEmail = null;
let planDetailsEtag = null;
let planCategoryDescriptions = {};
let customThemeNames = JSON.parse(localStorage.getItem('customThemeNames') || '{}');
let currentUserIsAdmin = false;

let config = {
    clientId: '',
    authority: '',
    redirectUri: window.location.origin + window.location.pathname,
    scopes: ['Tasks.ReadWrite', 'Group.ReadWrite.All', 'User.Read'],
    allowedTenants: [],
    adminGroupId: ''
};
let planId = '';
let adminUsers = [];

const GRAPH_MAX_RETRIES = 5;
const GRAPH_BASE_DELAY_MS = 500;

function $(id) { return document.getElementById(id); }

function setStatus(text, color = '#666') {
    const badge = $('adminStatus');
    if (badge) {
        badge.textContent = text;
        badge.style.color = color;
    }
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

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

function parseJwt(token) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    try {
        const decoded = atob(payload);
        return JSON.parse(decoded);
    } catch (e) {
        console.warn('Unable to parse token payload', e);
        return null;
    }
}

function hasAdminRole() {
    const payload = parseJwt(accessToken);
    if (!payload) return false;
    const roleClaims = payload.roles || payload.appRoles || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || [];
    if (Array.isArray(roleClaims)) {
        return roleClaims.map(r => (r || '').toString()).some(r => r.toLowerCase() === ADMIN_ROLE.toLowerCase());
    }
    return false;
}

function isAdmin() {
    return currentUserIsAdmin === true;
}

async function evaluateAdminStatus() {
    currentUserIsAdmin = false;
    if (!currentUserEmail) return false;

    const groupConfigured = !!config.adminGroupId;

    // Prefer explicit role claim
    if (hasAdminRole()) {
        currentUserIsAdmin = true;
        return true;
    }

    // Group membership check if configured
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

function initializeVersion() {
    const versionDisplay = $('versionDisplay');
    if (versionDisplay) versionDisplay.textContent = ADMIN_APP_VERSION;
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    updateThemeIcon();
}

function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = $('themeToggleIcon');
    const isDark = document.body.classList.contains('dark-mode');
    if (icon) {
        icon.textContent = isDark ? '☀️' : '🌙';
    }
}

function loadSettingsFromStorage() {
    $('clientIdInput').value = config.clientId;
    $('planIdInput').value = planId;
    $('authorityInput').value = config.authority;
    $('allowedTenantsInput').value = config.allowedTenants.join(', ');
    $('adminGroupIdInput').value = config.adminGroupId;
    $('taskIdPrefixInput').value = localStorage.getItem('taskIdPrefix') || 'STE';
    $('adminUsersInput').value = adminUsers.join(', ');

    $('themeNameCategory5').value = customThemeNames['category5'] || DEFAULT_THEME_NAMES.category5;
    $('themeNameCategory4').value = customThemeNames['category4'] || DEFAULT_THEME_NAMES.category4;
    $('themeNameCategory3').value = customThemeNames['category3'] || DEFAULT_THEME_NAMES.category3;
    $('themeNameCategory1').value = customThemeNames['category1'] || DEFAULT_THEME_NAMES.category1;
    $('themeNameCategory7').value = customThemeNames['category7'] || DEFAULT_THEME_NAMES.category7;
    $('themeNameCategory9').value = customThemeNames['category9'] || DEFAULT_THEME_NAMES.category9;
    $('themeNameCategory2').value = customThemeNames['category2'] || DEFAULT_THEME_NAMES.category2;
}

function updateVisibility(isAuthenticated) {
    $('signInBtn').style.display = isAuthenticated ? 'none' : 'inline-block';
    $('signOutBtn').style.display = isAuthenticated ? 'inline-block' : 'none';
    $('adminContent').style.display = isAuthenticated ? 'block' : 'none';
}

async function verifyUserTenant() {
    try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) return false;
        const user = await response.json();
        const userEmail = (user.userPrincipalName || user.mail || '').toLowerCase();
        currentUserEmail = userEmail;
        const isAllowed = config.allowedTenants.some(tenant => userEmail.endsWith('@' + tenant.toLowerCase()));
        if (!isAllowed) console.warn('Unauthorized tenant attempt:', userEmail);
        return isAllowed;
    } catch (err) {
        console.error('Tenant verification failed', err);
        return false;
    }
}

async function handleRedirectCallback() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('error')) {
        alert(`Authentication error: ${urlParams.get('error_description') || urlParams.get('error')}`);
        return;
    }

    if (urlParams.has('code')) {
        const code = urlParams.get('code');
        const verifier = sessionStorage.getItem('pkce_code_verifier');
        window.history.replaceState({}, document.title, window.location.pathname);
        if (!verifier) {
            alert('Authentication error: missing code verifier');
            return;
        }
        try {
            const tokenResponse = await fetch(`${config.authority}/oauth2/v2.0/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: config.clientId,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: config.redirectUri,
                    code_verifier: verifier,
                    scope: config.scopes.join(' ')
                })
            });
            if (!tokenResponse.ok) {
                const errText = await tokenResponse.text();
                throw new Error(errText || 'Token exchange failed');
            }
            const tokenData = await tokenResponse.json();
            accessToken = tokenData.access_token;
            const expiresIn = tokenData.expires_in;
            const expirationTime = Date.now() + (parseInt(expiresIn) * 1000);
            localStorage.setItem('plannerAccessToken', accessToken);
            localStorage.setItem('tokenExpiration', expirationTime.toString());
            sessionStorage.removeItem('pkce_code_verifier');
            const tenantOk = await verifyUserTenant();
            if (!tenantOk) {
                signOut();
                alert('Access denied for this tenant.');
                return;
            }
            await finalizeAuth();
        } catch (err) {
            console.error('Auth failed', err);
            alert('Authentication failed: ' + err.message);
            sessionStorage.removeItem('pkce_code_verifier');
        }
    } else {
        const stored = localStorage.getItem('plannerAccessToken');
        const expiration = localStorage.getItem('tokenExpiration');
        if (stored && expiration && Date.now() < parseInt(expiration, 10)) {
            accessToken = stored;
            await verifyUserTenant();
            await finalizeAuth();
        }
    }
}

async function finalizeAuth() {
    const allowed = await verifyUserTenant();
    if (!allowed) {
        setStatus('Access denied', '#b00020');
        updateVisibility(false);
        showUnauthorized();
        return;
    }
    await evaluateAdminStatus();
    setStatus('Connected', '#107c10');
    updateVisibility(true);
    toggleUnauthorized(false);
    updateAdminVisibility();
    await ensurePlanDetails();
}

function toggleUnauthorized(show) {
    $('unauthorizedPanel').style.display = show ? 'block' : 'none';
}

function showUnauthorized() {
    toggleUnauthorized(true);
    $('adminContent').style.display = 'none';
}

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
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem('pkce_code_verifier', verifier);
    const authUrl = `${config.authority}/oauth2/v2.0/authorize?` +
        `client_id=${config.clientId}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
        `&scope=${encodeURIComponent(config.scopes.join(' '))}` +
        `&response_mode=query` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256` +
        `&state=admin`; 
    window.location.href = authUrl;
}

function signOut() {
    accessToken = null;
    currentUserEmail = null;
    planDetailsEtag = null;
    currentUserIsAdmin = false;
    localStorage.removeItem('plannerAccessToken');
    localStorage.removeItem('tokenExpiration');
    setStatus('Not connected');
    updateVisibility(false);
    showUnauthorized();
}

function updateAdminVisibility() {
    const isUserAdmin = isAdmin();
    if (!isUserAdmin) {
        showUnauthorized();
    } else {
        toggleUnauthorized(false);
        $('adminContent').style.display = 'block';
    }
}

async function ensurePlanDetails() {
    if (!accessToken) return false;
    try {
        const res = await fetchGraph(
            `https://graph.microsoft.com/v1.0/planner/plans/${planId}/details`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        if (res.ok) {
            const details = await res.json();
            planCategoryDescriptions = details.categoryDescriptions || {};
            planDetailsEtag = details['@odata.etag'];
            return true;
        }
    } catch (err) {
        console.error('Failed to load plan details', err);
    }
    return false;
}

async function syncThemesToPlanner(themeNames) {
    if (!accessToken) return false;
    if (!planDetailsEtag) {
        const ok = await ensurePlanDetails();
        if (!ok) return false;
    }
    const categoryDescriptions = {
        category5: themeNames.category5 || 'Enhance Security & Compliance',
        category4: themeNames.category4 || 'Optimize Efficiency & Automation',
        category3: themeNames.category3 || 'Improve Documentation',
        category1: themeNames.category1 || 'Streamline Reporting',
        category7: themeNames.category7 || 'Practical Modernization',
        category9: themeNames.category9 || 'Develop Capabilities & Cross-Training',
        category2: themeNames.category2 || 'Maintain Upgrades & Bug Fixes'
    };
    try {
        const res = await fetchGraph(
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
        if (res.ok) {
            const newEtag = res.headers.get('etag') || res.headers.get('ETag') || planDetailsEtag;
            if (res.status === 204) {
                planDetailsEtag = newEtag;
                return true;
            }
            try {
                const updated = await res.json();
                planCategoryDescriptions = updated.categoryDescriptions || {};
                planDetailsEtag = updated['@odata.etag'] || newEtag;
            } catch (parseErr) {
                planDetailsEtag = newEtag;
            }
            return true;
        }
        console.error('Theme sync failed', await res.text());
        return false;
    } catch (err) {
        console.error('Theme sync error', err);
        return false;
    }
}

async function saveAdminSettings() {
    if (!accessToken) {
        alert('Please sign in first.');
        return;
    }
    if (!isAdmin()) {
        showUnauthorized();
        alert('You are not authorized to change admin settings.');
        return;
    }

    const clientId = $('clientIdInput').value.trim();
    const planIdValue = $('planIdInput').value.trim();
    const authority = $('authorityInput').value.trim();
    const allowedTenants = $('allowedTenantsInput').value.trim();
    const adminGroupId = $('adminGroupIdInput').value.trim();
    const prefix = $('taskIdPrefixInput').value.trim().toUpperCase();
    const adminUsersInput = $('adminUsersInput').value.trim();

    // Update runtime config
    if (clientId) config.clientId = clientId;
    if (planIdValue) planId = planIdValue;
    if (authority) config.authority = authority;
    if (allowedTenants) config.allowedTenants = allowedTenants.split(',').map(t => t.trim());
    if (adminGroupId) {
        config.adminGroupId = adminGroupId;
    } else {
        config.adminGroupId = '';
    }
    if (adminUsersInput) {
        adminUsers = adminUsersInput.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
    } else {
        adminUsers = [];
    }

    const updatedThemes = {
        category5: $('themeNameCategory5').value.trim(),
        category4: $('themeNameCategory4').value.trim(),
        category3: $('themeNameCategory3').value.trim(),
        category1: $('themeNameCategory1').value.trim(),
        category7: $('themeNameCategory7').value.trim(),
        category9: $('themeNameCategory9').value.trim(),
        category2: $('themeNameCategory2').value.trim()
    };
    Object.keys(updatedThemes).forEach(k => { if (!updatedThemes[k]) delete updatedThemes[k]; });
    customThemeNames = updatedThemes;
    localStorage.setItem('customThemeNames', JSON.stringify(customThemeNames));

    // Generate updated config.json content
    const newConfig = {
        clientId: config.clientId,
        authority: config.authority,
        planId: planId,
        allowedTenants: config.allowedTenants,
        adminGroupId: config.adminGroupId,
        adminUsers: adminUsers,
        taskIdPrefix: prefix || 'STE'
    };

    const synced = await syncThemesToPlanner(updatedThemes);
    
    // Show config.json content in modal for easy copying
    const configJson = JSON.stringify(newConfig, null, 2);
    showConfigModal(configJson);
}

function showConfigModal(configJson) {
    const modal = document.getElementById('configModal');
    const textarea = document.getElementById('configJsonText');
    textarea.value = configJson;
    modal.style.display = 'flex';
}

function closeConfigModal() {
    document.getElementById('configModal').style.display = 'none';
}

function copyConfigJson() {
    const textarea = document.getElementById('configJsonText');
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile
    navigator.clipboard.writeText(textarea.value).then(() => {
        alert('Configuration JSON copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy. Please select and copy manually.');
    });
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
        adminUsers = (configData.adminUsers || []).map(e => e.trim().toLowerCase()).filter(e => e);
        
        console.log('✅ Admin configuration loaded from config.json');
        return true;
    } catch (err) {
        console.error('❌ Failed to load config.json:', err);
        alert('Failed to load application configuration. Please ensure config.json exists.');
        return false;
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    initializeVersion();
    initializeTheme();
    
    // Load config first
    const configLoaded = await loadConfig();
    if (!configLoaded) return;
    
    loadSettingsFromStorage();
    showGettingStartedIfNeeded();
    handleRedirectCallback();
});

// Check if this is first-time user (no plan ID set)
function showGettingStartedIfNeeded() {
    const planId = localStorage.getItem('planId') || '';
    const gettingStartedPanel = document.getElementById('gettingStartedPanel');
    if (gettingStartedPanel && !planId) {
        gettingStartedPanel.style.display = 'block';
    }
}

// Expose globally for buttons
window.login = login;
window.signOut = signOut;
window.showAdminHelp = function() {
    document.getElementById('helpModal').style.display = 'flex';
};
window.closeAdminHelp = function() {
    document.getElementById('helpModal').style.display = 'none';
};
window.closeGettingStarted = function() {
    const panel = document.getElementById('gettingStartedPanel');
    if (panel) {
        panel.style.display = 'none';
        // Mark that user has dismissed the getting started
        localStorage.setItem('dismissedGettingStarted', 'true');
    }
};
window.saveAdminSettings = saveAdminSettings;
window.loadSettingsFromStorage = loadSettingsFromStorage;
window.toggleTheme = toggleTheme;
window.showConfigModal = showConfigModal;
window.closeConfigModal = closeConfigModal;
window.copyConfigJson = copyConfigJson;
