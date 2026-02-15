<template>
  <div class="chips-card-wrapper">
    <div class="chips-card-wrapper__header">
      <span class="chips-card-wrapper__title">{{ t('i18n.plugin.600003') }}</span>
    </div>
    <div class="chips-card-wrapper__content">
      <p class="chips-card-wrapper__description">
        {{ t('i18n.plugin.600004') }}
      </p>
      <div class="chips-card-wrapper__actions">
        <button
          class="chips-button chips-button--primary"
          :class="{ 'chips-button--loading': loading }"
          :disabled="loading"
          @click="handleSave"
        >
          {{ t('i18n.core.000003') }}
        </button>
        <button
          class="chips-button chips-button--ghost"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ t('i18n.core.000002') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';
import type { ChipsSDK } from '@chips/sdk';

const sdk = inject<ChipsSDK>('sdk');
const loading = ref<boolean>(false);

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

async function handleSave(): Promise<void> {
  loading.value = true;
  try {
    await window.chips!.invoke('log', 'info', {
      message: 'Save button clicked',
    });
    console.log('Save action triggered');
  } catch (error) {
    console.error('Save error:', error);
  } finally {
    loading.value = false;
  }
}

function handleCancel(): void {
  console.log('Cancel action triggered');
}
</script>
