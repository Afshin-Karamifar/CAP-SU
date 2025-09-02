# Vercel Deployment Fix

## Issue

When deployed to Vercel, the application was returning 404 errors for API requests to `/rest/api/3/project` and other Jira endpoints. This happened because the Vite proxy configuration only works during development and doesn't apply to production builds.

## Solution

The application has been updated to use different API base URLs depending on the environment:

- **Development**: Uses relative URLs (e.g., `/rest/api/3/project`) that are proxied by Vite to your Jira domain
- **Production**: Uses full Jira domain URLs (e.g., `https://your-domain.atlassian.net/rest/api/3/project`)

## Changes Made

### 1. Created API Utility Functions

- Added `src/lib/apiUtils.ts` with `buildApiUrl()` function
- Automatically handles development vs production URL building

### 2. Updated All API Calls

Updated these files to use the new `buildApiUrl()` function:

- `src/contexts/AppContext.tsx`
- `src/components/hooks/useStartSU.ts`
- `src/components/hooks/useTicketStatus.ts`
- `src/components/TicketPopover.tsx`
- `src/components/BacklogTab.tsx`

### 3. Added Vercel Configuration

- Created `vercel.json` with proper build configuration
- Simplified approach without rewrites (which are complex for dynamic domains)

### 4. Updated Environment Variables

- Added `VITE_JIRA_DOMAIN` to `.env.example`
- This variable is required for production builds

## Deployment Steps

### 1. Set Environment Variables in Vercel

In your Vercel dashboard, go to your project settings and add these environment variables:

```
VITE_JIRA_DOMAIN=https://your-actual-domain.atlassian.net
VITE_ENCRYPTION_KEY=your-secure-32-character-key-here
VITE_SESSION_TIMEOUT=60
```

**Important**: Replace `your-actual-domain` with your real Jira domain name.

### 2. Local Development Setup

Create a `.env` file in your project root (copy from `.env.example`):

```
VITE_JIRA_DOMAIN=https://your-actual-domain.atlassian.net
VITE_ENCRYPTION_KEY=your-secure-32-character-key-here
VITE_SESSION_TIMEOUT=60
```

### 3. Deploy to Vercel

```bash
# Build and test locally first
pnpm build
pnpm preview

# Then deploy (if using Vercel CLI)
vercel --prod

# Or push to your connected Git repository
git add .
git commit -m "Fix Vercel deployment API routing"
git push
```

## How It Works

### Development Mode

- `buildApiUrl('/rest/api/3/project')` returns `/rest/api/3/project`
- Vite proxy forwards this to your Jira domain
- No CORS issues because it's server-side proxying

### Production Mode

- `buildApiUrl('/rest/api/3/project')` returns `https://your-domain.atlassian.net/rest/api/3/project`
- Direct API calls to Jira with proper authentication
- Works because Jira allows authenticated requests from web browsers

## Testing

After deployment, test these key endpoints:

1. Settings page - API token validation
2. Project selection - Loading projects list
3. Sprint management - Fetching sprint data
4. Ticket operations - Status updates, comments

## Troubleshooting

### 404 Errors Still Happening?

1. Check that `VITE_JIRA_DOMAIN` is set correctly in Vercel
2. Verify the domain format: `https://domain.atlassian.net` (no trailing slash)
3. Clear browser cache and try again

### CORS Errors?

- This shouldn't happen with proper authentication
- Verify your API token has correct permissions
- Check Jira domain spelling

### Build Errors?

- Ensure all environment variables are set
- The build will fail if `VITE_JIRA_DOMAIN` is missing in production

## Rollback Plan

If issues occur, you can temporarily revert by:

1. Reverting to the previous commit
2. Or manually changing `buildApiUrl()` calls back to relative URLs and using Vercel rewrites (though this requires hardcoding your domain in `vercel.json`)
