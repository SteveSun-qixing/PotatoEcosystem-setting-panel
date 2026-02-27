<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { ChipsButton, ChipsInput, ChipsSelect, ChipsTextarea } from '@chips/components';

import { useI18n } from '@/composables/use-i18n';
import { ecosystemSettingsService } from '@/services/ecosystem-settings-service';

const { setLocale, t } = useI18n();
const loading = ref(false);
const saving = ref(false);
const dictionaryUpdating = ref(false);
const error = ref('');

const locales = ref<string[]>([]);
const currentLocale = ref('zh-CN');
const dictionaryPluginId = ref('chips.settings.manual');
const dictionaryEntries = ref('');
const lastDictionaryResult = ref('');

const localeOptions = computed(() => locales.value.map((locale) => ({ value: locale, label: locale })));

async function refresh(): Promise<void> {
  loading.value = true;
  error.value = '';

  try {
    const [availableLocales, activeLocale] = await Promise.all([
      ecosystemSettingsService.listLocales(),
      ecosystemSettingsService.getCurrentLocale()
    ]);

    locales.value = availableLocales;
    currentLocale.value = activeLocale;
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

async function saveLocale(): Promise<void> {
  saving.value = true;
  error.value = '';

  try {
    await ecosystemSettingsService.setCurrentLocale(currentLocale.value);
    setLocale(currentLocale.value);
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
  }
}

function handleLocaleChange(value: string | string[]): void {
  currentLocale.value = Array.isArray(value) ? String(value[0] ?? '') : String(value);
}

async function updateDictionary(): Promise<void> {
  dictionaryUpdating.value = true;
  error.value = '';

  try {
    const entries = dictionaryEntries.value.trim().length > 0
      ? (JSON.parse(dictionaryEntries.value) as Record<string, Record<string, string>>)
      : undefined;

    const result = await ecosystemSettingsService.updateDictionary(entries, dictionaryPluginId.value);
    lastDictionaryResult.value = `updated=${result.updated}, registered=${result.registered}`;
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    dictionaryUpdating.value = false;
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
        <h2 class="chips-settings-panel__title">{{ t('i18n.plugin.693001') }}</h2>
        <p class="chips-settings-panel__description">{{ t('i18n.plugin.693002') }}</p>
      </div>
      <ChipsButton variant="secondary" :loading="loading" @click="refresh">{{ t('i18n.plugin.693003') }}</ChipsButton>
    </header>

    <div v-if="error" class="chips-settings-alert chips-settings-alert--error">{{ error }}</div>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.693004') }}</h3>
      <div class="chips-settings-card__toolbar">
        <ChipsSelect
          :model-value="currentLocale"
          :options="localeOptions"
          @update:model-value="handleLocaleChange"
        />
        <ChipsButton variant="primary" :loading="saving" @click="saveLocale">{{ t('i18n.plugin.693005') }}</ChipsButton>
      </div>
    </div>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.693006') }}</h3>
      <div class="chips-settings-form">
        <label class="chips-settings-form__field">
          <span class="chips-settings-form__label">{{ t('i18n.plugin.693007') }}</span>
          <ChipsInput v-model="dictionaryPluginId" :placeholder="t('i18n.plugin.693008')" />
        </label>
        <label class="chips-settings-form__field">
          <span class="chips-settings-form__label">{{ t('i18n.plugin.693009') }}</span>
          <ChipsTextarea
            v-model="dictionaryEntries"
            :rows="6"
            :placeholder="t('i18n.plugin.693010')"
          />
        </label>
      </div>
      <div class="chips-settings-card__toolbar">
        <ChipsButton variant="secondary" :loading="dictionaryUpdating" @click="updateDictionary">
          {{ t('i18n.plugin.693011') }}
        </ChipsButton>
      </div>
      <p v-if="lastDictionaryResult" class="chips-settings-card__meta">
        {{ t('i18n.plugin.693012', { result: lastDictionaryResult }) }}
      </p>
    </div>
  </section>
</template>
