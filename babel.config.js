'use strict';

module.exports = (api) => {
    api.cache(true);

    return {
        presets: [
            ['@moxy/babel-preset/lib', { react: true }],
        ],
    };
};
