# Planner Pro - Setup Guide

A Microsoft Graph-powered task management interface for Microsoft Planner with Weekly Compass integration.

## Quick Start

### 1. Azure App Registration Setup

1. Go to [Azure Portal](https://portal.azure.com) → **App Registrations** → **New registration**
2. Set **Redirect URI**: `https://yourdomain.com/private/planner/` (replace with your GitHub Pages URL)
3. After creation, copy the **Application (client) ID**
4. Go to **API permissions** → Add the following Microsoft Graph Delegated permissions:
   - `Tasks.ReadWrite`
   - `Group.ReadWrite.All`
   - `User.Read`
5. Click **Grant admin consent** (requires tenant admin)

### 2. Get Your Planner Plan ID

1. Open [Planner](https://tasks.office.com) in your browser
2. Navigate to your target plan
3. Copy the Plan ID from the URL: `https://tasks.office.com/.../plans/{PLAN-ID}/...`

### 3. Configure config.json

1. Copy `config.example.json` to `config.json`:
   ```powershell
   Copy-Item config.example.json config.json
   ```

2. Edit `config.json` with your values:
   ```json
   {
     "clientId": "YOUR-CLIENT-ID-FROM-AZURE",
     "authority": "https://login.microsoftonline.com/yourtenant.com",
     "planId": "YOUR-PLANNER-PLAN-ID",
     "allowedTenants": ["yourtenant.com"],
     "adminGroupName": "Planner Admins",
     "adminUsers": [],
     "taskIdPrefix": "PRJ"
   }
   ```

### 4. Admin Access Control

**Option A: Group Membership (Recommended - More Secure)**
- Set `adminGroupName` to your Entra ID group's display name (e.g., "Planner Admins")
- Leave `adminGroupId` empty or omit it
- Users in this group will see the "Admin Portal" option

**Option B: Group ID**
- Set `adminGroupId` to your Entra ID group's Object ID (GUID)
- Less secure since the GUID is exposed in the public config

**Option C: Email Allowlist**
- Set `adminUsers` to an array of admin emails
- Takes precedence over group checks
- Use for granular control or if no admin group exists

**No Admin Controls?**
- If all three are empty, everyone with access to the plan becomes an admin (useful for single-user or testing scenarios)

### 5. Deploy to GitHub Pages

1. Commit and push your changes (make sure `config.json` is committed):
   ```powershell
   git add config.json
   git commit -m "Configure Planner Pro"
   git push origin main
   ```

2. Access at: `https://yourusername.github.io/private/planner/`

## Security Notes

### What's Safe to Expose Publicly (in config.json)
✅ **clientId** - Public by design for MSAL authentication  
✅ **authority** - Tenant domain/ID (public identifier)  
✅ **planId** - Plan GUID (requires valid Graph token to access)  
✅ **allowedTenants** - Public tenant domains  
✅ **taskIdPrefix** - Display preference  
✅ **adminGroupName** - Group display name (no direct access risk)  
⚠️ **adminGroupId** - Group GUID (less secure, prefer adminGroupName)  
⚠️ **adminUsers** - Admin emails (consider privacy implications)

### What Should NEVER Be in config.json
❌ **Client secrets** - Never store secrets client-side  
❌ **Access tokens** - Handled by MSAL, never hardcoded  
❌ **Passwords** - Authentication is via Microsoft identity platform  
❌ **Personal data** - No PII beyond what users configure

### Network Security
- All data access requires valid Microsoft Graph authentication
- App uses browser-based MSAL for token acquisition
- Tokens are stored in sessionStorage, never in config
- CORS and Azure permissions control API access

## Features

### Main Interface
- **Multi-view grouping**: By Assigned To, Bucket, Progress, Due Date, Priority, Theme
- **Secondary grouping**: Nest groups for multi-dimensional views
- **Grid edit mode**: Inline editing of tasks (toggle on/off)
- **Bulk operations**: Multi-select for assign, move, delete
- **Filter options**: All/My tasks, Show/Hide completed
- **Custom themes**: Up to 7 custom Planner category labels

### Weekly Compass
- **Role-based planning**: Define roles with "Big Rocks" (weekly priorities)
- **Sharpen the Saw**: Track physical, mental, social/emotional, spiritual renewal activities
- **Motivational quotes**: Random inspirational quote each week
- **Persistent storage**: Data stored in Microsoft To Do lists
- **Background color picker**: Customize the compass panel appearance
- **Drag-and-drop**: Reorder roles

### Admin Portal
Accessible to users who meet admin criteria (separate `admin.html` page):
- Configure custom theme names (syncs to Planner categories)
- Manage app settings
- View configuration JSON for deployment

## Troubleshooting

### "Too Many Requests (429)" errors
- App includes automatic retry with exponential backoff
- Global request limiter and startup jitter reduce burst traffic
- If persistent, consider increasing `GRAPH_STARTUP_JITTER_MS` in `planner.js`

### Admin Portal not visible
1. Verify you're in the admin group (if using `adminGroupName` or `adminGroupId`)
2. Check `adminUsers` array includes your email
3. Confirm Graph API permissions include `Group.ReadWrite.All` for group membership checks
4. Check browser console for admin evaluation errors

### Tasks not loading
1. Verify Plan ID is correct (visible in Planner URL)
2. Ensure Graph permissions are granted and admin consented
3. Check that `allowedTenants` includes your tenant domain
4. Review browser console for API errors

### Weekly Compass not saving
- Compass data is stored in a To Do list named `PlannerCompass_Data`
- Ensure `Tasks.ReadWrite` permission is granted
- Check for 429 rate limiting (app auto-retries with backoff)

## Version
Current: v2.0.48

See [CHANGELOG.md](CHANGELOG.md) for version history and recent changes.

## Support
For issues or questions, check the browser console for detailed error messages. Common fixes:
- Hard refresh after updates (Ctrl+F5)
- Re-grant admin consent if permissions change
- Verify all GUIDs and domains in config.json are correct
