import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase/config';

function getSafeFileName(file) {
  const baseName = file?.name || `app-file-${Date.now()}`;
  return baseName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadAppFile(file, onProgress) {
  if (!file) throw new Error('No file selected');
  if (!storage) throw new Error('Firebase Storage is not configured');

  const safeName = getSafeFileName(file);
  const objectPath = `apps/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, objectPath);
  const metadata = {
    contentType: file.type || 'application/octet-stream',
    cacheControl: 'public, max-age=31536000, immutable',
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const total = snapshot.totalBytes || file.size || 0;
        const loaded = snapshot.bytesTransferred || 0;
        const percent = total ? Math.round((loaded / total) * 100) : 0;
        onProgress?.(percent, loaded, total);
      },
      (error) => {
        reject(new Error(getUploadErrorMessage(error)));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url,
            name: safeName,
            size: file.size,
            path: objectPath,
          });
        } catch (error) {
          reject(new Error(error?.message || 'Could not get download URL'));
        }
      }
    );
  });
}

function getUploadErrorMessage(error) {
  if (error?.status_ === 404) {
    return 'Firebase Storage is not enabled for this project or the storage bucket is missing. Open Firebase Console -> Storage, create the bucket, then allow uploads in Storage rules.';
  }
  if (error?.code === 'storage/unauthorized') {
    return 'Firebase Storage blocked the upload. Update your Storage rules to allow admin uploads.';
  }
  if (error?.code === 'storage/canceled') {
    return 'Upload was canceled.';
  }
  if (error?.code === 'storage/retry-limit-exceeded') {
    return 'Upload timed out. Check your connection and try again.';
  }
  return error?.message || 'Upload failed';
}

export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
