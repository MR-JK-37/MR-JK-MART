const VERSION_KEY = 'mrjk_app_version';
const VERSION_RELOAD_KEY = 'mrjk_app_version_reload';
const CURRENT_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

function hasReloadedForVersion(version) {
  return sessionStorage.getItem(VERSION_RELOAD_KEY) === version;
}

function markReloadedForVersion(version) {
  sessionStorage.setItem(VERSION_RELOAD_KEY, version);
}

export function initVersionCheck() {
  if (CURRENT_VERSION === 'dev') return;

  const storedVersion = localStorage.getItem(VERSION_KEY);
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION);

  if (!storedVersion || storedVersion === CURRENT_VERSION || hasReloadedForVersion(CURRENT_VERSION)) {
    return;
  }

  markReloadedForVersion(CURRENT_VERSION);
  window.location.reload();
}

export function getAppVersion() {
  return CURRENT_VERSION;
}
