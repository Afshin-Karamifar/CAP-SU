// Vercel serverless function to proxy JIRA API requests
// This avoids CORS issues by making server-side requests

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      res.status(400).json({ error: 'Path parameter is required' });
      return;
    }

    const jiraDomain = process.env.VITE_JIRA_DOMAIN;
    if (!jiraDomain) {
      res.status(500).json({ error: 'JIRA domain not configured' });
      return;
    }

    // Build the complete JIRA URL
    const jiraUrl = `${jiraDomain}${path.startsWith('/') ? path : `/${path}`}`;

    // Forward the request to JIRA
    const response = await fetch(jiraUrl, {
      method: req.method,
      headers: {
        Authorization: req.headers.authorization || '',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();

    // Set the same status code and headers from JIRA response
    res.status(response.status);

    // Try to parse as JSON, fallback to text
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      res.send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
