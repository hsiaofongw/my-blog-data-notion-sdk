import { IdIssuerMiddleware } from './id-issuer.middleware';

describe('IdIssuerMiddleware', () => {
  it('should be defined', () => {
    expect(new IdIssuerMiddleware()).toBeDefined();
  });
});
