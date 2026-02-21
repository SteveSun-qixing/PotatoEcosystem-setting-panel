export const THEME_CSS_LAYERS = ['tokens', 'components', 'animations', 'icons'] as const;

export type ThemeCssLayer = (typeof THEME_CSS_LAYERS)[number];

export type ThemeCssLayerMap = Partial<Record<ThemeCssLayer, string>>;

const STYLE_ID_PREFIX = 'chips-theme-layer';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function styleIdFor(layer: ThemeCssLayer): string {
  return `${STYLE_ID_PREFIX}-${layer}`;
}

function ensureLayerStyle(layer: ThemeCssLayer): HTMLStyleElement {
  const styleId = styleIdFor(layer);
  const existing = document.getElementById(styleId);

  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const node = document.createElement('style');
  node.id = styleId;
  node.setAttribute('data-chips-theme-layer', layer);

  const nextLayer = THEME_CSS_LAYERS
    .slice(THEME_CSS_LAYERS.indexOf(layer) + 1)
    .find((candidate) => document.getElementById(styleIdFor(candidate)) instanceof HTMLStyleElement);
  const nextNode = nextLayer ? document.getElementById(styleIdFor(nextLayer)) : null;
  document.head.insertBefore(node, nextNode);
  return node;
}

function removeLayerStyle(layer: ThemeCssLayer): void {
  const styleNode = document.getElementById(styleIdFor(layer));
  if (styleNode) {
    styleNode.remove();
  }
}

function isNonEmptyCss(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function normalizeThemeCssLayers(value: unknown): ThemeCssLayerMap {
  if (!isObjectRecord(value)) {
    return {};
  }

  const layers: ThemeCssLayerMap = {};
  for (const layer of THEME_CSS_LAYERS) {
    const candidate = value[layer];
    if (isNonEmptyCss(candidate)) {
      layers[layer] = candidate;
    }
  }

  return layers;
}

export function applyThemeCssLayers(layers: ThemeCssLayerMap): void {
  for (const layer of THEME_CSS_LAYERS) {
    const css = layers[layer];
    if (!isNonEmptyCss(css)) {
      removeLayerStyle(layer);
      continue;
    }

    const styleNode = ensureLayerStyle(layer);
    styleNode.textContent = css;
  }
}
