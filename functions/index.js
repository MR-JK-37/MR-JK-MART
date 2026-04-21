import crypto from 'node:crypto';
import { onRequest } from 'firebase-functions/v2/https';

const GITHUB_API = 'https://api.github.com';
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'MR-JK-37';
const GITHUB_REPO = process.env.GITHUB_REPO || 'MR-JK-MART-releases';
const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_APP_INSTALLATION_ID = process.env.GITHUB_APP_INSTALLATION_ID;
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY;

function withCors(response) {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getPrivateKey() {
  return GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');
}

function createAppJwt() {
  if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY) {
    throw new Error('Missing GitHub App credentials.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iat: now - 60,
      exp: now + 9 * 60,
      iss: GITHUB_APP_ID,
    })
  );
  const unsigned = `${header}.${payload}`;

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsigned)
    .sign(getPrivateKey(), 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${unsigned}.${signature}`;
}

async function githubFetch(path, init = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, init);
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || `GitHub request failed (${response.status})`);
  }

  return data;
}

async function createInstallationToken() {
  if (!GITHUB_APP_INSTALLATION_ID) {
    throw new Error('Missing GitHub App installation id.');
  }

  const jwt = createAppJwt();
  const data = await githubFetch(
    `/app/installations/${GITHUB_APP_INSTALLATION_ID}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  return data.token;
}

async function getLatestReleaseId(token) {
  const data = await githubFetch(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  return data.id;
}

export const githubReleaseToken = onRequest(
  { region: 'us-central1', cors: false, memory: '256MiB', timeoutSeconds: 60 },
  async (request, response) => {
    withCors(response);

    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const token = await createInstallationToken();
      const releaseId = await getLatestReleaseId(token);

      response.json({
        token,
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        releaseId,
      });
    } catch (error) {
      response.status(500).json({
        error: error.message || 'Could not create GitHub upload session.',
      });
    }
  }
);
