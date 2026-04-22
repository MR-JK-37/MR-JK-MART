export function getDirectDownloadUrl(url) {
  if (!url) return url;

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}&confirm=t`;
  }

  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveOpenMatch[1]}&confirm=t`;
  }

  if (url.includes('dropbox.com')) {
    return url
      .replace('dl=0', 'dl=1')
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
    return url.replace('redir?', 'download?');
  }

  return url;
}

export function isGoogleDriveLink(url) {
  return Boolean(url && url.includes('drive.google.com'));
}
