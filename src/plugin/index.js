import NextIntlWebpackPlugin from './NextIntlWebpackPlugin';

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
            // Moreover, the 'ws' which is not used
            // We circuvent that by using a null-loader
            config.module.rules.unshift({
                test: require.resolve('canvas'),
                loader: require.resolve('null-loader'),
            });

            // The ws package, which is also a dependency of jsdom, tries to optionally load some dependencies
            // This produces a warning in webpack that we want to avoid
            config.externals = [
                (context, request, callback) => {
                    if (
                        (request === 'bufferutil' || request === 'utf-8-validate') &&
                        /node_modules[\\/]ws[\\/]/.test(context)
                    ) {
                        return callback(undefined, `commonjs ${request}`);
                    }

                    return callback();
                },
                ...castArray(config.externals),
            ];
        }

        // Add webpack plugin that will inject the polyfill url that will be used by the NextIntlScript component
        config.plugins.push(new NextIntlWebpackPlugin(isServer, options.config));

        if (typeof nextConfig.webpack === 'function') {
            return nextConfig.webpack(config, options);
        }

        return config;
    },
});

export default withNextIntl;
