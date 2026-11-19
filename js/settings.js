import { settings } from './settings.js';

export const SEARCH_PROVIDERS = {
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    searchUrl: (q) => `https://duckduckgo.com{encodeURIComponent(q)}`,
    homeUrl: 'https://duckduckgo.com'
  },
  brave: {
    id: 'brave',
    name: 'Brave Search',
    searchUrl: (q) => `https://brave.com{encodeURIComponent(q)}`,
    homeUrl: 'https://brave.com'
  },
  google: {
    id: 'google',
    name: 'Google',
    searchUrl: (q) => `https://google.com{encodeURIComponent(q)}`,
    homeUrl: 'https://google.com'
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    searchUrl: (q) => `https://bing.com{encodeURIComponent(q)}`,
    homeUrl: 'https://bing.com'
  }
};

export function resolveInputToTarget(rawInput) {
  const input = (rawInput || '').trim();
  if (!input) return 'about:tor';

  // Internal pages
  if (input.startsWith('about:')) {
    return input.toLowerCase();
  }

  // Explicit protocol
  if (/^https?:\/\//i.test(input)) {
    try {
      const parsed = new URL(input);
      return parsed.href;
    } catch {
      return null;
    }
  }

  // Domain-like pattern (no spaces, contains dot)
  if (!input.includes(' ') && /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(:[0-9]+)?(\/.*)?$/.test(input)) {
    return `https://${input}`;
  }

  // Route query to configured real search engine
  const engineKey = settings.get('defaultEngine');
  const provider = SEARCH_PROVIDERS[engineKey] || SEARCH_PROVIDERS.duckduckgo;
  return provider.searchUrl(input);
}
