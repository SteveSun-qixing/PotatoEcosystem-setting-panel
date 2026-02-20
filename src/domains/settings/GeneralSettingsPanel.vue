<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { ChipsButton, ChipsInput, ChipsSelect, ChipsSwitch } from '@chips/components';

import { useI18n } from '@/composables/use-i18n';
import { useGeneralSettingsStore } from '@/stores/general-settings';

const { t } = useI18n();
const generalSettingsStore = useGeneralSettingsStore();

const localeOptions = computed(() => [
  { value: 'zh-CN', label: t('i18n.plugin.692004') },
  { value: 'en-US', label: t('i18n.plugin.692005') },
  { value: 'ja-JP', label: t('i18n.plugin.692006') }
]);

const themeOptions = computed(() => {
  if (generalSettingsStore.themes.length === 0) {
    return [{ value: 'default', label: t('i18n.plugin.692007') }];
  }

  return generalSettingsStore.themes.map((theme) => ({
    value: theme.id,
    label: theme.name
  }));
});

async function handleSave(): Promise<void> {
  await generalSettingsStore.save();
}

onMounted(async () => {
  await generalSettingsStore.load();
});
</script>

<template>
  <section class="chips-settings-panel">
    <header class="chips-settings-panel__header">
      <div>
        <h2 class="chips-settings-panel__title">{{ t('i18n.plugin.692001') }}</h2>
        <p class="chips-settings-panel__description">{{ t('i18n.plugin.692002') }}</p>
      </div>
      <ChipsButton variant="primary" :loading="generalSettingsStore.saving" @click="handleSave">
        {{ t('i18n.plugin.692003') }}
      </ChipsButton>
    </header>

    <div v-if="generalSettingsStore.error" class="chips-settings-alert chips-settings-alert--error">
      {{ t('i18n.plugin.692014', { message: generalSettingsStore.error }) }}
    </div>

    <div class="chips-settings-form">
      <label class="chips-settings-form__field">
        <span class="chips-settings-form__label">{{ t('i18n.plugin.692008') }}</span>
        <ChipsSelect
          :model-value="generalSettingsStore.form.locale"
          :options="localeOptions"
          @update:model-value="(value) => generalSettingsStore.updateForm({ locale: String(value) })"
        />
      </label>

      <label class="chips-settings-form__field">
        <span class="chips-settings-form__label">{{ t('i18n.plugin.692009') }}</span>
        <ChipsSelect
          :model-value="generalSettingsStore.form.themeId"
          :options="themeOptions"
          @update:model-value="(value) => generalSettingsStore.updateForm({ themeId: String(value) })"
        />
      </label>

      <label class="chips-settings-form__field">
        <span class="chips-settings-form__label">{{ t('i18n.plugin.692010') }}</span>
        <ChipsInput
          :model-value="generalSettingsStore.form.workspacePath"
          :placeholder="t('i18n.plugin.692011')"
          @update:model-value="(value) => generalSettingsStore.updateForm({ workspacePath: value })"
        />
      </label>

      <label class="chips-settings-form__field chips-settings-form__field--switch">
        <span class="chips-settings-form__label">{{ t('i18n.plugin.692012') }}</span>
        <ChipsSwitch
          :model-value="generalSettingsStore.form.autoStart"
          @update:model-value="(value) => generalSettingsStore.updateForm({ autoStart: value })"
        >
          {{ t('i18n.plugin.692012') }}
        </ChipsSwitch>
      </label>

      <label class="chips-settings-form__field chips-settings-form__field--switch">
        <span class="chips-settings-form__label">{{ t('i18n.plugin.692013') }}</span>
        <ChipsSwitch
          :model-value="generalSettingsStore.form.allowExternalLinks"
          @update:model-value="(value) => generalSettingsStore.updateForm({ allowExternalLinks: value })"
        >
          {{ t('i18n.plugin.692013') }}
        </ChipsSwitch>
      </label>
    </div>
  </section>
</template>
