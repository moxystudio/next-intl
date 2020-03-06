/* eslint-disable prefer-import/prefer-import-over-require */

if (!Intl.PluralRules) {
    require('@formatjs/intl-pluralrules/polyfill-locales');
}

if (!Intl.RelativeTimeFormat) {
    require('@formatjs/intl-relativetimeformat/polyfill-locales');
}
