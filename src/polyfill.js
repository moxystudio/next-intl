/* eslint-disable prefer-import/prefer-import-over-require */

const jsdom = require('jsdom');

global.DOMParser = new jsdom.JSDOM().window.DOMParser;

if (!Intl.PluralRules) {
    require('@formatjs/intl-pluralrules/polyfill-locales');
}

if (!Intl.RelativeTimeFormat) {
    require('@formatjs/intl-relativetimeformat/polyfill-locales');
}
