import NextIntlWebpackPlugin from './NextIntlWebpackPlugin';

const withNextIntl = () => (nextConfig = {}) => ({
    ...nextConfig,
    webpack: (config, options) => {
        const { isServer } = options;

        // Add webpack plugin that will inject the polyfill url that will be used by the NextIntlScript component
        config.plugins.push(new NextIntlWebpackPlugin(isServer, options.config));

        if (typeof nextConfig.webpack === 'function') {
            return nextConfig.webpack(config, options);
        }

        return config;
    },
});

export default withNextIntl;
