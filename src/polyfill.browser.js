/* istanbul ignore file */

// The function bellow is not used but it forces webpack to create the polyfill chunk
// since it's statically analyzed.
// This chunk will be loaded by NextIntlScript if the browser needs to be polyfilled.

const loadPolyfill = async () => {
    await import(/* webpackChunkName: "formatjs-intl-locale-polyfill" */ '@formatjs/intl-locale/polyfill');
    await import(/* webpackChunkName: "formatjs-intl-pluralrules-polyfill" */ '@formatjs/intl-pluralrules/polyfill-locales');
    await import(/* webpackChunkName: "formatjs-intl-relativetimeformat-polyfill" */ '@formatjs/intl-relativetimeformat/polyfill-locales');
    await import(/* webpackChunkName: "formatjs-intl-displaynames-polyfill" */ '@formatjs/intl-displaynames/polyfill-locales');
};

export default loadPolyfill;
