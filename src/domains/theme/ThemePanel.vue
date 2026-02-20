<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { ChipsButton, ChipsInput, ChipsSelect, ChipsSwitch } from '@chips/components';

import { DEFAULT_THEME_ID } from '@/constants/theme';
import { useI18n } from '@/composables/use-i18n';
import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';
import type { ThemeOption } from '@/types';

const { t } = useI18n();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const themes = ref<ThemeOption[]>([]);
const currentThemeId = ref(DEFAULT_THEME_ID);

const installPath = ref('');
const installOverwrite = ref(false);
const uninstallThemeId = ref('');

const themeOptions = computed(() =>
  themes.value.map((theme) => ({
    value: theme.id,
    label: theme.version ? `${theme.name} (${theme.version})` : theme.name
  }))
);

async function refresh(): Promise<void> {
  loading.value = true;
  error.value = '';

  try {
    const [themeList, activeTheme] = await Promise.all([
      ecosystemSettingsService.listThemeOptions(),
      ecosystemSettingsService.getCurrentThemeId()
    ]);

    themes.value = themeList;
    currentThemeId.value = activeTheme;
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

async function applyTheme(): Promise<void> {
  saving.value = true;
  error.value = '';

  try {
    await ecosystemSettingsService.applyTheme(currentThemeId.value);
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
  }
}

async function installTheme(): Promise<void> {
  if (!installPath.value) {
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    await ecosystemSettingsService.installTheme(installPath.value, installOverwrite.value);
    installPath.value = '';
    installOverwrite.value = false;
    await refresh();
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
  }
}

async function uninstallTheme(): Promise<void> {
  if (!uninstallThemeId.value) {
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    await ecosystemSettingsService.uninstallTheme(uninstallThemeId.value);
    uninstallThemeId.value = '';
    await refresh();
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
  }
}

function handleThemeChange(value: string | string[]): void {
  currentThemeId.value = Array.isArray(value) ? String(value[0] ?? '') : String(value);
}

onMounted(async () => {
  await refresh();
});
</script>

<template>
  <section class="chips-settings-panel">
    <header class="chips-settings-panel__header">
      <div>
        <h2 class="chips-settings-panel__title">{{ t('i18n.plugin.694001') }}</h2>
        <p class="chips-settings-panel__description">{{ t('i18n.plugin.694002') }}</p>
      </div>
      <ChipsButton variant="secondary" :loading="loading" @click="refresh">{{ t('i18n.plugin.694003') }}</ChipsButton>
    </header>

    <div v-if="error" class="chips-settings-alert chips-settings-alert--error">{{ error }}</div>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.694004') }}</h3>
      <div class="chips-settings-card__toolbar">
        <ChipsSelect
          :model-value="currentThemeId"
          :options="themeOptions"
          @update:model-value="handleThemeChange"
        />
        <ChipsButton variant="primary" :loading="saving" @click="applyTheme">{{ t('i18n.plugin.694005') }}</ChipsButton>
      </div>
    </div>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.694006') }}</h3>
      <div class="chips-settings-card__toolbar">
        <ChipsInput v-model="installPath" :placeholder="t('i18n.plugin.694007')" />
        <ChipsSwitch v-model="installOverwrite">{{ t('i18n.plugin.694008') }}</ChipsSwitch>
        <ChipsButton variant="secondary" :loading="saving" @click="installTheme">{{ t('i18n.plugin.694009') }}</ChipsButton>
      </div>
    </div>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.694010') }}</h3>
      <div class="chips-settings-card__toolbar">
        <ChipsInput v-model="uninstallThemeId" :placeholder="t('i18n.plugin.694011')" />
        <ChipsButton variant="danger" :loading="saving" @click="uninstallTheme">{{ t('i18n.plugin.694012') }}</ChipsButton>
      </div>
    </div>
  </section>
</template>
