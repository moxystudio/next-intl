/* global require */
/* eslint-disable import/no-commonjs */
/* istanbul ignore file */

if (!Intl.PluralRules) {
    require('@formatjs/intl-pluralrules/polyfill-locales');
}

if (!Intl.RelativeTimeFormat) {
    require('@formatjs/intl-relativetimeformat/polyfill-locales');
}
