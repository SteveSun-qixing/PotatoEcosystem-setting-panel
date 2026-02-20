<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { ChipsButton, ChipsInput, ChipsSelect } from '@chips/components';

import { useI18n } from '@/composables/use-i18n';
import { useOverviewStore } from '@/stores/overview';

const { t } = useI18n();
const overviewStore = useOverviewStore();
const restartReason = ref('');
const logLevel = ref<'debug' | 'info' | 'warn' | 'error'>('error');
const logQuery = ref('');

const snapshot = computed(() => overviewStore.snapshot);
const health = computed(() => overviewStore.health);
const logs = computed(() => overviewStore.logs?.logs ?? []);
const report = computed(() => overviewStore.report);

const lastUpdatedText = computed(() => {
  if (!overviewStore.lastUpdatedAt) {
    return t('i18n.plugin.690017');
  }

  return new Date(overviewStore.lastUpdatedAt).toLocaleString();
});

const logLevelOptions = computed(() => [
  { value: 'debug', label: 'debug' },
  { value: 'info', label: 'info' },
  { value: 'warn', label: 'warn' },
  { value: 'error', label: 'error' }
]);

async function handleRefresh(): Promise<void> {
  await overviewStore.refresh();
}

async function handleStart(): Promise<void> {
  await overviewStore.start();
  await overviewStore.refresh();
}

async function handleStop(): Promise<void> {
  await overviewStore.stop();
  await overviewStore.refresh();
}

async function handleRestart(): Promise<void> {
  await overviewStore.restart(restartReason.value);
  await overviewStore.refresh();
}

async function handleQueryLogs(): Promise<void> {
  await overviewStore.refreshLogs(logLevel.value, logQuery.value);
}

async function handleExportReport(): Promise<void> {
  await overviewStore.exportReport();
}

function handleLogLevelChange(value: string | string[]): void {
  const resolved = Array.isArray(value) ? value[0] : value;
  if (resolved === 'debug' || resolved === 'info' || resolved === 'warn' || resolved === 'error') {
    logLevel.value = resolved;
  }
}

onMounted(async () => {
  if (!snapshot.value) {
    await overviewStore.refresh();
  }

  await overviewStore.refreshLogs(logLevel.value, logQuery.value);
});
</script>

<template>
  <section class="chips-settings-panel">
    <header class="chips-settings-panel__header">
      <div>
        <h2 class="chips-settings-panel__title">{{ t('i18n.plugin.690001') }}</h2>
        <p class="chips-settings-panel__description">{{ t('i18n.plugin.690002') }}</p>
      </div>
      <div class="chips-settings-panel__actions">
        <ChipsButton variant="secondary" :loading="overviewStore.loading" @click="handleRefresh">
          {{ t('i18n.plugin.690003') }}
        </ChipsButton>
      </div>
    </header>

    <div v-if="overviewStore.error" class="chips-settings-alert chips-settings-alert--error">
      {{ t('i18n.plugin.690004', { message: overviewStore.error }) }}
    </div>

    <div class="chips-settings-grid">
      <article class="chips-settings-card">
        <h3 class="chips-settings-card__title">{{ t('i18n.plugin.690005') }}</h3>
        <dl class="chips-settings-card__list">
          <div class="chips-settings-card__item">
            <dt>{{ t('i18n.plugin.690006') }}</dt>
            <dd>{{ snapshot?.hostVersion ?? '-' }}</dd>
          </div>
          <div class="chips-settings-card__item">
            <dt>{{ t('i18n.plugin.690007') }}</dt>
            <dd>{{ snapshot?.hostPid ?? '-' }}</dd>
          </div>
          <div class="chips-settings-card__item">
            <dt>{{ t('i18n.plugin.690008') }}</dt>
            <dd>{{ snapshot?.platform ?? '-' }}</dd>
          </div>
          <div class="chips-settings-card__item">
            <dt>{{ t('i18n.plugin.690009') }}</dt>
            <dd>{{ snapshot?.nodeVersion ?? '-' }}</dd>
          </div>
        </dl>
      </article>

      <article class="chips-settings-card">
        <h3 class="chips-settings-card__title">{{ t('i18n.plugin.690010') }}</h3>
        <dl class="chips-settings-card__list">
          <div class="chips-settings-card__item">
            <dt>{{ t('i18n.plugin.690011') }}</dt>
            <dd>{{ snapshot?.routeCount ?? '-' }}</dd>
          </div>
          <div class="chips-settings-card__item">
            <dt>{{ t('i18n.plugin.690012') }}</dt>
            <dd>{{ snapshot?.namespaceCount ?? '-' }}</dd>
          </div>
          <div class="chips-settings-card__item">
            <dt>{{ t('i18n.plugin.690013') }}</dt>
            <dd>{{ snapshot?.p95LatencyMs ?? '-' }}</dd>
          </div>
          <div class="chips-settings-card__item">
            <dt>{{ t('i18n.plugin.690014') }}</dt>
            <dd>{{ snapshot?.errorCount ?? '-' }}</dd>
          </div>
        </dl>
      </article>

      <article class="chips-settings-card chips-settings-card--full">
        <h3 class="chips-settings-card__title">{{ t('i18n.plugin.690015') }}</h3>
        <p class="chips-settings-card__meta">
          {{ t('i18n.plugin.690016', { time: lastUpdatedText }) }}
        </p>
        <p class="chips-settings-card__meta">
          {{
            snapshot?.controlPlaneOnline
              ? t('i18n.plugin.690018')
              : t('i18n.plugin.690019')
          }}
        </p>
        <p class="chips-settings-card__meta">
          {{ t('i18n.plugin.690020', { uptime: String(snapshot?.uptimeMs ?? 0) }) }}
        </p>

        <div class="chips-settings-card__toolbar">
          <ChipsInput
            v-model="restartReason"
            :placeholder="t('i18n.plugin.690021')"
          />
          <ChipsButton
            variant="secondary"
            :loading="overviewStore.changingState"
            @click="handleStart"
          >
            {{ t('i18n.plugin.690023') }}
          </ChipsButton>
          <ChipsButton
            variant="secondary"
            :loading="overviewStore.changingState"
            @click="handleStop"
          >
            {{ t('i18n.plugin.690024') }}
          </ChipsButton>
          <ChipsButton
            variant="danger"
            :loading="overviewStore.restarting"
            @click="handleRestart"
          >
            {{ t('i18n.plugin.690022') }}
          </ChipsButton>
        </div>
      </article>

      <article class="chips-settings-card chips-settings-card--full">
        <h3 class="chips-settings-card__title">{{ t('i18n.plugin.690025') }}</h3>
        <ul v-if="health && health.checks.length > 0" class="chips-settings-list">
          <li v-for="item in health.checks" :key="item.id" class="chips-settings-list__item">
            <span>{{ item.id }}</span>
            <span :class="item.healthy ? 'chips-settings-status chips-settings-status--ok' : 'chips-settings-status chips-settings-status--error'">
              {{ item.healthy ? t('i18n.plugin.690026') : t('i18n.plugin.690027') }}
            </span>
            <span class="chips-settings-list__message">{{ item.message }}</span>
          </li>
        </ul>
        <p v-else class="chips-settings-card__meta">{{ t('i18n.plugin.690028') }}</p>
      </article>

      <article class="chips-settings-card chips-settings-card--full">
        <h3 class="chips-settings-card__title">{{ t('i18n.plugin.690029') }}</h3>
        <div class="chips-settings-card__toolbar">
          <ChipsSelect
            :model-value="logLevel"
            :options="logLevelOptions"
            @update:model-value="handleLogLevelChange"
          />
          <ChipsInput v-model="logQuery" :placeholder="t('i18n.plugin.690030')" />
          <ChipsButton variant="secondary" @click="handleQueryLogs">{{ t('i18n.plugin.690031') }}</ChipsButton>
          <ChipsButton variant="secondary" @click="handleExportReport">{{ t('i18n.plugin.690032') }}</ChipsButton>
        </div>

        <div v-if="logs.length > 0" class="chips-settings-log">
          <pre>{{ JSON.stringify(logs, null, 2) }}</pre>
        </div>
        <p v-else class="chips-settings-card__meta">{{ t('i18n.plugin.690033') }}</p>

        <details v-if="report" class="chips-settings-details">
          <summary>{{ t('i18n.plugin.690034') }}</summary>
          <pre>{{ JSON.stringify(report, null, 2) }}</pre>
        </details>
      </article>
    </div>
  </section>
</template>
