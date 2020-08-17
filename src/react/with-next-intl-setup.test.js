import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { render } from '@testing-library/react';
import NextIntlContext from './util/context';
import withNextIntlSetup from './with-next-intl-setup';

const messages = {
    'en-US': { apple: 'apple' },
    'pt-PT': { apple: 'maça' },
    'ru-RU': { apple: 'яблоко' },
};

const locales = [
    { id: 'en-US', name: 'English', loadMessages: () => messages['en-US'] },
    { id: 'pt-PT', name: 'Português', loadMessages: () => messages['pt-PT'] },
    { id: 'ru-RU', name: 'русский', loadMessages: () => messages['ru-RU'] },
];

const policies = [
    { match: () => locales[0].id },
    { match: () => locales[1].id },
];

const Component = () => 'Hello world';

describe('getInitialProps', () => {
    it('should return an object with the nextIntlProviderProps', async () => {
        const MyApp = () => null;
        const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

        const initialProps = await EnhancedMyApp.getInitialProps({ ctx: {}, Component });

        expect(initialProps.nextIntlProviderProps).toEqual({
            initialData: {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            },
        });
    });

    it('should return an object with the app props', async () => {
        const appContext = { ctx: {}, Component };

        const MyApp = () => null;

        MyApp.getInitialProps = jest.fn(async () => ({ foo: 'bar' }));

        const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

        const initialProps = await EnhancedMyApp.getInitialProps(appContext);

        expect(MyApp.getInitialProps).toHaveBeenCalledTimes(1);
        expect(MyApp.getInitialProps).toHaveBeenCalledWith(appContext);
        expect(initialProps.appProps).toEqual({ foo: 'bar' });
    });

    it('should inject locale into the page context', async () => {
        const appContext = { ctx: {}, Component };

        const MyApp = () => null;
        const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

        await EnhancedMyApp.getInitialProps(appContext);

        expect(appContext.ctx.locale).toEqual(locales[0]);
    });

    it('should call page\'s getInitialProps', async () => {
        const Component = () => 'Hello World';

        Component.getInitialProps = jest.fn(async () => ({ foo: 'bar' }));

        const appContext = { ctx: {}, Component };

        const MyApp = () => null;
        const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

        const initialProps = await EnhancedMyApp.getInitialProps(appContext);

        expect(Component.getInitialProps).toHaveBeenCalledTimes(1);
        expect(Component.getInitialProps).toHaveBeenCalledWith(appContext.ctx);
        expect(initialProps.appProps).toEqual({ pageProps: { foo: 'bar' } });
    });

    describe('on SS', () => {
        const globalWindow = window;

        beforeAll(() => {
            Object.defineProperty(global, 'window', {
                value: undefined,
                writable: true,
            });
        });

        afterAll(() => {
            global.window = globalWindow;
        });

        it('should not cache resolved initial props', async () => {
            const policies = [
                { match: (locales, ctx) => ctx.req?.headers['accept-language'] ?? locales[0].id },
            ];

            const MyApp = () => null;
            const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

            const initialProps1 = await EnhancedMyApp.getInitialProps({ ctx: {}, Component });

            expect(initialProps1.nextIntlProviderProps).toEqual({
                initialData: {
                    localeId: locales[0].id,
                    messages: messages[locales[0].id],
                },
            });

            const initialProps2 = await EnhancedMyApp.getInitialProps({
                ctx: {
                    req: {
                        headers: { 'accept-language': 'pt-PT' },
                    },
                },
                Component,
            });

            expect(initialProps2.nextIntlProviderProps).toEqual({
                initialData: {
                    localeId: locales[1].id,
                    messages: messages[locales[1].id],
                },
            });
        });
    });

    describe('on CS', () => {
        it('should inject new locale into the page context if it changed', async () => {
            let changeLocale;
            const appContext = { ctx: {}, Component };

            const MyApp = () => {
                const nextIntl = useContext(NextIntlContext);

                changeLocale = nextIntl.changeLocale;

                return null;
            };

            const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

            const nextIntlProviderProps = {
                initialData: {
                    localeId: locales[0].id,
                    messages: messages[locales[0].id],
                },
            };

            render(
                <EnhancedMyApp nextIntlProviderProps={ nextIntlProviderProps } />,
            );

            await changeLocale(locales[1].id);

            await EnhancedMyApp.getInitialProps(appContext);

            expect(appContext.ctx.locale).toEqual(locales[1]);
        });

        it('should cache nextIntlProviderProps', async () => {
            const appContext1 = { ctx: {}, Component };
            const appContext2 = { ctx: {}, Component };

            const MyApp = () => <FormattedMessage id="apple" />;
            const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

            const initialProps1 = await EnhancedMyApp.getInitialProps(appContext1);
            const initialProps2 = await EnhancedMyApp.getInitialProps(appContext2);

            expect(initialProps1.nextIntlProviderProps).toBe(initialProps2.nextIntlProviderProps);
            expect(appContext1.ctx.locale).toBe(appContext2.ctx.locale);
        });

        it('should build nextIntlProviderProps based on the manager state', async () => {
            const appContext = { ctx: {}, Component };

            const MyApp = () => <FormattedMessage id="apple" />;
            const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

            const nextIntlProviderProps = {
                initialData: {
                    localeId: locales[1].id,
                    messages: messages[locales[1].id],
                },
            };

            render(
                <EnhancedMyApp nextIntlProviderProps={ nextIntlProviderProps } />,
            );

            const initialProps = await EnhancedMyApp.getInitialProps(appContext);

            expect(initialProps.nextIntlProviderProps).toEqual(nextIntlProviderProps);
            expect(appContext.ctx.locale).toBe(locales[1]);
        });
    });
});

it('should setup NextIntlProvider', async () => {
    const MyApp = () => <FormattedMessage id="apple" />;
    const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

    const nextIntlProviderProps = {
        initialData: {
            localeId: locales[1].id,
            messages: messages[locales[1].id],
        },
    };

    const { queryByText } = render(
        <EnhancedMyApp nextIntlProviderProps={ nextIntlProviderProps } />,
    );

    const appleMessage = messages[nextIntlProviderProps.initialData.localeId].apple;

    expect(queryByText(appleMessage)).toBeTruthy();
});

it('should spread any other props to the app component', async () => {
    const MyApp = ({ foo }) => <div>{ foo }</div>; // eslint-disable-line react/prop-types
    const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

    const nextIntlProviderProps = {
        initialData: {
            localeId: locales[0].id,
            messages: messages[locales[0].id],
        },
    };

    const { queryByText } = render(
        <EnhancedMyApp nextIntlProviderProps={ nextIntlProviderProps } foo="bar" />,
    );

    expect(queryByText('bar')).toBeTruthy();
});

it('should copy statics', () => {
    const MyApp = () => null;

    MyApp.foo = 'bar';

    const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

    expect(EnhancedMyApp.foo).toBe('bar');
});
