const CLOUD_NAME = 'desi8fsoe'; // replace after signup
const UPLOAD_PRESET = 'mrjk_mart';    // create this in Cloudinary
const CLOUDINARY_RAW_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;
const APP_FILE_FOLDER = 'mrjk-mart/apps';
const STALLED_UPLOAD_TIMEOUT_MS = 45000;
export const CLOUDINARY_RAW_FILE_LIMIT_BYTES = 10 * 1024 * 1024;

export async function uploadImage(file, folder = 'mrjk-mart') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

  const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
      );

  if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Upload failed');
  }

  const data = await res.json();
    return {
          url:      data.secure_url,
          publicId: data.public_id,
          width:    data.width,
          height:   data.height,
    };
}

export async function uploadMultipleImages(files, folder, onProgress) {
    const results = [];
    for (let i = 0; i < files.length; i++) {
          if (onProgress) onProgress(i, files.length);
          const result = await uploadImage(files[i], folder);
          results.push(result);
    }
    return results;
}

function getCloudinaryErrorMessage(responseText) {
  try {
    const parsed = JSON.parse(responseText);
    const message = parsed.error?.message || parsed.message;

    if (message?.toLowerCase().includes('file size too large')) {
      return `${message}. Cloudinary rejected this app file because it is above your account raw-file upload limit. Use the Paste URL tab for this APK, or increase the Cloudinary raw file limit.`;
    }

    return message || 'Cloudinary upload failed';
  } catch {
    return responseText || 'Cloudinary upload failed';
  }
}

export function getCloudinaryRawLimitMessage(file) {
  const fileSize = file?.size ? formatFileSize(file.size) : 'This file';
  return `${fileSize} is larger than the Cloudinary raw upload limit on this account. Use Paste URL for APK files above 10 MB, or increase the Cloudinary raw file limit.`;
}

function getRawPublicId(file) {
  const fallbackName = `application-file-${Date.now()}`;
  const safeFileName = (file.name || fallbackName)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 120);

  return `${Date.now()}-${safeFileName || fallbackName}`;
}

export async function uploadAppFile(file, onProgress) {
  if (!file) throw new Error('No file selected');
  if (file.size > CLOUDINARY_RAW_FILE_LIMIT_BYTES) {
    throw new Error(getCloudinaryRawLimitMessage(file));
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', APP_FILE_FOLDER);
    formData.append('public_id', getRawPublicId(file));

    const xhr = new XMLHttpRequest();
    let settled = false;
    let lastProgressAt = Date.now();

    const cleanup = () => {
      settled = true;
      clearInterval(stalledTimer);
    };

    const fail = (message) => {
      if (settled) return;
      cleanup();
      reject(new Error(message));
    };

    const stalledTimer = setInterval(() => {
      if (Date.now() - lastProgressAt > STALLED_UPLOAD_TIMEOUT_MS) {
        xhr.abort();
        fail('Cloudinary upload stalled. Check the connection and try again.');
      }
    }, 5000);

    xhr.upload.addEventListener('progress', (event) => {
      lastProgressAt = Date.now();
      const total = event.lengthComputable ? event.total : file.size;
      const loaded = event.loaded || 0;
      const percent = total ? Math.round((loaded / total) * 100) : 0;
      onProgress?.(Math.min(percent, 99), loaded, total || file.size);
    });

    xhr.addEventListener('load', () => {
      if (settled) return;

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          cleanup();
          onProgress?.(100, file.size, file.size);
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            size: data.bytes,
          });
        } catch {
          fail('Cloudinary returned an invalid upload response.');
        }
        return;
      }

      fail(getCloudinaryErrorMessage(xhr.responseText));
    });

    xhr.addEventListener('error', () => {
      fail('Cloudinary upload failed because of a network error.');
    });

    xhr.addEventListener('abort', () => {
      fail('Cloudinary upload was canceled.');
    });

    xhr.open('POST', CLOUDINARY_RAW_UPLOAD_URL);
    xhr.send(formData);
  });
}

// Format bytes to readable size
export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) 
    return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) 
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
