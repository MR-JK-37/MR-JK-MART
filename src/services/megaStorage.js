import { Storage } from 'megajs';
import { Buffer } from 'buffer';

const MEGA_EMAIL = import.meta.env.VITE_MEGA_EMAIL;
const MEGA_PASSWORD = import.meta.env.VITE_MEGA_PASSWORD;

let storageInstance = null;
let uploadFolder = null;

function validateConfig() {
  if (!MEGA_EMAIL || !MEGA_PASSWORD) {
    throw new Error(
      'MEGA not configured. Add VITE_MEGA_EMAIL and VITE_MEGA_PASSWORD to .env file'
    );
  }

  if (!MEGA_EMAIL.includes('@')) {
    throw new Error('VITE_MEGA_EMAIL is invalid format');
  }
}

async function getMegaStorage() {
  validateConfig();

  if (storageInstance) return storageInstance;

  return await new Promise((resolve, reject) => {
    const storage = new Storage({
      email: MEGA_EMAIL,
      password: MEGA_PASSWORD,
    });

    const timeout = setTimeout(() => {
      storageInstance = null;
      reject(new Error('MEGA login timed out. Check your credentials.'));
    }, 30000);

    storage.on('ready', () => {
      clearTimeout(timeout);
      storageInstance = storage;
      resolve(storage);
    });

    storage.on('error', (err) => {
      clearTimeout(timeout);
      storageInstance = null;
      reject(
        new Error(
          'MEGA login failed: ' +
          (err?.message || String(err)) +
          '. Check email and password.'
        )
      );
    });
  });
}

async function getUploadFolder(storage) {
  if (uploadFolder) return uploadFolder;

  const root = storage.root;
  const children = Object.values(storage.files || {})
    .filter((file) => file.parent === root && file.directory);

  const existing = children.find((node) => node.name === 'MR-JK-MART');

  if (existing) {
    uploadFolder = existing;
    return uploadFolder;
  }

  return await new Promise((resolve, reject) => {
    root.mkdir('MR-JK-MART', (err, folder) => {
      if (err) {
        reject(new Error(`Cannot create MEGA folder: ${err}`));
      } else {
        uploadFolder = folder;
        resolve(folder);
      }
    });
  });
}

export async function uploadToMega(file, onProgress) {
  if (!file) throw new Error('No file selected');

  validateConfig();

  onProgress?.(5, 0, file.size);

  let storage;
  try {
    storage = await getMegaStorage();
  } catch (err) {
    throw new Error(`MEGA login failed: ${err.message}`);
  }

  onProgress?.(10, 0, file.size);

  const folder = await getUploadFolder(storage);
  onProgress?.(15, 0, file.size);

  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = 15 + Math.round((e.loaded / e.total) * 20);
        onProgress?.(percent, e.loaded, file.size);
      }
    };

    reader.onload = (e) => {
      onProgress?.(35, file.size * 0.35, file.size);
      resolve(e.target.result);
    };

    reader.onerror = () => reject(new Error('Cannot read file'));
    reader.readAsArrayBuffer(file);
  });

  const timestamp = Date.now();
  const safeName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;

  const uploadedFile = await new Promise((resolve, reject) => {
    const uploadStream = folder.upload(
      {
        name: safeName,
        size: file.size,
        allowUploadBuffering: true,
      },
      Buffer.from(arrayBuffer),
      (err, uploadedNode) => {
        if (err) {
          reject(new Error(`MEGA upload error: ${err}`));
        } else {
          resolve(uploadedNode);
        }
      }
    );

    if (uploadStream?.on) {
      uploadStream.on('progress', ({ bytesLoaded, bytesTotal }) => {
        if (onProgress && bytesTotal) {
          const percent = 35 + Math.round((bytesLoaded / bytesTotal) * 60);
          onProgress(
            Math.min(percent, 95),
            bytesLoaded,
            file.size
          );
        }
      });
    }
  });

  onProgress?.(97, file.size * 0.97, file.size);

  const publicUrl = await new Promise((resolve, reject) => {
    uploadedFile.link((err, url) => {
      if (err) {
        reject(new Error(`Cannot generate MEGA link: ${err}`));
      } else {
        resolve(url);
      }
    });
  });

  onProgress?.(100, file.size, file.size);

  return {
    url: publicUrl,
    name: file.name,
    size: file.size,
    path: safeName,
  };
}

export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 ** 3) {
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
