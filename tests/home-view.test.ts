import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import HomeView from '../src/views/HomeView.vue';
import { ChipsSDK } from '@chips/sdk';

describe('HomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render home view correctly', () => {
    const pinia = createPinia();
    const sdk = new ChipsSDK({ autoConnect: false });

    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
        provide: {
          sdk,
        },
      },
    });

    expect(wrapper.find('.chips-view--home').exists()).toBe(true);
  });
});
