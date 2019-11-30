/* global __NEXT_INTL_POLYFILL_URL__:false */
import React from 'react';

// The script bellow was minified using terser: https://xem.github.io/terser-online/
// You may find the original script below in case you need to modify it:
/*
(function () {
if (!Intl.PluralRules || !Intl.RelativeTimeFormat) {
    var currentScript = document.currentScript;
    var polyfillScript = document.createElement('script');

    polyfillScript.src = ${JSON.stringify(polyfillChunkUrl)};

    currentScript.parentNode.insertBefore(polyfillScript, currentScript.nextSibling);
})();
*/
const buildScript = (polyfillChunkUrl) => `(function(){if(!Intl.PluralRules||!Intl.RelativeTimeFormat){var e=document.currentScript,t=document.createElement("script");t.src=${JSON.stringify(polyfillChunkUrl)},e.parentNode.insertBefore(t,e.nextSibling)}})();`;

const NextIntlScript = () => {
    if (typeof __NEXT_INTL_POLYFILL_URL__ === 'undefined') {
        throw new Error('Could not locale the polyfill URL, did you forget to enable the plugin in the next.config.js file?');
    }

    const script = buildScript(__NEXT_INTL_POLYFILL_URL__);

    return <script dangerouslySetInnerHTML={ { __html: script } } />;
};

export default NextIntlScript;
