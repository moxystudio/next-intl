import loadPolyfill from './polyfill-chunk';

let calls = 0;

jest.mock('@formatjs/intl-pluralrules/polyfill-locales', () => {
    calls += 1;

    return () => {};
});

jest.mock('@formatjs/intl-relativetimeformat/polyfill-locales', () => {
    calls += 1;

    return () => {};
});

it('should load the polyfill chunk', async () => {
    await loadPolyfill();

    expect(calls).toBe(2);
});
