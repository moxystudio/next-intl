import * as exports from '.';

jest.mock('canvas', () => ({}));

it('should export all functionality', () => {
    expect(exports).toHaveProperty('NextIntlScript');
    expect(exports).toHaveProperty('NextIntlProvider');
    expect(exports).toHaveProperty('NextIntlConsumer');
    expect(exports).toHaveProperty('useNextIntl');
    expect(exports).toHaveProperty('withNextIntl');
    expect(exports).toHaveProperty('withNextIntlSetup');
    expect(exports).toHaveProperty('acceptLanguagePolicy');
    expect(exports).toHaveProperty('cookiePolicy');
    expect(exports).toHaveProperty('defaultPolicy');
});
