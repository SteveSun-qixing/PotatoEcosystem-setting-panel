<template>
  <div class="chips-view chips-view--home">
    <div class="chips-view__header">
      <h1 class="chips-view__title">{{ t('i18n.plugin.600005') }}</h1>
      <p class="chips-view__subtitle">{{ t('i18n.plugin.600006') }}</p>
    </div>

    <div class="chips-view__content">
      <SampleCard />

      <div class="chips-section">
        <h2 class="chips-section__title">{{ t('i18n.plugin.600007') }}</h2>
        <div class="chips-section__content">
          <p>{{ t('i18n.plugin.600008') }}</p>
          <div class="chips-file-info" v-if="currentFile">
            <span class="chips-file-info__label">{{ t('i18n.plugin.600009') }}</span>
            <span class="chips-file-info__value">{{ currentFile }}</span>
          </div>
          <p v-else class="chips-text--muted">{{ t('i18n.plugin.600010') }}</p>
        </div>
      </div>

      <div class="chips-section">
        <h2 class="chips-section__title">{{ t('i18n.plugin.600011') }}</h2>
        <div class="chips-section__content">
          <button
            class="chips-button chips-button--primary"
            :disabled="loading"
            @click="handleLoadExample"
          >
            {{ loading ? t('i18n.ui.100001') : t('i18n.plugin.600012') }}
          </button>
          <p v-if="error" class="chips-text--error">
            {{ t('i18n.ui.100004', { message: error }) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/stores/app';
import { useSample } from '@/composables/use-sample';
import SampleCard from '@/components/SampleCard.vue';

const appStore = useAppStore();
const { t, loading, error, loadFile } = useSample();

const currentFile = computed(() => appStore.currentFile);

async function handleLoadExample(): Promise<void> {
  try {
    const content = await loadFile('/example/test.txt');
    console.log('Loaded file content:', content);
    await appStore.openFile('/example/test.txt');
  } catch (err) {
    console.error('Failed to load example file:', err);
  }
}
</script>
