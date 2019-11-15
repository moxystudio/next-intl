import * as exports from '.';

it('should export all functionality', () => {
    expect(exports).toHaveProperty('NextIntlContext');
    expect(exports).toHaveProperty('NextIntlProvider');
    expect(exports).toHaveProperty('NextIntlConsumer');
    expect(exports).toHaveProperty('useNextIntl');
    expect(exports).toHaveProperty('NextIntlScript');
    expect(exports).toHaveProperty('getInitialIntlData');
    expect(exports).toHaveProperty('acceptLanguagePolicy');
    expect(exports).toHaveProperty('cookiePolicy');
    expect(exports).toHaveProperty('defaultPolicy');
});
