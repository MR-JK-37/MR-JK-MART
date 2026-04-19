// COMPRESS — call this on upload before storing to IndexedDB
export async function compressFile(arrayBuffer) {
  const startTime = Date.now();
  const originalSize = arrayBuffer.byteLength;
  
  try {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    const reader = cs.readable.getReader();
    
    // Fire and forget writing to the stream
    writer.write(arrayBuffer).then(() => writer.close());
    
    const chunks = [];
    let totalSize = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.byteLength;
    }
    
    // Combine all chunks
    const compressed = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      compressed.set(chunk, offset);
      offset += chunk.byteLength;
    }
    
    const compressionRatio = (
      (1 - compressed.byteLength / originalSize) * 100
    ).toFixed(1);
    
    console.log(
      `Compressed: ${formatSize(originalSize)} → ${formatSize(compressed.byteLength)} (${compressionRatio}% saved in ${Date.now() - startTime}ms)`
    );
    
    return {
      data: compressed.buffer,
      originalSize,
      compressedSize: compressed.byteLength,
      compressionRatio: parseFloat(compressionRatio),
      compressed: true
    };
  } catch (err) {
    // CompressionStream not supported — store raw
    console.warn('Compression not supported or failed, storing raw', err);
    return {
      data: arrayBuffer,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      compressed: false
    };
  }
}

// DECOMPRESS — call this on download before serving to user
export async function decompressFile(arrayBuffer) {
  try {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    
    // Fire and forget writing to the stream
    writer.write(arrayBuffer).then(() => writer.close());
    
    const chunks = [];
    let totalSize = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.byteLength;
    }
    
    const decompressed = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      decompressed.set(chunk, offset);
      offset += chunk.byteLength;
    }
    
    return decompressed.buffer;
  } catch (err) {
    // If decompress fails, return as-is (already raw)
    console.error('Decompression failed, returning original array buffer', err);
    return arrayBuffer;
  }
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  return (bytes / 1024 ** 3).toFixed(2) + ' GB';
}
