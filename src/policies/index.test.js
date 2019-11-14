import * as policies from '.';

it('should export all policies', () => {
    expect(policies).toHaveProperty('acceptLanguagePolicy');
    expect(policies).toHaveProperty('cookiePolicy');
    expect(policies).toHaveProperty('defaultPolicy');
});
