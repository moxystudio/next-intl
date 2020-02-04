module.exports = (api) => {
    api.cache(true);

    return {
        ignore: process.env.NODE_ENV === 'test' ? [] : ['**/*.test.js'],
        presets: [
            ['@moxy/babel-preset/lib', { react: true }],
        ],
    };
};
