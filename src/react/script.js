import fs from 'fs';
import React from 'react';

// The script bellow was minified using terser: https://xem.github.io/terser-online/
// You may find the original script below in case you need to modify it:
/*
(function () {
if (!Intl.PluralRules || !Intl.RelativeTimeFormat) {
    var currentScript = document.currentScript;
    var polyfillScript = document.createElement('script');

    polyfillScript.src = '${polyfillChunkPublicPath}';

    currentScript.parentNode.insertBefore(polyfillScript, currentScript.nextSibling);
})();
*/
const buildScript = (polyfillChunkPublicPath) => `(function(){if(!Intl.PluralRules||!Intl.RelativeTimeFormat){var e=document.currentScript,t=document.createElement("script");t.src="${polyfillChunkPublicPath}",e.parentNode.insertBefore(t,e.nextSibling)}})();`;

const getPolyfillChunkPublicPath = () => {
    const manifest = JSON.parse(fs.readFileSync('.next/react-loadable-manifest.json'));
    const publicPath = manifest?.['@formatjs/intl-pluralrules/polyfill-locales']?.[0]?.publicPath;

    if (!publicPath) {
        throw new Error('Could not find intl-polyfill chunk in .next/react-loadable-manifest.json');
    }

    return __webpack_public_path__ + publicPath; // eslint-disable-line
};

const NextIntlScript = () => {
    const polyfillChunkPublicPath = getPolyfillChunkPublicPath();

    const script = buildScript(polyfillChunkPublicPath);

    return <script dangerouslySetInnerHTML={ { __html: script } } />;
};

export default NextIntlScript;
