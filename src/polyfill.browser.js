// The function below is not used but it forces webpack to create the polyfill chunk
// since it's statically analyzed
// This chunk will be loaded by NextIntlScript if the browser needs to be polyfilled

const loadPolyfill = async () => {
    await import(/* webpackChunkName: "intl-polyfill" */ '@formatjs/intl-pluralrules/polyfill-locales');
    await import(/* webpackChunkName: "intl-polyfill" */ '@formatjs/intl-relativetimeformat/polyfill-locales');
};

export default loadPolyfill;
