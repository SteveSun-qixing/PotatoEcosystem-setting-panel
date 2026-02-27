<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { ChipsButton, ChipsDialog, ChipsInput, ChipsSwitch } from '@chips/components';

import { useI18n } from '@/composables/use-i18n';
import { usePluginsStore } from '@/stores/plugins';
import type { PluginRecord } from '@/types';

const { t } = useI18n();
const pluginsStore = usePluginsStore();

const installSourcePath = ref('');
const forceInstall = ref(false);
const uninstallTarget = ref<PluginRecord | null>(null);
const uninstallDialogOpen = ref(false);

const hasPlugins = computed(() => pluginsStore.items.length > 0);

function isBusy(pluginId: string): boolean {
  return pluginsStore.busyPluginIds.includes(pluginId);
}

async function handleRefresh(): Promise<void> {
  await Promise.all([pluginsStore.refresh(), pluginsStore.refreshUpdates()]);
}

async function handleInstall(): Promise<void> {
  if (!installSourcePath.value) {
    return;
  }

  await pluginsStore.install(installSourcePath.value, forceInstall.value);
  installSourcePath.value = '';
  forceInstall.value = false;
}

async function handleToggle(plugin: PluginRecord): Promise<void> {
  await pluginsStore.setEnabled(plugin, !plugin.enabled);
}

function openUninstallDialog(plugin: PluginRecord): void {
  uninstallTarget.value = plugin;
  uninstallDialogOpen.value = true;
}

function closeUninstallDialog(): void {
  uninstallTarget.value = null;
  uninstallDialogOpen.value = false;
}

async function confirmUninstall(): Promise<void> {
  if (!uninstallTarget.value) {
    return;
  }

  await pluginsStore.uninstall(uninstallTarget.value);
  closeUninstallDialog();
}

async function handleApplyUpdates(): Promise<void> {
  await pluginsStore.applyUpdates([]);
  await pluginsStore.refresh();
}

onMounted(async () => {
  if (!hasPlugins.value) {
    await pluginsStore.refresh();
  }

  await pluginsStore.refreshUpdates();
});
</script>

<template>
  <section class="chips-settings-panel">
    <header class="chips-settings-panel__header">
      <div>
        <h2 class="chips-settings-panel__title">{{ t('i18n.plugin.691001') }}</h2>
        <p class="chips-settings-panel__description">{{ t('i18n.plugin.691002') }}</p>
      </div>
      <ChipsButton variant="secondary" :loading="pluginsStore.loading" @click="handleRefresh">
        {{ t('i18n.plugin.691003') }}
      </ChipsButton>
    </header>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.691004') }}</h3>
      <div class="chips-settings-card__toolbar">
        <ChipsInput
          v-model="installSourcePath"
          :placeholder="t('i18n.plugin.691005')"
        />
        <div class="chips-settings-inline-field">
          <ChipsSwitch v-model="forceInstall">
            {{ t('i18n.plugin.691006') }}
          </ChipsSwitch>
        </div>
        <ChipsButton
          variant="primary"
          :loading="pluginsStore.installPending"
          :disabled="!installSourcePath"
          @click="handleInstall"
        >
          {{ t('i18n.plugin.691007') }}
        </ChipsButton>
      </div>
    </div>

    <div class="chips-settings-card">
      <h3 class="chips-settings-card__title">{{ t('i18n.plugin.691020') }}</h3>
      <div class="chips-settings-card__toolbar">
        <ChipsButton variant="secondary" @click="pluginsStore.refreshUpdates">{{ t('i18n.plugin.691021') }}</ChipsButton>
        <ChipsButton variant="secondary" :loading="pluginsStore.updatePending" @click="handleApplyUpdates">
          {{ t('i18n.plugin.691022') }}
        </ChipsButton>
      </div>
      <div v-if="pluginsStore.updates.length > 0" class="chips-settings-log">
        <pre>{{ JSON.stringify(pluginsStore.updates, null, 2) }}</pre>
      </div>
      <p v-else class="chips-settings-card__meta">{{ t('i18n.plugin.691023') }}</p>
    </div>

    <div v-if="pluginsStore.error" class="chips-settings-alert chips-settings-alert--error">
      {{ t('i18n.plugin.691008', { message: pluginsStore.error }) }}
    </div>

    <div class="chips-settings-card chips-settings-card--table">
      <table class="chips-settings-table">
        <thead>
          <tr>
            <th>{{ t('i18n.plugin.691009') }}</th>
            <th>{{ t('i18n.plugin.691010') }}</th>
            <th>{{ t('i18n.plugin.691011') }}</th>
            <th>{{ t('i18n.plugin.691012') }}</th>
            <th>{{ t('i18n.plugin.691013') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plugin in pluginsStore.items" :key="plugin.id">
            <td>
              <p class="chips-settings-table__name">{{ plugin.name }}</p>
              <p class="chips-settings-table__subtext">{{ plugin.id }}</p>
            </td>
            <td>{{ plugin.type }}</td>
            <td>{{ plugin.version }}</td>
            <td>{{ plugin.publisher }}</td>
            <td class="chips-settings-table__actions">
              <ChipsSwitch
                :model-value="plugin.enabled"
                :disabled="isBusy(plugin.id)"
                @update:model-value="() => handleToggle(plugin)"
              >
                {{ plugin.enabled ? t('i18n.plugin.691014') : t('i18n.plugin.691015') }}
              </ChipsSwitch>
              <ChipsButton
                size="sm"
                variant="danger"
                :loading="isBusy(plugin.id)"
                @click="openUninstallDialog(plugin)"
              >
                {{ t('i18n.plugin.691016') }}
              </ChipsButton>
            </td>
          </tr>
          <tr v-if="!pluginsStore.loading && pluginsStore.items.length === 0">
            <td colspan="5" class="chips-settings-table__empty">{{ t('i18n.plugin.691017') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ChipsDialog
      v-model="uninstallDialogOpen"
      type="confirm"
      :title="t('i18n.plugin.691018')"
    >
      <p>{{ t('i18n.plugin.691019', { plugin: uninstallTarget?.name ?? '' }) }}</p>
      <template #cancel-text>{{ t('i18n.core.000002') }}</template>
      <template #confirm-text>{{ t('i18n.core.000001') }}</template>
      <template #footer>
        <div class="chips-settings-dialog-actions">
          <ChipsButton variant="secondary" @click="closeUninstallDialog">
            {{ t('i18n.core.000002') }}
          </ChipsButton>
          <ChipsButton variant="danger" @click="confirmUninstall">
            {{ t('i18n.plugin.691016') }}
          </ChipsButton>
        </div>
      </template>
    </ChipsDialog>
  </section>
</template>
