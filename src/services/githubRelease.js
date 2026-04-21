const DEFAULT_TOKEN_ENDPOINT =
  'https://us-central1-mrjk-mart.cloudfunctions.net/githubReleaseToken';

const tokenEndpoint =
  import.meta.env.VITE_GITHUB_UPLOAD_TOKEN_URL || DEFAULT_TOKEN_ENDPOINT;

async function getUploadSession() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ action: 'create-upload-session' }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      throw new Error('GitHub upload session timed out. Check the upload gateway and try again.');
    }
    throw error;
  }

  clearTimeout(timeoutId);

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      'GitHub upload gateway is unavailable. Deploy the Firebase Function and configure the GitHub App secrets.'
    );
  }

  return data;
}

async function deleteExistingAsset(token, owner, repo, releaseId, fileName) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    if (!response.ok) return;

    const assets = await response.json();
    const existing = assets.find((asset) => asset.name === fileName);

    if (existing) {
      await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/assets/${existing.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );
    }
  } catch (error) {
    console.warn('Delete existing asset failed:', error);
  }
}

export async function uploadAppFile(file, onProgress) {
  if (!file) throw new Error('No file selected');

  const session = await getUploadSession();
  const token = session.token;
  const owner = session.owner;
  const repo = session.repo;
  const releaseId = session.releaseId;

  if (!token || !owner || !repo || !releaseId) {
    throw new Error('GitHub upload session is incomplete.');
  }

  const safeName = file.name.replace(/\s+/g, '_');
  await deleteExistingAsset(token, owner, repo, releaseId, safeName);

  const uploadUrl =
    `https://uploads.github.com/repos/${owner}/` +
    `${repo}/releases/${releaseId}/assets` +
    `?name=${encodeURIComponent(safeName)}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let started = false;

    xhr.upload.addEventListener('progress', (event) => {
      const total = event.lengthComputable ? event.total : file.size;
      const loaded = event.loaded || 0;
      const percent = total ? Math.round((loaded / total) * 100) : 0;

      if (onProgress) {
        onProgress(
          Math.max(started ? 1 : 0, percent),
          loaded,
          total
        );
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 201) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.browser_download_url,
          name: data.name,
          size: data.size,
          id: data.id,
        });
      } else {
        let parsedError = {};

        try {
          parsedError = JSON.parse(xhr.responseText);
        } catch {
          parsedError = {};
        }

        reject(
          new Error(
            parsedError.errors?.[0]?.message ||
            parsedError.message ||
            'Upload failed'
          )
        );
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was canceled'));
    });

    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Accept', 'application/vnd.github+json');
    started = true;
    onProgress?.(1, 0, file.size);
    xhr.send(file);
  });
}

export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
