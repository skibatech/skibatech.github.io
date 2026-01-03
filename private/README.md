# SkibaTech Private Area - Access Control

This directory contains internal tools and dashboards that require authentication.

> **Note**: Planner Pro has been moved to its own repository: [skibatech.plannerpro](https://github.com/skibatech/skibatech.plannerpro)

## Security Features

### 1. Application-Level Authentication
- **Microsoft OAuth Required**: All pages require Microsoft sign-in before displaying content
- **Tenant Restriction**: Only @skibatech.com and @skibatech.onmicrosoft.com users are allowed
- **Token Validation**: Every API call verifies token validity and tenant membership

### 2. Search Engine Protection
- **robots.txt**: Blocks all search engine crawlers from /private/ directory
- **Meta Tags**: Each page includes `<meta name="robots" content="noindex, nofollow">`
- **No Sitemap**: Private pages are not included in sitemap.xml

### 3. Client-Side Protection
- **Hidden by Default**: Content is hidden with CSS until authentication succeeds
- **Tenant Verification**: User email domain is checked against allowed list
- **Unauthorized Access Alerts**: Failed access attempts are logged to console

### 4. Token Security
- **Short-Lived Tokens**: Access tokens expire after 1 hour
- **Secure Storage**: Tokens stored in localStorage (browser-specific, not shared)
- **Auto-Expiration**: Expired tokens are automatically cleared

## Limitations (GitHub Pages Static Hosting)

GitHub Pages cannot provide:
- ❌ Server-side authentication (no .htaccess, no server processing)
- ❌ IP restrictions
- ❌ HTTP Basic Auth
- ❌ Request-level authorization

For stronger security, consider:
1. **Azure Static Web Apps** - Built-in authentication with Azure AD
2. **Cloudflare Access** - Zero Trust authentication layer
3. **Auth0** or similar identity provider

## Current Security Level

✅ **Good for internal tools**: The current setup provides reasonable security for internal dashboards:
- Prevents accidental public discovery (robots.txt + noindex)
- Requires valid Microsoft account from SkibaTech
- Protects against casual unauthorized access

⚠️ **Not suitable for**: 
- Highly sensitive data (PII, credentials, financial data)
- Compliance requirements (HIPAA, PCI-DSS, etc.)
- Protection against determined attackers with network access

## Access Monitoring

Since this is a static site, we don't have server logs. To monitor access:
1. Enable **Microsoft Clarity** tracking (already configured on main site)
2. Check **Azure AD Sign-in Logs** for authentication attempts
3. Review browser console logs for unauthorized access attempts

## Files in /private/

- **planner/** - Planner Dashboard (requires SkibaTech Microsoft account)
- **.keep** - Placeholder to maintain directory in git

---

Last Updated: December 22, 2025
