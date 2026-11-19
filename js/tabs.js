// js/tabs.js
class TabsManager extends EventTarget {
  constructor() {
    super();
    this.tabs = [];
    this.activeTabId = null;
  }

  createTab({ url = 'about:tor', isPrivate = false, activate = true } = {}) {
    const id = `tab-${crypto.randomUUID()}`;
    const tab = {
      id,
      title: isPrivate ? 'Private Tab' : 'New Tab',
      url,
      isPrivate,
      historyStack: [url],
      historyIndex: 0,
      loading: false,
      blockedByFramePolicy: false
    };
    this.tabs.push(tab);
    this.dispatchEvent(new CustomEvent('tabcreated', { detail: tab }));
    if (activate) {
      this.activateTab(id);
    }
    return tab;
  }

  getActiveTab() {
    return this.tabs.find((t) => t.id === this.activeTabId) || null;
  }

  getTab(id) {
    return this.tabs.find((t) => t.id === id) || null;
  }

  activateTab(id) {
    if (!this.tabs.some((t) => t.id === id)) return;
    this.activeTabId = id;
    this.dispatchEvent(new CustomEvent('tabactivated', { detail: this.getActiveTab() }));
  }

  closeTab(id) {
    const idx = this.tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const [closed] = this.tabs.splice(idx, 1);
    this.dispatchEvent(new CustomEvent('tabclosed', { detail: closed }));

    if (this.tabs.length === 0) {
      this.createTab({ url: 'about:tor', isPrivate: false, activate: true });
      return;
    }

    if (this.activeTabId === id) {
      const nextTab = this.tabs[Math.min(idx, this.tabs.length - 1)];
      this.activateTab(nextTab.id);
    }
  }

  updateTab(id, patch) {
    const tab = this.getTab(id);
    if (!tab) return;
    Object.assign(tab, patch);
    this.dispatchEvent(new CustomEvent('tabupdated', { detail: tab }));
  }
}

export const tabsManager = new TabsManager();
