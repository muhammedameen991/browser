// js/history.js
import { storage } from './storage.js';

class HistoryManager extends EventTarget {
  constructor() {
    super();
    this.entries = [];
  }

  async init() {
    const all = await storage.getAll('history');
    this.entries = all.sort((a, b) => b.timestamp - a.timestamp);
    return this.entries;
  }

  async record({ title, url, isPrivate }) {
    // Strictly never store private browsing history
    if (isPrivate || !url || url === 'about:tor' || url === 'about:blank') return;
    const entry = {
      id: `hist-${crypto.randomUUID()}`,
      title: title || url,
      url,
      timestamp: Date.now()
    };
    await storage.put('history', entry);
    this.entries.unshift(entry);
    this.dispatchEvent(new Event('change'));
  }

  async deleteEntry(id) {
    await storage.delete('history', id);
    this.entries = this.entries.filter((e) => e.id !== id);
    this.dispatchEvent(new Event('change'));
  }

  async clearAll() {
    await storage.clearStore('history');
    this.entries = [];
    this.dispatchEvent(new Event('change'));
  }
}

export const historyManager = new HistoryManager();
