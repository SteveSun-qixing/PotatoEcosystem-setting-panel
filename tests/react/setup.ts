import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

Object.assign(window, {
  chips: {
    invoke: vi.fn(async () => ({})),
    on: vi.fn(() => () => undefined),
    once: vi.fn(() => () => undefined),
    emit: vi.fn()
  }
});
