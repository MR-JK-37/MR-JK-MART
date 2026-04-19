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

// Upload ANY file type (exe, apk, zip, pdf, etc)
export async function uploadAppFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('resource_type', 'raw'); // for non-image files
    formData.append('folder', 'mrjk-mart/apps');
    
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent, e.loaded, e.total);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          size: data.bytes,
          format: data.format,
          originalFilename: data.original_filename,
        });
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || 'Upload failed'));
        } catch (e) {
          reject(new Error('Upload failed with status ' + xhr.status));
        }
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`
    );
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
