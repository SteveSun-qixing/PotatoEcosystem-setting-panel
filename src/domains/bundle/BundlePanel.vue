<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { ChipsButton } from '@chips/components';

import { useI18n } from '@/composables/use-i18n';
import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { BundleStatus } from '@/types';

const { t } = useI18n();
const loading = ref(false);
const operating = ref(false);
const error = ref('');
const status = ref<BundleStatus | null>(null);
const lastOperation = ref('');

async function refresh(): Promise<void> {
  loading.value = true;
  error.value = '';

  try {
    status.value = await ecosystemSettingsService.getBundleStatus();
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

async function updateBundle(): Promise<void> {
  operating.value = true;
  error.value = '';

  try {
    await ecosystemSettingsService.updateBundle();
    lastOperation.value = `update @ ${new Date().toLocaleString()}`;
    await refresh();
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    operating.value = false;
  }
}

async function repairBundle(): Promise<void> {
  operating.value = true;
  error.value = '';

  try {
    await ecosystemSettingsService.repairBundle();
    lastOperation.value = `repair @ ${new Date().toLocaleString()}`;
    await refresh();
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    operating.value = false;
  }
}

onMounted(async () => {
  await refresh();
});
</script>

<template>
  <section class="chips-settings-panel">
    <header class="chips-settings-panel__header">
      <div>
        <h2 class="chips-settings-panel__title">{{ t('i18n.plugin.695001') }}</h2>
        <p class="chips-settings-panel__description">{{ t('i18n.plugin.695002') }}</p>
      </div>
      <ChipsButton variant="secondary" :loading="loading" @click="refresh">{{ t('i18n.plugin.695003') }}</ChipsButton>
    </header>

    <div v-if="error" class="chips-settings-alert chips-settings-alert--error">{{ error }}</div>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.695004') }}</h3>
      <dl v-if="status" class="chips-settings-card__list">
        <div class="chips-settings-card__item">
          <dt>{{ t('i18n.plugin.695005') }}</dt>
          <dd>{{ status.healthy ? t('i18n.plugin.695006') : t('i18n.plugin.695007') }}</dd>
        </div>
        <div class="chips-settings-card__item">
          <dt>{{ t('i18n.plugin.695008') }}</dt>
          <dd>{{ status.installedCount }}</dd>
        </div>
        <div class="chips-settings-card__item">
          <dt>{{ t('i18n.plugin.695009') }}</dt>
          <dd>{{ status.requiredTypes.join(', ') }}</dd>
        </div>
      </dl>
      <p v-else class="chips-settings-card__meta">{{ t('i18n.plugin.695010') }}</p>
    </div>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.695011') }}</h3>
      <div class="chips-settings-card__toolbar">
        <ChipsButton variant="secondary" :loading="operating" @click="updateBundle">{{ t('i18n.plugin.695012') }}</ChipsButton>
        <ChipsButton variant="secondary" :loading="operating" @click="repairBundle">{{ t('i18n.plugin.695013') }}</ChipsButton>
      </div>
      <p v-if="lastOperation" class="chips-settings-card__meta">{{ lastOperation }}</p>
    </div>
  </section>
</template>
