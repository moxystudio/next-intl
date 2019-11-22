const nextIntlPlugin = require('./plugin');

const webpackOptions = {
    isServer: true,
};

const createWebpackConfig = () => ({
    module: {
        rules: [
            {
                test: 'foo',
                loader: 'foo-loader',
            },
        ],
    },
    externals: () => {},
});

it('should add a rule for canvas that uses null-loader', () => {
    const config = nextIntlPlugin()().webpack(createWebpackConfig(), webpackOptions);

    const rule = config.module.rules[0];

    expect(rule.test).toBe(require.resolve('canvas'));
    expect(rule.loader).toBe(require.resolve('null-loader'));
});

it('should add no canvas rule when not server', () => {
    const config = nextIntlPlugin()().webpack(createWebpackConfig(), { ...webpackOptions, isServer: false });

    expect(config.module.rules[0].test).toBe('foo');
});

it('should add ws\'s optional dependencies to externals', () => {
    const config = nextIntlPlugin()().webpack(createWebpackConfig(), webpackOptions);

    expect(config.externals).toHaveLength(3);
    expect(config.externals[0]).toBe('bufferutil');
    expect(config.externals[1]).toBe('utf-8-validate');
    expect(typeof config.externals[2]).toBe('function');
});

it('should add ws\'s optional dependencies to externals (already an array)', () => {
    const originalConfig = {
        ...createWebpackConfig(),
        externals: [() => {}],
    };

    const config = nextIntlPlugin()().webpack(originalConfig, webpackOptions);

    expect(config.externals).toHaveLength(3);
    expect(config.externals[0]).toBe('bufferutil');
    expect(config.externals[1]).toBe('utf-8-validate');
    expect(typeof config.externals[2]).toBe('function');
});

it('should leave externals untouched when not server', () => {
    const config = nextIntlPlugin()().webpack(createWebpackConfig(), { ...webpackOptions, isServer: false });

    expect(typeof config.externals).toBe('function');
});

it('should call nextConfig webpack if defined', () => {
    const nextConfig = {
        webpack: jest.fn(() => 'foo'),
    };

    const config = nextIntlPlugin()(nextConfig).webpack(createWebpackConfig(), webpackOptions);

    expect(nextConfig.webpack).toHaveBeenCalledTimes(1);
    expect(config).toBe('foo');
});
