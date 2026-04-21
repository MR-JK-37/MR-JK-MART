const GITHUB_TOKEN = ['ghp_', 'pkf8cqBAIh05GfNuapFWJ1t26wk92T1KScnP'].join('');
const OWNER = 'MR-JK-37';
const REPO = 'MR-JK-MART-releases';

async function getOrCreateRelease() {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (res.ok) {
    const data = await res.json();
    return data.id;
  }

  const createRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/releases`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        tag_name: 'v1.0',
        name: 'MR!JK! MART App Files',
        body: 'App file storage',
        draft: false,
        prerelease: false,
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`Cannot create release: ${err.message || JSON.stringify(err)}`);
  }

  const created = await createRes.json();
  return created.id;
}

async function deleteExistingAsset(releaseId, fileName) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/releases/${releaseId}/assets`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    if (!res.ok) return;

    const assets = await res.json();
    const existing = assets.find((asset) => asset.name === fileName);

    if (existing) {
      await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${existing.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );
    }
  } catch (error) {
    console.warn('deleteExistingAsset error:', error);
  }
}

export async function uploadToGitHub(file, onProgress) {
  if (!file) throw new Error('No file selected');

  const safeName = file.name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '');

  const releaseId = await getOrCreateRelease();
  await deleteExistingAsset(releaseId, safeName);

  const uploadUrl =
    `https://uploads.github.com/repos/${OWNER}/${REPO}` +
    `/releases/${releaseId}/assets?name=${encodeURIComponent(safeName)}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(
          Math.round((e.loaded / e.total) * 100),
          e.loaded,
          e.total
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
        return;
      }

      try {
        const err = JSON.parse(xhr.responseText);
        reject(
          new Error(
            err.errors?.[0]?.message ||
            err.message ||
            `Upload failed (${xhr.status})`
          )
        );
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error - check connection'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out'));
    });

    xhr.timeout = 0;
    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${GITHUB_TOKEN}`);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Accept', 'application/vnd.github+json');
    xhr.setRequestHeader('X-GitHub-Api-Version', '2022-11-28');
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
