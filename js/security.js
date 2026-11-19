import { settings } from './settings.js';

export const SECURITY_LEVELS = {
  standard: {
    id: 'standard',
    title: 'Standard',
    summary: 'All supported browser and website features are enabled.',
    iframeSandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
    protections: [
      { label: 'Strict Referrer Policy (no-referrer)', status: 'Active', type: 'active' },
      { label: 'Sandboxed Web Frame Isolation', status: 'Active', type: 'active' },
      { label: 'JavaScript JIT & WebAssembly Disabling', status: 'Requires Desktop Engine', type: 'unavailable' },
      { label: 'Tor Circuit & Onion Routing', status: 'Requires Local Tor Service', type: 'unavailable' }
    ]
  },
  safer: {
    id: 'safer',
    title: 'Safer',
    summary: 'Restricts popup windows and enforces stricter frame isolation for embedded pages.',
    iframeSandbox: 'allow-scripts allow-same-origin allow-forms',
    protections: [
      { label: 'Popups Blocked in Embedded Frames', status: 'Active', type: 'active' },
      { label: 'Third-Party Content Warnings', status: 'Active', type: 'active' },
      { label: 'HTTPS Upgrade Enforcement on Input', status: 'Active', type: 'active' },
      { label: 'SVG & Remote Font Blocking', status: 'Requires Desktop Engine', type: 'unavailable' }
    ]
  },
  safest: {
    id: 'safest',
    title: 'Safest',
    summary: 'Disables JavaScript execution inside embedded web frames using HTML5 iframe sandboxing.',
    iframeSandbox: 'allow-forms',
    protections: [
      { label: 'JavaScript Disabled in Embedded Frames', status: 'Active (via iframe sandbox)', type: 'active' },
      { label: 'Forms Only (No Scripts, Popups, or Top-Navigation)', status: 'Active', type: 'active' },
      { label: 'Private Session Memory Isolation', status: 'Active', type: 'active' },
      { label: 'System-Level Canvas Fingerprinting Defense', status: 'Requires Tor Browser / Desktop Runtime', type: 'unavailable' }
    ]
  }
};

export function getActiveSecurityPolicy() {
  const level = settings.get('securityLevel') || 'standard';
  return SECURITY_LEVELS[level] || SECURITY_LEVELS.standard;
}
