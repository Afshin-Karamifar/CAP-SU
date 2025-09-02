# ⚠️ IMPORTANT CONFIGURATION REQUIRED ⚠️

Before using this application with real Jira data, you MUST update the Jira domain in the API calls.

## Required Changes

### 1. Update Jira Domain

Open `src/contexts/AppContext.tsx` and replace `your-domain.atlassian.net` with your actual Jira domain in these locations:

- Line ~92: `https://your-domain.atlassian.net/rest/api/3/project`
- Line ~113: `https://your-domain.atlassian.net/rest/agile/1.0/board?projectKeyOrId=${projectId}`
- Line ~125: `https://your-domain.atlassian.net/rest/agile/1.0/board/${boardId}/sprint?state=active,future`
- Line ~150: `https://your-domain.atlassian.net/rest/agile/1.0/sprint/${sprintId}/issue`

### 2. Get Your API Token

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a descriptive label (e.g., "Sprint Manager App")
4. Copy the generated token
5. Paste it in the Settings page of this application

### 3. Find Your Jira Domain

Your Jira domain is the URL you use to access Jira, for example:

- `mycompany.atlassian.net`
- `jira.mycompany.com`

### Example Configuration

If your Jira is at `https://mycompany.atlassian.net`, then update all API calls to use:

```
https://mycompany.atlassian.net/rest/...
```

## Test API Token

You can test your API token with curl:

```bash
curl -X GET \
  "https://YOUR-DOMAIN.atlassian.net/rest/api/3/myself" \
  -H "Authorization: Bearer YOUR-API-TOKEN" \
  -H "Accept: application/json"
```

Replace `YOUR-DOMAIN` and `YOUR-API-TOKEN` with your actual values.
