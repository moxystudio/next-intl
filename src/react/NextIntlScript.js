import fs from 'fs';
import React from 'react';
import memoizeOne from 'memoize-one';
import PropTypes from 'prop-types';

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

const getPolyfillChunkPublicPath = (assetPrefix) => {
    const manifest = JSON.parse(fs.readFileSync('.next/react-loadable-manifest.json'));
    const publicPath = manifest?.['@formatjs/intl-pluralrules/polyfill-locales']?.[0]?.publicPath;

    if (!publicPath) {
        throw new Error('Could not find intl-polyfill chunk in .next/react-loadable-manifest.json');
    }

    return `${assetPrefix}/_next/${publicPath}`;
};

const memoizedGetPolyfillChunkPublicPath =
    process.env.NODE_ENV === 'test' ? getPolyfillChunkPublicPath : memoizeOne(getPolyfillChunkPublicPath);

const NextIntlScript = ({ assetPrefix }) => {
    const polyfillChunkPublicPath = memoizedGetPolyfillChunkPublicPath(assetPrefix);
    const script = buildScript(polyfillChunkPublicPath);

    return <script dangerouslySetInnerHTML={ { __html: script } } />;
};

NextIntlScript.defaultProps = {
    assetPrefix: '',
};

NextIntlScript.propTypes = {
    assetPrefix: PropTypes.string,
};

export default NextIntlScript;
