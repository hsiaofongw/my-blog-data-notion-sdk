import { StaleWhileRevalidateInterceptor } from './stale-while-revalidate.interceptor';

describe('StaleWhileRevalidateInterceptor', () => {
  it('should be defined', () => {
    expect(new StaleWhileRevalidateInterceptor()).toBeDefined();
  });
});
