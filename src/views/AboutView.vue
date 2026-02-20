<template>
  <div class="chips-view chips-view--about">
    <div class="chips-view__header">
      <h1 class="chips-view__title">{{ t('i18n.plugin.600013') }}</h1>
      <p class="chips-view__subtitle">{{ t('i18n.plugin.600014') }}</p>
    </div>

    <div class="chips-view__content">
      <div class="chips-section">
        <h2 class="chips-section__title">{{ t('i18n.plugin.600015') }}</h2>
        <div class="chips-section__content">
          <div class="chips-info-grid">
            <div class="chips-info-item">
              <span class="chips-info-item__label">{{ t('i18n.plugin.600016') }}</span>
              <span class="chips-info-item__value">1.0.0</span>
            </div>
            <div class="chips-info-item">
              <span class="chips-info-item__label">{{ t('i18n.plugin.600017') }}</span>
              <span class="chips-info-item__value">Chips Official</span>
            </div>
            <div class="chips-info-item">
              <span class="chips-info-item__label">{{ t('i18n.plugin.600018') }}</span>
              <span class="chips-info-item__value">MIT</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chips-section">
        <h2 class="chips-section__title">{{ t('i18n.plugin.600019') }}</h2>
        <div class="chips-section__content">
          <div class="chips-theme-selector">
            <p class="chips-text--muted">{{ t('i18n.plugin.600020') }}</p>
            <div class="chips-theme-info">
              <span class="chips-theme-info__label">{{ t('i18n.plugin.600021') }}</span>
              <span class="chips-theme-info__value">{{ currentTheme || DEFAULT_THEME_ID }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chips-section">
        <h2 class="chips-section__title">{{ t('i18n.plugin.600022') }}</h2>
        <div class="chips-section__content">
          <div class="chips-language-selector">
            <p class="chips-text--muted">{{ t('i18n.plugin.600023') }}</p>
            <div class="chips-language-info">
              <span class="chips-language-info__label">{{ t('i18n.plugin.600024') }}</span>
              <span class="chips-language-info__value">{{ currentLanguage }}</span>
            </div>
            <div class="chips-language-list">
              <span class="chips-language-list__label">{{ t('i18n.plugin.600025') }}</span>
              <span class="chips-language-list__value">zh-CN, en-US, ja-JP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import type { ChipsSDK } from '@chips/sdk';
import { DEFAULT_THEME_ID } from '@/constants/theme';

const sdk = inject<ChipsSDK>('sdk');

if (!sdk) {
  throw new Error('SDK not provided');
}

function t(key: string, params?: Record<string, string | number>): string {
  try {
    return sdk!.t(key, params);
  } catch (error) {
    console.error('Translation error:', error);
    return key;
  }
}

const currentTheme = computed(() => {
  try {
    return sdk!.themes.currentThemeId || null;
  } catch (error) {
    console.error('Theme error:', error);
    return null;
  }
});

const currentLanguage = computed(() => {
  try {
    return sdk!.i18n.locale;
  } catch (error) {
    console.error('Language error:', error);
    return 'zh-CN';
  }
});
</script>
