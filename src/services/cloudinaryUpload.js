const CLOUD_NAME = 'desi8fsoe';
const UPLOAD_PRESET = 'mrjk_mart';
const CHUNK_SIZE = 6 * 1024 * 1024;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];

function parseUploadError(responseText, status) {
  try {
    const parsed = JSON.parse(responseText);
    return parsed.error?.message || `Upload failed: ${status}`;
  } catch {
    return `Upload failed: ${status}`;
  }
}

export function getResourceType(file) {
  const ext = file?.name?.split('.').pop()?.toLowerCase() || '';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return 'raw';
}

function uploadDirect(file, resourceType, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'mrjk-mart/apps');

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(
        Math.round((event.loaded / event.total) * 100),
        event.loaded,
        event.total
      );
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          name: file.name,
          size: file.size,
          publicId: data.public_id,
        });
        return;
      }

      reject(new Error(parseUploadError(xhr.responseText, xhr.status)));
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.timeout = 0;
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`
    );
    xhr.send(formData);
  });
}

async function uploadChunked(file, resourceType, onProgress) {
  const uniqueId = `mrjk_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadedBytes = 0;
  let finalResponse = null;

  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'mrjk-mart/apps');
    formData.append('public_id', uniqueId);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        headers: {
          'X-Unique-Upload-Id': uniqueId,
          'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
        },
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Chunk ${index + 1} failed`);
    }

    finalResponse = data;
    uploadedBytes = end;

    if (onProgress) {
      onProgress(
        Math.round((uploadedBytes / file.size) * 100),
        uploadedBytes,
        file.size
      );
    }
  }

  return {
    url: finalResponse?.secure_url,
    name: file.name,
    size: file.size,
    publicId: finalResponse?.public_id,
  };
}

export async function uploadFile(file, onProgress) {
  const resourceType = getResourceType(file);
  if (file.size < 95 * 1024 * 1024) {
    return uploadDirect(file, resourceType, onProgress);
  }
  return uploadChunked(file, resourceType, onProgress);
}

export async function uploadImage(file, folder = 'mrjk-mart/icons') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Image upload failed');
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

export async function uploadMultipleImages(files, folder, onProgress) {
  const results = [];
  for (let index = 0; index < files.length; index += 1) {
    if (onProgress) onProgress(index, files.length);
    const result = await uploadImage(files[index], folder);
    results.push(result);
  }
  return results;
}

export function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
