import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './config';

const APP_FILE_FOLDER = 'app-files';

function sanitizeFileName(name) {
  return (name || 'application-file')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

function getUploadErrorMessage(error) {
  if (error?.code === 'storage/unauthorized') {
    return 'Firebase Storage rejected the upload. Check Storage write rules.';
  }

  if (error?.code === 'storage/canceled') {
    return 'Upload was canceled.';
  }

  if (error?.code === 'storage/quota-exceeded') {
    return 'Firebase Storage quota exceeded. Upgrade Firebase or free storage space.';
  }

  if (error?.code === 'storage/retry-limit-exceeded') {
    return 'Upload retry limit exceeded. Check the connection and try again.';
  }

  return error?.message || 'Upload failed';
}

export async function uploadAppFile(file, onProgress) {
  if (!file) throw new Error('No file selected');

  const safeName = sanitizeFileName(file.name);
  const storagePath = `${APP_FILE_FOLDER}/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, storagePath);
  const metadata = {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      originalName: file.name || safeName,
    },
  };

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, file, metadata);

    task.on(
      'state_changed',
      (snapshot) => {
        const percent = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;

        if (onProgress) {
          onProgress(percent, snapshot.bytesTransferred, snapshot.totalBytes);
        }
      },
      (error) => {
        reject(new Error(getUploadErrorMessage(error)));
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({
            url,
            path: task.snapshot.ref.fullPath,
            size: task.snapshot.totalBytes,
          });
        } catch (error) {
          reject(new Error(getUploadErrorMessage(error)));
        }
      }
    );
  });
}
