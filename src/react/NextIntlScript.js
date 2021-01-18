/* global __NEXT_INTL_POLYFILLS__:false */
import React from 'react';

// The script bellow was minified using terser: https://xem.github.io/terser-online/
// You may find the original script below in case you need to modify it:
/*
(function (polyfill) {
    const shouldPolyfill = new Function('var exports={};' + polyfill.shouldPolyfill + 'return shouldPolyfill()');

    if (shouldPolyfill()) {
        var currentScript = document.currentScript;
        var polyfillScript = document.createElement('script');

        polyfillScript.src = polyfill.asset;

        currentScript.parentNode.insertBefore(polyfillScript, currentScript.nextSibling);
    }
})(polyfill);
*/
const renderScript = (polyfill) => `!function(e){if(new Function("var exports={};"+e.shouldPolyfill+"return shouldPolyfill()")()){var n=document.currentScript,t=document.createElement("script");t.src=e.asset,n.parentNode.insertBefore(t,n.nextSibling)}}(${JSON.stringify(polyfill)})`;

const NextIntlScript = () => {
    if (typeof __NEXT_INTL_POLYFILLS__ === 'undefined') {
        throw new Error('Could not locale polyfills data, did you forgot to enable the plugin in the next.config.js file?');
    }

    return (
        <>
            { __NEXT_INTL_POLYFILLS__.map((polyfill) => (
                <script
                    key={ polyfill.asset }
                    dangerouslySetInnerHTML={ { __html: renderScript(polyfill) } } />
            )) }
        </>
    );
};

export default NextIntlScript;
