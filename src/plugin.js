const castArray = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    return value != null ? [value] : [];
};

const withNextIntl = () => (nextConfig = {}) => ({
    ...nextConfig,
    webpack: (config, options) => {
        const { isServer } = options;

        if (isServer) {
            // The canvas package, which is a dependency of jsdom, has a native binding which causes
            // the following error during Next.js build process: "Module did not self-register"
            // See https://github.com/zeit/next.js/issues/7894
            // We circuvent that by using a null-loader
            config.module.rules.unshift({
                test: require.resolve('canvas'),
                loader: require.resolve('null-loader'),
            });

            // The ws package, which is also a dependency of jsdom, tries to optionally load some dependencies
            // This produces a warning in webpack that we want to avoid
            config.externals = [
                'bufferutil',
                'utf-8-validate',
                ...castArray(config.externals),
            ];
        }

        if (typeof nextConfig.webpack === 'function') {
            return nextConfig.webpack(config, options);
        }

        return config;
    },
});

export default withNextIntl;
