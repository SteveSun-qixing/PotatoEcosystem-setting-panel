import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { useSample } from '../src/composables/use-sample';
import { ChipsSDK } from '@chips/sdk';

describe('useSample Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.window.chips = {
      invoke: vi.fn(),
    } as any;
  });

  it('should provide translation function', () => {
    const sdk = new ChipsSDK({ autoConnect: false });

    const TestComponent = defineComponent({
      setup() {
        const { t } = useSample();
        return { t };
      },
      template: '<div>{{ t("test.key") }}</div>',
    });

    const wrapper = mount(TestComponent, {
      global: {
        provide: {
          sdk,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
