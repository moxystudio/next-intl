const loadPolyfill = async () => {
    await import(/* webpackChunkName: "intl-polyfill" */ '@formatjs/intl-pluralrules/polyfill-locales');
    await import(/* webpackChunkName: "intl-polyfill" */ '@formatjs/intl-relativetimeformat/polyfill-locales');
};

export default loadPolyfill;
