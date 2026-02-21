import { afterEach, describe, expect, it } from 'vitest';

import { applyThemeCssLayers, normalizeThemeCssLayers } from '@/utils/theme-style';

const STYLE_IDS = [
  'chips-theme-layer-tokens',
  'chips-theme-layer-components',
  'chips-theme-layer-animations',
  'chips-theme-layer-icons'
] as const;

function clearThemeStyles(): void {
  for (const styleId of STYLE_IDS) {
    document.getElementById(styleId)?.remove();
  }
}

describe('theme-style utilities', () => {
  afterEach(() => {
    clearThemeStyles();
  });

  it('normalizes css layers and ignores invalid values', () => {
    const layers = normalizeThemeCssLayers({
      tokens: ':root { --chips-color-primary: #0055ff; }',
      components: '',
      animations: 1,
      icons: '.chips-icon { color: inherit; }',
      unknown: '.x {}'
    });

    expect(layers).toEqual({
      tokens: ':root { --chips-color-primary: #0055ff; }',
      icons: '.chips-icon { color: inherit; }'
    });
  });

  it('injects ordered style layers and removes missing layers on next apply', () => {
    applyThemeCssLayers({
      tokens: ':root { --chips-color-primary: #111111; }',
      components: '.chips-button { border-radius: 6px; }'
    });

    const tokensStyle = document.getElementById('chips-theme-layer-tokens');
    const componentsStyle = document.getElementById('chips-theme-layer-components');

    expect(tokensStyle).not.toBeNull();
    expect(componentsStyle).not.toBeNull();
    if (!tokensStyle || !componentsStyle) {
      return;
    }

    expect(tokensStyle?.textContent).toContain('--chips-color-primary: #111111');
    expect(componentsStyle?.textContent).toContain('border-radius: 6px');
    expect(Boolean(tokensStyle.compareDocumentPosition(componentsStyle) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    applyThemeCssLayers({
      tokens: ':root { --chips-color-primary: #222222; }'
    });

    expect(document.getElementById('chips-theme-layer-tokens')?.textContent).toContain('#222222');
    expect(document.getElementById('chips-theme-layer-components')).toBeNull();
  });
});
