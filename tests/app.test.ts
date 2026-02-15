import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import App from '../src/App.vue';
import { ChipsSDK } from '@chips/sdk';

describe('App Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create app instance successfully', () => {
    const pinia = createPinia();
    const sdk = new ChipsSDK({ autoConnect: false });

    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
        provide: {
          sdk,
        },
        stubs: {
          RouterLink: true,
          RouterView: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should throw error when SDK is not provided', () => {
    const pinia = createPinia();

    expect(() => {
      mount(App, {
        global: {
          plugins: [pinia],
          stubs: {
            RouterLink: true,
            RouterView: true,
          },
        },
      });
    }).toThrow('SDK not provided');
  });
});
