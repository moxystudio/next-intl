import React, { Component } from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';
import App from 'next/app';
import { getInitialData, matchLocale } from '../manager';
import NextIntlProvider from './NextIntlProvider';

let _locale;
let _initialData;

const withNextIntlSetup = (config) => (WrappedApp) => {
    const { locales, policies } = config;
    let _provider;

    const getNextIntlInitialData = async (appCtx) => {
        const initialData = _initialData ?? await getInitialData(locales, policies, appCtx.ctx);
        const locale = _locale ?? locales.find(({ id }) => id === initialData.localeId);

        appCtx.ctx.locale = locale;

        if (typeof window !== 'undefined') {
            _initialData = initialData;
            _locale = locale;
        }

        return initialData;
    };

    const injectLocaleIntoCtx = (appCtx) => {
        const locale = matchLocale(locales, policies, appCtx.ctx);

        appCtx.ctx.locale = locale;
    };

    class WithNextIntlSetup extends Component {
        static propTypes = {
            appProps: PropTypes.object,
            nextIntlInitialData: PropTypes.object,
        };

        static displayName = `withNextIntlSetup(${WrappedApp.displayName || WrappedApp.name || /* istanbul ignore next */ 'App'})`;

        static async getInitialProps(appCtx) {
            let nextIntlInitialData;
            const isDataRequest = appCtx.ctx.req?.url.endsWith('.json') ?? false;

            // If the request is a data request (e.g.: originated from navigating to a page getServerSideProps from the client-side),
            // then we skip getting the initialData completely, as it will increase latency and payload.
            if (isDataRequest) {
                injectLocaleIntoCtx(appCtx);
            } else {
                nextIntlInitialData = await getNextIntlInitialData(appCtx);
            }

            const appProps = await (WrappedApp.getInitialProps ? WrappedApp.getInitialProps(appCtx) : App.getInitialProps(appCtx));

            return { ...appProps, nextIntlInitialData };
        }

        render() {
            const { nextIntlInitialData, ...appProps } = this.props;

            return (
                <NextIntlProvider
                    ref={ this.providerRef }
                    { ...config }
                    initialData={ nextIntlInitialData }
                    onChange={ this.handleChange }>
                    <WrappedApp { ...appProps } />
                </NextIntlProvider>
            );
        }

        providerRef = (provider) => {
            _provider = provider;

            if (provider) {
                _initialData = provider.manager.toData();
                _locale = provider.getValue().locale;
            } else {
                _initialData = _locale = undefined;
            }
        };

        handleChange = () => {
            _initialData = _provider.manager.toData();
            _locale = _provider.getValue().locale;
        };
    }

    hoistNonReactStatics(WithNextIntlSetup, WrappedApp, { getInitialProps: true });

    return WithNextIntlSetup;
};

export default withNextIntlSetup;
