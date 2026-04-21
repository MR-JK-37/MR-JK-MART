import { Storage } from 'megajs';
import { Buffer } from 'buffer';

const MEGA_EMAIL = import.meta.env.VITE_MEGA_EMAIL || 'YOUR_MEGA_EMAIL@gmail.com';
const MEGA_PASSWORD = import.meta.env.VITE_MEGA_PASSWORD || 'YOUR_MEGA_PASSWORD';

let storageInstance = null;
let uploadFolder = null;

function assertMegaConfigured() {
  const missingEmail = !MEGA_EMAIL || MEGA_EMAIL === 'YOUR_MEGA_EMAIL@gmail.com';
  const missingPassword = !MEGA_PASSWORD || MEGA_PASSWORD === 'YOUR_MEGA_PASSWORD';

  if (missingEmail || missingPassword) {
    throw new Error('MEGA is not configured. Add VITE_MEGA_EMAIL and VITE_MEGA_PASSWORD, then restart the app.');
  }
}

async function getMegaStorage() {
  assertMegaConfigured();

  if (storageInstance) return storageInstance;

  return await new Promise((resolve, reject) => {
    const storage = new Storage({
      email: MEGA_EMAIL,
      password: MEGA_PASSWORD,
      autologin: true,
      autoload: true,
    });

    storage.on('ready', () => {
      storageInstance = storage;
      resolve(storage);
    });

    storage.on('error', (err) => {
      storageInstance = null;
      reject(new Error(`MEGA login failed: ${err.message || err}`));
    });
  });
}

async function getUploadFolder(storage) {
  if (uploadFolder) return uploadFolder;

  const children = storage.root?.children || [];
  const existing = children.find(
    (node) => node.name === 'MR-JK-MART' && node.directory
  );

  if (existing) {
    uploadFolder = existing;
    return uploadFolder;
  }

  return await new Promise((resolve, reject) => {
    storage.root.mkdir('MR-JK-MART', (err, folder) => {
      if (err) {
        reject(new Error(`Cannot create folder: ${err}`));
        return;
      }
      uploadFolder = folder;
      resolve(folder);
    });
  });
}

export async function uploadToMega(file, onProgress) {
  if (!file) throw new Error('No file selected');

  onProgress?.(0, 0, file.size);

  const storage = await getMegaStorage();
  const folder = await getUploadFolder(storage);

  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 20);
        onProgress?.(percent, e.loaded, file.size);
      }
    };

    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });

  onProgress?.(20, Math.round(file.size * 0.2), file.size);

  const safeName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

  return await new Promise((resolve, reject) => {
    const uploadStream = folder.upload(
      { name: safeName, size: file.size },
      Buffer.from(arrayBuffer),
      (err, uploadedFile) => {
        if (err) {
          reject(new Error(`MEGA upload failed: ${err}`));
          return;
        }

        uploadedFile.link((linkErr, url) => {
          if (linkErr) {
            reject(new Error(`Cannot get MEGA link: ${linkErr}`));
            return;
          }

          onProgress?.(100, file.size, file.size);
          resolve({
            url,
            name: file.name,
            size: file.size,
            path: safeName,
          });
        });
      }
    );

    uploadStream.on('progress', (data) => {
      const loaded = data?.bytesUploaded || data?.bytesLoaded || 0;
      const total = data?.bytesTotal || file.size;

      if (!total) return;

      const percent = Math.round(20 + (loaded / total) * 75);
      onProgress?.(Math.min(percent, 95), loaded, file.size);
    });

    uploadStream.on('error', (err) => {
      reject(new Error(`MEGA upload failed: ${err.message || err}`));
    });
  });
}

export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
