/**
 * Theme = one localStorage key ('wgk-theme') shared by the shell, the embedded
 * tools, and standalone tool tabs (same origin). No stored value → follow the
 * OS. The `wgk-theme` window event lets canvases repaint on switch; the
 * `storage` event keeps other tabs/iframes in sync.
 */
export type Theme = 'dark' | 'light';

const KEY = 'wgk-theme';
const sysDark = window.matchMedia('(prefers-color-scheme: dark)');

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  return stored() ?? (sysDark.matches ? 'dark' : 'light');
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event('wgk-theme'));
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // private mode / file:// — the attribute below still switches this tab
  }
  apply(theme);
}

export function subscribeTheme(fn: () => void) {
  window.addEventListener('wgk-theme', fn);
  return () => window.removeEventListener('wgk-theme', fn);
}

export function initTheme() {
  apply(currentTheme());
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) apply(currentTheme());
  });
  sysDark.addEventListener('change', () => {
    if (!stored()) apply(currentTheme());
  });
}
