// js/downloads.js
import { storage } from './storage.js';

class DownloadsManager extends EventTarget {
  constructor() {
    super();
    this.items = [];
    this.blobUrls = new Map();
  }

  async init() {
    const all = await storage.getAll('downloads');
    this.items = all.sort((a, b) => b.startedAt - a.startedAt);
    return this.items;
  }

  async startDownload(url, suggestedName = '') {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Invalid download URL.');
    }

    const fileName = suggestedName || parsedUrl.pathname.split('/').pop() || 'download.bin';
    const record = {
      id: `dl-${crypto.randomUUID()}`,
      fileName,
      url: parsedUrl.href,
      sizeBytes: 0,
      receivedBytes: 0,
      status: 'in_progress',
      error: null,
      startedAt: Date.now()
    };

    this.items.unshift(record);
    await storage.put('downloads', record);
    this.dispatchEvent(new Event('change'));

    try {
      const response = await fetch(parsedUrl.href);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const contentLength = Number(response.headers.get('content-length')) || 0;
      record.sizeBytes = contentLength;

      if (response.body && response.body.getReader) {
        const reader = response.body.getReader();
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          record.receivedBytes += value.byteLength;
          this.dispatchEvent(new Event('progress'));
        }
        const blob = new Blob(chunks);
        record.sizeBytes = blob.size;
        const objectUrl = URL.createObjectURL(blob);
        this.blobUrls.set(record.id, objectUrl);
        this.triggerBrowserSave(objectUrl, fileName);
      } else {
        const blob = await response.blob();
        record.sizeBytes = blob.size;
        record.receivedBytes = blob.size;
        const objectUrl = URL.createObjectURL(blob);
        this.blobUrls.set(record.id, objectUrl);
        this.triggerBrowserSave(objectUrl, fileName);
      }

      record.status = 'completed';
    } catch (err) {
      // Explain CORS / browser security limitation honestly
      record.status = 'blocked_or_failed';
      record.error = `Browser fetch blocked by CORS or network error (${err.message}). Opening direct browser download fallback.`;
      window.open(parsedUrl.href, '_blank', 'noopener,noreferrer');
    }

    await storage.put('downloads', record);
    this.dispatchEvent(new Event('change'));
    return record;
  }

  triggerBrowserSave(objectUrl, fileName) {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  openDownload(id) {
    const blobUrl = this.blobUrls.get(id);
    if (blobUrl) {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      return true;
    }
    const item = this.items.find((d) => d.id === id);
    if (item && item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return true;
    }
    return false;
  }

  async removeRecord(id) {
    const blobUrl = this.blobUrls.get(id);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      this.blobUrls.delete(id);
    }
    await storage.delete('downloads', id);
    this.items = this.items.filter((d) => d.id !== id);
    this.dispatchEvent(new Event('change'));
  }
}

export const downloads = new DownloadsManager();
