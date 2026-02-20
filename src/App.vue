<script setup lang="ts">
import { computed, ref } from 'vue';

import { ChipsButton } from '@chips/components';

import { useI18n } from '@/composables/use-i18n';
import BundlePanel from '@/domains/bundle/BundlePanel.vue';
import FileSystemPanel from '@/domains/filesystem/FileSystemPanel.vue';
import LanguagePanel from '@/domains/i18n/LanguagePanel.vue';
import OverviewPanel from '@/domains/overview/OverviewPanel.vue';
import PluginPanel from '@/domains/plugin/PluginPanel.vue';
import ThemePanel from '@/domains/theme/ThemePanel.vue';

const { t } = useI18n();

type SectionId =
  | 'runtime'
  | 'language'
  | 'theme'
  | 'plugins'
  | 'bundle'
  | 'filesystem';

const activeSection = ref<SectionId>('runtime');

const menuItems = computed<Array<{ id: SectionId; label: string; desc: string }>>(() => [
  {
    id: 'runtime',
    label: t('i18n.plugin.699012'),
    desc: t('i18n.plugin.699013')
  },
  {
    id: 'language',
    label: t('i18n.plugin.699014'),
    desc: t('i18n.plugin.699015')
  },
  {
    id: 'theme',
    label: t('i18n.plugin.699016'),
    desc: t('i18n.plugin.699017')
  },
  {
    id: 'plugins',
    label: t('i18n.plugin.699018'),
    desc: t('i18n.plugin.699019')
  },
  {
    id: 'bundle',
    label: t('i18n.plugin.699020'),
    desc: t('i18n.plugin.699021')
  },
  {
    id: 'filesystem',
    label: t('i18n.plugin.699022'),
    desc: t('i18n.plugin.699023')
  }
]);
</script>

<template>
  <div class="chips-settings-shell">
    <aside class="chips-settings-shell__sidebar">
      <header class="chips-settings-shell__header">
        <h1 class="chips-settings-shell__title">{{ t('i18n.plugin.699007') }}</h1>
        <p class="chips-settings-shell__subtitle">{{ t('i18n.plugin.699008') }}</p>
      </header>

      <nav class="chips-settings-shell__menu" :aria-label="t('i18n.plugin.699009')">
        <ChipsButton
          v-for="item in menuItems"
          :key="item.id"
          variant="ghost"
          :class="[
            'chips-settings-shell__menu-item',
            activeSection === item.id ? 'chips-settings-shell__menu-item--active' : ''
          ].join(' ').trim()"
          @click="activeSection = item.id"
        >
          <span class="chips-settings-shell__menu-label">{{ item.label }}</span>
          <span class="chips-settings-shell__menu-desc">{{ item.desc }}</span>
        </ChipsButton>
      </nav>
    </aside>

    <main class="chips-settings-shell__main">
      <OverviewPanel v-if="activeSection === 'runtime'" />
      <LanguagePanel v-else-if="activeSection === 'language'" />
      <ThemePanel v-else-if="activeSection === 'theme'" />
      <PluginPanel v-else-if="activeSection === 'plugins'" />
      <BundlePanel v-else-if="activeSection === 'bundle'" />
      <FileSystemPanel v-else />
    </main>
  </div>
</template>
