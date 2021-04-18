beforeEach(() => {
    jest.resetModules();

    global.__NEXT_DATA__ = {
        locale: 'en',
        props: {
            pageProps: {},
        },
    };
});

it('should throw if no locale loader was set', async () => {
    const { default: getIntlProps } = require('./intl-props');

    await expect(getIntlProps('en')).rejects.toEqual(
        new Error('No loadLocale() function configured. Did you forget to wrap your app using withIntlApp()?'),
    );
});

it('should throw if no locale loader returns nullish', async () => {
    const { default: getIntlProps, setLocaleLoader } = require('./intl-props');

    setLocaleLoader(() => null);

    await expect(getIntlProps('en')).rejects.toEqual(
        new Error('Expecting loadLocale() to return a messages object'),
    );
});

it('should call locale loader and return an object with a "intl" key', async () => {
    const { default: getIntlProps, setLocaleLoader } = require('./intl-props');

    const loadLocale = jest.fn(async () => ({ foo: 'bar' }));

    setLocaleLoader(loadLocale);

    const messages = await getIntlProps('en');

    expect(loadLocale).toHaveBeenCalledTimes(1);
    expect(loadLocale).toHaveBeenCalledWith('en');

    expect(messages).toEqual({
        intl: {
            messages: { foo: 'bar' },
        },
    });
});

describe('client-side', () => {
    it('should hydrate from __NEXT_DATA__', async () => {
        global.__NEXT_DATA__ = {
            locale: 'en',
            props: {
                pageProps: {
                    intl: {
                        messages: { foo: 'baz' },
                    },
                },
            },
        };

        const { default: getIntlProps, setLocaleLoader } = require('./intl-props');

        const loadLocale = jest.fn(async () => ({ foo: 'bar' }));

        setLocaleLoader(loadLocale);

        const messages = await getIntlProps('en');

        expect(loadLocale).toHaveBeenCalledTimes(0);

        expect(messages).toEqual({
            intl: {
                messages: { foo: 'baz' },
            },
        });
    });

    it('should cache messages', async () => {
        const { default: getIntlProps, setLocaleLoader } = require('./intl-props');

        const loadLocale = jest.fn(async () => ({ foo: 'bar' }));

        setLocaleLoader(loadLocale);

        const messages = await getIntlProps('pt');
        const messages2 = await getIntlProps('pt');

        expect(loadLocale).toHaveBeenCalledTimes(1);

        expect(messages).toEqual({
            intl: {
                messages: { foo: 'bar' },
            },
        });
        expect(messages).toEqual(messages2);
    });
});
