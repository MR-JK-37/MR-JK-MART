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
