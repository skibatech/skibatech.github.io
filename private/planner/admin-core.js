// Admin portal core logic
const ADMIN_APP_VERSION = '1.4.53-admin';
const ADMIN_ROLE = 'PlannerAdmin';

let accessToken = null;
let currentUserEmail = null;
let planDetailsEtag = null;
let planCategoryDescriptions = {};
let customThemeNames = JSON.parse(localStorage.getItem('customThemeNames') || '{}');
let currentUserIsAdmin = false;

const config = {
    clientId: localStorage.getItem('plannerClientId') || '073fb8bf-274f-496d-b2a1-648b1a8195b3',
    authority: localStorage.getItem('plannerAuthority') || 'https://login.microsoftonline.com/skibatech.com',
    redirectUri: window.location.origin + window.location.pathname,
    scopes: ['Tasks.ReadWrite', 'Group.ReadWrite.All', 'User.Read'],
    allowedTenants: (localStorage.getItem('plannerAllowedTenants') || 'skibatech.com, skibatech.onmicrosoft.com').split(',').map(t => t.trim()),
    adminGroupId: localStorage.getItem('plannerAdminGroupId') || ''
};
let planId = localStorage.getItem('plannerPlanId') || 'nwc8iIFj8U2MvA4RQReZpWUABC_U';
let adminUsers = (localStorage.getItem('plannerAdminUsers') || '').split(',').map(e => e.trim().toLowerCase()).filter(e => e);

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

    // Prefer explicit role claim
    if (hasAdminRole()) {
        currentUserIsAdmin = true;
        return true;
    }

    // Group membership check if configured
    if (config.adminGroupId && accessToken) {
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

    // Fallback to email list
    if (adminUsers.length === 0) {
        currentUserIsAdmin = true;
    } else {
        currentUserIsAdmin = adminUsers.includes(currentUserEmail);
    }
    return currentUserIsAdmin;
}

function initializeVersion() {
    const versionDisplay = $('versionDisplay');
    if (versionDisplay) versionDisplay.textContent = ADMIN_APP_VERSION;
}

function loadSettingsFromStorage() {
    $('clientIdInput').value = config.clientId;
    $('planIdInput').value = planId;
    $('authorityInput').value = config.authority;
    $('allowedTenantsInput').value = config.allowedTenants.join(', ');
    $('adminGroupIdInput').value = config.adminGroupId;
    $('taskIdPrefixInput').value = localStorage.getItem('taskIdPrefix') || 'STE';
    $('adminUsersInput').value = adminUsers.join(', ');

    $('themeNameCategory5').value = customThemeNames['category5'] || '';
    $('themeNameCategory4').value = customThemeNames['category4'] || '';
    $('themeNameCategory3').value = customThemeNames['category3'] || '';
    $('themeNameCategory1').value = customThemeNames['category1'] || '';
    $('themeNameCategory7').value = customThemeNames['category7'] || '';
    $('themeNameCategory9').value = customThemeNames['category9'] || '';
    $('themeNameCategory2').value = customThemeNames['category2'] || '';
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

    if (clientId) {
        config.clientId = clientId;
        localStorage.setItem('plannerClientId', clientId);
    }
    if (planIdValue) {
        planId = planIdValue;
        localStorage.setItem('plannerPlanId', planIdValue);
    }
    if (authority) {
        config.authority = authority;
        localStorage.setItem('plannerAuthority', authority);
    }
    if (allowedTenants) {
        config.allowedTenants = allowedTenants.split(',').map(t => t.trim());
        localStorage.setItem('plannerAllowedTenants', allowedTenants);
    }
    if (adminGroupId) {
        config.adminGroupId = adminGroupId;
        localStorage.setItem('plannerAdminGroupId', adminGroupId);
    } else {
        config.adminGroupId = '';
        localStorage.removeItem('plannerAdminGroupId');
    }
    if (prefix) {
        localStorage.setItem('taskIdPrefix', prefix);
    }
    if (adminUsersInput) {
        adminUsers = adminUsersInput.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
        localStorage.setItem('plannerAdminUsers', adminUsersInput);
    } else {
        adminUsers = [];
        localStorage.removeItem('plannerAdminUsers');
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

    const synced = await syncThemesToPlanner(updatedThemes);
    if (synced) {
        alert('Settings saved and synced to Planner.');
    } else {
        alert('Settings saved locally. Sync to Planner failed.');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initializeVersion();
    loadSettingsFromStorage();
    handleRedirectCallback();
});

// Expose globally for buttons
window.login = login;
window.signOut = signOut;
window.saveAdminSettings = saveAdminSettings;
window.loadSettingsFromStorage = loadSettingsFromStorage;
