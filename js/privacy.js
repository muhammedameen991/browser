// js/privacy.js
import { storage } from './storage.js';
import { historyManager } from './history.js';

export async function clearBrowsingData({
  history = true,
  downloads = false,
  localStorageData = false,
  cookies = false,
  cachesData = false
}) {
  const report = [];

  if (history) {
    await historyManager.clearAll();
    report.push('Browsing history cleared from IndexedDB.');
  }

  if (downloads) {
    await storage.clearStore('downloads');
    report.push('Download records cleared from IndexedDB.');
  }

  if (localStorageData) {
    sessionStorage.clear();
    Object.keys(localStorage).forEach((key) => {
      if (key !== 'onionshell_settings_v1') {
        localStorage.removeItem(key);
      }
    });
    report.push('Local & session storage entries cleared.');
  }

  if (cookies) {
    // Only first-party non-HttpOnly cookies on the current origin are accessible to JS
    const rawCookies = document.cookie.split(';');
    let clearedCount = 0;
    for (const cookie of rawCookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        clearedCount++;
      }
    }
    report.push(`Cleared ${clearedCount} accessible first-party cookie(s). Cross-origin & HttpOnly cookies cannot be accessed by web JavaScript.`);
  }

  if (cachesData && 'caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    report.push(`Cleared ${keys.length} Cache Storage bucket(s).`);
  }

  return report;
}
