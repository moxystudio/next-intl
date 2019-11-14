module.exports = (api) => {
    api.cache(true);

    return {
        ignore: process.env.NODE_ENV === 'test' ? [] : ['**/*.test.js'],
        presets: [
            ['babel-preset-moxy/lib', { react: true }],
        ],
    };
};
