const CLOUD_NAME = 'desi8fsoe'; // replace after signup
const UPLOAD_PRESET = 'mrjk_mart';    // create this in Cloudinary

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

const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunks

export async function uploadAppFile(file, onProgress) {
  // For files under 10MB — direct upload
  if (file.size <= 10 * 1024 * 1024) {
    return uploadDirect(file, onProgress);
  }
  // For larger files — chunked upload
  return uploadChunked(file, onProgress);
}

async function uploadDirect(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('resource_type', 'raw');
    formData.append('folder', 'mrjk-mart/apps');

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(
          Math.round((e.loaded / e.total) * 100),
          e.loaded, e.total
        );
      }
    });
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          size: data.bytes,
        });
      } else {
        reject(new Error(
          JSON.parse(xhr.responseText)?.error?.message 
          || 'Upload failed'
        ));
      }
    });
    xhr.addEventListener('error', () => 
      reject(new Error('Network error'))
    );
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`
    );
    xhr.send(formData);
  });
}

async function uploadChunked(file, onProgress) {
  const uniqueId = `mrjk_${Date.now()}_${Math.random()
    .toString(36).substr(2,9)}`;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadedBytes = 0;
  let finalResponse = null;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const contentRange = 
      `bytes ${start}-${end - 1}/${file.size}`;

    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('resource_type', 'raw');
    formData.append('folder', 'mrjk-mart/apps');
    formData.append('public_id', uniqueId);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
      {
        method: 'POST',
        headers: {
          'X-Unique-Upload-Id': uniqueId,
          'Content-Range': contentRange,
        },
        body: formData,
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Chunk upload failed');
    }

    finalResponse = await res.json();
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
    url: finalResponse.secure_url,
    publicId: finalResponse.public_id,
    size: finalResponse.bytes,
  };
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
