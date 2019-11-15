import * as exports from '.';

it('should export all react related functionality', () => {
    expect(exports).toHaveProperty('NextIntlContext');
    expect(exports).toHaveProperty('NextIntlProvider');
    expect(exports).toHaveProperty('NextIntlConsumer');
    expect(exports).toHaveProperty('useNextIntl');
    expect(exports).toHaveProperty('NextIntlScript');
});
