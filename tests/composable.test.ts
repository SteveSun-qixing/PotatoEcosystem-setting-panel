import { describe, it, expect } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';

import { useI18n } from '@/composables/use-i18n';

describe('useI18n', () => {
  it('returns translated text with injected sdk', () => {
    const TestComponent = defineComponent({
      setup() {
        const { t } = useI18n();
        return { text: t('demo.key') };
      },
      template: '<div>{{ text }}</div>'
    });

    const wrapper = mount(TestComponent, {
      global: {
        provide: {
          sdk: {
            t: (key: string) => `translated:${key}`
          }
        }
      }
    });

    expect(wrapper.text()).toBe('translated:demo.key');
  });

  it('throws when sdk is missing', () => {
    const TestComponent = defineComponent({
      setup() {
        useI18n();
        return {};
      },
      template: '<div />'
    });

    expect(() => mount(TestComponent)).toThrow('SDK not provided');
  });
});
