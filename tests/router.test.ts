import { describe, it, expect } from 'vitest';
import router from '../src/router';

describe('Router', () => {
  it('should have home route', () => {
    const homeRoute = router.getRoutes().find((route) => route.name === 'home');
    expect(homeRoute).toBeDefined();
    expect(homeRoute?.path).toBe('/');
  });

  it('should have about route', () => {
    const aboutRoute = router.getRoutes().find((route) => route.name === 'about');
    expect(aboutRoute).toBeDefined();
    expect(aboutRoute?.path).toBe('/about');
  });
});
