import { settings } from './settings.js';

class NetworkManager extends EventTarget {
  constructor() {
    super();
    this.connected = false;
    this.runtimeMode = window.electronTorBridge ? 'electron-desktop' : 'web-browser';
    this.lastDiagnostic = null;
  }

  async checkTorConnection() {
    const host = settings.get('torProxyHost') || '127.0.0.1';
    const port = Number(settings.get('torProxyPort')) || 9050;

    // 1. If running inside the optional Electron desktop shell with native IPC bridge
    if (window.electronTorBridge && typeof window.electronTorBridge.checkSocksProxy === 'function') {
      try {
        const result = await window.electronTorBridge.checkSocksProxy({ host, port });
        this.connected = Boolean(result.connected);
        this.lastDiagnostic = {
          checkedAt: new Date().toISOString(),
          runtime: 'Electron Desktop Shell',
          proxyEndpoint: `${host}:${port}`,
          torConnected: this.connected,
          detail: result.message || (this.connected ? 'SOCKS5 Tor daemon reachable.' : 'Tor network is not connected.')
        };
      } catch (err) {
        this.connected = false;
        this.lastDiagnostic = {
          checkedAt: new Date().toISOString(),
          runtime: 'Electron Desktop Shell',
          proxyEndpoint: `${host}:${port}`,
          torConnected: false,
          detail: `Connection check failed: ${err.message}`
        };
      }
      this.updateStatusUI();
      return this.lastDiagnostic;
    }

    // 2. Standard Web Browser / Vercel Hosted Runtime
    // Browsers cannot directly open raw TCP/SOCKS5 sockets to 127.0.0.1:9050 due to OS/browser sandbox security.
    let apiStatus = 'Unavailable';
    try {
      const res = await fetch('./api/health', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        apiStatus = data.message;
      }
    } catch {
      apiStatus = 'Static local/offline origin (no serverless health endpoint).';
    }

    this.connected = false;
    this.lastDiagnostic = {
      checkedAt: new Date().toISOString(),
      runtime: 'Standard Web Browser (Sandboxed)',
      proxyEndpoint: `${host}:${port} (Configured for Desktop Runtime)`,
      torConnected: false,
      detail: 'Tor network is not connected. Web browsers cannot route traffic over SOCKS5 or the Tor network directly. Launch the desktop shell with a running local Tor daemon for genuine Tor routing.',
      hostHealth: apiStatus
    };

    this.updateStatusUI();
    return this.lastDiagnostic;
  }

  updateStatusUI() {
    const pill = document.getElementById('tor-status-pill');
    if (!pill) return;
    const label = pill.querySelector('.status-label');
    if (this.connected) {
      pill.classList.remove('disconnected');
      pill.classList.add('connected');
      if (label) label.textContent = 'Tor: Connected (SOCKS5)';
    } else {
      pill.classList.remove('connected');
      pill.classList.add('disconnected');
      if (label) label.textContent = 'Tor: Not Connected';
    }
    this.dispatchEvent(new CustomEvent('statuschange', { detail: this.lastDiagnostic }));
  }
}

export const network = new NetworkManager();
