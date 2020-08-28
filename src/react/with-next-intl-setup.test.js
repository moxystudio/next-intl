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
    it('should return an object with nextIntlInitialData', async () => {
        const MyApp = () => null;
        const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

        const initialProps = await EnhancedMyApp.getInitialProps({ ctx: {}, Component });

        expect(initialProps).toEqual({
            pageProps: {},
            nextIntlInitialData: {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            },
        });
    });

    it('should inject locale into the page context', async () => {
        const appCtx = { ctx: {}, Component };

        const MyApp = () => null;
        const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

        await EnhancedMyApp.getInitialProps(appCtx);

        expect(appCtx.ctx.locale).toEqual(locales[0]);
    });

    it('should call page\'s getInitialProps', async () => {
        const Component = () => 'Hello World';

        Component.getInitialProps = jest.fn(async () => ({ foo: 'bar' }));

        const appCtx = { ctx: {}, Component };

        const MyApp = () => null;
        const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

        const initialProps = await EnhancedMyApp.getInitialProps(appCtx);

        expect(Component.getInitialProps).toHaveBeenCalledTimes(1);
        expect(Component.getInitialProps).toHaveBeenCalledWith(appCtx.ctx);
        expect(initialProps).toEqual({
            pageProps: { foo: 'bar' },
            nextIntlInitialData: {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            },
        });
    });

    describe('on SS', () => {
        const globalWindow = window;
        let withNextIntlSetup;

        beforeAll(() => {
            Object.defineProperty(global, 'window', {
                value: undefined,
                writable: true,
            });

            jest.resetModules();
            withNextIntlSetup = require('./with-next-intl-setup');
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

            const initialProps1 = await EnhancedMyApp.getInitialProps({
                ctx: {
                    req: {
                        url: '/',
                        headers: { 'accept-language': 'en-US' },
                    },
                },
                Component,
            });

            expect(initialProps1.nextIntlInitialData).toEqual({
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            });

            const initialProps2 = await EnhancedMyApp.getInitialProps({
                ctx: {
                    req: {
                        url: '/',
                        headers: { 'accept-language': 'pt-PT' },
                    },
                },
                Component,
            });

            expect(initialProps2.nextIntlInitialData).toEqual({
                localeId: locales[1].id,
                messages: messages[locales[1].id],
            });
        });

        it('should only inject locale in the page context on data requests', async () => {
            const policies = [
                { match: (locales, ctx) => ctx.req?.headers['accept-language'] ?? locales[0].id },
            ];

            const MyApp = () => null;
            const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

            const appCtx = {
                ctx: {
                    req: {
                        url: '/index.json',
                        headers: { 'accept-language': 'pt-PT' },
                    },
                },
                Component,
            };

            const initialProps = await EnhancedMyApp.getInitialProps(appCtx);

            expect(appCtx.ctx.locale).toEqual(locales[1]);
            expect(initialProps).toEqual({
                pageProps: {},
            });
        });
    });

    describe('on CS', () => {
        it('should inject new locale into the page context if it changed', async () => {
            let changeLocale;
            const appCtx = { ctx: {}, Component };

            const MyApp = () => {
                const nextIntl = useContext(NextIntlContext);

                changeLocale = nextIntl.changeLocale;

                return null;
            };

            const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

            const nextIntlInitialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            render(
                <EnhancedMyApp nextIntlInitialData={ nextIntlInitialData } />,
            );

            await changeLocale(locales[1].id);

            await EnhancedMyApp.getInitialProps(appCtx);

            expect(appCtx.ctx.locale).toEqual(locales[1]);
        });

        it('should cache nextIntlInitialData', async () => {
            const appCtx1 = { ctx: {}, Component };
            const appCtx2 = { ctx: {}, Component };

            const MyApp = () => <FormattedMessage id="apple" />;
            const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

            const initialProps1 = await EnhancedMyApp.getInitialProps(appCtx1);
            const initialProps2 = await EnhancedMyApp.getInitialProps(appCtx2);

            expect(initialProps1.nextIntlInitialData).toBe(initialProps2.nextIntlInitialData);
            expect(appCtx1.ctx.locale).toBe(appCtx2.ctx.locale);
        });

        it('should build nextIntlInitialData based on the manager state', async () => {
            const appCtx = { ctx: {}, Component };

            const MyApp = () => <FormattedMessage id="apple" />;
            const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

            const nextIntlInitialData = {
                localeId: locales[1].id,
                messages: messages[locales[1].id],
            };

            render(
                <EnhancedMyApp nextIntlInitialData={ nextIntlInitialData } />,
            );

            const initialProps = await EnhancedMyApp.getInitialProps(appCtx);

            expect(initialProps.nextIntlInitialData).toEqual(nextIntlInitialData);
            expect(appCtx.ctx.locale).toBe(locales[1]);
        });
    });
});

it('should setup NextIntlProvider', async () => {
    const MyApp = () => <FormattedMessage id="apple" />;
    const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

    const nextIntlInitialData = {
        localeId: locales[1].id,
        messages: messages[locales[1].id],
    };

    const { queryByText } = render(
        <EnhancedMyApp nextIntlInitialData={ nextIntlInitialData } />,
    );

    const appleMessage = messages[nextIntlInitialData.localeId].apple;

    expect(queryByText(appleMessage)).toBeTruthy();
});

it('should spread any other props to the app component', async () => {
    const MyApp = ({ foo }) => <div>{ foo }</div>; // eslint-disable-line react/prop-types
    const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

    const nextIntlInitialData = {
        localeId: locales[0].id,
        messages: messages[locales[0].id],
    };

    const { queryByText } = render(
        <EnhancedMyApp nextIntlInitialData={ nextIntlInitialData } foo="bar" />,
    );

    expect(queryByText('bar')).toBeTruthy();
});

it('should copy statics', () => {
    const MyApp = () => null;

    MyApp.foo = 'bar';

    const EnhancedMyApp = withNextIntlSetup({ locales, policies })(MyApp);

    expect(EnhancedMyApp.foo).toBe('bar');
});
