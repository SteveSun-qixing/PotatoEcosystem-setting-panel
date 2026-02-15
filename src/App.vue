<template>
  <div class="chips-app" :data-chips-theme="currentTheme">
    <nav class="chips-app__nav">
      <router-link
        v-for="route in routes"
        :key="route.path"
        :to="route.path"
        class="chips-app__nav-item"
      >
        {{ t(route.labelKey) }}
      </router-link>
    </nav>
    <main class="chips-app__content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import type { ChipsSDK } from '@chips/sdk';

const sdk = inject<ChipsSDK>('sdk');

if (!sdk) {
  throw new Error('SDK not provided');
}

function t(key: string): string {
  try {
    return sdk!.t(key);
  } catch (error) {
    console.error('Translation error:', error);
    return key;
  }
}

const currentTheme = computed(() => {
  try {
    return sdk!.themes.currentThemeId || 'default';
  } catch (error) {
    console.error('Theme error:', error);
    return 'default';
  }
});

const routes = computed(() => [
  { path: '/', labelKey: 'i18n.plugin.600001' },
  { path: '/about', labelKey: 'i18n.plugin.600002' },
]);
</script>
