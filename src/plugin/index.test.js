const nextIntlPlugin = require('./');
const NextIntlWebpackPlugin = require('./NextIntlWebpackPlugin');

const webpackOptions = {
    isServer: true,
    config: {
        distDir: '.next',
        assetPrefix: '',
    },
};

const createWebpackConfig = () => ({
    plugins: [],
});

it('should add NextIntlWebpackPlugin', () => {
    const config = nextIntlPlugin()().webpack(createWebpackConfig(), webpackOptions);

    expect(config.plugins).toHaveLength(1);
    expect(config.plugins[0].constructor).toBe(NextIntlWebpackPlugin);
});

it('should call nextConfig webpack if defined', () => {
    const nextConfig = {
        webpack: jest.fn(() => 'foo'),
    };

    const config = nextIntlPlugin()(nextConfig).webpack(createWebpackConfig(), webpackOptions);

    expect(nextConfig.webpack).toHaveBeenCalledTimes(1);
    expect(config).toBe('foo');
});
