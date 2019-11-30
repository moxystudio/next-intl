const nextIntlPlugin = require('./');

const webpackOptions = {
    isServer: true,
    config: {
        distDir: '.next',
        assetPrefix: '',
    },
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
    plugins: [],
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
    expect.assertions(4);

    const config = nextIntlPlugin()().webpack(createWebpackConfig(), webpackOptions);

    expect(config.externals).toHaveLength(2);

    config.externals[0]('node_modules/ws/lib', 'bufferutil', (...args) => {
        expect(args).toEqual([undefined, 'commonjs bufferutil']);
    });
    config.externals[0]('node_modules/ws/lib', 'utf-8-validate', (...args) => {
        expect(args).toEqual([undefined, 'commonjs utf-8-validate']);
    });
    config.externals[0]('node_modules/foo', 'bufferutil', (...args) => {
        expect(args).toHaveLength(0);
    });
});

it('should still add ws\'s optional dependencies to externals if it\'s already an array', () => {
    const originalConfig = {
        ...createWebpackConfig(),
        externals: ['foo'],
    };

    const config = nextIntlPlugin()().webpack(originalConfig, webpackOptions);

    expect(config.externals).toHaveLength(2);
    expect(typeof config.externals[0]).toBe('function');
    expect(config.externals[1]).toBe('foo');
});

it('should still add ws\'s optional dependencies to externals if it\'s nullish', () => {
    const originalConfig = {
        ...createWebpackConfig(),
        externals: undefined,
    };

    const config = nextIntlPlugin()().webpack(originalConfig, webpackOptions);

    expect(config.externals).toHaveLength(1);
    expect(typeof config.externals[0]).toBe('function');
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
