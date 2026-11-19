// js/bookmarks.js
import { storage } from './storage.js';

const DEFAULT_BOOKMARKS = [
  { id: 'bm-1', title: 'Tor Project Official', url: 'https://torproject.org', folder: 'Privacy & Security', createdAt: Date.now() },
  { id: 'bm-2', title: 'DuckDuckGo Search', url: 'https://duckduckgo.com', folder: 'Search', createdAt: Date.now() },
  { id: 'bm-3', title: 'Electronic Frontier Foundation', url: 'https://eff.org', folder: 'Privacy & Security', createdAt: Date.now() },
  { id: 'bm-4', title: 'Tor Diagnostics', url: 'about:tor', folder: 'Browser', createdAt: Date.now() }
];

class BookmarksManager extends EventTarget {
  constructor() {
    super();
    this.items = [];
  }

  async init() {
    this.items = await storage.getAll('bookmarks');
    if (this.items.length === 0 && !localStorage.getItem('onionshell_bm_seeded')) {
      for (const bm of DEFAULT_BOOKMARKS) {
        await storage.put('bookmarks', bm);
      }
      localStorage.setItem('onionshell_bm_seeded', '1');
      this.items = await storage.getAll('bookmarks');
    }
    this.renderBar();
    return this.items;
  }

  isBookmarked(url) {
    return this.items.some((b) => b.url === url);
  }

  async add({ title, url, folder = 'General' }) {
    if (!url || !title) throw new Error('Title and URL are required.');
    const item = {
      id: `bm-${crypto.randomUUID()}`,
      title: title.trim(),
      url: url.trim(),
      folder: folder.trim() || 'General',
      createdAt: Date.now()
    };
    await storage.put('bookmarks', item);
    this.items.push(item);
    this.renderBar();
    this.dispatchEvent(new Event('change'));
    return item;
  }

  async update(id, updates) {
    const existing = this.items.find((b) => b.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    await storage.put('bookmarks', updated);
    this.items = this.items.map((b) => (b.id === id ? updated : b));
    this.renderBar();
    this.dispatchEvent(new Event('change'));
  }

  async remove(id) {
    await storage.delete('bookmarks', id);
    this.items = this.items.filter((b) => b.id !== id);
    this.renderBar();
    this.dispatchEvent(new Event('change'));
  }

  renderBar() {
    const bar = document.getElementById('bookmarks-bar');
    if (!bar) return;
    bar.innerHTML = '';
    this.items.slice(0, 12).forEach((bm) => {
      const btn = document.createElement('button');
      btn.className = 'bookmark-chip';
      btn.textContent = bm.title;
      btn.title = `${bm.title} (${bm.url})`;
      btn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('browser:navigate', { detail: { url: bm.url } }));
      });
      bar.appendChild(btn);
    });
  }
}

export const bookmarks = new BookmarksManager();
