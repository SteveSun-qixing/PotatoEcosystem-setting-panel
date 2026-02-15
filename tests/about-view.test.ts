import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import AboutView from '../src/views/AboutView.vue';
import { ChipsSDK } from '@chips/sdk';

describe('AboutView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render about view correctly', () => {
    const pinia = createPinia();
    const sdk = new ChipsSDK({ autoConnect: false });

    const wrapper = mount(AboutView, {
      global: {
        plugins: [pinia],
        provide: {
          sdk,
        },
      },
    });

    expect(wrapper.find('.chips-view--about').exists()).toBe(true);
  });
});
