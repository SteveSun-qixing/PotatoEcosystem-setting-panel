import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';

import App from '@/App.vue';

function createSdkStub() {
  return {
    t: (key: string) => key
  };
}

describe('App shell', () => {
  it('renders sidebar menu', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
        provide: {
          sdk: createSdkStub()
        },
        stubs: {
          OverviewPanel: {
            template: '<div>overview</div>'
          },
          LanguagePanel: {
            template: '<div>language</div>'
          },
          ThemePanel: {
            template: '<div>theme</div>'
          },
          PluginPanel: {
            template: '<div>plugins</div>'
          },
          BundlePanel: {
            template: '<div>bundle</div>'
          },
          FileSystemPanel: {
            template: '<div>filesystem</div>'
          }
        }
      }
    });

    expect(wrapper.text()).toContain('i18n.plugin.699007');
    expect(wrapper.text()).toContain('i18n.plugin.699012');
    expect(wrapper.text()).toContain('i18n.plugin.699014');
    expect(wrapper.text()).toContain('i18n.plugin.699016');
    expect(wrapper.text()).toContain('i18n.plugin.699018');
  });
});
