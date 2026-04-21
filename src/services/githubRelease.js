const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || 'PASTE_YOUR_TOKEN_HERE';
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'MR-JK-37';
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'MR-JK-MART-releases';

function getAuthHeaders() {
  if (!GITHUB_TOKEN || GITHUB_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
    throw new Error('Missing VITE_GITHUB_TOKEN. Add the GitHub token to .env and restart the app.');
  }

  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  };
}

async function getLatestReleaseId() {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    throw new Error('Cannot get release info');
  }

  const data = await res.json();
  return data.id;
}

async function deleteExistingAsset(releaseId, fileName) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/${releaseId}/assets`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      throw new Error('Cannot list release assets');
    }

    const assets = await res.json();
    const existing = assets.find((asset) => asset.name === fileName);

    if (existing) {
      await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/assets/${existing.id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );
    }
  } catch (error) {
    console.warn('Delete existing asset failed:', error);
  }
}

export async function uploadToGitHub(file, onProgress) {
  if (!file) throw new Error('No file selected');

  const releaseId = await getLatestReleaseId();
  const safeName = file.name.replace(/\s+/g, '_');

  await deleteExistingAsset(releaseId, safeName);

  const uploadUrl =
    `https://uploads.github.com/repos/${GITHUB_OWNER}/` +
    `${GITHUB_REPO}/releases/${releaseId}/assets` +
    `?name=${encodeURIComponent(safeName)}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(
          Math.round((event.loaded / event.total) * 100),
          event.loaded,
          event.total
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
        let parsedError;

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

    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${GITHUB_TOKEN}`);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Accept', 'application/vnd.github+json');
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
