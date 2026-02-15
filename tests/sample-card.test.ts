import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import SampleCard from '../src/components/SampleCard.vue';
import { ChipsSDK } from '@chips/sdk';

describe('SampleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sample card with correct CSS classes', () => {
    const pinia = createPinia();
    const sdk = new ChipsSDK({ autoConnect: false });

    const wrapper = mount(SampleCard, {
      global: {
        plugins: [pinia],
        provide: {
          sdk,
        },
      },
    });

    expect(wrapper.find('.chips-card-wrapper').exists()).toBe(true);
    expect(wrapper.find('.chips-card-wrapper__header').exists()).toBe(true);
    expect(wrapper.find('.chips-card-wrapper__content').exists()).toBe(true);
    expect(wrapper.find('.chips-button--primary').exists()).toBe(true);
    expect(wrapper.find('.chips-button--ghost').exists()).toBe(true);
  });
});
