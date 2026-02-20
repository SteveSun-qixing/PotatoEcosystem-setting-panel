<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { ChipsButton, ChipsInput, ChipsSelect } from '@chips/components';

import { useI18n } from '@/composables/use-i18n';
import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { WorkspaceExchangePolicy } from '@/types';

const { t } = useI18n();
const loading = ref(false);
const saving = ref(false);
const error = ref('');

const workspacePath = ref('');
const policy = ref<WorkspaceExchangePolicy>({
  mode: 'copy',
  conflict: 'rename'
});

const modeOptions = [
  { value: 'copy', label: 'copy' },
  { value: 'link', label: 'link' }
];

const conflictOptions = [
  { value: 'rename', label: 'rename' },
  { value: 'overwrite', label: 'overwrite' },
  { value: 'skip', label: 'skip' }
];

async function refresh(): Promise<void> {
  loading.value = true;
  error.value = '';

  try {
    const [path, exchangePolicy] = await Promise.all([
      ecosystemSettingsService.getWorkspacePath(),
      ecosystemSettingsService.getWorkspaceExchangePolicy()
    ]);

    workspacePath.value = path;
    policy.value = exchangePolicy;
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

async function savePath(): Promise<void> {
  saving.value = true;
  error.value = '';

  try {
    await ecosystemSettingsService.setWorkspacePath(workspacePath.value);
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
  }
}

async function savePolicy(): Promise<void> {
  saving.value = true;
  error.value = '';

  try {
    await ecosystemSettingsService.setWorkspaceExchangePolicy(policy.value);
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
  }
}

function handleModeChange(value: string | string[]): void {
  const resolved = Array.isArray(value) ? value[0] : value;
  policy.value = {
    ...policy.value,
    mode: resolved === 'link' ? 'link' : 'copy'
  };
}

function handleConflictChange(value: string | string[]): void {
  const resolved = Array.isArray(value) ? value[0] : value;
  const conflict =
    resolved === 'overwrite' || resolved === 'skip' || resolved === 'rename' ? resolved : 'rename';
  policy.value = {
    ...policy.value,
    conflict
  };
}

onMounted(async () => {
  await refresh();
});
</script>

<template>
  <section class="chips-settings-panel">
    <header class="chips-settings-panel__header">
      <div>
        <h2 class="chips-settings-panel__title">{{ t('i18n.plugin.696001') }}</h2>
        <p class="chips-settings-panel__description">{{ t('i18n.plugin.696002') }}</p>
      </div>
      <ChipsButton variant="secondary" :loading="loading" @click="refresh">{{ t('i18n.plugin.696003') }}</ChipsButton>
    </header>

    <div v-if="error" class="chips-settings-alert chips-settings-alert--error">{{ error }}</div>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.696004') }}</h3>
      <div class="chips-settings-card__toolbar">
        <ChipsInput v-model="workspacePath" :placeholder="t('i18n.plugin.696005')" />
        <ChipsButton variant="primary" :loading="saving" @click="savePath">{{ t('i18n.plugin.696006') }}</ChipsButton>
      </div>
    </div>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.696007') }}</h3>
      <div class="chips-settings-form">
        <label class="chips-settings-form__field">
          <span class="chips-settings-form__label">{{ t('i18n.plugin.696008') }}</span>
          <ChipsSelect :model-value="policy.mode" :options="modeOptions" @update:model-value="handleModeChange" />
        </label>
        <label class="chips-settings-form__field">
          <span class="chips-settings-form__label">{{ t('i18n.plugin.696009') }}</span>
          <ChipsSelect
            :model-value="policy.conflict"
            :options="conflictOptions"
            @update:model-value="handleConflictChange"
          />
        </label>
      </div>
      <div class="chips-settings-card__toolbar">
        <ChipsButton variant="secondary" :loading="saving" @click="savePolicy">{{ t('i18n.plugin.696010') }}</ChipsButton>
      </div>
    </div>
  </section>
</template>
